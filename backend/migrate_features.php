<?php
include_once 'config/database.php';
try {
    $db = (new Database())->getConnection();
    
    // Check if column exists
    $check = $db->query("SHOW COLUMNS FROM `event_participants` LIKE 'is_approved'");
    if ($check->rowCount() == 0) {
        $db->exec("ALTER TABLE `event_participants` ADD COLUMN `is_approved` TINYINT(1) DEFAULT 0");
        echo "Successfully added 'is_approved' column to event_participants.\n";
    } else {
        echo "Column 'is_approved' already exists.\n";
    }
} catch(PDOException $e) {
    echo "Connection error: " . $e->getMessage();
}
?>
