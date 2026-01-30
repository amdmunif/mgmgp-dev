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
        // Fetch App Settings
        $queryApp = "SELECT * FROM app_settings WHERE id = 1 LIMIT 1";
        $stmtApp = $this->conn->prepare($queryApp);
        $stmtApp->execute();
        $appSettings = $stmtApp->fetch(PDO::FETCH_ASSOC);

        if (!$appSettings) {
             // Create default settings if not exists
             $default = "INSERT INTO app_settings (id, site_title) VALUES (1, 'MGMP Informatika')";
             $this->conn->exec($default);
             $appSettings = ["id" => 1, "site_title" => "MGMP Informatika"];
        }

        // Fetch Site Content
        $queryContent = "SELECT * FROM site_content WHERE id = 1 LIMIT 1";
        $stmtContent = $this->conn->prepare($queryContent);
        $stmtContent->execute();
        $siteContent = $stmtContent->fetch(PDO::FETCH_ASSOC);

        if (!$siteContent) {
            // Create default site content
            $defaultContent = "INSERT INTO site_content (id) VALUES (1)";
            $this->conn->exec($defaultContent);
            $siteContent = ["id" => 1];
        }

        // Merge results
        // Note: Fields in site_content will overwrite app_settings if keys collide, but our schema has distinct keys mostly.
        $merged = array_merge($appSettings, $siteContent);
        
        return json_encode($merged);
    }

    public function updateSettings($data)
    {
        // 1. Update App Settings
        $queryApp = "UPDATE app_settings SET 
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

        $stmtApp = $this->conn->prepare($queryApp);
        // Use default values if keys missing to avoid errors
        $stmtApp->bindValue(':site_title', $data['site_title'] ?? 'MGMP Informatika');
        $stmtApp->bindValue(':site_description', $data['site_description'] ?? '');
        $stmtApp->bindValue(':logo_url', $data['logo_url'] ?? '');
        $stmtApp->bindValue(':email', $data['email'] ?? '');
        $stmtApp->bindValue(':phone', $data['phone'] ?? '');
        $stmtApp->bindValue(':address', $data['address'] ?? '');
        $stmtApp->bindValue(':bank_name', $data['bank_name'] ?? '');
        $stmtApp->bindValue(':bank_number', $data['bank_number'] ?? '');
        $stmtApp->bindValue(':bank_holder', $data['bank_holder'] ?? '');
        $stmtApp->bindValue(':premium_price', $data['premium_price'] ?? 0);
        
        $stmtApp->execute();

        // 2. Update Site Content
        // Only update fields that exist in the input data or keep existing? 
        // For simplicity, we update all known columns.

        $queryContent = "UPDATE site_content SET 
            home_hero_title = :home_hero_title,
            home_hero_subtitle = :home_hero_subtitle,
            home_hero_image = :home_hero_image,
            profile_visi = :profile_visi,
            profile_misi = :profile_misi,
            profile_sejarah = :profile_sejarah,
            profile_struktur = :profile_struktur,
            contact_address = :contact_address,
            contact_phone = :contact_phone,
            contact_email = :contact_email,
            contact_map_url = :contact_map_url,
            app_logo = :app_logo,
            kop_surat = :kop_surat,
            ketua_nama = :ketua_nama,
            ketua_nip = :ketua_nip,
            ketua_signature_url = :ketua_signature_url,
            sekretaris_nama = :sekretaris_nama,
            sekretaris_nip = :sekretaris_nip,
            sekretaris_signature_url = :sekretaris_signature_url,
            mkks_nama = :mkks_nama,
            mkks_nip = :mkks_nip,
            mkks_signature_url = :mkks_signature_url
            WHERE id = 1";

        $stmtContent = $this->conn->prepare($queryContent);
        
        $stmtContent->bindValue(':home_hero_title', $data['home_hero_title'] ?? '');
        $stmtContent->bindValue(':home_hero_subtitle', $data['home_hero_subtitle'] ?? '');
        $stmtContent->bindValue(':home_hero_image', $data['home_hero_image'] ?? '');
        $stmtContent->bindValue(':profile_visi', $data['profile_visi'] ?? '');
        $stmtContent->bindValue(':profile_misi', $data['profile_misi'] ?? '');
        $stmtContent->bindValue(':profile_sejarah', $data['profile_sejarah'] ?? '');
        $stmtContent->bindValue(':profile_struktur', $data['profile_struktur'] ?? '');
        $stmtContent->bindValue(':contact_address', $data['contact_address'] ?? '');
        $stmtContent->bindValue(':contact_phone', $data['contact_phone'] ?? '');
        $stmtContent->bindValue(':contact_email', $data['contact_email'] ?? '');
        $stmtContent->bindValue(':contact_map_url', $data['contact_map_url'] ?? '');
        $stmtContent->bindValue(':app_logo', $data['app_logo'] ?? '');
        $stmtContent->bindValue(':kop_surat', $data['kop_surat'] ?? '');
        $stmtContent->bindValue(':ketua_nama', $data['ketua_nama'] ?? '');
        $stmtContent->bindValue(':ketua_nip', $data['ketua_nip'] ?? '');
        $stmtContent->bindValue(':ketua_signature_url', $data['ketua_signature_url'] ?? '');
        $stmtContent->bindValue(':sekretaris_nama', $data['sekretaris_nama'] ?? '');
        $stmtContent->bindValue(':sekretaris_nip', $data['sekretaris_nip'] ?? '');
        $stmtContent->bindValue(':sekretaris_signature_url', $data['sekretaris_signature_url'] ?? '');
        $stmtContent->bindValue(':mkks_nama', $data['mkks_nama'] ?? '');
        $stmtContent->bindValue(':mkks_nip', $data['mkks_nip'] ?? '');
        $stmtContent->bindValue(':mkks_signature_url', $data['mkks_signature_url'] ?? '');

        if ($stmtContent->execute()) {
            return $this->getSettings();
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to update site content."]);
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
        $allowTypes = array('jpg', 'png', 'jpeg', 'gif', 'ico', 'svg', 'webp');
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
                // Adjust path based on your deployment structure. 
                // If index.php is in backend/, and uploads is in backend/uploads.
                // The URL should be relative from the web root or absolute.
                // Assuming typical setup where API is processed by index.php
                
                $url = "$protocol://$host/api/uploads/$fileName";

                return json_encode(["url" => $url]);
            }
        }

        http_response_code(500);
        return json_encode(["message" => "Sorry, there was an error uploading your file."]);
    }
}
