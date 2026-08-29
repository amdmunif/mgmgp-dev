<?php
require_once "backend/config/database.php";
$db = new Database();
$conn = $db->getConnection();

echo "<pre>";
if (!$conn) {
    die("Database connection failed.\n");
}

try {
    // 1. Add total_days to events
    try {
        $conn->exec("ALTER TABLE events ADD COLUMN total_days INT DEFAULT 1 AFTER date");
        echo "✅ Added total_days to events.\n";
    } catch (PDOException $e) {
        echo "ℹ️ total_days might already exist: " . $e->getMessage() . "\n";
    }

    // 2. Add is_passed to event_participants
    try {
        $conn->exec("ALTER TABLE event_participants ADD COLUMN is_passed INT DEFAULT 0 AFTER is_hadir");
        echo "✅ Added is_passed to event_participants.\n";
    } catch (PDOException $e) {
        echo "ℹ️ is_passed might already exist: " . $e->getMessage() . "\n";
    }

    // 3. Create event_attendances table
    $createTableQuery = "
    CREATE TABLE IF NOT EXISTS event_attendances (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        attended_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY event_user_date (event_id, user_id, attended_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $conn->exec($createTableQuery);
    echo "✅ Created event_attendances table.\n";
    
} catch (PDOException $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
echo "</pre>";
?>
