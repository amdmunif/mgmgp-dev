<?php
$_ENV['DB_HOST'] = '127.0.0.1';
include_once 'backend/config/database.php';
include_once 'backend/controllers/LmsController.php';
$controller = new LmsController();
echo $controller->getAllParticipantsActivity('123');
