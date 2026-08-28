<?php
$token = ""; // We don't have token... wait.
// Let's just modify the database connection config in test_db.php to use 127.0.0.1
$content = file_get_contents("backend/config/database.php");
$content = str_replace("localhost", "127.0.0.1", $content);
file_put_contents("backend/config/database.temp.php", $content);
require_once "backend/config/database.temp.php";
$db = new Database();
$conn = $db->getConnection();
$stmt = $conn->query("SELECT id, quiz_id, user_id, started_at, total_score, is_passed, status FROM lms_quiz_attempts ORDER BY started_at DESC LIMIT 5");
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($res);
unlink("backend/config/database.temp.php");
