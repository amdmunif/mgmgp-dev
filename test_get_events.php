<?php
require "backend/config/Database.php";
$db = new Database();
$conn = $db->getConnection();
try {
    $stmt = $conn->query("SELECT id, title, date, registration_deadline, is_registration_open, quota, (SELECT COUNT(*) FROM event_participants WHERE event_id = events.id) as participants_count FROM events WHERE title = 'Coba LMS'");
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode($event, JSON_PRETTY_PRINT);
} catch(Exception $e) { echo $e->getMessage(); }
