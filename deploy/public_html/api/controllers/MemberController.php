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

    public function update($id, $data)
    {
        // Split updates for profiles and users tables
        $profileUpdates = [];
        $userUpdates = [];

        // Profiles table fields
        if (isset($data['nama']))
            $profileUpdates[] = "nama = :nama";
        if (isset($data['role']))
            $profileUpdates[] = "role = :role";
        if (isset($data['is_active']))
            $profileUpdates[] = "is_active = :is_active";

        // Users table fields
        if (isset($data['email']))
            $userUpdates[] = "email = :email";

        if (empty($profileUpdates) && empty($userUpdates)) {
            http_response_code(400);
            return json_encode(["message" => "No fields to update"]);
        }

        try {
            $this->conn->beginTransaction();

            if (!empty($profileUpdates)) {
                $query = "UPDATE profiles SET " . implode(", ", $profileUpdates) . " WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                if (isset($data['nama']))
                    $stmt->bindValue(':nama', $data['nama']);
                if (isset($data['role']))
                    $stmt->bindValue(':role', $data['role']);
                if (isset($data['is_active']))
                    $stmt->bindValue(':is_active', $data['is_active']);
                $stmt->bindValue(':id', $id);
                $stmt->execute();
            }

            if (!empty($userUpdates)) {
                $query = "UPDATE users SET " . implode(", ", $userUpdates) . " WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                if (isset($data['email']))
                    $stmt->bindValue(':email', $data['email']);
                $stmt->bindValue(':id', $id);
                $stmt->execute();
            }

            $this->conn->commit();
            return json_encode(["message" => "Member updated successfully"]);
        } catch (Exception $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Failed to update member: " . $e->getMessage()]);
        }
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