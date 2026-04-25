<?php
require_once __DIR__ . '/controllers/ContributorController.php';

$controller = new ContributorController();
$result = $controller->getAllApplications();
print_r($result);
?>