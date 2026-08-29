<?php
require_once "config/Database.php";
require_once "lib/Helper.php";

header('Content-Type: application/json');

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Add is_approved column
    $conn->exec("ALTER TABLE event_participants ADD COLUMN is_approved TINYINT(1) DEFAULT 0 AFTER is_hadir");
    
    echo json_encode(["status" => "success", "message" => "Added is_approved column successfully."]);
} catch (PDOException $e) {
    if ($e->getCode() == '42S21') {
        echo json_encode(["status" => "success", "message" => "Column is_approved already exists."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
