<?php
// backend/controllers/InteractiveMediaController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class InteractiveMediaController
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
        $sql = "CREATE TABLE IF NOT EXISTS `interactive_media` (
            `id` char(36) NOT NULL,
            `title` varchar(255) NOT NULL,
            `description` text DEFAULT NULL,
            `mapel` varchar(50) DEFAULT 'Informatika',
            `kelas` varchar(20) DEFAULT 'Semua',
            `semester` varchar(20) DEFAULT 'Semua',
            `category` varchar(100) DEFAULT 'Simulasi',
            `file_url` text NOT NULL,
            `file_name` varchar(255) DEFAULT NULL,
            `file_size` int(11) DEFAULT 0,
            `author_id` char(36) DEFAULT NULL,
            `author_name` varchar(255) DEFAULT NULL,
            `views_count` int(11) DEFAULT 0,
            `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
            `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        try {
            $this->conn->exec($sql);
        } catch (Exception $e) {
            // Ignore if table already exists
        }
    }

    public function getAll()
    {
        if (!$this->conn) {
            http_response_code(500);
            return json_encode(["message" => "Database connection error"]);
        }

        try {
            $query = "SELECT im.*, COALESCE(p.nama, im.author_name, 'Admin') as creator_name
                      FROM interactive_media im
                      LEFT JOIN profiles p ON CONVERT(im.author_id USING utf8mb4) = CONVERT(p.id USING utf8mb4)
                      ORDER BY im.created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            try {
                $query = "SELECT *, author_name as creator_name FROM interactive_media ORDER BY created_at DESC";
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
                return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            } catch (Exception $ex) {
                http_response_code(500);
                return json_encode(["message" => "Gagal mengambil data: " . $ex->getMessage()]);
            }
        }
    }

    public function getById($id)
    {
        if (!$this->conn) {
            http_response_code(500);
            return json_encode(["message" => "Database connection error"]);
        }

        try {
            $query = "SELECT im.*, COALESCE(p.nama, im.author_name, 'Admin') as creator_name
                      FROM interactive_media im
                      LEFT JOIN profiles p ON CONVERT(im.author_id USING utf8mb4) = CONVERT(p.id USING utf8mb4)
                      WHERE im.id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row) {
                return json_encode($row);
            }
        } catch (Exception $e) {
            try {
                $query = "SELECT *, author_name as creator_name FROM interactive_media WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':id', $id);
                $stmt->execute();
                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($row) {
                    return json_encode($row);
                }
            } catch (Exception $ex) {
                // fall through to 404
            }
        }

        http_response_code(404);
        return json_encode(["message" => "Media interaktif tidak ditemukan"]);
    }

    public function create($data, $userId, $userName)
    {
        if (!$userId) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }

        $id = Helper::uuid();
        $title = trim($data['title'] ?? '');
        $description = $data['description'] ?? '';
        $mapel = $data['mapel'] ?? 'Informatika';
        $kelas = $data['kelas'] ?? 'Semua';
        $semester = $data['semester'] ?? 'Semua';
        $category = $data['category'] ?? 'Simulasi';
        $fileUrl = $data['file_url'] ?? '';
        $fileName = $data['file_name'] ?? basename($fileUrl);
        $fileSize = isset($data['file_size']) ? (int)$data['file_size'] : 0;

        if (!$title || !$fileUrl) {
            http_response_code(400);
            return json_encode(["message" => "Judul dan file HTML wajib diisi"]);
        }

        $query = "INSERT INTO interactive_media 
                  (id, title, description, mapel, kelas, semester, category, file_url, file_name, file_size, author_id, author_name)
                  VALUES (:id, :title, :description, :mapel, :kelas, :semester, :category, :file_url, :file_name, :file_size, :author_id, :author_name)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':mapel', $mapel);
        $stmt->bindParam(':kelas', $kelas);
        $stmt->bindParam(':semester', $semester);
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':file_url', $fileUrl);
        $stmt->bindParam(':file_name', $fileName);
        $stmt->bindParam(':file_size', $fileSize);
        $stmt->bindParam(':author_id', $userId);
        $stmt->bindParam(':author_name', $userName);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'CREATE_INTERACTIVE_MEDIA', $title);
            return json_encode(["message" => "Media interaktif berhasil ditambahkan", "id" => $id]);
        }

        http_response_code(500);
        return json_encode(["message" => "Gagal menyimpan media interaktif"]);
    }

    public function update($id, $data, $userId, $userName)
    {
        if (!$userId) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }

        $title = trim($data['title'] ?? '');
        $description = $data['description'] ?? '';
        $mapel = $data['mapel'] ?? 'Informatika';
        $kelas = $data['kelas'] ?? 'Semua';
        $semester = $data['semester'] ?? 'Semua';
        $category = $data['category'] ?? 'Simulasi';

        $query = "UPDATE interactive_media SET
                    title = :title,
                    description = :description,
                    mapel = :mapel,
                    kelas = :kelas,
                    semester = :semester,
                    category = :category";

        if (!empty($data['file_url'])) {
            $query .= ", file_url = :file_url, file_name = :file_name, file_size = :file_size";
        }
        $query .= " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':mapel', $mapel);
        $stmt->bindParam(':kelas', $kelas);
        $stmt->bindParam(':semester', $semester);
        $stmt->bindParam(':category', $category);

        if (!empty($data['file_url'])) {
            $fileUrl = $data['file_url'];
            $fileName = $data['file_name'] ?? basename($fileUrl);
            $fileSize = isset($data['file_size']) ? (int)$data['file_size'] : 0;
            $stmt->bindParam(':file_url', $fileUrl);
            $stmt->bindParam(':file_name', $fileName);
            $stmt->bindParam(':file_size', $fileSize);
        }

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'UPDATE_INTERACTIVE_MEDIA', $title);
            return json_encode(["message" => "Media interaktif berhasil diperbarui"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Gagal memperbarui media interaktif"]);
    }

    public function delete($id, $userId, $userName)
    {
        if (!$userId) {
            http_response_code(401);
            return json_encode(["message" => "Unauthorized"]);
        }

        $stmt = $this->conn->prepare("DELETE FROM interactive_media WHERE id = :id");
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'DELETE_INTERACTIVE_MEDIA', $id);
            return json_encode(["message" => "Media interaktif berhasil dihapus"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Gagal menghapus media interaktif"]);
    }
}
?>

