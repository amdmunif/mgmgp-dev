<?php
require_once 'backend/config/Database.php';
$db = new Database();
$conn = $db->getConnection();
$q = $conn->query("DESCRIBE lms_quiz_attempts");
print_r($q->fetchAll(PDO::FETCH_ASSOC));
