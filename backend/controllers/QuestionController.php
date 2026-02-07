<?php
// backend/controllers/QuestionController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class QuestionController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    private function getUser()
    {
        $headers = getallheaders();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        $token = str_replace('Bearer ', '', $authHeader);
        if ($token) {
            return Helper::verifyJWT($token);
        }
        return null;
    }

    // --- NEW: Individual Question (Repository) ---
    // Table: questions

    public function getAll()
    {
        $user = $this->getUser();
        //$role = $user['role'] ?? 'Guest'; // Can use role for verified check later

        // Filters
        $mapel = $_GET['mapel'] ?? null;
        $kelas = $_GET['kelas'] ?? null;
        $level = $_GET['level'] ?? null;
        $search = $_GET['search'] ?? null;

        $query = "SELECT q.*, p.nama as creator_name FROM questions q LEFT JOIN profiles p ON q.creator_id = p.id WHERE 1=1";
        $params = [];

        if ($mapel) {
            $query .= " AND q.mapel = :mapel";
            $params[':mapel'] = $mapel;
        }
        if ($kelas) {
            $query .= " AND q.kelas = :kelas";
            $params[':kelas'] = $kelas;
        }
        if ($level) {
            $query .= " AND q.level = :level";
            $params[':level'] = $level;
        }
        if ($search) {
            $query .= " AND (q.content LIKE :search OR q.mapel LIKE :search)";
            $params[':search'] = "%$search%";
        }

        $query .= " ORDER BY q.created_at DESC";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode options JSON
        foreach ($questions as &$q) {
            if (isset($q['options'])) {
                $q['options'] = json_decode($q['options'], true);
            }
        }

        return json_encode($questions);
    }

    public function create($data)
    {
        $user = $this->getUser();
        if (!$user) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }
        $userId = $user['sub'];
        $role = $user['role'];

        $status = in_array($role, ['Admin', 'Pengurus']) ? 'verified' : 'pending';

        $id = Helper::uuid();
        $query = "INSERT INTO questions (id, content, type, options, answer_key, explanation, level, mapel, kelas, creator_id, status, created_at) 
                  VALUES (:id, :content, :type, :options, :answer_key, :explanation, :level, :mapel, :kelas, :creator_id, :status, NOW())";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':type', $data['type']);

        $options = isset($data['options']) ? json_encode($data['options']) : null;
        $stmt->bindParam(':options', $options);

        $stmt->bindParam(':answer_key', $data['answer_key']);
        $stmt->bindParam(':explanation', $data['explanation']);
        $stmt->bindParam(':level', $data['level']);
        $stmt->bindParam(':mapel', $data['mapel']);
        $stmt->bindParam(':kelas', $data['kelas']);
        $stmt->bindParam(':creator_id', $userId);
        $stmt->bindParam(':status', $status);

        if ($stmt->execute()) {
            return json_encode(["message" => "Question created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create question"]);
    }

    public function getById($id)
    {
        $query = "SELECT * FROM questions WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($data) {
            $data['options'] = json_decode($data['options'], true);
            return json_encode($data);
        }
        http_response_code(404);
        return json_encode(["message" => "Question not found"]);
    }

    public function update($id, $data)
    {
        $user = $this->getUser();
        if (!$user) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }

        // Verify ownership or Admin role
        $checkQuery = "SELECT creator_id FROM questions WHERE id = :id";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            http_response_code(404);
            return json_encode(["message" => "Question not found"]);
        }

        // Allow Admin/Pengurus or Owner
        if ($existing['creator_id'] !== $user['sub'] && $user['role'] !== 'Admin' && $user['role'] !== 'Pengurus') {
            http_response_code(403);
            return json_encode(["message" => "Forbidden"]);
        }

        $query = "UPDATE questions SET 
                  content = :content, 
                  type = :type, 
                  options = :options, 
                  answer_key = :answer_key, 
                  explanation = :explanation, 
                  level = :level, 
                  mapel = :mapel, 
                  kelas = :kelas 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':type', $data['type']);
        $options = isset($data['options']) ? json_encode($data['options']) : null;
        $stmt->bindParam(':options', $options);
        $stmt->bindParam(':answer_key', $data['answer_key']);
        $stmt->bindParam(':explanation', $data['explanation']);
        $stmt->bindParam(':level', $data['level']);
        $stmt->bindParam(':mapel', $data['mapel']);
        $stmt->bindParam(':kelas', $data['kelas']);

        if ($stmt->execute()) {
            return json_encode(["message" => "Question updated"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to update question"]);
    }

    public function delete($id)
    {
        $query = "DELETE FROM questions WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            return json_encode(["message" => "Question deleted"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete question"]);
    }

    // --- OLD: Question Bank Bundles (Files & Games) ---
    // Table: question_banks

    public function getBanks()
    {
        $query = "SELECT q.*, p.nama as creator_name FROM question_banks q LEFT JOIN profiles p ON q.creator_id = p.id ORDER BY q.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function createBank($data)
    {
        $user = $this->getUser();
        if (!$user) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }
        $userId = $user['sub'];
        $role = $user['role'];

        $status = in_array($role, ['Admin', 'Pengurus']) ? 'verified' : 'pending';

        $id = Helper::uuid();
        $query = "INSERT INTO question_banks (id, title, mapel, category, file_url, game_data, is_premium, created_at, creator_id, status) 
                  VALUES (:id, :title, :mapel, :category, :file_url, :game_data, :is_premium, NOW(), :creator_id, :status)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':mapel', $data['mapel']);
        $stmt->bindParam(':category', $data['category']);
        $fileUrl = $data['file_url'] ?? null;
        $stmt->bindParam(':file_url', $fileUrl);

        $gameData = isset($data['game_data']) ? json_encode($data['game_data']) : null;
        $stmt->bindParam(':game_data', $gameData);

        $isPremium = $data['is_premium'] ?? 1;
        $stmt->bindParam(':is_premium', $isPremium, PDO::PARAM_INT);

        $stmt->bindParam(':creator_id', $userId);
        $stmt->bindParam(':status', $status);

        if ($stmt->execute()) {
            return json_encode(["message" => "Question bank created", "id" => $id, "status" => $status]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create question bank"]);
    }

    public function deleteBank($id)
    {
        $query = "DELETE FROM question_banks WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            return json_encode(["message" => "Question bank deleted"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete question bank"]);
    }
}
?>