<?php
// backend/migrate_kka.php

include_once './config/database.php';

echo "<h2>Migrasi Log KKA</h2>";

try {
    $db = new Database();
    $conn = $db->getConnection();

    // 1. Create kka_logs table
    $query = "
    CREATE TABLE IF NOT EXISTS kka_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guru_id CHAR(36),
        table_name VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";
    
    $conn->exec($query);
    echo "✅ Tabel kka_logs berhasil dibuat atau sudah ada.<br>";

    // Let's create triggers.
    $tables = ['kka_guru', 'kka_progres', 'kka_slide', 'kka_token'];
    
    foreach ($tables as $table) {
        $stmt = $conn->prepare("SHOW TABLES LIKE :table");
        $stmt->execute([':table' => $table]);
        if ($stmt->rowCount() == 0) {
            echo "⚠️ Tabel $table tidak ditemukan di database. Pastikan aplikasi KKA sudah membuat tabel-tabel ini.<br>";
            continue;
        }

        // Drop triggers if they exist
        $conn->exec("DROP TRIGGER IF EXISTS trg_{$table}_insert");
        $conn->exec("DROP TRIGGER IF EXISTS trg_{$table}_update");
        $conn->exec("DROP TRIGGER IF EXISTS trg_{$table}_delete");

        // We assume all KKA tables have a `guru_id` field based on standard patterns or schema.
        // Let's create standard triggers.

        $insertTrigger = "
        CREATE TRIGGER trg_{$table}_insert AFTER INSERT ON {$table}
        FOR EACH ROW
        BEGIN
            INSERT INTO kka_logs (guru_id, table_name, action, description)
            VALUES (NEW.guru_id, '{$table}', 'INSERT', CONCAT('Data baru ditambahkan di ', '{$table}'));
        END;
        ";

        $updateTrigger = "
        CREATE TRIGGER trg_{$table}_update AFTER UPDATE ON {$table}
        FOR EACH ROW
        BEGIN
            INSERT INTO kka_logs (guru_id, table_name, action, description)
            VALUES (NEW.guru_id, '{$table}', 'UPDATE', CONCAT('Data diubah di ', '{$table}'));
        END;
        ";

        $deleteTrigger = "
        CREATE TRIGGER trg_{$table}_delete AFTER DELETE ON {$table}
        FOR EACH ROW
        BEGIN
            INSERT INTO kka_logs (guru_id, table_name, action, description)
            VALUES (OLD.guru_id, '{$table}', 'DELETE', CONCAT('Data dihapus dari ', '{$table}'));
        END;
        ";

        $conn->exec($insertTrigger);
        $conn->exec($updateTrigger);
        $conn->exec($deleteTrigger);
        
        echo "✅ Triggers untuk tabel $table berhasil dibuat.<br>";
    }

    echo "<h3>Migrasi selesai.</h3>";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}
?>
