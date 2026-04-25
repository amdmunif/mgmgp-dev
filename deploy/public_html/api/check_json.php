<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/ContributorController.php';

$db = new Database();
$conn = $db->getConnection();

$controller = new ContributorController();
$controller->conn = $conn; // manually inject

echo "Starting fetch...\n";
try {
    $res = $controller->getAllApplications();
    echo "Raw Controller Output Length: " . strlen($res) . "\n";
    echo "Output: \n$res\n";
    echo "JSON Error: " . json_last_error_msg() . "\n";
} catch (Throwable $t) {
    echo "Fatal Error Caught: " . $t->getMessage() . " at " . $t->getFile() . ":" . $t->getLine() . "\n";
}
