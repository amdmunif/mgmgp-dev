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
        try {
            // Fetch Site Content
            $queryContent = "SELECT * FROM site_content WHERE id = 1 LIMIT 1";
            $stmtContent = $this->conn->prepare($queryContent);
            $stmtContent->execute();
            $siteContent = $stmtContent->fetch(PDO::FETCH_ASSOC);

            if (!$siteContent) {
                // Create default site content
                $defaultContent = "INSERT INTO site_content (id, home_hero_title) VALUES (1, 'MGMP Informatika')";
                $this->conn->exec($defaultContent);
                $siteContent = ["id" => 1, "home_hero_title" => "MGMP Informatika"];
            }

            // Fetch Premium Settings (for price)
            // Check if table exists first/handle gracefully? No, let's catch exception
            $queryPremium = "SELECT registration_fee FROM premium_settings WHERE id = 1 LIMIT 1";
            $stmtPremium = $this->conn->prepare($queryPremium);
            $stmtPremium->execute();
            $premiumSettings = $stmtPremium->fetch(PDO::FETCH_ASSOC);

            if (!$premiumSettings) {
                // Determine if table exists or just empty?
                // If we are here, query succeeded.
                $this->conn->exec("INSERT INTO premium_settings (id, registration_fee) VALUES (1, 50000)");
                $premiumSettings = ['registration_fee' => 50000];
            }

            // Map to legacy keys for frontend compatibility
            $mappedSettings = [
                'id' => 1,
                'site_title' => $siteContent['home_hero_title'] ?? 'MGMP Informatika',
                'site_description' => $siteContent['home_hero_subtitle'] ?? '',
                'logo_url' => $siteContent['app_logo'] ?? '',
                'email' => $siteContent['contact_email'] ?? '',
                'phone' => $siteContent['contact_phone'] ?? '',
                'address' => $siteContent['contact_address'] ?? '',
                'map_url' => $siteContent['contact_map_url'] ?? '',

                // Premium/Bank (Legacy support, though bank_accounts table is preferred)
                'premium_price' => $premiumSettings['registration_fee'] ?? 0,
                'bank_name' => $siteContent['bank_name'] ?? '',
                'bank_number' => $siteContent['bank_number'] ?? '',
                'bank_holder' => $siteContent['bank_holder'] ?? '',

                // Merge full site_content for specific fields
                ...$siteContent
            ];

            return json_encode($mappedSettings);
        } catch (Exception $e) {
            http_response_code(500);
            return json_encode(["message" => "Error loading settings: " . $e->getMessage()]);
        }
    }

    public function updateSettings($data, $userId, $userName)
    {
        try {
            $this->conn->beginTransaction();

            // 1. Update Site Content
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
                mkks_signature_url = :mkks_signature_url,
                premium_rules = :premium_rules,
                
                -- Legacy bank fields
                bank_name = :bank_name,
                bank_number = :bank_number,
                bank_holder = :bank_holder
                WHERE id = 1";

            // Map incoming 'site_title' back to 'home_hero_title' if provided, else use existing
            $homeHeroTitle = $data['home_hero_title'] ?? ($data['site_title'] ?? '');
            $contactEmail = $data['contact_email'] ?? ($data['email'] ?? '');
            $contactPhone = $data['contact_phone'] ?? ($data['phone'] ?? '');
            $contactAddress = $data['contact_address'] ?? ($data['address'] ?? '');
            $appLogo = $data['app_logo'] ?? ($data['logo_url'] ?? '');

            $stmtContent = $this->conn->prepare($queryContent);
            $stmtContent->bindValue(':home_hero_title', $homeHeroTitle);
            $stmtContent->bindValue(':home_hero_subtitle', $data['home_hero_subtitle'] ?? ($data['site_description'] ?? ''));
            $stmtContent->bindValue(':home_hero_image', $data['home_hero_image'] ?? '');
            $stmtContent->bindValue(':profile_visi', $data['profile_visi'] ?? '');
            $stmtContent->bindValue(':profile_misi', $data['profile_misi'] ?? '');
            $stmtContent->bindValue(':profile_sejarah', $data['profile_sejarah'] ?? '');
            $stmtContent->bindValue(':profile_struktur', $data['profile_struktur'] ?? '');
            $stmtContent->bindValue(':contact_address', $contactAddress);
            $stmtContent->bindValue(':contact_phone', $contactPhone);
            $stmtContent->bindValue(':contact_email', $contactEmail);
            $stmtContent->bindValue(':contact_map_url', $data['contact_map_url'] ?? '');
            $stmtContent->bindValue(':app_logo', $appLogo);
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
            $stmtContent->bindValue(':premium_rules', $data['premium_rules'] ?? '');

            $stmtContent->bindValue(':bank_name', $data['bank_name'] ?? '');
            $stmtContent->bindValue(':bank_number', $data['bank_number'] ?? '');
            $stmtContent->bindValue(':bank_holder', $data['bank_holder'] ?? '');

            $stmtContent->execute();

            // 2. Update Premium Settings (Price)
            if (isset($data['premium_price'])) {
                $queryPremium = "UPDATE premium_settings SET registration_fee = :fee WHERE id = 1";
                $stmtPremium = $this->conn->prepare($queryPremium);
                $stmtPremium->bindValue(':fee', $data['premium_price']);
                $stmtPremium->execute();
            }

            $this->conn->commit();
            Helper::log($this->conn, $userId, $userName, 'UPDATE_SETTINGS', 'Site Configuration Updated');

            return $this->getSettings();

        } catch (Exception $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Failed to update settings: " . $e->getMessage()]);
        }
    }

    public function uploadLogo()
    {
        if (!isset($_FILES['file'])) {
            http_response_code(400);
            return json_encode(["message" => "No file uploaded."]);
        }

        // Project root uploads folder
        $targetDir = __DIR__ . "/../../uploads/";
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
                // Return URL
                $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
                $host = $_SERVER['HTTP_HOST'];
                // Served via /uploads endpoint in index.php
                $url = "$protocol://$host/uploads/$fileName";

                return json_encode(["url" => $url]);
            }
        }

        http_response_code(500);
        return json_encode(["message" => "Sorry, there was an error uploading your file."]);
    }
}
