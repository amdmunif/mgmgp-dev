-- backend/manual_fix_final.sql

-- 1. Set Timezone to WIB to match application expectation
SET time_zone = '+07:00';

-- 2. Add missing columns to site_content (safely)
-- We use a stored procedure to check if columns exist before adding them to avoid errors
DELIMITER //

CREATE PROCEDURE SafeAddColumn()
BEGIN
    -- Check and add bank_name
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content' AND COLUMN_NAME = 'bank_name'
    ) THEN
        ALTER TABLE site_content ADD COLUMN bank_name TEXT DEFAULT NULL;
    END IF;

    -- Check and add bank_number
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content' AND COLUMN_NAME = 'bank_number'
    ) THEN
        ALTER TABLE site_content ADD COLUMN bank_number TEXT DEFAULT NULL;
    END IF;

    -- Check and add bank_holder
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content' AND COLUMN_NAME = 'bank_holder'
    ) THEN
        ALTER TABLE site_content ADD COLUMN bank_holder TEXT DEFAULT NULL;
    END IF;
END//

DELIMITER ;

-- Execute the procedure
CALL SafeAddColumn();
-- Clean up procedure
DROP PROCEDURE SafeAddColumn;

-- 3. Create premium_settings if not exists
CREATE TABLE IF NOT EXISTS `premium_settings` (
  `id` int(11) NOT NULL PRIMARY KEY DEFAULT 1,
  `registration_fee` decimal(10,2) DEFAULT 50000.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure default row exists
INSERT IGNORE INTO `premium_settings` (`id`, `registration_fee`) VALUES (1, 50000.00);

-- 4. Create premium_bank_accounts if not exists
CREATE TABLE IF NOT EXISTS `premium_bank_accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `bank_name` varchar(100) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `account_holder` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Ensure reset_token columns exist in users (using similar safe approach or direct ALTER IGNORE if supported, but mysql doesn't support ALTER IGNORE well for columns)
-- Using the same procedure approach for Users
DELIMITER //

CREATE PROCEDURE SafeAddUserColumns()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_token'
    ) THEN
        ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_token_expiry'
    ) THEN
        ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL;
    END IF;
END//

DELIMITER ;

CALL SafeAddUserColumns();
DROP PROCEDURE SafeAddUserColumns;

-- 6. Migrate legacy data if useful (Safe INSERT IGNORE)
-- If app_settings exists and we have data we want to move:
-- This part assumes app_settings might exist. If not, it will fail, so we wrap in a block if possible or just leave it for manual check.
-- Since this is "manual_fix", we can leave this optional or commented out if unsure. 
-- However, we saw app_settings in the dump. Let's try to migrate if the table exists.

-- Actually, we can't easily check table existence in pure SQL script without procedure. 
-- Assuming site_content is the main target. We won't do complex data migration here to keep it reliable.
-- The user can re-save settings from the admin panel to populate the new columns.

SELECT "Database repair completed successfully." as status;
