-- Database Schema for MGMP V2 (MySQL) - Revised based on Supabase Schema

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- 1. Users Table (Replaces auth.users)
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Profiles (Extends users)
CREATE TABLE `profiles` (
  `id` char(36) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `asal_sekolah` varchar(255) DEFAULT NULL,
  `pendidikan_terakhir` varchar(50) DEFAULT NULL,
  `jurusan` varchar(255) DEFAULT NULL,
  `status_kepegawaian` varchar(50) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'Anggota',
  `is_active` tinyint(1) DEFAULT 0,
  `ukuran_baju` varchar(10) DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `foto_profile` text DEFAULT NULL,
  `mapel` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mapel`)), -- JSON Array
  `kelas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`kelas`)), -- JSON Array
  `premium_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_profiles_users` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Events
CREATE TABLE `events` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `date` timestamp NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `materials_url` text DEFAULT NULL,
  `tasks_url` text DEFAULT NULL,
  `certificate_url` text DEFAULT NULL,
  `certificate_template` text DEFAULT NULL,
  `is_registration_open` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Event Participants
CREATE TABLE `event_participants` (
  `event_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `is_hadir` tinyint(1) DEFAULT 0,
  `tugas_submitted` tinyint(1) DEFAULT 0,
  `task_url` text DEFAULT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`event_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_evt_part_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_evt_part_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Learning Materials (Consolidated from learning_materials & teaching_resources)
CREATE TABLE `learning_materials` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `mapel` varchar(50) DEFAULT NULL,
  `kelas` varchar(10) DEFAULT NULL,
  `semester` varchar(10) DEFAULT NULL,
  `type` varchar(20) DEFAULT 'modul', -- modul, rpp, slide
  `file_url` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `is_premium` tinyint(1) DEFAULT 0,
  `author_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Question Banks
CREATE TABLE `question_banks` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `mapel` varchar(50) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `file_url` text DEFAULT NULL,
  `game_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`game_data`)), -- JSON
  `is_premium` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Games
CREATE TABLE `games` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `link_url` text NOT NULL,
  `image_url` text DEFAULT NULL,
  `plays_count` int(11) DEFAULT 0,
  `is_premium` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Prompt Library
CREATE TABLE `prompt_library` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `prompt_content` text NOT NULL,
  `description` text DEFAULT NULL,
  `example_result` text DEFAULT NULL,
  `example_type` varchar(20) DEFAULT 'text',
  `category` varchar(50) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)), -- JSON
  `is_premium` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Learning References
CREATE TABLE `learning_references` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(50) DEFAULT NULL, -- Buku, Simulator, Game
  `link_url` text NOT NULL,
  `cover_image` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_premium` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Premium Requests
CREATE TABLE `premium_requests` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `proof_url` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `bank_name` text DEFAULT NULL,
  `account_number` text DEFAULT NULL,
  `account_holder` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_prem_req_user` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. App Settings (Combined app_settings and site_content logic if needed, or keep separate)
-- User had app_settings separate. Let's keep both to be safe.
CREATE TABLE `app_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `site_title` varchar(255) DEFAULT 'MGMP Informatika',
  `site_description` text DEFAULT NULL,
  `logo_url` text DEFAULT NULL,
  `email` text DEFAULT NULL,
  `phone` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `bank_name` text DEFAULT NULL,
  `bank_number` text DEFAULT NULL,
  `bank_holder` text DEFAULT NULL,
  `premium_price` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Site Content
CREATE TABLE `site_content` (
  `id` int(11) NOT NULL DEFAULT 1,
  `home_hero_title` varchar(255) DEFAULT NULL,
  `home_hero_subtitle` text DEFAULT NULL,
  `home_hero_image` text DEFAULT NULL,
  `profile_visi` text DEFAULT NULL,
  `profile_misi` text DEFAULT NULL,
  `profile_sejarah` text DEFAULT NULL,
  `profile_struktur` text DEFAULT NULL,
  `contact_address` text DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_map_url` text DEFAULT NULL,
  `app_logo` text DEFAULT NULL,
  `kop_surat` text DEFAULT NULL,
  `ketua_nama` varchar(255) DEFAULT NULL,
  `ketua_nip` varchar(100) DEFAULT NULL,
  `ketua_signature_url` text DEFAULT NULL,
  `sekretaris_nama` varchar(255) DEFAULT NULL,
  `sekretaris_nip` varchar(100) DEFAULT NULL,
  `sekretaris_signature_url` text DEFAULT NULL,
  `mkks_nama` varchar(255) DEFAULT NULL,
  `mkks_nip` varchar(100) DEFAULT NULL,
  `mkks_signature_url` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Audit Logs
CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` char(36) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `target` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id` (`user_id`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Gallery Images
CREATE TABLE `gallery_images` (
  `id` char(36) NOT NULL,
  `image_url` text NOT NULL,
  `caption` text DEFAULT NULL,
  `event_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `fk_gallery_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Learning CP (Capaian Pembelajaran)
CREATE TABLE `learning_cp` (
  `id` char(36) NOT NULL,
  `mapel` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Learning TP (Tujuan Pembelajaran)
CREATE TABLE `learning_tp` (
  `id` char(36) NOT NULL,
  `mapel` varchar(255) NOT NULL,
  `kelas` varchar(255) NOT NULL,
  `semester` varchar(255) NOT NULL,
  `materi` varchar(255) DEFAULT NULL,
  `tujuan` text NOT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Letters
CREATE TABLE `letters` (
  `id` char(36) NOT NULL,
  `template_id` varchar(100) NOT NULL,
  `letter_number` varchar(255) NOT NULL,
  `letter_date` date NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `recipient` text DEFAULT NULL,
  `event_id` char(36) DEFAULT NULL,
  `author_id` char(36) DEFAULT NULL,
  `content` text NOT NULL,
  `form_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`form_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. News Articles
CREATE TABLE `news_articles` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author_id` char(36) DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Premium Settings
CREATE TABLE `premium_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `registration_fee` decimal(10,2) DEFAULT 0.00,
  `bank_name` varchar(255) DEFAULT NULL,
  `bank_account_number` varchar(255) DEFAULT NULL,
  `bank_account_name` varchar(255) DEFAULT NULL,
  `premium_features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`premium_features`)),
  `active_period_months` int(11) DEFAULT 12,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Premium Subscriptions
CREATE TABLE `premium_subscriptions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `payment_proof_url` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_prem_sub_user` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
