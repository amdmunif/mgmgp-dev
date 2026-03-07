<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/config/database.php';

echo "=== DIAGNOSTIK TABEL KONTRIBUTOR ===\n\n";

try {
    $db = new Database();
    $conn = $db->getConnection();
    if (!$conn) die("Koneksi database gagal.");
    
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $query3 = "SELECT ca.*, p.nama, u.email, 
               (SELECT COUNT(*) FROM questions q WHERE q.creator_id = ca.user_id) as question_count
               FROM contributor_applications ca
               LEFT JOIN profiles p ON ca.user_id = p.id
               LEFT JOIN users u ON ca.user_id = u.id
               ORDER BY ca.applied_at DESC";
    $stmt3 = $conn->prepare($query3);
    $stmt3->execute();
    $res3 = $stmt3->fetchAll(PDO::FETCH_ASSOC);
    
    echo ">> HASIL QUERY SUKSES mendapatkan " . count($res3) . " baris data:\n";
    
    echo "\n>> MENGUJI JSON ENCODE STANDARD:\n";
    $json1 = json_encode($res3);
    echo "Result: " . ($json1 === false ? "FAILED (" . json_last_error_msg() . ")" : "SUCCESS") . "\n";
    
    echo "\n>> MENGUJI JSON ENCODE INVALID_UTF8:\n";
    $json2 = json_encode($res3, JSON_INVALID_UTF8_SUBSTITUTE);
    echo "Result: " . ($json2 === false ? "FAILED (" . json_last_error_msg() . ")" : "SUCCESS") . "\n";

    echo "\n>> MENGUJI MBSTRING:\n";
    if (function_exists('mb_convert_encoding')) {
        echo "mb_convert_encoding is available.\n";
    } else {
        echo "mb_convert_encoding is MISSING!\n";
    }

} catch (Throwable $e) {
    echo "\n=== ERROR ===\n" . $e->getMessage() . "\n";
}
?>
