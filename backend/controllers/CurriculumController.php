<?php
// backend/controllers/CurriculumController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class CurriculumController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    // --- CP Operations ---

    public function getCP($mapel)
    {
        $query = "SELECT * FROM learning_cp WHERE mapel = :mapel LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':mapel', $mapel);
        $stmt->execute();
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($data) {
            return json_encode($data);
        }

        // Return empty structure if not found
        return json_encode([
            "id" => null,
            "mapel" => $mapel,
            "content" => ""
        ]);
    }

    public function saveCP($input, $userId, $userName)
    {
        $mapel = $input['mapel'];
        $content = $input['content'];
        $materi = $input['materi'] ?? ''; // Optional title

        // Check if exists
        $check = "SELECT id FROM learning_cp WHERE mapel = :mapel";
        $stmt = $this->conn->prepare($check);
        $stmt->bindParam(':mapel', $mapel);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            // Update
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $query = "UPDATE learning_cp SET content = :content, materi = :materi, updated_by = :uid, updated_at = NOW() WHERE id = :id";
            $stmtUpdate = $this->conn->prepare($query);
            $stmtUpdate->bindParam(':content', $content);
            $stmtUpdate->bindParam(':materi', $materi);
            $stmtUpdate->bindParam(':uid', $userId);
            $stmtUpdate->bindParam(':id', $row['id']);

            if ($stmtUpdate->execute()) {
                Helper::log($this->conn, $userId, $userName, 'UPDATE_CP', "Updated CP for $mapel");
                return json_encode(["message" => "CP updated successfully"]);
            }
        } else {
            // Create
            $id = Helper::uuid();
            $query = "INSERT INTO learning_cp (id, mapel, content, materi, updated_by) VALUES (:id, :mapel, :content, :materi, :uid)";
            $stmtInsert = $this->conn->prepare($query);
            $stmtInsert->bindParam(':id', $id);
            $stmtInsert->bindParam(':mapel', $mapel);
            $stmtInsert->bindParam(':content', $content);
            $stmtInsert->bindParam(':materi', $materi);
            $stmtInsert->bindParam(':uid', $userId);

            if ($stmtInsert->execute()) {
                Helper::log($this->conn, $userId, $userName, 'CREATE_CP', "Created CP for $mapel");
                return json_encode(["message" => "CP created successfully"]);
            }
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to save CP"]);
    }

    // --- TP Operations ---

    public function getTPs($filters)
    {
        $query = "SELECT * FROM learning_tp WHERE 1=1";
        $params = [];

        if (isset($filters['mapel']) && $filters['mapel'] && $filters['mapel'] !== 'all') {
            $query .= " AND mapel = :mapel";
            $params[':mapel'] = $filters['mapel'];
        }
        if (isset($filters['kelas']) && $filters['kelas'] && $filters['kelas'] !== 'all') {
            $query .= " AND kelas = :kelas";
            $params[':kelas'] = $filters['kelas'];
        }
        if (isset($filters['semester']) && $filters['semester'] && $filters['semester'] !== 'all') {
            $query .= " AND semester = :semester";
            $params[':semester'] = $filters['semester'];
        }

        // Order by Code if available, then by Created At
        $query .= " ORDER BY code ASC, created_at ASC";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();

        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function createTP($input, $userId, $userName)
    {
        $id = Helper::uuid();
        $code = $input['code'] ?? null;

        $query = "INSERT INTO learning_tp (id, code, mapel, kelas, semester, materi, tujuan, created_by) 
                  VALUES (:id, :code, :mapel, :kelas, :semester, :materi, :tujuan, :uid)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':code', $code);
        $stmt->bindParam(':mapel', $input['mapel']);
        $stmt->bindParam(':kelas', $input['kelas']);
        $stmt->bindParam(':semester', $input['semester']);
        $stmt->bindParam(':materi', $input['materi']);
        $stmt->bindParam(':tujuan', $input['tujuan']);
        $stmt->bindParam(':uid', $userId);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'CREATE_TP', $input['materi']);
            return json_encode(["message" => "TP created", "id" => $id]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to create TP"]);
    }

    public function updateTP($id, $input, $userId, $userName)
    {
        $code = $input['code'] ?? null;

        $query = "UPDATE learning_tp SET 
                    code = :code,
                    mapel = :mapel, 
                    kelas = :kelas, 
                    semester = :semester, 
                    materi = :materi, 
                    tujuan = :tujuan 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':code', $code);
        $stmt->bindParam(':mapel', $input['mapel']);
        $stmt->bindParam(':kelas', $input['kelas']);
        $stmt->bindParam(':semester', $input['semester']);
        $stmt->bindParam(':materi', $input['materi']);
        $stmt->bindParam(':tujuan', $input['tujuan']);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'UPDATE_TP', $input['materi']);
            return json_encode(["message" => "TP updated"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to update TP"]);
    }

    public function deleteTP($id, $userId, $userName)
    {
        // Get info for log
        $stmtInfo = $this->conn->prepare("SELECT materi FROM learning_tp WHERE id = :id");
        $stmtInfo->bindParam(':id', $id);
        $stmtInfo->execute();
        $materi = "Unknown TP";
        if ($row = $stmtInfo->fetch(PDO::FETCH_ASSOC)) {
            $materi = $row['materi'];
        }

        $query = "DELETE FROM learning_tp WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'DELETE_TP', $materi);
            return json_encode(["message" => "TP deleted"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to delete TP"]);
    }
}
?>