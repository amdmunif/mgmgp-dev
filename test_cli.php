<?php
$content = file_get_contents("backend/config/database.php");
// Force 127.0.0.1 for local CLI execution since 'localhost' uses unix sockets
$content = str_replace("private \$host = 'localhost';", "private \$host = '127.0.0.1';", $content);
file_put_contents("backend/config/database_cli.php", $content);
require_once "backend/config/database_cli.php";
$db = new Database();
$conn = $db->getConnection();
$stmt = $conn->query("SELECT * FROM lms_quiz_attempts ORDER BY started_at DESC LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
unlink("backend/config/database_cli.php");
