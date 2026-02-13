<?php
// backend/controllers/LearningController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class LearningController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function getAll()
    {
        $query = "SELECT * FROM learning_materials ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function getById($id)
    {
        $query = "SELECT * FROM learning_materials WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $material = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($material) {
            return json_encode($material);
        }
        http_response_code(404);
        return json_encode(["message" => "Material not found"]);
    }

    public function create($userId, $userName)
    {
        if (!$userId) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }

        // Handle JSON Input
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        if (!$data) {
            $data = $_POST;
        }

        $id = Helper::uuid();
        $is_premium = isset($data['is_premium']) ? $data['is_premium'] : 0;
        $type = $data['type'] ?? 'modul';

        // link_url handling
        $link_url = isset($data['link_url']) ? $data['link_url'] : null;
        $file_url = isset($data['file_url']) ? $data['file_url'] : null;

        $stmt = $this->conn->prepare("INSERT INTO learning_materials (id, title, mapel, kelas, semester, type, file_url, link_url, content, is_premium, author_id) VALUES (:id, :title, :mapel, :kelas, :semester, :type, :file_url, :link_url, :content, :is_premium, :author_id)");

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':mapel', $data['mapel']);
        $stmt->bindParam(':kelas', $data['kelas']);
        $stmt->bindParam(':semester', $data['semester']);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':file_url', $file_url);
        $stmt->bindParam(':link_url', $link_url);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':is_premium', $is_premium);
        $stmt->bindParam(':author_id', $userId); // Use authenticated userId

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'CREATE_LEARNING', $data['title']);
            return json_encode(["message" => "Material created", "id" => $id]);
        }

        error_log("Failed to create material: " . print_r($stmt->errorInfo(), true));
        http_response_code(500);
        return json_encode(["message" => "Failed to create material"]);
    }

    public function delete($id, $userId, $userName)
    {
        if (!$userId) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }

        // Get title for logging
        $title = "Unknown Material";
        $stmtTitle = $this->conn->prepare("SELECT title FROM learning_materials WHERE id = :id");
        $stmtTitle->bindParam(':id', $id);
        $stmtTitle->execute();
        if ($res = $stmtTitle->fetch(PDO::FETCH_ASSOC))
            $title = $res['title'];

        // Optional: Delete file from disk too
        $query = "DELETE FROM learning_materials WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'DELETE_LEARNING', $title);
            return json_encode(["message" => "Deleted successfully"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete"]);
    }

    public function update($id, $data, $userId, $userName)
    {
        if (!$userId) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }

        // Handle JSON Input
        $input = file_get_contents("php://input");
        $jsonData = json_decode($input, true);
        if ($jsonData) {
            $data = array_merge($data, $jsonData);
        }

        $query = "UPDATE learning_materials SET 
                    title = :title, 
                    mapel = :mapel, 
                    kelas = :kelas, 
                    semester = :semester, 
                    type = :type, 
                    content = :content, 
                    is_premium = :is_premium,
                    link_url = :link_url
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $is_premium = isset($data['is_premium']) ? $data['is_premium'] : 0;
        $link_url = isset($data['link_url']) ? $data['link_url'] : null;

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':mapel', $data['mapel']);
        $stmt->bindParam(':kelas', $data['kelas']);
        $stmt->bindParam(':semester', $data['semester']);
        $stmt->bindParam(':type', $data['type']);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':is_premium', $is_premium);
        $stmt->bindParam(':link_url', $link_url);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'UPDATE_LEARNING', $data['title']);
            return json_encode(["message" => "Material updated"]);
        }

        error_log("Failed to update material: " . print_r($stmt->errorInfo(), true));
        http_response_code(500);
        return json_encode(["message" => "Failed to update material"]);
    }
}
?>