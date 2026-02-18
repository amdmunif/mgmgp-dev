-- SQL Fix Script (Final Version)
-- Run this in phpMyAdmin > SQL tab

SET time_zone = '+07:00';

-- 1. Add MISSING bank columns to site_content
-- These were the ones causing the "Unknown column bank_name" error in the script
-- We use IGNORE or just run them. If they exist, it errors, but these are likely the only missing ones based on your dump.
ALTER TABLE `site_content` ADD COLUMN `bank_name` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `bank_number` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `bank_holder` text DEFAULT NULL;

-- 2. Create Premium Tables (Safe to run if they exist)
CREATE TABLE IF NOT EXISTS `premium_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `registration_fee` decimal(10,2) DEFAULT 0.00,
  `active_period_months` int(11) DEFAULT 12,
  `premium_features` longtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `premium_bank_accounts` (
  `id` char(36) NOT NULL,
  `bank_name` varchar(255) NOT NULL,
  `account_number` varchar(255) NOT NULL,
  `account_holder` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Insert Default Data for Premium Settings (Safe Insert)
INSERT INTO `premium_settings` (`id`, `registration_fee`, `active_period_months`) 
SELECT 1, 50000.00, 12 
WHERE NOT EXISTS (SELECT 1 FROM `premium_settings` WHERE `id` = 1);

-- 4. Verify Reset Password Columns (Safe Check)
-- Your dump shows these exist, but just in case:
-- ALTER TABLE `users` ADD COLUMN `reset_token` VARCHAR(255) NULL AFTER `password_hash`;
-- ALTER TABLE `users` ADD COLUMN `reset_token_expiry` DATETIME NULL AFTER `reset_token`;

SELECT "Fix Completed Successfully" as status;
