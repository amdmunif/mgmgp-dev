<?php
if (!function_exists('getallheaders')) {
    function getallheaders() {
        return [];
    }
}
$_SERVER['REQUEST_URI'] = '/api/finances/summary';
$_SERVER['REQUEST_METHOD'] = 'GET';
require 'backend/index.php';
