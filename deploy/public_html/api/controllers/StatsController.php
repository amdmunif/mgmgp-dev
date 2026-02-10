<?php
// backend/controllers/StatsController.php
include_once './config/database.php';

class StatsController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function getOverview()
    {
        $stats = [
            'members' => 0,
            'materials' => 0,
            'events' => 0,
            'premium' => 0,
            'pendingMembers' => 0,
            'pendingPremium' => 0
        ];

        // Members Count (all)
        $q1 = $this->conn->query("SELECT COUNT(*) FROM profiles");
        $stats['members'] = $q1->fetchColumn();

        // Pending Members (is_active = 0)
        $q2 = $this->conn->query("SELECT COUNT(*) FROM profiles WHERE is_active = 0");
        $stats['pendingMembers'] = $q2->fetchColumn();

        // Materials
        $q3 = $this->conn->query("SELECT COUNT(*) FROM learning_materials");
        $stats['materials'] = $q3->fetchColumn();

        // Events
        $q4 = $this->conn->query("SELECT COUNT(*) FROM events");
        $stats['events'] = $q4->fetchColumn();

        // Premium Requests (Approved)
        $q5 = $this->conn->query("SELECT COUNT(*) FROM premium_requests WHERE status = 'approved'");
        $stats['premium'] = $q5->fetchColumn();

        // Pending Premium Requests
        $q6 = $this->conn->query("SELECT COUNT(*) FROM premium_requests WHERE status = 'pending'");
        $stats['pendingPremium'] = $q6->fetchColumn();

        return json_encode($stats);
    }
}
?>