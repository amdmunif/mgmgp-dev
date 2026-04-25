<?php
// backend/migrate_reset_password_browser.php
header('Content-Type: text/plain');
require_once __DIR__ . '/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    if (!$conn) {
        die("Connection failed. Check database.php config.");
    }

    echo "Running migration to add reset_token columns...\n";

    // Column 1: reset_token
    try {
        $sql = "ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL AFTER password_hash";
        $conn->exec($sql);
        echo "Added column: reset_token\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column name") !== false) {
            echo "Column reset_token already exists.\n";
        } else {
            echo "Error adding reset_token: " . $e->getMessage() . "\n";
        }
    }

    // Column 2: reset_token_expiry
    try {
        $sql = "ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP NULL AFTER reset_token";
        $conn->exec($sql);
        echo "Added column: reset_token_expiry\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Duplicate column name") !== false) {
            echo "Column reset_token_expiry already exists.\n";
        } else {
            echo "Error adding reset_token_expiry: " . $e->getMessage() . "\n";
        }
    }

    echo "Migration completed successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    http_response_code(500);
}
?>