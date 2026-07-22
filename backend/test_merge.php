<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once './config/database.php';
$db = new Database();
$conn = $db->getConnection();
try {
    $mergeEvents = "
        INSERT INTO event_participants (event_id, user_id, is_hadir, tugas_submitted, task_url, registered_at)
        SELECT event_id, 'test', is_hadir, tugas_submitted, task_url, registered_at
        FROM event_participants
        WHERE user_id = 'test2'
        ON DUPLICATE KEY UPDATE
            is_hadir = IF(VALUES(is_hadir) = 1, 1, event_participants.is_hadir),
            tugas_submitted = IF(VALUES(tugas_submitted) = 1, 1, event_participants.tugas_submitted),
            task_url = IF(VALUES(task_url) IS NOT NULL AND VALUES(task_url) != '', VALUES(task_url), event_participants.task_url)
    ";
    $conn->query($mergeEvents);
    echo "Success\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
