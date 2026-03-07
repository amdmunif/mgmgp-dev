<?php
require_once './config/database.php';

header('Content-Type: text/plain');

try {
    $database = new Database();
    $conn = $database->getConnection();

    if (!$conn) {
        die("Koneksi database gagal.");
    }

    // Set PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Memulai perbaikan collation database...\n";

    // Fix contributor_applications table
    $query1 = "ALTER TABLE `contributor_applications` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;";
    $conn->exec($query1);
    echo "1. Berhasil mengubah charset dan collation tabel 'contributor_applications' menjadi utf8mb4_unicode_ci\n";

    // Also fix user_id column specifically just in case
    $query2 = "ALTER TABLE `contributor_applications` MODIFY `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;";
    $conn->exec($query2);
    echo "2. Berhasil memastikan kolom 'user_id' menggunakan utf8mb4_unicode_ci\n";

    // Fix contact_messages table
    $query3 = "ALTER TABLE `contact_messages` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;";
    $conn->exec($query3);
    echo "3. Berhasil mengubah charset dan collation tabel 'contact_messages' menjadi utf8mb4_unicode_ci\n";

    echo "\nSelesai! Database collation sudah sinkron.\nSilakan refresh halaman Admin Panel bagian Kontributor.";

} catch (PDOException $e) {
    echo "\nERROR: Gagal melakukan perbaikan database.\n";
    echo "Pesan Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "\nERROR: " . $e->getMessage() . "\n";
}
?>