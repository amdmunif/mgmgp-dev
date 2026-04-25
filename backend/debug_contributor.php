<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/config/database.php';

$db = new Database();
$conn = $db->getConnection();

try {
    $query = "SELECT ca.*, p.nama, u.email, 
              (SELECT COUNT(*) FROM questions q WHERE q.creator_id = ca.user_id) as question_count
              FROM contributor_applications ca
              JOIN profiles p ON ca.user_id = p.id
              JOIN users u ON ca.user_id = u.id
              ORDER BY ca.applied_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $apps = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "query" => $query,
        "data" => $apps,
        "count" => count($apps)
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>