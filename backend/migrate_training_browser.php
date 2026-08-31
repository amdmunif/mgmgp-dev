<?php
require_once __DIR__ . '/config/database.php';
$db = new Database();
$conn = $db->getConnection();

try {
    $conn->exec("
        CREATE TABLE IF NOT EXISTS training_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_name VARCHAR(255) NOT NULL,
            event_date DATETIME NOT NULL,
            price_regular DECIMAL(10,2) NOT NULL,
            price_premium DECIMAL(10,2) NOT NULL,
            description TEXT,
            is_open BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS training_registrations (
            id VARCHAR(36) PRIMARY KEY,
            registration_code VARCHAR(50) UNIQUE NOT NULL,
            nama_lengkap VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            no_wa VARCHAR(50) NOT NULL,
            asal_sekolah VARCHAR(255) NOT NULL,
            user_id VARCHAR(36),
            is_premium BOOLEAN DEFAULT false,
            total_payment DECIMAL(10,2) NOT NULL,
            payment_status VARCHAR(50) DEFAULT 'pending',
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ");

    $stmt = $conn->query("SELECT COUNT(*) FROM training_settings");
    if ($stmt->fetchColumn() == 0) {
        $conn->exec("INSERT INTO training_settings (event_name, event_date, price_regular, price_premium, description, is_open) VALUES ('Pelatihan Perdana', NOW(), 150000, 100000, 'Pelatihan perdana MGMP Informatika', 1)");
    }
    
    echo "<h1>Migration Successful!</h1>";
    echo "<p>Training tables have been created and initialized.</p>";
    echo "<a href='../'>Back to App</a>";
} catch (PDOException $e) {
    echo "<h1>Migration Failed</h1>";
    echo "<pre>Error: " . $e->getMessage() . "</pre>";
}
