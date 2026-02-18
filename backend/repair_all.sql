-- SQL Repair Script for MGMP Informatika
-- Run this in phpMyAdmin or your MySQL client

-- 1. Set Timezone to WIB (Asia/Jakarta) for this session
SET time_zone = '+07:00';

-- 2. Ensure `users` table has reset password columns
-- We use a stored procedure trick to add columns only if they don't exist, 
-- or you can just run these (they will fail safely if column exists in some versions, 
-- but detailed checking is better). 
-- For simplicity in phpMyAdmin, we can just try to add them. If they exist, it errors but you can ignore.
-- Better approach: detailed ALTER statements.

-- Drop columns if they exist to ensure clean state (Optional, but safer to just add if missing)
-- Instead, let's just modify them to ensure they are correct.
ALTER TABLE `users` MODIFY COLUMN `reset_token` VARCHAR(255) NULL;
ALTER TABLE `users` MODIFY COLUMN `reset_token_expiry` DATETIME NULL;

-- If the above didn't error, columns exist. If they error saying "Unknown column", then run:
-- ALTER TABLE `users` ADD COLUMN `reset_token` VARCHAR(255) NULL AFTER `password_hash`;
-- ALTER TABLE `users` ADD COLUMN `reset_token_expiry` DATETIME NULL AFTER `reset_token`;


-- 3. Fix `site_content` table
-- Ensure the table exists
CREATE TABLE IF NOT EXISTS `site_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `home_hero_title` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add potentially missing columns one by one. 
-- run these lines even if you get "Duplicate column" error (it's fine).
ALTER TABLE `site_content` ADD COLUMN `home_hero_subtitle` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `home_hero_image` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `app_logo` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `profile_visi` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `profile_misi` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `profile_sejarah` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `profile_struktur` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `contact_address` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `contact_phone` varchar(50) DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `contact_email` varchar(255) DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `contact_map_url` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `kop_surat` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `ketua_nama` varchar(255) DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `ketua_nip` varchar(100) DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `ketua_signature_url` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `sekretaris_nama` varchar(255) DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `sekretaris_nip` varchar(100) DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `sekretaris_signature_url` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `mkks_nama` varchar(255) DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `mkks_nip` varchar(100) DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `mkks_signature_url` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `premium_rules` text DEFAULT NULL;

-- These are the ones likely causing your error:
ALTER TABLE `site_content` ADD COLUMN `bank_name` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `bank_number` text DEFAULT NULL;
ALTER TABLE `site_content` ADD COLUMN `bank_holder` text DEFAULT NULL;


-- 4. Create `premium_settings` table
CREATE TABLE IF NOT EXISTS `premium_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `registration_fee` decimal(10,2) DEFAULT 0.00,
  `active_period_months` int(11) DEFAULT 12,
  `premium_features` longtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Create `premium_bank_accounts` table
CREATE TABLE IF NOT EXISTS `premium_bank_accounts` (
  `id` char(36) NOT NULL,
  `bank_name` varchar(255) NOT NULL,
  `account_number` varchar(255) NOT NULL,
  `account_holder` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 6. Insert Default Data (Safe Insert)
-- Site Content Default
INSERT INTO `site_content` (`id`, `home_hero_title`) 
SELECT 1, 'MGMP Informatika' 
WHERE NOT EXISTS (SELECT 1 FROM `site_content` WHERE `id` = 1);

-- Premium Settings Default
INSERT INTO `premium_settings` (`id`, `registration_fee`, `active_period_months`) 
SELECT 1, 50000.00, 12 
WHERE NOT EXISTS (SELECT 1 FROM `premium_settings` WHERE `id` = 1);

-- 7. Verification
SELECT * FROM `site_content`;
SELECT * FROM `premium_settings`;
