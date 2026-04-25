<?php
require_once __DIR__ . '/backend/config/database.php';
require_once __DIR__ . '/backend/controllers/ContributorController.php';

$controller = new ContributorController();
$result = $controller->getAllApplications();

echo "Raw Controller Output Length: " . strlen($result) . "\n";
echo "Output: \n$result\n";
echo "JSON Error: " . json_last_error_msg() . "\n";
?>