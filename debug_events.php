<?php
require_once __DIR__ . '/backend/config/database.php';
$db = new Database();
$conn = $db->getConnection();
$stmt = $conn->query("SELECT id, title, date, is_premium FROM events ORDER BY date DESC");
$events = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($events, JSON_PRETTY_PRINT);
?>