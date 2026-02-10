<?php
// backend/controllers/ContactController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class ContactController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function saveMessage($data)
    {
        if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
            http_response_code(400);
            return json_encode(["message" => "Name, email, and message are required"]);
        }

        $query = "INSERT INTO contact_messages (name, email, message) VALUES (:name, :email, :message)";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':message', $data['message']);

        if ($stmt->execute()) {
            return json_encode(["message" => "Message sent successfully"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to send message"]);
    }

    public function getMessages()
    {
        $query = "SELECT * FROM contact_messages ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function deleteMessage($id)
    {
        $query = "DELETE FROM contact_messages WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            return json_encode(["message" => "Message deleted"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to delete message"]);
    }
}
