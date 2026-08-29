<?php
require "backend/config/Database.php";
$db = new Database();
$conn = $db->getConnection();
try {
    $stmt = $conn->query("SELECT id FROM events LIMIT 1");
    $id = $stmt->fetchColumn();
    
    $_GET['url'] = "events/$id";
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer dummy';
    require "backend/index.php";
} catch(Exception $e) { echo $e->getMessage(); }
