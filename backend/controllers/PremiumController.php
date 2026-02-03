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

            $qProfUp = "UPDATE profiles SET premium_until = :expiry, subscription_status = 'premium' WHERE id = :uid";
            $sProfUp = $this->conn->prepare($qProfUp);
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
}
?>