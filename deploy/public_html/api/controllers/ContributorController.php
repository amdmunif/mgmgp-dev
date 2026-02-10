<?php
// backend/controllers/ContributorController.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Helper.php';

class ContributorController
{
    private $conn;

    public function __construct()
    {
        $db = new Database();
        $this->conn = $db->getConnection();
    }

    public function getStatus($userId)
    {
        // Check current role
        $queryRole = "SELECT role FROM profiles WHERE id = :id";
        $stmtRole = $this->conn->prepare($queryRole);
        $stmtRole->bindParam(':id', $userId);
        $stmtRole->execute();
        $role = $stmtRole->fetchColumn();

        if ($role === 'Kontributor') {
            return json_encode(['status' => 'active', 'role' => 'Kontributor']);
        }

        // Check active application
        $queryApp = "SELECT status, notes, applied_at FROM contributor_applications WHERE user_id = :id ORDER BY applied_at DESC LIMIT 1";
        $stmtApp = $this->conn->prepare($queryApp);
        $stmtApp->bindParam(':id', $userId);
        $stmtApp->execute();
        $application = $stmtApp->fetch(PDO::FETCH_ASSOC);

        // Get Question Count (Verified or Total created by user)
        // Note: We need to count questions where creator_id = userId
        // Assuming we will migrate existing questions or new ones act as count.
        // For eligibility, maybe we count 'pending' + 'verified'? User said "make 100 questions".
        // Get Question Count (Verified or Total created by user)
        // Count from 'questions' table (new repository)
        $queryCount = "SELECT COUNT(*) FROM questions WHERE creator_id = :id";
        $stmtCount = $this->conn->prepare($queryCount);
        $stmtCount->bindParam(':id', $userId);
        $stmtCount->execute();
        $questionCount = $stmtCount->fetchColumn();

        return json_encode([
            'status' => $application ? $application['status'] : 'none',
            'application' => $application,
            'role' => $role,
            'question_count' => $questionCount
        ]);
    }

    public function apply($userId)
    {
        // 1. Check requirements (100 questions)
        $queryCount = "SELECT COUNT(*) FROM questions WHERE creator_id = :id";
        $stmtCount = $this->conn->prepare($queryCount);
        $stmtCount->bindParam(':id', $userId);
        $stmtCount->execute();
        $count = $stmtCount->fetchColumn();

        if ($count < 100) {
            http_response_code(400);
            return json_encode(["message" => "Belum memenuhi syarat minimal 100 soal."]);
        }

        // 2. Check existing pending application
        $queryCheck = "SELECT id FROM contributor_applications WHERE user_id = :id AND status = 'pending'";
        $stmtCheck = $this->conn->prepare($queryCheck);
        $stmtCheck->bindParam(':id', $userId);
        $stmtCheck->execute();
        if ($stmtCheck->rowCount() > 0) {
            http_response_code(400);
            return json_encode(["message" => "Anda sudah memiliki aplikasi pending."]);
        }

        // 3. Create Application
        $queryInsert = "INSERT INTO contributor_applications (user_id, status) VALUES (:id, 'pending')";
        $stmtInsert = $this->conn->prepare($queryInsert);
        $stmtInsert->bindParam(':id', $userId);

        if ($stmtInsert->execute()) {
            return json_encode(["message" => "Aplikasi berhasil dikirim. Tunggu verifikasi admin."]);
        }

        http_response_code(500);
        return json_encode(["message" => "Gagal mengirim aplikasi."]);
    }

    // Admin: List Applications
    public function getAllApplications()
    {
        $query = "SELECT ca.*, p.nama, p.email, 
                  (SELECT COUNT(*) FROM questions q WHERE q.creator_id = ca.user_id) as question_count
                  FROM contributor_applications ca
                  JOIN profiles p ON ca.user_id = p.id
                  ORDER BY ca.applied_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $apps = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($apps);
    }

    // Admin: Verify
    public function verify($data) // { id: applicationId, status: 'approved'|'rejected', notes: '' }
    {
        $appId = $data['id'];
        $status = $data['status'];
        $notes = $data['notes'] ?? '';

        if (!in_array($status, ['approved', 'rejected'])) {
            http_response_code(400);
            return json_encode(["message" => "Invalid status."]);
        }

        $this->conn->beginTransaction();

        try {
            // Update Application
            $queryApp = "UPDATE contributor_applications SET status = :status, notes = :notes WHERE id = :id";
            $stmtApp = $this->conn->prepare($queryApp);
            $stmtApp->bindParam(':status', $status);
            $stmtApp->bindParam(':notes', $notes);
            $stmtApp->bindParam(':id', $appId);
            $stmtApp->execute();

            if ($status === 'approved') {
                // Get User ID
                $queryGet = "SELECT user_id FROM contributor_applications WHERE id = :id";
                $stmtGet = $this->conn->prepare($queryGet);
                $stmtGet->bindParam(':id', $appId);
                $stmtGet->execute();
                $userId = $stmtGet->fetchColumn();

                if ($userId) {
                    // Update Role to 'Kontributor'
                    $queryRole = "UPDATE profiles SET role = 'Kontributor', premium_until = DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE id = :id";
                    $stmtRole = $this->conn->prepare($queryRole);
                    $stmtRole->bindParam(':id', $userId);
                    $stmtRole->execute();
                }
            }

            $this->conn->commit();
            return json_encode(["message" => "Application $status."]);

        } catch (Exception $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Failed to verify: " . $e->getMessage()]);
        }
    }
}
?>