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
            // More accurate regex for Negeri schools to avoid false positives like "NURUL IMAN" matching "MAN"
            // Matches boundaries of SMAN, SMPN, SMKN, MTSN, MAN, MIN, SDN, NEGERI
            if (preg_match('/\b(SMPN|SMAN|SMKN|MTSN|MAN|MIN|SDN)[ \-\d]*\b|\bNEGERI\b/i', $school)) {
                $stats['schoolTypes']['Negeri']++;
            } else {
                $stats['schoolTypes']['Swasta']++;
            }
        }

        // 3. Engagement (Attendance)
        try {
            // Using 'is_hadir' from event_participants table
            $q3 = $this->conn->query("SELECT COUNT(*) FROM event_participants WHERE is_hadir = 1");
            $stats['engagement']['totalAttendance'] = (int) $q3->fetchColumn();

            $q4 = $this->conn->query("SELECT COUNT(DISTINCT user_id) FROM event_participants WHERE is_hadir = 1");
            $stats['engagement']['uniqueActiveTeachers'] = (int) $q4->fetchColumn();
        } catch (Exception $e) {
            // Fallback if table doesn't exist or column differs
        }

        // 4. Education Distribution (Pendidikan Terakhir)
        $q5 = $this->conn->query("SELECT pendidikan_terakhir, COUNT(*) as count FROM profiles WHERE pendidikan_terakhir IS NOT NULL AND pendidikan_terakhir != '' GROUP BY pendidikan_terakhir ORDER BY count DESC");
        $stats['education'] = $q5->fetchAll(PDO::FETCH_ASSOC);

        // 5. Top Schools (Asal Sekolah terbanyak)
        $q6 = $this->conn->query("SELECT asal_sekolah, COUNT(*) as count FROM profiles WHERE asal_sekolah IS NOT NULL AND asal_sekolah != '' GROUP BY asal_sekolah ORDER BY count DESC LIMIT 5");
        $stats['topSchools'] = $q6->fetchAll(PDO::FETCH_ASSOC);

        // 6. Majors (Jurusan)
        $q7 = $this->conn->query("SELECT jurusan, COUNT(*) as count FROM profiles WHERE jurusan IS NOT NULL AND jurusan != '' GROUP BY jurusan ORDER BY count DESC LIMIT 10");
        $stats['majors'] = $q7->fetchAll(PDO::FETCH_ASSOC);

        return json_encode($stats);
    }
    
    public function getLeaderboard()
    {
        $memberFilter = isset($_GET['member_type']) ? $_GET['member_type'] : 'all';
        $eventFilter = isset($_GET['event_type']) ? $_GET['event_type'] : 'all';

        $query = "SELECT p.id, p.nama, p.asal_sekolah, p.premium_until, 
                  COUNT(DISTINCT e.id) as total_events_attended
                  FROM event_attendances ea
                  JOIN events e ON ea.event_id = e.id
                  JOIN profiles p ON ea.user_id = p.id
                  WHERE 1=1";

        if ($memberFilter === 'premium') {
            $query .= " AND p.premium_until >= NOW()";
        } elseif ($memberFilter === 'reguler') {
            $query .= " AND (p.premium_until IS NULL OR p.premium_until < NOW())";
        }

        if ($eventFilter === 'premium') {
            $query .= " AND e.is_premium = 1";
        } elseif ($eventFilter === 'umum') {
            $query .= " AND e.is_premium = 0";
        }

        $query .= " GROUP BY p.id, p.nama, p.asal_sekolah, p.premium_until 
                    ORDER BY total_events_attended DESC, p.nama ASC 
                    LIMIT 100";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            http_response_code(500);
            return json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }
}
?>