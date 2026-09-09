<?php
// backend/controllers/SchoolController.php

include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../utils/SchoolNormalizer.php';

class SchoolController
{
    private $conn;

    public function __construct()
    {
        $db = new Database();
        $this->conn = $db->getConnection();
    }

    /**
     * Get all schools from master_schools, falling back to SchoolNormalizer if table missing
     */
    public function getAll()
    {
        try {
            if ($this->conn) {
                // Check if table exists
                $check = $this->conn->query("SHOW TABLES LIKE 'master_schools'")->fetch();
                if ($check) {
                    $stmt = $this->conn->query("SELECT id, npsn, nama, kecamatan, is_verified FROM master_schools ORDER BY kecamatan ASC, nama ASC");
                    $schools = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    if (!empty($schools)) {
                        return json_encode($schools);
                    }
                }
            }
        } catch (Exception $e) {
            // Silently fallback on query error
        }

        // Fallback to static list
        $staticList = array_map(function($s) {
            return [
                'id' => $s['no'],
                'npsn' => $s['npsn'],
                'nama' => $s['nama'],
                'kecamatan' => $s['kecamatan'],
                'is_verified' => 1
            ];
        }, SchoolNormalizer::$schools);

        return json_encode($staticList);
    }

    /**
     * Add a new school to master_schools
     */
    public function create($data)
    {
        if (empty($data['nama']) || empty($data['kecamatan'])) {
            http_response_code(400);
            return json_encode(["message" => "Nama sekolah dan kecamatan wajib diisi."]);
        }

        $nama = trim($data['nama']);
        $kecamatan = trim($data['kecamatan']);
        $npsn = !empty($data['npsn']) ? trim($data['npsn']) : null;
        $is_verified = isset($data['is_verified']) ? (int)$data['is_verified'] : 1;

        if (!$this->conn) {
            http_response_code(500);
            return json_encode(["message" => "Koneksi database gagal."]);
        }

        try {
            // Ensure table exists
            $this->conn->exec("CREATE TABLE IF NOT EXISTS `master_schools` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `npsn` varchar(20) DEFAULT NULL,
                `nama` varchar(255) NOT NULL,
                `kecamatan` varchar(100) NOT NULL,
                `is_verified` tinyint(1) DEFAULT 1,
                `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY (`id`),
                UNIQUE KEY `uniq_school_nama` (`nama`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // Check if already exists
            $checkStmt = $this->conn->prepare("SELECT id, npsn, nama, kecamatan, is_verified FROM master_schools WHERE LOWER(nama) = LOWER(:nama) LIMIT 1");
            $checkStmt->execute([':nama' => $nama]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // If existing school was unverified or had no npsn, update it
                if ($npsn && empty($existing['npsn'])) {
                    $updateStmt = $this->conn->prepare("UPDATE master_schools SET npsn = :npsn WHERE id = :id");
                    $updateStmt->execute([':npsn' => $npsn, ':id' => $existing['id']]);
                    $existing['npsn'] = $npsn;
                }
                http_response_code(200);
                return json_encode([
                    "message" => "Sekolah sudah terdaftar.",
                    "school" => $existing
                ]);
            }

            // Insert new school
            $stmt = $this->conn->prepare("INSERT INTO master_schools (npsn, nama, kecamatan, is_verified) VALUES (:npsn, :nama, :kecamatan, :is_verified)");
            $stmt->execute([
                ':npsn' => $npsn,
                ':nama' => $nama,
                ':kecamatan' => $kecamatan,
                ':is_verified' => $is_verified
            ]);

            $newId = $this->conn->lastInsertId();
            $newSchool = [
                'id' => (int)$newId,
                'npsn' => $npsn,
                'nama' => $nama,
                'kecamatan' => $kecamatan,
                'is_verified' => $is_verified
            ];

            http_response_code(201);
            return json_encode([
                "message" => "Sekolah berhasil ditambahkan ke database.",
                "school" => $newSchool
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            return json_encode(["message" => "Gagal menyimpan sekolah: " . $e->getMessage()]);
        }
    }

    /**
     * Delete a school from master_schools
     */
    public function delete($id)
    {
        if (!$this->conn) {
            http_response_code(500);
            return json_encode(["message" => "Koneksi database gagal."]);
        }

        try {
            $stmt = $this->conn->prepare("DELETE FROM master_schools WHERE id = :id");
            $stmt->execute([':id' => $id]);

            if ($stmt->rowCount() > 0) {
                return json_encode(["message" => "Sekolah berhasil dihapus."]);
            } else {
                http_response_code(404);
                return json_encode(["message" => "Sekolah tidak ditemukan."]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            return json_encode(["message" => "Gagal menghapus sekolah: " . $e->getMessage()]);
        }
    }

    /**
     * Static helper to ensure school exists in master_schools when submitted by users
     */
    public static function ensureSchoolExists($pdo, $schoolName, $npsn = null, $kecamatan = null)
    {
        if (!$pdo || empty(trim($schoolName))) {
            return null;
        }

        $nama = trim($schoolName);

        try {
            // Check if table exists
            $tbl = $pdo->query("SHOW TABLES LIKE 'master_schools'")->fetch();
            if (!$tbl) {
                return null;
            }

            // Check if already in master_schools
            $checkStmt = $pdo->prepare("SELECT id, npsn, nama, kecamatan FROM master_schools WHERE LOWER(nama) = LOWER(:nama) LIMIT 1");
            $checkStmt->execute([':nama' => $nama]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // Optionally update NPSN if it was null but provided now
                if (empty($existing['npsn']) && !empty($npsn)) {
                    $updateStmt = $pdo->prepare("UPDATE master_schools SET npsn = :npsn WHERE id = :id");
                    $updateStmt->execute([':npsn' => $npsn, ':id' => $existing['id']]);
                }
                return $existing;
            }

            // If not found, try to derive kecamatan if not provided
            if (empty($kecamatan)) {
                $kecamatan = 'Lainnya';
                if (method_exists('SchoolNormalizer', 'matchSchool')) {
                    $matched = SchoolNormalizer::matchSchool($nama);
                    if ($matched && isset($matched['kecamatan'])) {
                        $kecamatan = $matched['kecamatan'];
                    }
                }
            }

            $insertStmt = $pdo->prepare("INSERT IGNORE INTO master_schools (npsn, nama, kecamatan, is_verified) VALUES (:npsn, :nama, :kecamatan, 1)");
            $insertStmt->execute([
                ':npsn' => !empty($npsn) ? $npsn : null,
                ':nama' => $nama,
                ':kecamatan' => trim($kecamatan)
            ]);

            return [
                'id' => (int)$pdo->lastInsertId(),
                'nama' => $nama,
                'kecamatan' => $kecamatan
            ];
        } catch (Throwable $e) {
            // Fail silently to not block user registration/profile updates
            error_log("Error in ensureSchoolExists: " . $e->getMessage());
            return null;
        }
    }
}
