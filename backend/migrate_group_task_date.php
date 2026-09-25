<?php
include_once './config/database.php';
try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Add columns
    $conn->exec("ALTER TABLE events ADD COLUMN group_task_available_at datetime DEFAULT NULL");
    
    echo "Migration success\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
