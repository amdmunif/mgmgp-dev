<?php
require_once __DIR__ . '/backend/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // 1. Alter profiles table
    $sql1 = "ALTER TABLE `profiles` 
             ADD COLUMN IF NOT EXISTS `last_data_update` timestamp NULL DEFAULT NULL,
             ADD COLUMN IF NOT EXISTS `mengajar_tahun_ini` tinyint(1) DEFAULT 1;";
    $conn->exec($sql1);
    echo "Successfully altered profiles table.\n";
    
    // 2. Alter site_content table
    $sql2 = "ALTER TABLE `site_content` 
             ADD COLUMN IF NOT EXISTS `maintenance_public` tinyint(1) DEFAULT 0,
             ADD COLUMN IF NOT EXISTS `maintenance_member` tinyint(1) DEFAULT 0,
             ADD COLUMN IF NOT EXISTS `maintenance_premium` tinyint(1) DEFAULT 0;";
    $conn->exec($sql2);
    echo "Successfully altered site_content table.\n";
    
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
