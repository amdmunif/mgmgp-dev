<?php
require_once "backend/config/database.php";
$db = new Database();
$conn = $db->getConnection();
$stmt = $conn->query("SELECT * FROM lms_quiz_attempts ORDER BY started_at DESC LIMIT 10");
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
file_put_contents("debug_attempts.json", json_encode($res, JSON_PRETTY_PRINT));
