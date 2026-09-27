<?php
include_once './config/database_cli.php';
$db = new Database();
$conn = $db->getConnection();
try {
    $conn->exec("ALTER TABLE event_groups ADD COLUMN presentation_url TEXT NULL AFTER task_url");
    echo "Column presentation_url added successfully.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
