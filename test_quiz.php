<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
require_once 'backend/config/Database.php';
require_once 'backend/utils/Helper.php';
require_once 'backend/controllers/LmsController.php';

$db = new Database();
$conn = $db->getConnection();

$c = new LmsController();

// get a quiz_id
$q = $conn->query("SELECT id FROM lms_quizzes LIMIT 1");
if ($row = $q->fetch()) {
    $quizId = $row['id'];
    echo "Testing submit for quiz: $quizId\n";
    
    $res = $c->submitQuizAttempt(['quiz_id' => $quizId, 'answers' => []], 'user-123', 'Test User');
    echo $res;
} else {
    echo "No quizzes found.";
}
