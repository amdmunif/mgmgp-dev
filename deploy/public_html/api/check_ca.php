<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/config/database.php';

echo "=== DIAGNOSTIK TABEL KONTRIBUTOR ===\n\n";

try {
    $db = new Database();
    $conn = $db->getConnection();
    if (!$conn)
        die("Koneksi database gagal.");

    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "1. Mengecek isi mentah tabel contributor_applications (Tanpa JOIN)...\n";
    $q1 = $conn->query("SELECT * FROM contributor_applications");
    $res1 = $q1->fetchAll(PDO::FETCH_ASSOC);
    if (empty($res1)) {
        echo ">> KOSONG! Baris data di tabel contributor_applications memang tidak ada.\n\n";
    } else {
        echo ">> Ditemukan " . count($res1) . " baris data:\n";
        print_r($res1);
        echo "\n";
    }

    echo "2. Mengecek Collation Tabel Saat Ini...\n";
    $q2 = $conn->query("SHOW TABLE STATUS WHERE Name IN ('contributor_applications', 'users', 'profiles')");
    $res2 = $q2->fetchAll(PDO::FETCH_ASSOC);
    foreach ($res2 as $row) {
        echo "Tabel " . $row['Name'] . " -> " . $row['Collation'] . "\n";
    }
    echo "\n";

    echo "3. Menjalankan Query Gabungan (LEFT JOIN) persis seperti Admin Panel...\n";
    $query3 = "SELECT ca.*, p.nama, u.email, 
               (SELECT COUNT(*) FROM questions q WHERE q.creator_id = ca.user_id) as question_count
               FROM contributor_applications ca
               LEFT JOIN profiles p ON ca.user_id = p.id
               LEFT JOIN users u ON ca.user_id = u.id
               ORDER BY ca.applied_at DESC";
    $stmt3 = $conn->prepare($query3);
    $stmt3->execute();
    $res3 = $stmt3->fetchAll(PDO::FETCH_ASSOC);

    if (empty($res3)) {
        echo ">> HASIL QUERY KOSONG meskipun dijalankan pakai LEFT JOIN!\n";
    } else {
        echo ">> HASIL QUERY SUKSES mendapatkan " . count($res3) . " baris data:\n";
        print_r($res3);
    }

} catch (PDOException $e) {
    echo "\n=== SQL ERROR ===\n" . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "\n=== SYSTEM ERROR ===\n" . $e->getMessage() . "\n";
}
?>