<?php
include_once 'backend/config/database.php';
include_once 'backend/controllers/LmsController.php';
$controller = new LmsController();
echo $controller->getAllParticipantsActivity('any_event_id');
