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

    public function getAll()
    {
        $query = "SELECT * FROM question_banks ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function create($data)
    {
        $id = Helper::uuid();
        $query = "INSERT INTO question_banks (id, title, mapel, category, file_url, game_data, is_premium, created_at) 
                  VALUES (:id, :title, :mapel, :category, :file_url, :game_data, :is_premium, NOW())";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':mapel', $data['mapel']);
        $stmt->bindParam(':category', $data['category']);
        $stmt->bindParam(':file_url', $data['file_url']);
        // Store JSON for game_data
        $gameData = isset($data['game_data']) ? json_encode($data['game_data']) : null;
        $stmt->bindParam(':game_data', $gameData);
        $isPremium = $data['is_premium'] ?? 1;
        $stmt->bindParam(':is_premium', $isPremium, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return json_encode(["message" => "Question bank created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create question bank"]);
    }

    public function delete($id)
    {
        $query = "DELETE FROM question_banks WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            return json_encode(["message" => "Question deleted"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete question"]);
    }
}
?>