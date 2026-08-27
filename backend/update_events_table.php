<?php
require_once __DIR__ . '/config/database.php';

$db = new Database();
$conn = $db->getConnection();

try {
    // Check if has_lms exists
    $stmt = $conn->query("SHOW COLUMNS FROM events LIKE 'has_lms'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("ALTER TABLE events ADD COLUMN has_lms TINYINT(1) DEFAULT 0");
        echo "Column has_lms added successfully.\n";
    } else {
        echo "Column has_lms already exists.\n";
    }

    // Check if quota exists
    $stmt = $conn->query("SHOW COLUMNS FROM events LIKE 'quota'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("ALTER TABLE events ADD COLUMN quota INT NULL");
        echo "Column quota added successfully.\n";
    } else {
        echo "Column quota already exists.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
