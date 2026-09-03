<?php
// backend/migrate_email_logs.php
include_once './config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    $sql = "CREATE TABLE IF NOT EXISTS email_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        status ENUM('success', 'failed') NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";

    $conn->exec($sql);
    echo "Migration successful: email_logs table created or already exists.\n";
} catch(PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
