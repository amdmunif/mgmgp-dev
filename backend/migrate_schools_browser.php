<?php
// backend/migrate_schools_browser.php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/SchoolNormalizer.php';

$isCli = (php_sapi_name() === 'cli');

$db = new Database();
$conn = $db->getConnection();

$message = '';
$messageType = 'info';
$migrateStats = null;

if (!$conn) {
    if ($isCli) {
        echo "Error: Database connection failed. Please check config/database.php\n";
        exit(1);
    }
    die("<div style='font-family:sans-serif;padding:30px;color:red;'><h2>Gagal Terhubung ke Database</h2><p>Pastikan konfigurasi di config/database.php sudah benar.</p></div>");
}

function runMigration($pdo) {
    // 1. Create table
    $createSql = "CREATE TABLE IF NOT EXISTS `master_schools` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `npsn` varchar(20) DEFAULT NULL,
        `nama` varchar(255) NOT NULL,
        `kecamatan` varchar(100) NOT NULL,
        `is_verified` tinyint(1) DEFAULT 1,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (`id`),
        UNIQUE KEY `uniq_school_nama` (`nama`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $pdo->exec($createSql);

    // 2. Seed 109 official schools from SchoolNormalizer
    $stmt = $pdo->prepare("INSERT INTO `master_schools` (`npsn`, `nama`, `kecamatan`, `is_verified`) 
        VALUES (:npsn, :nama, :kecamatan, 1)
        ON DUPLICATE KEY UPDATE 
            `kecamatan` = VALUES(`kecamatan`),
            `npsn` = IF(VALUES(`npsn`) IS NOT NULL AND VALUES(`npsn`) != '', VALUES(`npsn`), `npsn`)");

    $seededCount = 0;
    foreach (SchoolNormalizer::$schools as $s) {
        $stmt->execute([
            ':npsn' => $s['npsn'],
            ':nama' => trim($s['nama']),
            ':kecamatan' => trim($s['kecamatan'])
        ]);
        $seededCount++;
    }

    // 3. Scan unique schools from profiles and insert any novel ones
    $profileStmt = $pdo->query("SELECT DISTINCT TRIM(asal_sekolah) as sekolah FROM profiles WHERE asal_sekolah IS NOT NULL AND TRIM(asal_sekolah) != ''");
    $profileSchools = $profileStmt->fetchAll(PDO::FETCH_COLUMN);

    $importedFromProfiles = 0;
    $insertCustomStmt = $pdo->prepare("INSERT IGNORE INTO `master_schools` (`npsn`, `nama`, `kecamatan`, `is_verified`) VALUES (NULL, :nama, :kecamatan, 1)");

    foreach ($profileSchools as $raw) {
        $raw = trim($raw);
        if (empty($raw)) continue;

        // Check if matches existing official school
        $normalized = SchoolNormalizer::matchSchool($raw);
        $schoolNameToUse = $normalized ? $normalized['nama'] : $raw;
        $kecamatanToUse = $normalized ? $normalized['kecamatan'] : 'Lainnya';

        // Check if exists in master_schools
        $checkStmt = $pdo->prepare("SELECT id FROM master_schools WHERE LOWER(nama) = LOWER(:nama) LIMIT 1");
        $checkStmt->execute([':nama' => $schoolNameToUse]);
        if (!$checkStmt->fetch()) {
            $insertCustomStmt->execute([
                ':nama' => $schoolNameToUse,
                ':kecamatan' => $kecamatanToUse
            ]);
            $importedFromProfiles++;
        }
    }

    // 4. Count total
    $countStmt = $pdo->query("SELECT COUNT(*) FROM master_schools");
    $totalCount = (int)$countStmt->fetchColumn();

    return [
        'seeded' => $seededCount,
        'imported_from_profiles' => $importedFromProfiles,
        'total' => $totalCount
    ];
}

// Handle action
if (($isCli && isset($argv[1]) && $argv[1] === '--run') || 
    ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'migrate')) {
    try {
        $migrateStats = runMigration($conn);
        $message = "Sukses! Tabel 'master_schools' berhasil disiapkan dengan {$migrateStats['seeded']} sekolah resmi dan {$migrateStats['imported_from_profiles']} sekolah dari profil anggota. Total saat ini: {$migrateStats['total']} sekolah.";
        $messageType = 'success';
        if ($isCli) {
            echo $message . "\n";
            exit(0);
        }
    } catch (Exception $e) {
        $message = "Error saat migrasi: " . $e->getMessage();
        $messageType = 'error';
        if ($isCli) {
            echo $message . "\n";
            exit(1);
        }
    }
}

// Check current state
$tableExists = false;
$currentCount = 0;
$sampleSchools = [];
try {
    $tblCheck = $conn->query("SHOW TABLES LIKE 'master_schools'")->fetch();
    if ($tblCheck) {
        $tableExists = true;
        $currentCount = (int)$conn->query("SELECT COUNT(*) FROM master_schools")->fetchColumn();
        $sampleSchools = $conn->query("SELECT id, npsn, nama, kecamatan, is_verified FROM master_schools ORDER BY kecamatan ASC, nama ASC LIMIT 50")->fetchAll(PDO::FETCH_ASSOC);
    }
} catch (Exception $e) {
    // Table not exists
}

$totalOfficial = count(SchoolNormalizer::$schools);
$totalProfilesWithSchool = 0;
try {
    $totalProfilesWithSchool = (int)$conn->query("SELECT COUNT(*) FROM profiles WHERE asal_sekolah IS NOT NULL AND TRIM(asal_sekolah) != ''")->fetchColumn();
} catch (Exception $e) {}

if ($isCli) {
    echo "Table master_schools exists: " . ($tableExists ? "YES ({$currentCount} rows)" : "NO") . "\n";
    echo "Run with 'php backend/migrate_schools_browser.php --run' to execute migration.\n";
    exit(0);
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Migrasi Database Master Sekolah - MGMP Informatika</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 32px 20px; line-height: 1.5; }
        .container { max-width: 960px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white; padding: 26px 30px; border-radius: 18px; margin-bottom: 24px; box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.2); }
        .header h1 { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
        .header p { font-size: 14px; opacity: 0.9; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; padding: 20px; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
        .stat-card .label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
        .stat-card .num { font-size: 28px; font-weight: 800; margin-top: 6px; }
        .stat-card.green .num { color: #16a34a; }
        .stat-card.blue .num { color: #2563eb; }
        .stat-card.amber .num { color: #d97706; }
        .stat-card.purple .num { color: #7c3aed; }
        .alert { padding: 16px 20px; border-radius: 14px; margin-bottom: 24px; font-weight: 500; font-size: 14px; display: flex; align-items: center; gap: 12px; }
        .alert-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .alert-error { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
        .alert-info { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
        .card h2 { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; }
        .btn-primary { background: #2563eb; color: white; box-shadow: 0 4px 6px -1px rgba(37, 99, 255, 0.3); }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-success { background: #16a34a; color: white; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3); }
        .btn-success:hover { background: #15803d; }
        .btn-outline { background: white; color: #334155; border: 1px solid #cbd5e1; }
        .btn-outline:hover { background: #f8fafc; border-color: #94a3b8; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 14px; }
        th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .code-box { background: #0f172a; color: #e2e8f0; padding: 14px 18px; border-radius: 10px; font-family: monospace; font-size: 13px; overflow-x: auto; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Migrasi Database Master Sekolah</h1>
            <p>MGMP Informatika Kabupaten Wonosobo &bull; Menyiapkan tabel <code>master_schools</code> dan mengisi data 109 sekolah resmi.</p>
        </div>

        <?php if ($message): ?>
            <div class="alert alert-<?= $messageType ?>">
                <div><?= $messageType === 'success' ? '✅' : '⚠️' ?></div>
                <div><?= htmlspecialchars($message) ?></div>
            </div>
        <?php endif; ?>

        <div class="stats-grid">
            <div class="stat-card <?= $tableExists ? 'green' : 'amber' ?>">
                <div class="label">Status Tabel master_schools</div>
                <div class="num"><?= $tableExists ? 'Tersedia' : 'Belum Ada' ?></div>
            </div>
            <div class="stat-card blue">
                <div class="label">Sekolah di Database</div>
                <div class="num"><?= $currentCount ?></div>
            </div>
            <div class="stat-card purple">
                <div class="label">Target Sekolah Resmi</div>
                <div class="num"><?= $totalOfficial ?></div>
            </div>
            <div class="stat-card amber">
                <div class="label">Anggota Mengisi Sekolah</div>
                <div class="num"><?= $totalProfilesWithSchool ?></div>
            </div>
        </div>

        <div class="card">
            <h2>Jalankan Migrasi Database</h2>
            <p style="color: #475569; font-size: 14px; margin-bottom: 16px;">
                Klik tombol di bawah untuk membuat tabel <code>master_schools</code> dan mengisi (seeding) otomatis 109 sekolah resmi Wonosobo lengkap dengan NPSN dan Kecamatan. Aman dijalankan berulang kali (tidak akan menduplikasi data).
            </p>
            <form method="POST" onsubmit="return confirm('Jalankan migrasi tabel master_schools dan seeding 109 data sekolah sekarang?');">
                <input type="hidden" name="action" value="migrate">
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button type="submit" class="btn <?= $tableExists && $currentCount >= $totalOfficial ? 'btn-outline' : 'btn-success' ?>">
                        ⚡ <?= $tableExists ? 'Jalankan / Sinkronkan Ulang Seeding' : 'Buat Tabel & Seeding Sekarang' ?>
                    </button>
                    <a href="./migrate_schools_browser.php" class="btn btn-outline">🔄 Refresh Halaman</a>
                    <a href="./standardize_schools_browser.php" class="btn btn-outline">🛠️ Standarisasi Data Lama</a>
                </div>
            </form>
        </div>

        <div class="card">
            <h2>Query SQL Manual (Opsional via phpMyAdmin)</h2>
            <p style="color: #64748b; font-size: 13px;">Jika Anda lebih memilih mengeksekusi langsung lewat phpMyAdmin, silakan jalankan query di bawah ini:</p>
            <div class="code-box">CREATE TABLE IF NOT EXISTS `master_schools` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `npsn` varchar(20) DEFAULT NULL,
  `nama` varchar(255) NOT NULL,
  `kecamatan` varchar(100) NOT NULL,
  `is_verified` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_school_nama` (`nama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;</div>
        </div>

        <?php if ($tableExists && !empty($sampleSchools)): ?>
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h2>Preview Data Sekolah di Database (50 Pertama)</h2>
                    <span class="badge badge-green"><?= $currentCount ?> Total Terdaftar</span>
                </div>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>NPSN</th>
                                <th>Nama Sekolah</th>
                                <th>Kecamatan</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($sampleSchools as $idx => $s): ?>
                                <tr>
                                    <td><?= $idx + 1 ?></td>
                                    <td><code><?= htmlspecialchars($s['npsn'] ?? '-') ?></code></td>
                                    <td><strong><?= htmlspecialchars($s['nama']) ?></strong></td>
                                    <td><span class="badge badge-blue">Kec. <?= htmlspecialchars($s['kecamatan']) ?></span></td>
                                    <td><span class="badge badge-green">Terverifikasi</span></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
