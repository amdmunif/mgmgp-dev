<?php
require_once 'backend/config/Database.php';

try {
    $database = new Database();
    // Override host to 127.0.0.1 for local script execution if needed, or just handle null
    $db = $database->getConnection();

    if ($db === null) {
        die("Failed to connect to database. Check credentials or host.\n");
    }

    $sql = file_get_contents('backend/migrations/20260218_bank_accounts.sql');

    if (!$sql) {
        die("Error: SQL file not found or empty.\n");
    }

    $db->exec($sql);
    echo "Migration executed successfully.\n";

} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>