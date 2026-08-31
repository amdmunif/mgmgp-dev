<?php
// Custom DB config to override host
class Database
{
    private $host = "127.0.0.1";
    private $db_name = "ouycwnsb_dev";
    private $username = "ouycwnsb_admin";
    private $password = "t_wn8LUzGHv88RA";
    public $conn;

    public function getConnection()
    {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4", $this->username, $this->password);
            $this->conn->exec("set names utf8mb4");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}

$db = new Database();
$conn = $db->getConnection();
if (!$conn) {
    echo "Connection failed.\n";
    exit(1);
}
try {
    $conn->exec("CREATE TABLE IF NOT EXISTS `training_settings` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `event_name` VARCHAR(255) NOT NULL,
        `event_date` TIMESTAMP NOT NULL,
        `price_regular` DECIMAL(10,2) NOT NULL,
        `price_premium` DECIMAL(10,2) NOT NULL,
        `description` TEXT,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $conn->exec("CREATE TABLE IF NOT EXISTS `training_registrations` (
        `id` CHAR(36) PRIMARY KEY,
        `registration_code` VARCHAR(50) NOT NULL UNIQUE,
        `nama_lengkap` VARCHAR(255) NOT NULL,
        `email` VARCHAR(255) NOT NULL,
        `no_wa` VARCHAR(20) NOT NULL,
        `asal_sekolah` VARCHAR(255) NOT NULL,
        `user_id` CHAR(36) DEFAULT NULL,
        `is_premium` TINYINT(1) DEFAULT 0,
        `total_payment` DECIMAL(10,2) NOT NULL,
        `payment_status` ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
        `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $stmt = $conn->query("SELECT count(*) FROM training_settings");
    if ($stmt->fetchColumn() == 0) {
        $conn->exec("INSERT INTO training_settings (event_name, event_date, price_regular, price_premium, description) VALUES ('Pelatihan Perdana', '2026-10-10 08:00:00', 100000, 50000, 'Ini adalah pelatihan publik')");
    }

    echo "Migration successful.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
