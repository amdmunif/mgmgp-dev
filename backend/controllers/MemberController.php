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

    public function autoMergeDuplicates()
    {
        // 1. Find duplicates based on exact match of Email OR (Nama AND Asal Sekolah) OR No HP
        // We will do a self join to find potential duplicates
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
                (u1.email = u2.email AND u1.email IS NOT NULL AND u1.email != '') OR
                (p1.no_hp = p2.no_hp AND p1.no_hp IS NOT NULL AND p1.no_hp != '') OR
                (p1.nama = p2.nama AND p1.asal_sekolah = p2.asal_sekolah AND p1.nama != '' AND p1.asal_sekolah != '')
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $mergedCount = 0;
        $processedIds = [];

        foreach ($duplicates as $dup) {
            if (in_array($dup['id1'], $processedIds) || in_array($dup['id2'], $processedIds)) {
                continue; // Already processed in this batch
            }

            // Determine primary
            $primaryId = $dup['id1'];
            $secondaryId = $dup['id2'];
            $primaryEmail = $dup['email1'];

            if ($dup['attendance2'] > $dup['attendance1']) {
                $primaryId = $dup['id2'];
                $secondaryId = $dup['id1'];
                $primaryEmail = $dup['email2'];
            }

            try {
                $this->conn->beginTransaction();

                // 1. Move event_participants
                $updateEvents = "UPDATE event_participants SET user_id = :primary_id WHERE user_id = :secondary_id";
                $stmtEvents = $this->conn->prepare($updateEvents);
                $stmtEvents->execute([':primary_id' => $primaryId, ':secondary_id' => $secondaryId]);

                // 2. Move other references if any (e.g. audit_logs)
                
                // 3. Delete secondary profile & user
                $deleteUser = "DELETE FROM users WHERE id = :secondary_id";
                $stmtDelete = $this->conn->prepare($deleteUser);
                $stmtDelete->execute([':secondary_id' => $secondaryId]);

                $this->conn->commit();
                $mergedCount++;
                $processedIds[] = $primaryId;
                $processedIds[] = $secondaryId;

                // Send Email Notification
                Mailer::sendDuplicateMerged($primaryEmail, $dup['nama1'] ?? $dup['nama2']);

            } catch (Exception $e) {
                $this->conn->rollBack();
                // Log or continue
            }
        }

        return json_encode([
            "message" => "Auto-merge completed.",
            "merged_count" => $mergedCount
        ]);
    }
}
?>