<?php
// backend/controllers/ProjectController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class ProjectController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    // Public: Get all approved projects
    public function getPublicProjects()
    {
        $query = "SELECT mp.*, p.nama as user_name 
                  FROM member_projects mp
                  LEFT JOIN profiles p ON mp.user_id = p.id
                  WHERE mp.status = 'approved'
                  ORDER BY mp.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Admin: Get all projects (pending, approved, rejected)
    public function getAllProjects()
    {
        $query = "SELECT mp.*, p.nama as user_name 
                  FROM member_projects mp
                  LEFT JOIN profiles p ON mp.user_id = p.id
                  ORDER BY mp.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Member: Get their own projects
    public function getMyProjects($userId)
    {
        $query = "SELECT * FROM member_projects WHERE user_id = :user_id ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Member: Submit a new project
    public function createProject($userId, $data)
    {
        $id = Helper::uuid();
        $title = $data['title'] ?? '';
        $description = $data['description'] ?? '';
        $linkUrl = $data['link_url'] ?? '';
        $imageUrl = $data['image_url'] ?? '';

        $query = "INSERT INTO member_projects (id, user_id, title, description, link_url, image_url, status, created_at, updated_at) 
                  VALUES (:id, :user_id, :title, :description, :link_url, :image_url, 'pending', NOW(), NOW())";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':link_url', $linkUrl);
        $stmt->bindParam(':image_url', $imageUrl);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, 'Member', 'CREATE_PROJECT', "Title: $title", 'Peserta');
            return json_encode(["message" => "Project submitted successfully"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to submit project"]);
    }

    // Member: Update their project
    public function updateProject($id, $userId, $data)
    {
        $title = $data['title'] ?? '';
        $description = $data['description'] ?? '';
        $linkUrl = $data['link_url'] ?? '';
        $imageUrl = $data['image_url'] ?? '';

        $query = "UPDATE member_projects 
                  SET title = :title, description = :description, link_url = :link_url, image_url = :image_url, status = 'pending', updated_at = NOW() 
                  WHERE id = :id AND user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':link_url', $linkUrl);
        $stmt->bindParam(':image_url', $imageUrl);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $userId);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, 'Member', 'UPDATE_PROJECT', "Project ID: $id", 'Peserta');
            return json_encode(["message" => "Project updated successfully"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to update project"]);
    }

    // Member: Delete their project
    public function deleteProject($id, $userId, $userRole = 'Member')
    {
        if (in_array($userRole, ['Admin', 'Pengurus'])) {
            $query = "DELETE FROM member_projects WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
        } else {
            $query = "DELETE FROM member_projects WHERE id = :id AND user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $userId);
        }

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, 'Member', 'DELETE_PROJECT', "Project ID: $id", 'Peserta');
            return json_encode(["message" => "Project deleted successfully"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete project"]);
    }

    // Admin: Update status
    public function updateStatus($id, $status)
    {
        if (!in_array($status, ['pending', 'approved', 'rejected'])) {
            http_response_code(400);
            return json_encode(["message" => "Invalid status"]);
        }

        $query = "UPDATE member_projects SET status = :status, updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            Helper::log($this->conn, 0, 'Admin', 'VALIDATE_PROJECT', "Project ID: $id, Status: $status");
            return json_encode(["message" => "Status updated successfully"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to update status"]);
    }
}
?>
