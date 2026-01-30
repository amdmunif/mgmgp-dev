<?php
// backend/controllers/LearningController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class LearningController
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
        $query = "SELECT * FROM learning_materials ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function create()
    {
        // Handle Multipart Form Data
        $data = $_POST;
        $files = $_FILES;

        $id = Helper::uuid();

        $rpp_url = null;
        $slide_url = null;
        $file_url = null;

        // Ensure upload directory exists
        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir))
            mkdir($uploadDir, 0777, true);

        // Upload Helper
        $uploadFile = function ($fileKey) use ($uploadDir) {
            if (isset($_FILES[$fileKey]) && $_FILES[$fileKey]['error'] === UPLOAD_ERR_OK) {
                $ext = pathinfo($_FILES[$fileKey]['name'], PATHINFO_EXTENSION);
                $filename = uniqid() . '.' . $ext;
                if (move_uploaded_file($_FILES[$fileKey]['tmp_name'], $uploadDir . $filename)) {
                    // Return URL relative to API root (assuming /api/uploads/...)
                    // Adjust base URL as needed for production
                    return '/api/uploads/' . $filename;
                }
            }
            return null;
        };

        $rpp_url = $uploadFile('rpp_file');
        $slide_url = $uploadFile('slide_file');
        $file_url = $uploadFile('file'); // Generic file

        // Fallback for URLs passed as text (if files not uploaded but URL provided)
        if (!$rpp_url && isset($data['rpp_url']))
            $rpp_url = $data['rpp_url'];
        if (!$slide_url && isset($data['slide_url']))
            $slide_url = $data['slide_url'];
        if (!$file_url && isset($data['file_url']))
            $file_url = $data['file_url'];

        // Logic for different migration schemas:
        // 'teaching_resources' schema has rpp_url and slide_url
        // 'learning_materials' schema in database.sql has file_url and type

        // Let's support both logic based on 'type'
        $type = $data['type'] ?? 'modul'; // modul, rpp, slide

        $query = "INSERT INTO learning_materials (id, title, mapel, kelas, semester, type, file_url, content, is_premium, author_id) VALUES (:id, :title, :mapel, :kelas, :semester, :type, :file_url, :content, :is_premium, :author_id)";

        $stmt = $this->conn->prepare($query);

        // Determine primary file_url based on type
        $final_file_url = $file_url;
        if ($type === 'rpp')
            $final_file_url = $rpp_url;
        if ($type === 'slide')
            $final_file_url = $slide_url;

        $is_premium = isset($data['is_premium']) ? $data['is_premium'] : 0;

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':mapel', $data['mapel']);
        $stmt->bindParam(':kelas', $data['kelas']);
        $stmt->bindParam(':semester', $data['semester']);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':file_url', $final_file_url);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':is_premium', $is_premium);
        $stmt->bindParam(':author_id', $data['author_id']);

        if ($stmt->execute()) {
            return json_encode(["message" => "Material created", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to create material"]);
    }

    public function delete($id)
    {
        // Optional: Delete file from disk too
        $query = "DELETE FROM learning_materials WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            return json_encode(["message" => "Deleted successfully"]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to delete"]);
    }
}
?>