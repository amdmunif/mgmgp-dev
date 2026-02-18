<?php
// backend/controllers/PremiumController.php
include_once './config/database.php';
include_once './utils/Helper.php';

class PremiumController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function getAllRequests()
    {
        // Join premium_requests with profiles
        $query = "SELECT pr.*, p.nama, p.premium_until 
                  FROM premium_requests pr
                  LEFT JOIN profiles p ON pr.user_id = p.id
                  ORDER BY pr.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format nested profile object to match frontend expectation (optional but helpful)
        // Frontend expects: requests[i].profiles.nama
        // But simpler: just return flat with prefix or let frontend adapt.
        // Let's adapt output to match Service expectation: { ..., profiles: { nama: ... } }

        $formatted = [];
        foreach ($requests as $req) {
            $item = [
                'id' => $req['id'],
                'user_id' => $req['user_id'],
                'proof_url' => $req['proof_url'],
                'status' => $req['status'],
                'bank_name' => $req['bank_name'],
                'account_number' => $req['account_number'],
                'account_holder' => $req['account_holder'],
                'notes' => $req['notes'],
                'created_at' => $req['created_at'],
                'profiles' => [
                    'nama' => $req['nama'],
                    'premium_until' => $req['premium_until']
                ]
            ];
            $formatted[] = $item;
        }

        return json_encode($formatted);
    }

    public function approve($id)
    {
        // 1. Get request details
        $qGet = "SELECT user_id, status FROM premium_requests WHERE id = :id";
        $sGet = $this->conn->prepare($qGet);
        $sGet->bindParam(':id', $id);
        $sGet->execute();
        $request = $sGet->fetch(PDO::FETCH_ASSOC);

        if (!$request) {
            http_response_code(404);
            return json_encode(["message" => "Request not found"]);
        }

        if ($request['status'] === 'approved') {
            return json_encode(["message" => "Already approved"]);
        }

        $userId = $request['user_id'];

        try {
            $this->conn->beginTransaction();

            // 2. Update status
            $qUp = "UPDATE premium_requests SET status = 'approved', updated_at = NOW() WHERE id = :id";
            $sUp = $this->conn->prepare($qUp);
            $sUp->bindParam(':id', $id);
            $sUp->execute();

            // 3. Update Profile (Add 1 Year)
            // First check current expiry
            $qProf = "SELECT premium_until FROM profiles WHERE id = :uid";
            $sProf = $this->conn->prepare($qProf);
            $sProf->bindParam(':uid', $userId);
            $sProf->execute();
            $profile = $sProf->fetch(PDO::FETCH_ASSOC);

            $currentExpiry = $profile['premium_until'] ? new DateTime($profile['premium_until']) : null;
            $now = new DateTime();
            $newExpiry = new DateTime();

            if ($currentExpiry && $currentExpiry > $now) {
                // If active, add 1 year to current expiry
                $newExpiry = clone $currentExpiry;
            }

            $newExpiry->modify('+1 year');
            $newExpiryStr = $newExpiry->format('Y-m-d H:i:s');

            $qProfUp = "UPDATE profiles SET premium_until = :expiry WHERE id = :uid";
            $stmtProfUp = $this->conn->prepare($qProfUp); // Fixed var name to avoid confusion or reuse
            $sProfUp = $stmtProfUp; // keeping original var name
            $sProfUp->bindParam(':expiry', $newExpiryStr);
            $sProfUp->bindParam(':uid', $userId);
            $sProfUp->execute();

            $this->conn->commit();
            return json_encode(["message" => "Approved successfully", "new_expiry" => $newExpiryStr]);

        } catch (Exception $e) {
            $this->conn->rollBack();
            http_response_code(500);
            return json_encode(["message" => "Failed to approve: " . $e->getMessage()]);
        }
    }

    public function reject($id, $data)
    {
        $notes = $data['reason'] ?? '';

        $query = "UPDATE premium_requests SET status = 'rejected', notes = :notes, updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':notes', $notes);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            return json_encode(["message" => "Rejected successfully"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to reject"]);
    }
    public function create($userId, $data)
    {
        $id = Helper::uuid();
        $proofUrl = $data['proof_url'] ?? '';
        $bankName = $data['bank_name'] ?? '';
        $accountNumber = $data['account_number'] ?? '';
        $accountHolder = $data['account_holder'] ?? '';

        // Insert into premium_requests
        $query = "INSERT INTO premium_requests (id, user_id, proof_url, bank_name, account_number, account_holder, status, created_at) 
                  VALUES (:id, :user_id, :proof_url, :bank_name, :account_number, :account_holder, 'pending', NOW())";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':proof_url', $proofUrl);
        $stmt->bindParam(':bank_name', $bankName);
        $stmt->bindParam(':account_number', $accountNumber);
        $stmt->bindParam(':account_holder', $accountHolder);

        if ($stmt->execute()) {
            return json_encode(["message" => "Request submitted successfully"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to submit request"]);
    }

    public function getMyLatest($userId)
    {
        $query = "SELECT * FROM premium_requests WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        $request = $stmt->fetch(PDO::FETCH_ASSOC);

        return json_encode($request ?: null);
    }

    public function getActiveSubscribers()
    {
        $query = "SELECT p.id, p.nama, p.premium_until, u.email 
                  FROM profiles p 
                  JOIN users u ON p.id = u.id 
                  WHERE p.premium_until > NOW() 
                  ORDER BY p.premium_until ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return json_encode($subscribers);
    }

    public function extend($userId)
    {
        // Add 1 year to current expiry
        $query = "SELECT premium_until FROM profiles WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $current = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$current) {
            http_response_code(404);
            return json_encode(["message" => "User not found"]);
        }

        $expiry = $current['premium_until'] ? new DateTime($current['premium_until']) : new DateTime();

        // If expired, start from now + 1 year
        $now = new DateTime();
        if ($expiry < $now) {
            $expiry = new DateTime();
        }

        $expiry->modify('+1 year');
        $newExpiry = $expiry->format('Y-m-d H:i:s');

        $update = "UPDATE profiles SET premium_until = :expiry WHERE id = :id";
        $stmtUp = $this->conn->prepare($update);
        $stmtUp->bindParam(':expiry', $newExpiry);
        $stmtUp->bindParam(':id', $userId);

        if ($stmtUp->execute()) {
            return json_encode(["message" => "Extended successfully", "new_expiry" => $newExpiry]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to extend"]);
    }

    public function revoke($userId)
    {
        // Set premium_until to NULL or NOW()
        // Let's set to NULL to completely remove status
        $update = "UPDATE profiles SET premium_until = NULL WHERE id = :id";
        $stmt = $this->conn->prepare($update);
        $stmt->bindParam(':id', $userId);

        if ($stmt->execute()) {
            return json_encode(["message" => "Subscription revoked"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to revoke"]);
    }

    public function deleteRequest($id)
    {
        $query = "DELETE FROM premium_requests WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            return json_encode(["message" => "Request deleted successfully"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to delete request"]);
    }

    public function updateRequest($id, $data)
    {
        $updates = [];
        if (isset($data['bank_name']))
            $updates[] = "bank_name = :bank_name";
        if (isset($data['account_number']))
            $updates[] = "account_number = :account_number";
        if (isset($data['account_holder']))
            $updates[] = "account_holder = :account_holder";
        if (isset($data['status']))
            $updates[] = "status = :status";
        if (isset($data['notes']))
            $updates[] = "notes = :notes";

        if (empty($updates)) {
            http_response_code(400);
            return json_encode(["message" => "No fields to update"]);
        }

        $query = "UPDATE premium_requests SET " . implode(", ", $updates) . ", updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        if (isset($data['bank_name']))
            $stmt->bindValue(':bank_name', $data['bank_name']);
        if (isset($data['account_number']))
            $stmt->bindValue(':account_number', $data['account_number']);
        if (isset($data['account_holder']))
            $stmt->bindValue(':account_holder', $data['account_holder']);
        if (isset($data['status']))
            $stmt->bindValue(':status', $data['status']);
        if (isset($data['notes']))
            $stmt->bindValue(':notes', $data['notes']);
        $stmt->bindValue(':id', $id);

        if ($stmt->execute()) {
            return json_encode(["message" => "Request updated successfully"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to update request"]);
    }
}
?>