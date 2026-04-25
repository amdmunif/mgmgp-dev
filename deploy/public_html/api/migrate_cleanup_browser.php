<?php
// backend/migrate_cleanup_browser.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once './config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    $messages = [];

    // 1. Drop app_settings if exists
    try {
        $dropApp = "DROP TABLE IF EXISTS app_settings";
        $conn->exec($dropApp);
        $messages[] = "Dropped table `app_settings`.";
    } catch (Exception $e) {
        $messages[] = "Error dropping `app_settings`: " . $e->getMessage();
    }

    // 2. Clean up premium_settings (Drop legacy bank columns if they exist)
    // We check if columns exist first or just try dropping them (IGNORE doesn't work well with ALTER in simple PDO)
    // A simple way is to check information_schema or just try/catch individually
    $columnsToDrop = ['bank_name', 'bank_number', 'bank_holder'];

    foreach ($columnsToDrop as $col) {
        try {
            // Check if column exists
            $check = "SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'premium_settings' AND COLUMN_NAME = '$col'";
            $stmt = $conn->prepare($check);
            $stmt->execute();
            if ($stmt->rowCount() > 0) {
                $alter = "ALTER TABLE premium_settings DROP COLUMN $col";
                $conn->exec($alter);
                $messages[] = "Dropped column `$col` from `premium_settings`.";
            }
        } catch (Exception $e) {
            $messages[] = "Error dropping column `$col`: " . $e->getMessage();
        }
    }

    // 3. Ensure site_content has bank columns (legacy support) if missing
    // Since we merged, we want `site_content` to have these for now to store the data we mapped in controller
    $siteCols = ['bank_name', 'bank_number', 'bank_holder'];
    foreach ($siteCols as $col) {
        try {
            $check = "SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content' AND COLUMN_NAME = '$col'";
            $stmt = $conn->prepare($check);
            $stmt->execute();
            if ($stmt->rowCount() == 0) {
                $alter = "ALTER TABLE site_content ADD COLUMN $col TEXT DEFAULT NULL";
                $conn->exec($alter);
                $messages[] = "Added column `$col` to `site_content` (legacy support).";
            }
        } catch (Exception $e) {
            $messages[] = "Error adding column `$col`: " . $e->getMessage();
        }
    }


    echo json_encode([
        "status" => "success",
        "message" => "Cleanup completed.",
        "logs" => $messages
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>