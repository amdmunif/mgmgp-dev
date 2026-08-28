<?php
require_once "backend/config/database.php";
$db = new Database();
$conn = $db->getConnection();
$stmt = $conn->query("SELECT id, quiz_id, user_id, started_at, finished_at, total_score, is_passed FROM lms_quiz_attempts ORDER BY started_at DESC LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
