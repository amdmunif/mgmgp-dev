<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    echo "Running revision migration...\n";

    $conn->exec("ALTER TABLE `events` 
        ADD COLUMN IF NOT EXISTS `registration_deadline` datetime DEFAULT NULL;");
    echo "Added registration_deadline to events.\n";

    // Attempt to drop bank columns, ignore if they don't exist
    try {
        $conn->exec("ALTER TABLE `events` 
            DROP COLUMN `bank_name`,
            DROP COLUMN `bank_account_number`,
            DROP COLUMN `bank_account_holder`;");
        echo "Dropped bank columns from events.\n";
    } catch (Exception $e) {
        echo "Bank columns might not exist or already dropped.\n";
    }

    echo "Migration completed successfully!\n";

} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
}
?>
