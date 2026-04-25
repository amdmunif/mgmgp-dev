<?php
// backend/diagnose_db.php

include_once './config/database.php';

header('Content-Type: application/json');

try {
    $db = new Database();
    $conn = $db->getConnection();
} catch (Exception $e) {
    echo json_encode(["status" => "ERROR", "message" => "Connection failed: " . $e->getMessage()]);
    exit;
}

$report = [
    "status" => "OK",
    "tables" => [],
    "columns" => []
];

// 1. Check Tables
$tablesToCheck = ['site_content', 'users', 'premium_settings', 'premium_bank_accounts'];
foreach ($tablesToCheck as $table) {
    try {
        $stmt = $conn->query("SELECT 1 FROM $table LIMIT 1");
        $report["tables"][$table] = "EXISTS";
    } catch (PDOException $e) {
        $report["tables"][$table] = "MISSING (" . $e->getMessage() . ")";
        $report["status"] = "ERROR";
    }
}

// 2. Check Columns in site_content
$contentColumns = ['bank_name', 'bank_number', 'bank_holder'];
// Get actual columns
try {
    $stmt = $conn->query("SHOW COLUMNS FROM site_content");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($contentColumns as $col) {
        if (in_array($col, $columns)) {
            $report["columns"]["site_content"][$col] = "EXISTS";
        } else {
            $report["columns"]["site_content"][$col] = "MISSING";
            $report["status"] = "ERROR";
        }
    }
} catch (Exception $e) {
    $report["columns"]["site_content"] = "Could not check columns: " . $e->getMessage();
}

// 3. Check Columns in users
$userColumns = ['reset_token', 'reset_token_expiry'];
try {
    $stmt = $conn->query("SHOW COLUMNS FROM users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($userColumns as $col) {
        if (in_array($col, $columns)) {
            $report["columns"]["users"][$col] = "EXISTS";
        } else {
            $report["columns"]["users"][$col] = "MISSING";
            $report["status"] = "ERROR";
        }
    }
} catch (Exception $e) {
    $report["columns"]["users"] = "Could not check columns: " . $e->getMessage();
}

echo json_encode($report, JSON_PRETTY_PRINT);
