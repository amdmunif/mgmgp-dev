<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// We need to connect to the DB using the PDO directly with the right socket/port.
$host = '127.0.0.1';
$port = '3306'; // default MAMP port is usually 8889 but maybe 3306 here?
$dbname = 'mgmp_db'; // wait, what is the dbname? Let's check config/database.php
