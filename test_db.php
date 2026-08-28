<?php
require_once "backend/config/database.php";
$db = new Database();
$conn = $db->getConnection();
$stmt = $conn->query("SHOW COLUMNS FROM users");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
