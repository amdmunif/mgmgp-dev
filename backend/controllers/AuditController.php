<?php
// backend/controllers/AuditController.php
include_once './config/database.php';

class AuditController
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
        $query = "SELECT l.*, p.nama as user_display_name 
                  FROM audit_logs l 
                  LEFT JOIN profiles p ON l.user_id = p.id 
                  ORDER BY l.created_at DESC 
                  LIMIT 100";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($logs);
    }
}
?>