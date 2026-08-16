<?php
include_once 'backend/config/Database.php';
$db = new Database();
$conn = $db->getConnection();
$stmt = $conn->query("SHOW COLUMNS FROM event_participants");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
