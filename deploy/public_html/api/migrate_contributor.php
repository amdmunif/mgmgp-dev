<?php
// backend/migrate_contributor.php

// Direct connection to bypass potential socket issues with 'localhost' in CLI
$host = "127.0.0.1";
$db_name = "ouycwnsb_dev";
$username = "ouycwnsb_admin";
$password = "t_wn8LUzGHv88RA";

try {
    echo "Connecting to DB at $host...\n";
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Starting migration...\n";

    // 1. Alter question_banks
    try {
        $sql = "ALTER TABLE question_banks 
                ADD COLUMN creator_id CHAR(36) NULL,
                ADD COLUMN status ENUM('draft', 'pending', 'verified', 'rejected') DEFAULT 'verified',
                ADD COLUMN reviewer_notes TEXT NULL";
        $conn->exec($sql);
        echo "Updated question_banks table.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column name") !== false) {
            echo "Columns already exist in question_banks.\n";
        } else {
            echo "Error altering question_banks: " . $e->getMessage() . "\n";
        }
    }

    // 2. Create contributor_applications
    $sql2 = "CREATE TABLE IF NOT EXISTS contributor_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT NULL,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $conn->exec($sql2);
    echo "Created contributor_applications table.\n";

    echo "Migration completed successfully.\n";

} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
?>