<?php
// backend/controllers/SettingsController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class SettingsController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function getSettings()
    {
        // Assuming ID 1 is always the main settings
        $query = "SELECT * FROM app_settings WHERE id = 1 LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return json_encode($row);
        } else {
            // Create default settings if not exists
            $default = "INSERT INTO app_settings (id, site_title) VALUES (1, 'MGMP Informatika')";
            $this->conn->exec($default);
            return json_encode(["id" => 1, "site_title" => "MGMP Informatika"]);
        }
    }

    public function updateSettings($data)
    {
        // Remove non-column fields if necessary, but for now we assume $data matches columns
        // Safe update using named params

        $query = "UPDATE app_settings SET 
            site_title = :site_title,
            site_description = :site_description,
            logo_url = :logo_url,
            email = :email,
            phone = :phone,
            address = :address,
            bank_name = :bank_name,
            bank_number = :bank_number,
            bank_holder = :bank_holder,
            premium_price = :premium_price
            WHERE id = 1";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':site_title', $data['site_title']);
        $stmt->bindParam(':site_description', $data['site_description']);
        $stmt->bindParam(':logo_url', $data['logo_url']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':phone', $data['phone']);
        $stmt->bindParam(':address', $data['address']);
        $stmt->bindParam(':bank_name', $data['bank_name']);
        $stmt->bindParam(':bank_number', $data['bank_number']);
        $stmt->bindParam(':bank_holder', $data['bank_holder']);
        $stmt->bindParam(':premium_price', $data['premium_price']);

        if ($stmt->execute()) {
            return $this->getSettings();
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to update settings."]);
    }

    public function uploadLogo()
    {
        if (!isset($_FILES['file'])) {
            http_response_code(400);
            return json_encode(["message" => "No file uploaded."]);
        }

        $targetDir = __DIR__ . "/../uploads/";
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $fileName = time() . '_' . basename($_FILES["file"]["name"]);
        $targetFilePath = $targetDir . $fileName;
        $fileType = pathinfo($targetFilePath, PATHINFO_EXTENSION);

        // Allow certain file formats
        $allowTypes = array('jpg', 'png', 'jpeg', 'gif', 'ico');
        if (in_array(strtolower($fileType), $allowTypes)) {
            if (move_uploaded_file($_FILES["file"]["tmp_name"], $targetFilePath)) {
                // Return the public URL
                // Assuming the API is at /api and backend is served correctly
                // We need a way to serve static files or use absolute URL
                // For now, let's return a relative path that the frontend can resolve or proxy
                // Or better, a full URL if we knew the host.
                // Let's return just the filename and let frontend handle base URL or serve via a specific endpoint

                // Ideally: return "https://domain.com/api/uploads/filename"
                // Since we don't strictly know domain in PHP without $_SERVER, let's use relative
                $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
                $host = $_SERVER['HTTP_HOST'];
                // Assuming backend/index.php is at /api
                // and uploads are at backend/uploads

                // We need a route to serve these files.
                // For simplified FTP deployment where 'backend' folder content is at '/api',
                // then 'uploads' would be at '/api/uploads'.

                $url = "$protocol://$host/api/uploads/$fileName";

                return json_encode(["url" => $url]);
            }
        }

        http_response_code(500);
        return json_encode(["message" => "Sorry, there was an error uploading your file."]);
    }
}
