<?php
$host = "127.0.0.1";
$db_name = "mgmp_v2";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Quizzes progress
    $queryQuizzes = "
        SELECT q.id, q.title, a.total_score as score, a.finished_at as completed_at, pr.nama as user_name, pr.asal_sekolah
        FROM lms_quizzes q
        JOIN lms_topics t ON q.topic_id = t.id
        JOIN lms_quiz_attempts a ON a.quiz_id = q.id
        JOIN event_participants ep ON ep.user_id = a.user_id AND ep.event_id = '123'
        LEFT JOIN profiles pr ON pr.id = a.user_id
        WHERE t.event_id = '123' AND a.finished_at IS NOT NULL
    ";
    
    $stmt = $conn->prepare($queryQuizzes);
    $stmt->execute();
    echo "SUCCESS\n";
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
