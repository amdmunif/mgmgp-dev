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
            return json_encode(["message" => "Data Anggota berhasil dihapus"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Gagal menghapus data anggota"]);
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
                (LOWER(TRIM(u1.email)) = LOWER(TRIM(u2.email)) AND u1.email IS NOT NULL AND u1.email != '') OR
                (REPLACE(p1.no_hp, ' ', '') = REPLACE(p2.no_hp, ' ', '') AND p1.no_hp IS NOT NULL AND p1.no_hp != '') OR
                (LOWER(TRIM(p1.nama)) = LOWER(TRIM(p2.nama)) AND p1.nama != '')
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

            // 1. Move event_participants
            $updateEvents = "UPDATE event_participants SET user_id = :primary_id WHERE user_id = :secondary_id";
            $stmtEvents = $this->conn->prepare($updateEvents);
            $stmtEvents->execute([':primary_id' => $primaryId, ':secondary_id' => $secondaryId]);

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