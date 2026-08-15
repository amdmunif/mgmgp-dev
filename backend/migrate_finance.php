<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    echo "Running finance migration...\n";

    $conn->exec("ALTER TABLE `events` 
        ADD COLUMN IF NOT EXISTS `is_paid` tinyint(1) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS `price` decimal(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS `bank_name` varchar(100) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS `bank_account_number` varchar(100) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS `bank_account_holder` varchar(100) DEFAULT NULL;");
    echo "Added finance columns to events.\n";

    $conn->exec("ALTER TABLE `event_participants`
        ADD COLUMN IF NOT EXISTS `payment_status` enum('free','pending','waiting_confirmation','confirmed','rejected') DEFAULT 'free',
        ADD COLUMN IF NOT EXISTS `payment_proof_url` text DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS `payment_date` timestamp NULL DEFAULT NULL;");
    echo "Added finance columns to event_participants.\n";

    $conn->exec("CREATE TABLE IF NOT EXISTS `finance_transactions` (
        `id` char(36) NOT NULL,
        `type` enum('income', 'expense') NOT NULL,
        `amount` decimal(10,2) NOT NULL,
        `description` text NOT NULL,
        `reference_id` char(36) DEFAULT NULL,
        `reference_type` varchar(50) DEFAULT NULL,
        `transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
        `created_by` char(36) DEFAULT NULL,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;");
    echo "Created finance_transactions table.\n";

    echo "Migration completed successfully!\n";

} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
}
?>
