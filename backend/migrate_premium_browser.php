<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    echo "Connected to database...<br>";

    // Check if column exists
    $check = $conn->query("SHOW COLUMNS FROM events LIKE 'is_premium'");
    if ($check->rowCount() > 0) {
        echo "Column 'is_premium' already exists.<br>";
    } else {
        echo "Adding column 'is_premium'...<br>";
        $sql = "ALTER TABLE events ADD COLUMN is_premium TINYINT(1) DEFAULT 0";
        $conn->exec($sql);
        echo "Column added successfully!<br>";
    }

    echo "Done.";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>