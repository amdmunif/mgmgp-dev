<?php
require_once 'backend/config/Database.php';
$db = new Database();
$conn = $db->getConnection();
$stmt = $conn->query("SHOW COLUMNS FROM users");
while($row = $stmt->fetch()) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}
