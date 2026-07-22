<?php
// backend/migrate_maintenance_profile.php
include_once './config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // MariaDB syntax might not support IF NOT EXISTS in ALTER TABLE for ADD COLUMN in older versions.
    // So let's do it safely.
    
    try {
        $conn->exec("ALTER TABLE site_content ADD COLUMN maintenance_public TINYINT(1) DEFAULT 0");
    } catch(PDOException $e) {}
    try {
        $conn->exec("ALTER TABLE site_content ADD COLUMN maintenance_member TINYINT(1) DEFAULT 0");
    } catch(PDOException $e) {}
    try {
        $conn->exec("ALTER TABLE site_content ADD COLUMN maintenance_premium TINYINT(1) DEFAULT 0");
    } catch(PDOException $e) {}
    
    try {
        $conn->exec("ALTER TABLE profiles ADD COLUMN last_data_update TIMESTAMP NULL DEFAULT NULL");
    } catch(PDOException $e) {}
    try {
        $conn->exec("ALTER TABLE profiles ADD COLUMN mengajar_tahun_ini TINYINT(1) DEFAULT 1");
    } catch(PDOException $e) {}
    
    echo "Migration completed.\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
