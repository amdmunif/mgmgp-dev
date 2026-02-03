<?php
// backend/controllers/LetterController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class LetterController
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
        $query = "SELECT * FROM letters ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function create($data)
    {
        $id = Helper::uuid();
        $query = "INSERT INTO letters (id, template_id, letter_number, letter_date, subject, recipient, author_id, content, form_data, created_at) 
                  VALUES (:id, :template_id, :letter_number, :letter_date, :subject, :recipient, :author_id, :content, :form_data, NOW())";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':template_id', $data['template_id']);
        $stmt->bindParam(':letter_number', $data['letter_number']);
        $stmt->bindParam(':letter_date', $data['letter_date']);
        $stmt->bindParam(':subject', $data['subject']);
        $stmt->bindParam(':recipient', $data['recipient']);
        $stmt->bindParam(':author_id', $data['author_id']);
        $stmt->bindParam(':content', $data['content']);

        $formData = isset($data['form_data']) ? json_encode($data['form_data']) : null;
        $stmt->bindParam(':form_data', $formData);

        if ($stmt->execute()) {
            return json_encode(["message" => "Letter created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create letter"]);
    }

    public function delete($id)
    {
        $query = "DELETE FROM letters WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            return json_encode(["message" => "Letter deleted"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete letter"]);
    }
}
?>