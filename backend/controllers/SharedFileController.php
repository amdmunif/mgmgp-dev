<?php
// backend/controllers/SharedFileController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class SharedFileController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->ensureTable();
    }

    private function ensureTable()
    {
        if (!$this->conn) return;
        $sql = "CREATE TABLE IF NOT EXISTS `shared_files` (
            `id` char(36) NOT NULL,
            `title` varchar(255) NOT NULL,
            `description` text DEFAULT NULL,
            `category` varchar(100) NOT NULL DEFAULT 'Modul/Bahan Ajar',
            `mapel` varchar(50) DEFAULT 'Informatika',
            `kelas` varchar(20) DEFAULT 'Semua',
            `file_url` text NOT NULL,
            `file_name` varchar(255) DEFAULT NULL,
            `file_type` varchar(50) DEFAULT 'other',
            `file_ext` varchar(20) DEFAULT NULL,
            `file_size` int(11) DEFAULT 0,
            `user_id` char(36) NOT NULL,
            `uploader_name` varchar(255) DEFAULT NULL,
            `downloads_count` int(11) DEFAULT 0,
            `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
            `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (`id`),
            KEY `idx_shared_user` (`user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        try {
            $this->conn->exec($sql);
        } catch (Exception $e) {
            // Ignore if table already exists
        }
    }

    private function detectFileGroup($ext)
    {
        $ext = strtolower(trim($ext, '.'));
        if ($ext === 'pdf') return 'pdf';
        if (in_array($ext, ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'csv', 'rtf'])) return 'office';
        if (in_array($ext, ['html', 'htm'])) return 'html';
        if (in_array($ext, ['zip', 'rar', '7z', 'tar', 'gz'])) return 'archive';
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) return 'image';
        return 'other';
    }

    public function getAll()
    {
        if (!$this->conn) {
            http_response_code(500);
            return json_encode(["message" => "Database connection error"]);
        }

        try {
            $query = "SELECT sf.*, 
                             COALESCE(p.nama, sf.uploader_name, 'Anggota') as uploader_name,
                             p.asal_sekolah as uploader_school,
                             p.role as uploader_role
                      FROM shared_files sf
                      LEFT JOIN profiles p ON CONVERT(sf.user_id USING utf8mb4) = CONVERT(p.id USING utf8mb4)
                      ORDER BY sf.created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            try {
                $query = "SELECT * FROM shared_files ORDER BY created_at DESC";
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
                return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            } catch (Exception $ex) {
                http_response_code(500);
                return json_encode(["message" => "Gagal mengambil data file: " . $ex->getMessage()]);
            }
        }
    }

    public function create($data, $userId, $userName)
    {
        if (!$userId) {
            http_response_code(401);
            return json_encode(["message" => "Silakan login terlebih dahulu"]);
        }

        $id = Helper::uuid();
        $title = trim($data['title'] ?? '');
        $description = $data['description'] ?? '';
        $category = $data['category'] ?? 'Modul/Bahan Ajar';
        $mapel = $data['mapel'] ?? 'Informatika';
        $kelas = $data['kelas'] ?? 'Semua';
        $fileUrl = $data['file_url'] ?? '';
        $fileName = $data['file_name'] ?? basename($fileUrl);
        $fileSize = isset($data['file_size']) ? (int)$data['file_size'] : 0;

        $ext = strtolower(pathinfo($fileName ?: $fileUrl, PATHINFO_EXTENSION));
        $fileType = !empty($data['file_type']) ? $data['file_type'] : $this->detectFileGroup($ext);

        if (!$title || !$fileUrl) {
            http_response_code(400);
            return json_encode(["message" => "Judul dan file wajib diisi"]);
        }

        $query = "INSERT INTO shared_files 
                  (id, title, description, category, mapel, kelas, file_url, file_name, file_type, file_ext, file_size, user_id, uploader_name)
                  VALUES (:id, :title, :description, :category, :mapel, :kelas, :file_url, :file_name, :file_type, :file_ext, :file_size, :user_id, :uploader_name)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':mapel', $mapel);
        $stmt->bindParam(':kelas', $kelas);
        $stmt->bindParam(':file_url', $fileUrl);
        $stmt->bindParam(':file_name', $fileName);
        $stmt->bindParam(':file_type', $fileType);
        $stmt->bindParam(':file_ext', $ext);
        $stmt->bindParam(':file_size', $fileSize);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':uploader_name', $userName);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'UPLOAD_SHARED_FILE', $title);
            return json_encode(["message" => "File berhasil dibagikan", "id" => $id]);
        }

        http_response_code(500);
        return json_encode(["message" => "Gagal menyimpan file"]);
    }

    public function update($id, $data, $userId, $userName, $userRole = 'Anggota')
    {
        if (!$userId) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }

        // Check ownership or admin/pengurus role
        $checkStmt = $this->conn->prepare("SELECT user_id FROM shared_files WHERE id = :id");
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            http_response_code(404);
            return json_encode(["message" => "File tidak ditemukan"]);
        }

        $isAdminOrPengurus = in_array($userRole, ['Admin', 'Super Admin', 'Pengurus']);
        if ($existing['user_id'] !== $userId && !$isAdminOrPengurus) {
            http_response_code(403);
            return json_encode(["message" => "Anda tidak memiliki akses untuk mengubah file ini"]);
        }

        $title = trim($data['title'] ?? '');
        $description = $data['description'] ?? '';
        $category = $data['category'] ?? 'Modul/Bahan Ajar';
        $mapel = $data['mapel'] ?? 'Informatika';
        $kelas = $data['kelas'] ?? 'Semua';

        $query = "UPDATE shared_files SET
                    title = :title,
                    description = :description,
                    category = :category,
                    mapel = :mapel,
                    kelas = :kelas";

        if (!empty($data['file_url'])) {
            $query .= ", file_url = :file_url, file_name = :file_name, file_type = :file_type, file_ext = :file_ext, file_size = :file_size";
        }
        $query .= " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':mapel', $mapel);
        $stmt->bindParam(':kelas', $kelas);

        if (!empty($data['file_url'])) {
            $fileUrl = $data['file_url'];
            $fileName = $data['file_name'] ?? basename($fileUrl);
            $fileSize = isset($data['file_size']) ? (int)$data['file_size'] : 0;
            $ext = strtolower(pathinfo($fileName ?: $fileUrl, PATHINFO_EXTENSION));
            $fileType = !empty($data['file_type']) ? $data['file_type'] : $this->detectFileGroup($ext);

            $stmt->bindParam(':file_url', $fileUrl);
            $stmt->bindParam(':file_name', $fileName);
            $stmt->bindParam(':file_type', $fileType);
            $stmt->bindParam(':file_ext', $ext);
            $stmt->bindParam(':file_size', $fileSize);
        }

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'UPDATE_SHARED_FILE', $title);
            return json_encode(["message" => "Data file berhasil diperbarui"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Gagal memperbarui data file"]);
    }

    public function delete($id, $userId, $userName, $userRole = 'Anggota')
    {
        if (!$userId) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }

        $checkStmt = $this->conn->prepare("SELECT user_id, title FROM shared_files WHERE id = :id");
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            http_response_code(404);
            return json_encode(["message" => "File tidak ditemukan"]);
        }

        $isAdminOrPengurus = in_array($userRole, ['Admin', 'Super Admin', 'Pengurus']);
        if ($existing['user_id'] !== $userId && !$isAdminOrPengurus) {
            http_response_code(403);
            return json_encode(["message" => "Anda tidak memiliki akses untuk menghapus file ini"]);
        }

        $stmt = $this->conn->prepare("DELETE FROM shared_files WHERE id = :id");
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'DELETE_SHARED_FILE', $existing['title'] ?? $id);
            return json_encode(["message" => "File berhasil dihapus"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Gagal menghapus file"]);
    }

    public function incrementDownload($id)
    {
        $stmt = $this->conn->prepare("UPDATE shared_files SET downloads_count = downloads_count + 1 WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return json_encode(["message" => "OK"]);
    }
}
?>

