<?php
include_once __DIR__ . '/backend/config/database.php';
$db = new Database();
$conn = $db->getConnection();

$stmt = $conn->prepare("SELECT id, nama, role, is_active FROM profiles WHERE role IN ('Admin', 'Pengurus', 'administrator', 'admin') OR nama LIKE '%Admin%'");
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

print_r($users);
?>