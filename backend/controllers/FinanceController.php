<?php
// backend/controllers/FinanceController.php
include_once './config/database.php';

class FinanceController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function getSummary()
    {
        $summary = [
            'total_income' => 0,
            'total_expense' => 0,
            'balance' => 0,
            'this_month_income' => 0,
            'this_month_expense' => 0
        ];

        // Total
        $stmt = $this->conn->prepare("SELECT type, SUM(amount) as total FROM finance_transactions GROUP BY type");
        $stmt->execute();
        $totals = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($totals as $row) {
            if ($row['type'] === 'income') $summary['total_income'] = (float)$row['total'];
            if ($row['type'] === 'expense') $summary['total_expense'] = (float)$row['total'];
        }
        $summary['balance'] = $summary['total_income'] - $summary['total_expense'];

        // This Month
        $stmtMonth = $this->conn->prepare("SELECT type, SUM(amount) as total FROM finance_transactions WHERE MONTH(transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(transaction_date) = YEAR(CURRENT_DATE()) GROUP BY type");
        $stmtMonth->execute();
        $monthTotals = $stmtMonth->fetchAll(PDO::FETCH_ASSOC);
        foreach ($monthTotals as $row) {
            if ($row['type'] === 'income') $summary['this_month_income'] = (float)$row['total'];
            if ($row['type'] === 'expense') $summary['this_month_expense'] = (float)$row['total'];
        }

        return json_encode($summary);
    }

    public function getTransactions()
    {
        $stmt = $this->conn->prepare("SELECT * FROM finance_transactions ORDER BY transaction_date DESC");
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function addTransaction($data, $userId, $userName)
    {
        $id = Helper::uuid();
        $query = "INSERT INTO finance_transactions (id, type, amount, description, reference_id, reference_type, transaction_date) 
                  VALUES (:id, :type, :amount, :description, :reference_id, :reference_type, :transaction_date)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':type', $data['type']);
        $stmt->bindParam(':amount', $data['amount']);
        $stmt->bindParam(':description', $data['description']);
        $refId = $data['reference_id'] ?? null;
        $stmt->bindParam(':reference_id', $refId);
        $refType = $data['reference_type'] ?? 'manual';
        $stmt->bindParam(':reference_type', $refType);
        $txDate = $data['transaction_date'] ?? date('Y-m-d H:i:s');
        $stmt->bindParam(':transaction_date', $txDate);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'ADD_TRANSACTION', "{$data['type']} - {$data['amount']}");
            return json_encode(["message" => "Transaction added", "id" => $id]);
        }
        http_response_code(500);
        return json_encode(["message" => "Failed to add transaction"]);
    }
    public function deleteTransaction($id, $userId, $userName)
    {
        $query = "DELETE FROM finance_transactions WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            Helper::log($this->conn, $userId, $userName, 'DELETE_TRANSACTION', "Deleted ID: $id");
            return json_encode(["message" => "Transaction deleted successfully"]);
        }
        
        http_response_code(500);
        return json_encode(["message" => "Failed to delete transaction"]);
    }
}
?>
