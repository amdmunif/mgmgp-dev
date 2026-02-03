<?php
// backend/controllers/MemberController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class MemberController
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
        // Join profiles with users to get email
        $query = "SELECT p.*, u.email FROM profiles p 
                  LEFT JOIN users u ON p.id = u.id 
                  ORDER BY p.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function updateRole($id, $data)
    {
        $role = $data['role']; // Admin or Member

        $query = "UPDATE profiles SET role = :role WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':role', $role);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            return json_encode(["message" => "Role updated successfully"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to update role"]);
    }

    public function delete($id)
    {
        // Delete from profiles and users (ON DELETE CASCADE usually handles this if set in FK, 
        // but let's be safe and delete from users which cascades to profiles usually, or vice versa depending on schema)
        // Based on schema, profiles has FK to users.id. So deleting user should cascade to profile.

        // Let's delete from users table to ensure complete removal.
        $query = "DELETE FROM users WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            return json_encode(["message" => "Member deleted successfully"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to delete member"]);
    }
}
?>