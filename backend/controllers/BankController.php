<?php
// backend/controllers/BankController.php

require_once __DIR__ . '/../config/Database.php';

class BankController
{
    private $conn;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAll()
    {
        $query = "SELECT * FROM premium_bank_accounts ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Cast is_active to bool for frontend convenience
        foreach ($items as &$item) {
            $item['is_active'] = (bool) $item['is_active'];
        }

        return json_encode($items);
    }

    public function getActive()
    {
        $query = "SELECT * FROM premium_bank_accounts WHERE is_active = 1 ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($items);
    }

    public function create($data)
    {
        if (empty($data['bank_name']) || empty($data['account_number']) || empty($data['account_holder'])) {
            http_response_code(400);
            return json_encode(["message" => "Incomplete data"]);
        }

        $id = $this->uuid();
        $isActive = isset($data['is_active']) ? (int) $data['is_active'] : 1;

        $query = "INSERT INTO premium_bank_accounts (id, bank_name, account_number, account_holder, is_active) VALUES (:id, :bank_name, :account_number, :account_holder, :is_active)";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':bank_name', $data['bank_name']);
        $stmt->bindParam(':account_number', $data['account_number']);
        $stmt->bindParam(':account_holder', $data['account_holder']);
        $stmt->bindParam(':is_active', $isActive);

        if ($stmt->execute()) {
            http_response_code(201);
            return json_encode(["message" => "Bank account created", "id" => $id]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to create bank account"]);
    }

    public function update($id, $data)
    {
        $fields = [];
        if (isset($data['bank_name']))
            $fields[] = "bank_name = :bank_name";
        if (isset($data['account_number']))
            $fields[] = "account_number = :account_number";
        if (isset($data['account_holder']))
            $fields[] = "account_holder = :account_holder";
        if (isset($data['is_active']))
            $fields[] = "is_active = :is_active";

        if (empty($fields)) {
            http_response_code(400);
            return json_encode(["message" => "No fields to update"]);
        }

        $query = "UPDATE premium_bank_accounts SET " . implode(", ", $fields) . ", updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        if (isset($data['bank_name']))
            $stmt->bindValue(':bank_name', $data['bank_name']);
        if (isset($data['account_number']))
            $stmt->bindValue(':account_number', $data['account_number']);
        if (isset($data['account_holder']))
            $stmt->bindValue(':account_holder', $data['account_holder']);
        if (isset($data['is_active']))
            $stmt->bindValue(':is_active', (int) $data['is_active']);
        $stmt->bindValue(':id', $id);

        if ($stmt->execute()) {
            return json_encode(["message" => "Bank account updated"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to update bank account"]);
    }

    public function delete($id)
    {
        $query = "DELETE FROM premium_bank_accounts WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            return json_encode(["message" => "Bank account deleted"]);
        }

        http_response_code(500);
        return json_encode(["message" => "Failed to delete bank account"]);
    }

    private function uuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}
?>