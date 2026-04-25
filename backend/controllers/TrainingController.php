<?php
// backend/controllers/TrainingController.php
include_once './config/database.php';
include_once './utils/Helper.php';
include_once './utils/Mailer.php';

class TrainingController
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
        $query = "SELECT * FROM training_settings ORDER BY id DESC LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row) {
            return json_encode($row);
        }
        
        return json_encode(["message" => "No training settings found"]);
    }

    public function register($data)
    {
        $id = Helper::uuid();
        
        // Generate Registration Code (TRX-YYYYMMDD-RANDOM)
        $code = "TRX-" . date("Ymd") . "-" . strtoupper(substr(uniqid(), -4));

        $query = "INSERT INTO training_registrations 
                  (id, registration_code, nama_lengkap, email, no_wa, asal_sekolah, user_id, is_premium, total_payment, payment_status) 
                  VALUES (:id, :code, :nama, :email, :wa, :sekolah, :user_id, :is_premium, :total, 'pending')";
        $stmt = $this->conn->prepare($query);

        $userId = isset($data['user_id']) ? $data['user_id'] : null;
        $isPremium = isset($data['is_premium']) ? (int)$data['is_premium'] : 0;
        
        // Calculate price based on settings
        $settings = json_decode($this->getSettings(), true);
        $price = $isPremium ? $settings['price_premium'] : $settings['price_regular'];

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':code', $code);
        $stmt->bindParam(':nama', $data['nama_lengkap']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':wa', $data['no_wa']);
        $stmt->bindParam(':sekolah', $data['asal_sekolah']);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':is_premium', $isPremium);
        $stmt->bindParam(':total', $price);

        if ($stmt->execute()) {
            // Send email confirmation (Invoice)
            Mailer::sendTrainingInvoice($data['email'], $data['nama_lengkap'], $code, $price, $settings['event_name']);

            return json_encode([
                "message" => "Pendaftaran berhasil, silakan cek email untuk instruksi pembayaran.",
                "registration_code" => $code,
                "total_payment" => $price,
                "id" => $id
            ]);
        }
        
        http_response_code(500);
        return json_encode(["message" => "Gagal mendaftar pelatihan"]);
    }

    // For Admin: Get all registrations
    public function getRegistrations()
    {
        $query = "SELECT * FROM training_registrations ORDER BY registered_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // For Admin: Update Settings
    public function updateSettings($data)
    {
        $query = "UPDATE training_settings SET 
                  event_name = :event_name, 
                  event_date = :event_date, 
                  price_regular = :price_regular, 
                  price_premium = :price_premium, 
                  description = :description 
                  ORDER BY id DESC LIMIT 1";
                  
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':event_name', $data['event_name']);
        $stmt->bindParam(':event_date', $data['event_date']);
        $stmt->bindParam(':price_regular', $data['price_regular']);
        $stmt->bindParam(':price_premium', $data['price_premium']);
        $stmt->bindParam(':description', $data['description']);

        if ($stmt->execute()) {
            return json_encode(["message" => "Pengaturan berhasil disimpan"]);
        }
        
        http_response_code(500);
        return json_encode(["message" => "Gagal menyimpan pengaturan"]);
    }
}
?>
