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

    public function getTeacherStats()
    {
        $stats = [
            'employment' => [],
            'schoolTypes' => [
                'Negeri' => 0,
                'Swasta' => 0
            ],
            'engagement' => [
                'totalAttendance' => 0,
                'uniqueActiveTeachers' => 0
            ]
        ];

        // 1. Employment Counts
        $q1 = $this->conn->query("SELECT status_kepegawaian, COUNT(*) as count FROM profiles GROUP BY status_kepegawaian");
        $stats['employment'] = $q1->fetchAll(PDO::FETCH_ASSOC);

        // 2. School Types (Negeri vs Swasta)
        $q2 = $this->conn->query("SELECT asal_sekolah FROM profiles WHERE asal_sekolah IS NOT NULL");
        $schools = $q2->fetchAll(PDO::FETCH_COLUMN);

        foreach ($schools as $school) {
            $schoolUpper = strtoupper($school);
            // Keywords for Negeri: SMPN, SMAN, SMKN, MTSN, MAN, Negeri
            if (
                strpos($schoolUpper, 'SMPN') !== false ||
                strpos($schoolUpper, 'SMAN') !== false ||
                strpos($schoolUpper, 'SMKN') !== false ||
                strpos($schoolUpper, 'MTSN') !== false ||
                strpos($schoolUpper, 'MAN') !== false ||
                strpos($schoolUpper, 'NEGERI') !== false
            ) {
                $stats['schoolTypes']['Negeri']++;
            } else {
                $stats['schoolTypes']['Swasta']++;
            }
        }

        // 3. Engagement (Attendance)
        try {
            // Using 'attended' from event_participants table
            $q3 = $this->conn->query("SELECT COUNT(*) FROM event_participants WHERE status = 'attended'");
            $stats['engagement']['totalAttendance'] = (int) $q3->fetchColumn();

            $q4 = $this->conn->query("SELECT COUNT(DISTINCT user_id) FROM event_participants WHERE status = 'attended'");
            $stats['engagement']['uniqueActiveTeachers'] = (int) $q4->fetchColumn();
        } catch (Exception $e) {
            // Fallback if table doesn't exist or column differs
        }

        return json_encode($stats);
    }
}
?>