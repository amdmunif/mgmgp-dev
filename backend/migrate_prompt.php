<?php
require_once __DIR__ . '/config/database.php';
try {
    $db = new Database();
    $conn = $db->getConnection();
    if (!$conn) die("DB Connection Failed.");
    
    $stmt = $conn->query("SHOW COLUMNS FROM prompt_library LIKE 'created_by'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("ALTER TABLE prompt_library ADD COLUMN created_by VARCHAR(36) DEFAULT NULL");
    }
    
    $stmt = $conn->query("SHOW COLUMNS FROM prompt_library LIKE 'is_published'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("ALTER TABLE prompt_library ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 1");
    }
    
    $stmt = $conn->query("SHOW COLUMNS FROM prompt_library LIKE 'source_type'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("ALTER TABLE prompt_library ADD COLUMN source_type VARCHAR(20) NOT NULL DEFAULT 'manual'");
    }
    
    $stmt = $conn->query("SHOW COLUMNS FROM prompt_library LIKE 'generator_meta'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("ALTER TABLE prompt_library ADD COLUMN generator_meta TEXT DEFAULT NULL");
    }
    
    echo "Migration successful.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
