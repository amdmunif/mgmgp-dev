<?php
// backend/controllers/MemberController.php
include_once './config/database.php';
include_once './utils/Helper.php';
include_once './utils/Mailer.php';

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
        $query = "SELECT p.*, u.email, 
                  (SELECT COUNT(*) FROM event_participants ep WHERE ep.user_id = p.id AND ep.is_hadir = 1) as attendance_count,
                  CASE WHEN p.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN 1 ELSE 0 END as is_new
                  FROM profiles p 
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
        $allowedProfileFields = ['nama', 'role', 'is_active', 'asal_sekolah', 'no_hp', 'pendidikan_terakhir', 'jurusan', 'status_kepegawaian'];
        foreach ($allowedProfileFields as $field) {
            if (isset($data[$field])) {
                $profileUpdates[] = "$field = :$field";
            }
        }

        // Users table fields
        if (isset($data['email']))
            $userUpdates[] = "email = :email";

        if (empty($profileUpdates) && empty($userUpdates)) {
            http_response_code(400);
            return json_encode(["message" => "No fields to update"]);
        }

        $isActivating = false;
        $userEmail = '';
        $userNama = '';

        if (isset($data['is_active']) && $data['is_active'] == 1) {
            $stmtCheck = $this->conn->prepare("SELECT p.is_active, p.nama, u.email FROM profiles p JOIN users u ON p.id = u.id WHERE p.id = :id");
            $stmtCheck->bindParam(':id', $id);
            $stmtCheck->execute();
            $rowCheck = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if ($rowCheck && $rowCheck['is_active'] == 0) {
                $isActivating = true;
                $userEmail = $rowCheck['email'];
                $userNama = isset($data['nama']) ? $data['nama'] : $rowCheck['nama'];
            }
        }

        try {
            $this->conn->beginTransaction();

            if (!empty($profileUpdates)) {
                $query = "UPDATE profiles SET " . implode(", ", $profileUpdates) . " WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                foreach ($allowedProfileFields as $field) {
                    if (isset($data[$field])) {
                        $stmt->bindValue(":$field", $data[$field]);
                    }
                }
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
            Helper::log($this->conn, 0, 'Admin', 'UPDATE_MEMBER', $userNama || $id);

            if ($isActivating && $userEmail) {
                Mailer::sendMemberActivated($userEmail, $userNama);
            }

            return json_encode(["message" => "Data Anggota berhasil diperbarui"]);
        } catch (Exception $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Gagal memperbarui data anggota: " . $e->getMessage()]);
        }
    }

    public function resetPassword($id, $data)
    {
        $newPassword = $data['password'] ?? null;
        if (!$newPassword) {
            http_response_code(400);
            return json_encode(["message" => "Password baru wajib diisi."]);
        }

        try {
            $this->conn->beginTransaction();

            // Get user email
            $stmt = $this->conn->prepare("SELECT email FROM users WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$user) {
                throw new Exception("User tidak ditemukan.");
            }

            $hashed = password_hash($newPassword, PASSWORD_DEFAULT);
            $update = $this->conn->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");
            $update->execute([':hash' => $hashed, ':id' => $id]);

            $this->conn->commit();
            
            Helper::log($this->conn, 0, 'Admin', 'RESET_PASSWORD', $id);
            Mailer::sendPasswordResetAdmin($user['email'], $newPassword);

            return json_encode(["message" => "Password berhasil diubah dan dikirim ke email tujuan."]);
        } catch (Exception $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Gagal mereset password: " . $e->getMessage()]);
        }
    }

    public function delete($id)
    {
        try {
            $this->conn->beginTransaction();

            // Clean up related records manually to avoid FK constraint failures
            $tablesToDelete = [
                'audit_logs',
                'premium_requests',
                'event_participants',
                'contributor_applications',
                'training_registrations',
                'profiles',
                'users'
            ];

            foreach ($tablesToDelete as $table) {
                try {
                    $col = ($table === 'profiles' || $table === 'users') ? 'id' : 'user_id';
                    $stmt = $this->conn->prepare("DELETE FROM $table WHERE $col = :id");
                    $stmt->execute([':id' => $id]);
                } catch (Exception $e) {
                    if ($table === 'users' || $table === 'profiles') {
                        throw $e;
                    }
                }
            }

            // Set creator_id to NULL in questions if applicable (to prevent deleting questions)
            try {
                $this->conn->prepare("UPDATE questions SET creator_id = NULL WHERE creator_id = :id")->execute([':id' => $id]);
            } catch (Exception $e) {
                // Ignore if table/column doesn't exist or is not nullable
            }

            $this->conn->commit();
            return json_encode(["message" => "Data Anggota berhasil dihapus"]);
        } catch (Exception $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Gagal menghapus data anggota: " . $e->getMessage()]);
        }
    }

    public function getDuplicates()
    {
        // Find duplicates based on exact match of Email OR (Nama AND Asal Sekolah) OR No HP
        $query = "
            SELECT 
                p1.id as id1, p1.nama as nama1, p1.asal_sekolah as sekolah1, p1.no_hp as hp1, u1.email as email1,
                (SELECT COUNT(*) FROM event_participants ep WHERE ep.user_id = p1.id) as attendance1,
                p2.id as id2, p2.nama as nama2, p2.asal_sekolah as sekolah2, p2.no_hp as hp2, u2.email as email2,
                (SELECT COUNT(*) FROM event_participants ep WHERE ep.user_id = p2.id) as attendance2
            FROM profiles p1
            JOIN users u1 ON p1.id = u1.id
            JOIN profiles p2 ON p1.id < p2.id
            JOIN users u2 ON p2.id = u2.id
            WHERE 
                (LOWER(TRIM(u1.email)) = LOWER(TRIM(u2.email)) AND u1.email IS NOT NULL AND TRIM(u1.email) != '') OR
                (
                    REPLACE(REPLACE(REPLACE(LOWER(TRIM(p1.nama)), ' ', ''), '.', ''), ',', '') = 
                    REPLACE(REPLACE(REPLACE(LOWER(TRIM(p2.nama)), ' ', ''), '.', ''), ',', '') 
                    AND p1.nama IS NOT NULL AND TRIM(p1.nama) != '' AND LENGTH(TRIM(p1.nama)) > 3
                ) OR
                (
                    REPLACE(REPLACE(p1.no_hp, ' ', ''), '-', '') = REPLACE(REPLACE(p2.no_hp, ' ', ''), '-', '')
                    AND p1.no_hp IS NOT NULL AND TRIM(p1.no_hp) != '' AND LENGTH(TRIM(p1.no_hp)) > 8
                )
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return json_encode($duplicates);
    }

    public function mergeDuplicate($data)
    {
        $id1 = $data['id1'] ?? null;
        $id2 = $data['id2'] ?? null;

        if (!$id1 || !$id2) {
            http_response_code(400);
            return json_encode(["message" => "ID Anggota tidak lengkap."]);
        }

        try {
            $this->conn->beginTransaction();

            // Fetch details to know which one is primary based on attendance, 
            // or just use $id1 as primary as determined by frontend/user.
            // Let's assume the frontend sends the primary ID as id1 and secondary as id2
            $primaryId = $id1;
            $secondaryId = $id2;

            // Get emails for notification
            $stmtPrimary = $this->conn->prepare("SELECT u.email, p.nama FROM users u JOIN profiles p ON u.id = p.id WHERE u.id = :id");
            $stmtPrimary->execute([':id' => $primaryId]);
            $primaryData = $stmtPrimary->fetch(PDO::FETCH_ASSOC);

            $stmtSecondary = $this->conn->prepare("SELECT u.email FROM users u WHERE u.id = :id");
            $stmtSecondary->execute([':id' => $secondaryId]);
            $secondaryData = $stmtSecondary->fetch(PDO::FETCH_ASSOC);

            if (!$primaryData || !$secondaryData) {
                throw new Exception("Data pengguna tidak ditemukan.");
            }

            $primaryEmail = $primaryData['email'];
            $secondaryEmail = $secondaryData['email'];
            $nama = $primaryData['nama'];

            // 1. Move event_participants intelligently (preserve attendance if one of them attended)
            // If they both have the same event, update the primary to take the best of both
            $mergeBoth = "UPDATE event_participants ep1
                          JOIN event_participants ep2 ON ep1.event_id = ep2.event_id 
                          SET ep1.is_hadir = GREATEST(ep1.is_hadir, ep2.is_hadir),
                              ep1.tugas_submitted = GREATEST(ep1.tugas_submitted, ep2.tugas_submitted),
                              ep1.task_url = COALESCE(NULLIF(ep1.task_url, ''), ep2.task_url)
                          WHERE ep1.user_id = :primary_id AND ep2.user_id = :secondary_id";
            $stmtMergeBoth = $this->conn->prepare($mergeBoth);
            $stmtMergeBoth->execute([':primary_id' => $primaryId, ':secondary_id' => $secondaryId]);

            // Then update the rest (where primary didn't exist)
            $updateRest = "UPDATE IGNORE event_participants SET user_id = :primary_id WHERE user_id = :secondary_id";
            $stmtUpdateRest = $this->conn->prepare($updateRest);
            $stmtUpdateRest->execute([':primary_id' => $primaryId, ':secondary_id' => $secondaryId]);

            // Then delete any remaining secondary records
            $deleteRemaining = "DELETE FROM event_participants WHERE user_id = :secondary_id";
            $stmtDeleteRemaining = $this->conn->prepare($deleteRemaining);
            $stmtDeleteRemaining->execute([':secondary_id' => $secondaryId]);

            // 1.5. Transfer premium status if secondary is better
            $stmtCheckPremium = $this->conn->prepare("SELECT premium_until FROM profiles WHERE id = :id");
            $stmtCheckPremium->execute([':id' => $secondaryId]);
            $secPremium = $stmtCheckPremium->fetchColumn();

            $stmtCheckPremiumPrimary = $this->conn->prepare("SELECT premium_until FROM profiles WHERE id = :id");
            $stmtCheckPremiumPrimary->execute([':id' => $primaryId]);
            $priPremium = $stmtCheckPremiumPrimary->fetchColumn();

            if ($secPremium) {
                if (!$priPremium || strtotime($secPremium) > strtotime($priPremium)) {
                    $updatePremium = "UPDATE profiles SET premium_until = :premium WHERE id = :id";
                    $stmtUpdatePremium = $this->conn->prepare($updatePremium);
                    $stmtUpdatePremium->execute([':premium' => $secPremium, ':id' => $primaryId]);
                }
            }

            // 2. Delete secondary profile & user
            $deleteUser = "DELETE FROM users WHERE id = :secondary_id";
            $stmtDelete = $this->conn->prepare($deleteUser);
            $stmtDelete->execute([':secondary_id' => $secondaryId]);

            $this->conn->commit();

            // Send Email Notification to primary
            Mailer::sendDuplicateMerged($primaryEmail, $nama);

            // If secondary email is different and valid, notify them as well
            if ($secondaryEmail && $secondaryEmail !== $primaryEmail) {
                Mailer::sendDuplicateMerged($secondaryEmail, $nama);
            }

            return json_encode([
                "message" => "Data berhasil digabungkan."
            ]);
        } catch (Exception $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Gagal menggabungkan data: " . $e->getMessage()]);
        }
    }
}
?>