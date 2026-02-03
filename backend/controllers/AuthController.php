<?php
// backend/controllers/AuthController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class AuthController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function register($data)
    {
        $email = $data['email'];
        $password = $data['password'];
        $nama = $data['nama'];
        // Metadata fields
        $asal_sekolah = $data['data']['asal_sekolah'] ?? null;
        $no_hp = $data['data']['no_hp'] ?? null;

        // 1. Check if email exists
        $query = "SELECT id FROM users WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            http_response_code(400);
            return json_encode(["message" => "Email already registered."]);
        }

        // 2. Insert into Users
        $userId = Helper::uuid();
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $queryUser = "INSERT INTO users (id, email, password_hash) VALUES (:id, :email, :password_hash)";
        $stmtUser = $this->conn->prepare($queryUser);
        $stmtUser->bindParam(':id', $userId);
        $stmtUser->bindParam(':email', $email);
        $stmtUser->bindParam(':password_hash', $passwordHash);

        if ($stmtUser->execute()) {
            // 3. Insert into Profiles
            $queryProfile = "INSERT INTO profiles (id, nama, asal_sekolah, no_hp, role, is_active) VALUES (:id, :nama, :asal_sekolah, :no_hp, 'Anggota', 0)";
            $stmtProfile = $this->conn->prepare($queryProfile);
            $stmtProfile->bindParam(':id', $userId);
            $stmtProfile->bindParam(':nama', $nama);
            $stmtProfile->bindParam(':asal_sekolah', $asal_sekolah);
            $stmtProfile->bindParam(':no_hp', $no_hp);

            if ($stmtProfile->execute()) {
                // Auto-login (Generate Token)
                $tokenPayload = [
                    'sub' => $userId,
                    'email' => $email,
                    'role' => 'Anggota',
                    'iat' => time(),
                    'exp' => time() + (60 * 60 * 24) // 24 hours
                ];
                $token = Helper::generateJWT($tokenPayload);

                return json_encode([
                    "message" => "Registration successful.",
                    "user" => [
                        "id" => $userId,
                        "email" => $email,
                        "role" => "Anggota"
                    ],
                    "session" => [
                        "access_token" => $token
                    ]
                ]);
            }
        }

        http_response_code(500);
        return json_encode(["message" => "Registration failed."]);
    }

    public function login($data)
    {
        $email = $data['email'];
        $password = $data['password'];

        $query = "SELECT u.id, u.email, u.password_hash, p.role, p.nama, p.is_active FROM users u JOIN profiles p ON u.id = p.id WHERE u.email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($password, $row['password_hash'])) {

                // Check Active Status
                if (isset($row['is_active']) && $row['is_active'] == 0) {
                    http_response_code(403);
                    return json_encode(["message" => "Akun Anda sedang menunggu verifikasi Admin."]);
                }

                // Generate Token
                $tokenPayload = [
                    'sub' => $row['id'],
                    'email' => $row['email'],
                    'role' => $row['role'],
                    'iat' => time(),
                    'exp' => time() + (60 * 60 * 24 * 7) // 7 days
                ];
                $token = Helper::generateJWT($tokenPayload);

                // Update Last Login
                $update = "UPDATE users SET last_login = NOW() WHERE id = :id";
                $stmtUpdate = $this->conn->prepare($update);
                $stmtUpdate->bindParam(':id', $row['id']);
                $stmtUpdate->execute();

                return json_encode([
                    "user" => [
                        "id" => $row['id'],
                        "email" => $row['email'],
                        "role" => $row['role'],
                        "nama" => $row['nama']
                    ],
                    "session" => [
                        "access_token" => $token
                    ]
                ]);
            }
        }

        http_response_code(401);
        return json_encode(["message" => "Invalid email or password."]);
    }

    public function getProfile($id)
    {
        $query = "SELECT p.*, u.email FROM profiles p JOIN users u ON p.id = u.id WHERE p.id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            // Decode JSON fields if they exist as strings (though PDO usually fetches as string)
            // MySQL JSON columns might come out as strings
            if (isset($row['mapel']))
                $row['mapel'] = json_decode($row['mapel']);
            if (isset($row['kelas']))
                $row['kelas'] = json_decode($row['kelas']);

            return json_encode($row);
        }

        http_response_code(404);
        return json_encode(["message" => "Profile not found."]);
    }

    public function updateProfile($id, $data)
    {
        $query = "UPDATE profiles SET 
            nama = :nama,
            asal_sekolah = :asal_sekolah,
            pendidikan_terakhir = :pendidikan_terakhir,
            jurusan = :jurusan,
            status_kepegawaian = :status_kepegawaian,
            ukuran_baju = :ukuran_baju,
            no_hp = :no_hp,
            foto_profile = :foto_profile,
            updated_at = NOW()
            WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':nama', $data['nama']);
        $stmt->bindParam(':asal_sekolah', $data['asal_sekolah']);
        $stmt->bindParam(':pendidikan_terakhir', $data['pendidikan_terakhir']);
        $stmt->bindParam(':jurusan', $data['jurusan']);
        $stmt->bindParam(':status_kepegawaian', $data['status_kepegawaian']);
        $stmt->bindParam(':ukuran_baju', $data['ukuran_baju']);
        $stmt->bindParam(':no_hp', $data['no_hp']);

        $foto_profile = isset($data['foto_profile']) ? $data['foto_profile'] : null;
        $stmt->bindParam(':foto_profile', $foto_profile);

        if ($stmt->execute()) {
            return $this->getProfile($id);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to update profile."]);
    }
}
?>