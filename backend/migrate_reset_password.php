<?php
require_once __DIR__ . '/config/database_cli.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    echo "Running migration to add reset_token columns...\n";

    $sql = "ALTER TABLE users 
            ADD COLUMN reset_token VARCHAR(255) NULL AFTER password_hash,
            ADD COLUMN reset_token_expiry TIMESTAMP NULL AFTER reset_token";

    $conn->exec($sql);

    echo "Migration completed successfully! Columns added.\n";

} catch (PDOException $e) {
    if (strpos($e->getMessage(), "Duplicate column name") !== false) {
        echo "Columns already exist. Skipping.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
