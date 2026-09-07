<?php
// backend/standardize_schools_browser.php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/SchoolNormalizer.php';

$db = new Database();
$conn = $db->getConnection();

$message = '';
$actionResult = null;

if (!$conn) {
    die("<div style='font-family:sans-serif;padding:30px;color:red;'><h2>Gagal Terhubung ke Database</h2><p>Pastikan konfigurasi di config/database.php sudah benar.</p></div>");
}

// Handle Execute Action
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'execute') {
    try {
        $actionResult = SchoolNormalizer::executeStandardize($conn);
        $message = "Sukses! Berhasil memperbarui " . $actionResult['updated_count'] . " data nama sekolah anggota ke format resmi terstandarisasi.";
    } catch (Exception $e) {
        $message = "Error saat pembaruan: " . $e->getMessage();
    }
}

// Audit Current Status
$audit = SchoolNormalizer::audit($conn);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Standarisasi Nama Sekolah Lama - MGMP Informatika</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 30px 20px; line-height: 1.5; }
        .container { max-width: 960px; margin: 0 auto; }
        .header { background: #1e3a8a; color: white; padding: 24px 28px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
        .header p { font-size: 14px; opacity: 0.9; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; padding: 20px; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .stat-card .num { font-size: 28px; font-weight: 800; margin-top: 4px; }
        .stat-card.green .num { color: #16a34a; }
        .stat-card.blue .num { color: #2563eb; }
        .stat-card.amber .num { color: #d97706; }
        .stat-card.purple .num { color: #7c3aed; }
        .alert { padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; font-weight: 500; font-size: 14px; }
        .alert-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .alert-error { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
        .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .card h2 { font-size: 17px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
        th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .badge-gray { background: #f1f5f9; color: #475569; }
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 24px; font-size: 14px; font-weight: 600; border-radius: 10px; cursor: pointer; border: none; transition: all 0.2s; text-decoration: none; }
        .btn-primary { background: #2563eb; color: white; box-shadow: 0 2px 4px rgba(37,99,235,0.2); }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-outline { background: white; color: #475569; border: 1px solid #cbd5e1; margin-left: 8px; }
        .btn-outline:hover { background: #f8fafc; }
        .actions-bar { display: flex; align-items: center; gap: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛠️ Alat Standarisasi Nama Sekolah Lama</h1>
            <p>MGMP Informatika SMP Kabupaten Wonosobo &bull; Menyelaraskan variasi penulisan nama sekolah ke format resmi</p>
        </div>

        <?php if ($message): ?>
            <div class="alert <?= strpos($message, 'Sukses') !== false ? 'alert-success' : 'alert-error' ?>">
                <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>

        <!-- Stat Cards -->
        <div class="stats-grid">
            <div class="stat-card blue">
                <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Total Anggota Bersekolah</span>
                <div class="num"><?= $audit['total_with_school'] ?></div>
            </div>
            <div class="stat-card green">
                <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Sudah Terstandarisasi</span>
                <div class="num"><?= $audit['official_count'] ?></div>
            </div>
            <div class="stat-card amber">
                <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Bisa Di-automatch</span>
                <div class="num"><?= $audit['can_auto_match_count'] ?></div>
            </div>
            <div class="stat-card purple">
                <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Belum / Luar Daerah</span>
                <div class="num"><?= $audit['unmatched_count'] ?></div>
            </div>
        </div>

        <!-- Eksekusi Section -->
        <div class="card">
            <h2>⚡ Eksekusi Sinkronisasi Otomatis</h2>
            <p style="font-size: 14px; color: #475569;">
                Sistem akan membaca nama-nama sekolah lama (contoh: <code>SMPN 1 Wonosobo</code>, <code>SMP 2 Garung</code>, <code>SMPN 4 Satap Kalibawang</code>) dan memperbaruinya secara massal ke nama resmi terstandarisasi.
            </p>

            <form method="POST" onsubmit="return confirm('Apakah Anda yakin ingin memperbarui <?= $audit['can_auto_match_count'] ?> data sekolah secara massal? Tindakan ini akan mengupdate data di database.');">
                <input type="hidden" name="action" value="execute">
                <div class="actions-bar">
                    <button type="submit" class="btn btn-primary" <?= $audit['can_auto_match_count'] == 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : '' ?>>
                        🚀 Jalankan Standarisasi Massal (<?= $audit['can_auto_match_count'] ?> Data)
                    </button>
                    <a href="./standardize_schools_browser.php" class="btn btn-outline">🔄 Refresh Audit</a>
                    <a href="../" class="btn btn-outline">Kembali ke Aplikasi</a>
                </div>
            </form>
        </div>

        <!-- Preview Matched -->
        <?php if (!empty($audit['matched_preview'])): ?>
            <div class="card">
                <h2>📋 Preview Data yang Siap Di-Standarisasikan (<?= count($audit['matched_preview']) ?> ditampilkan)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Nama Guru / Anggota</th>
                            <th>Nama Sekolah Lama</th>
                            <th>Hasil Standarisasi Resmi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($audit['matched_preview'] as $row): ?>
                            <tr>
                                <td><strong><?= htmlspecialchars($row['nama']) ?></strong></td>
                                <td><span class="badge badge-amber"><?= htmlspecialchars($row['raw']) ?></span></td>
                                <td><span class="badge badge-green">➔ <?= htmlspecialchars($row['normalized']) ?></span></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>

        <!-- Preview Unmatched -->
        <?php if (!empty($audit['unmatched_preview'])): ?>
            <div class="card">
                <h2>ℹ️ Data yang Belum Terdaftar di 109 Sekolah (Bisa Di-edit Manual di Admin Members)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Nama Guru / Anggota</th>
                            <th>Nama Sekolah Saat Ini</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($audit['unmatched_preview'] as $row): ?>
                            <tr>
                                <td><?= htmlspecialchars($row['nama']) ?></td>
                                <td><code><?= htmlspecialchars($row['raw']) ?></code></td>
                                <td><span class="badge badge-gray">Saran Baru / Luar Wonosobo</span></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
