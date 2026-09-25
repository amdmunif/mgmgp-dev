<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Starting group tasks and evaluations migration...\n";

    // 1. Alter event_participants to add is_jury
    $sql = "ALTER TABLE `event_participants` ADD COLUMN `is_jury` tinyint(1) DEFAULT 0";
    try {
        $conn->exec($sql);
        echo "Successfully added is_jury to event_participants.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "Column is_jury already exists in event_participants. Skipping...\n";
        } else {
            throw $e;
        }
    }

    // 2. Create event_groups
    $sql = "CREATE TABLE IF NOT EXISTS `event_groups` (
      `id` char(36) NOT NULL,
      `event_id` char(36) NOT NULL,
      `name` varchar(255) NOT NULL,
      `task_url` text DEFAULT NULL,
      `is_submitted` tinyint(1) DEFAULT 0,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
    $conn->exec($sql);
    echo "Successfully created event_groups table.\n";

    // 3. Create event_group_members
    $sql = "CREATE TABLE IF NOT EXISTS `event_group_members` (
      `group_id` char(36) NOT NULL,
      `user_id` char(36) NOT NULL,
      PRIMARY KEY (`group_id`, `user_id`),
      FOREIGN KEY (`group_id`) REFERENCES `event_groups` (`id`) ON DELETE CASCADE,
      FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
    $conn->exec($sql);
    echo "Successfully created event_group_members table.\n";

    // 4. Create event_group_peer_evaluations
    $sql = "CREATE TABLE IF NOT EXISTS `event_group_peer_evaluations` (
      `id` char(36) NOT NULL,
      `evaluator_user_id` char(36) NOT NULL,
      `target_group_id` char(36) NOT NULL,
      `evaluation` enum('like', 'dislike') NOT NULL,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      FOREIGN KEY (`evaluator_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
      FOREIGN KEY (`target_group_id`) REFERENCES `event_groups` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
    $conn->exec($sql);
    echo "Successfully created event_group_peer_evaluations table.\n";

    // 5. Create lms_grade_settings
    $sql = "CREATE TABLE IF NOT EXISTS `lms_grade_settings` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `grade` varchar(2) NOT NULL,
      `points` int(11) NOT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
    $conn->exec($sql);
    echo "Successfully created lms_grade_settings table.\n";

    // Check if lms_grade_settings is empty and populate it
    $stmt = $conn->query("SELECT COUNT(*) FROM lms_grade_settings");
    if ($stmt->fetchColumn() == 0) {
        $sql = "INSERT INTO lms_grade_settings (grade, points) VALUES 
                ('A', 10), ('B', 8), ('C', 7), ('D', 5), ('E', 3)";
        $conn->exec($sql);
        echo "Successfully populated lms_grade_settings with default values.\n";
    }

    // 6. Create event_jury_group_evaluations
    $sql = "CREATE TABLE IF NOT EXISTS `event_jury_group_evaluations` (
      `id` char(36) NOT NULL,
      `jury_user_id` char(36) NOT NULL,
      `target_group_id` char(36) NOT NULL,
      `grade` varchar(2) NOT NULL,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      FOREIGN KEY (`jury_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
      FOREIGN KEY (`target_group_id`) REFERENCES `event_groups` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
    $conn->exec($sql);
    echo "Successfully created event_jury_group_evaluations table.\n";

    // 7. Create event_jury_participant_evaluations
    $sql = "CREATE TABLE IF NOT EXISTS `event_jury_participant_evaluations` (
      `id` char(36) NOT NULL,
      `jury_user_id` char(36) NOT NULL,
      `target_user_id` char(36) NOT NULL,
      `event_id` char(36) NOT NULL,
      `grade` varchar(2) NOT NULL,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      FOREIGN KEY (`jury_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
      FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
      FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
    $conn->exec($sql);
    echo "Successfully created event_jury_participant_evaluations table.\n";

    echo "Migration completed successfully!\n";

} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
