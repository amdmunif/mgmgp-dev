<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/ContributorController.php';

$db = new Database();
$conn = $db->getConnection();

$controller = new ContributorController();
$controller->conn = $conn; // manually inject

echo $controller->getAllApplications();
