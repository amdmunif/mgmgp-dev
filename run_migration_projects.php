<?php
require_once __DIR__ . '/backend/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    $sql1 = "CREATE TABLE IF NOT EXISTS `member_projects` (
        `id` char(36) NOT NULL,
        `user_id` char(36) NOT NULL,
        `title` varchar(255) NOT NULL,
        `description` text DEFAULT NULL,
        `link_url` text NOT NULL,
        `image_url` text DEFAULT NULL,
        `status` enum('pending','approved','rejected') DEFAULT 'pending',
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (`id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $conn->exec($sql1);
    echo "Successfully created member_projects table.\n";
    
    // 2. Alter events table
    $sql2 = "ALTER TABLE `events` 
             ADD COLUMN IF NOT EXISTS `attendance_deadline` datetime DEFAULT NULL;";
    $conn->exec($sql2);
    echo "Successfully altered events table.\n";
    
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
