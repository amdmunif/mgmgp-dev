<?php
require_once __DIR__ . '/config/database.php';

echo "<h1>Database Diagnostic</h1>";

try {
    $db = new Database();
    $conn = $db->getConnection();
    echo "✅ Connected to database.<br><hr>";

    // 1. List Tables
    echo "<h3>Tables:</h3>";
    $tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    if (empty($tables)) {
        echo "⚠️ No tables found!<br>";
    } else {
        echo "<ul>";
        foreach ($tables as $table) {
            echo "<li>$table</li>";
        }
        echo "</ul>";
    }
    echo "<hr>";

    // 2. Check 'events' columns
    if (in_array('events', $tables)) {
        echo "<h3>Columns in 'events':</h3>";
        $cols = $conn->query("SHOW COLUMNS FROM events")->fetchAll(PDO::FETCH_ASSOC);
        echo "<ul>";
        foreach ($cols as $col) {
            echo "<li>{$col['Field']} ({$col['Type']})</li>";
        }
        echo "</ul>";
    } else {
        echo "❌ Table 'events' NOT FOUND.<br>";
    }
    echo "<hr>";

    // 3. Check 'event_participants' columns
    if (in_array('event_participants', $tables)) {
        echo "<h3>Columns in 'event_participants':</h3>";
        $cols = $conn->query("SHOW COLUMNS FROM event_participants")->fetchAll(PDO::FETCH_ASSOC);
        echo "<ul>";
        foreach ($cols as $col) {
            echo "<li>{$col['Field']} ({$col['Type']})</li>";
        }
        echo "</ul>";
    } else {
        echo "❌ Table 'event_participants' NOT FOUND.<br>";
    }
    echo "<hr>";

    // 4. Test Query
    echo "<h3>Test getUpcomingEvents Query:</h3>";
    try {
        $userId = 'test_user';
        $query = "SELECT e.*, ep.status as participation_status 
                  FROM events e 
                  LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.user_id = :uid 
                  ORDER BY e.date ASC LIMIT 5";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Query executed successfully. " . count($results) . " rows returned.<br>";
        echo "<pre>" . json_encode($results, JSON_PRETTY_PRINT) . "</pre>";
    } catch (PDOException $e) {
        echo "❌ Query Failed: " . $e->getMessage();
    }

} catch (Exception $e) {
    echo "❌ Fatal Error: " . $e->getMessage();
}
?>