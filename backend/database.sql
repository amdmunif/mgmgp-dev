-- MGMP Informatika Database Schema
-- Cleaned and Optimized

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- 1. Core Users & Profiles
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `mapel` longtext DEFAULT NULL,
  `kelas` longtext DEFAULT NULL,
  `premium_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 2. System Settings & Content
--

-- Consolidating app_settings into site_content
CREATE TABLE `site_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `home_hero_title` varchar(255) DEFAULT NULL,
  `home_hero_subtitle` text DEFAULT NULL,
  `home_hero_image` text DEFAULT NULL,
  `app_logo` text DEFAULT NULL,
  `profile_visi` text DEFAULT NULL,
  `profile_misi` text DEFAULT NULL,
  `profile_sejarah` text DEFAULT NULL,
  `profile_struktur` text DEFAULT NULL,
  `contact_address` text DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_map_url` text DEFAULT NULL,
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
  `premium_rules` text DEFAULT NULL,
  -- Legacy bank fields for display reference if needed, otherwise use premium_bank_accounts
  `bank_name` text DEFAULT NULL,
  `bank_number` text DEFAULT NULL,
  `bank_holder` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `site_content` (`id`, `home_hero_title`, `updated_at`) VALUES
(1, 'MGMP Informatika', CURRENT_TIMESTAMP);

--
-- 3. Premium & Payments
--

CREATE TABLE `premium_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `registration_fee` decimal(10,2) DEFAULT 0.00,
  `active_period_months` int(11) DEFAULT 12,
  `premium_features` longtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `premium_settings` (`id`, `registration_fee`, `active_period_months`) VALUES
(1, 50000.00, 12);

CREATE TABLE `premium_bank_accounts` (
  `id` char(36) NOT NULL,
  `bank_name` varchar(255) NOT NULL,
  `account_number` varchar(255) NOT NULL,
  `account_holder` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  CONSTRAINT `premium_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `premium_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 4. Learning Management
--

CREATE TABLE `events` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  `location` varchar(255) DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `materials_url` text DEFAULT NULL,
  `tasks_url` text DEFAULT NULL,
  `certificate_url` text DEFAULT NULL,
  `certificate_template` text DEFAULT NULL,
  `is_registration_open` tinyint(1) DEFAULT 1,
  `is_premium` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `event_participants` (
  `event_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `is_hadir` tinyint(1) DEFAULT 0,
  `tugas_submitted` tinyint(1) DEFAULT 0,
  `task_url` text DEFAULT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`event_id`,`user_id`),
  CONSTRAINT `event_participants_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `prompt_library` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `prompt_content` text NOT NULL,
  `description` text DEFAULT NULL,
  `example_result` text DEFAULT NULL,
  `example_type` varchar(20) DEFAULT 'text',
  `category` varchar(50) DEFAULT NULL,
  `tags` longtext DEFAULT NULL,
  `is_premium` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `learning_materials` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `mapel` varchar(50) DEFAULT NULL,
  `kelas` varchar(10) DEFAULT NULL,
  `semester` varchar(10) DEFAULT NULL,
  `type` varchar(20) DEFAULT 'modul',
  `file_url` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `is_premium` tinyint(1) DEFAULT 0,
  `author_id` char(36) DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `link_url` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `learning_materials_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `learning_references` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `link_url` text NOT NULL,
  `cover_image` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_premium` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `learning_cp` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `mapel` enum('Informatika','KKA') NOT NULL,
  `content` text DEFAULT NULL,
  `materi` text DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `learning_tp` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `code` varchar(50) DEFAULT NULL,
  `mapel` enum('Informatika','KKA') NOT NULL DEFAULT 'Informatika',
  `kelas` enum('7','8','9') NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `materi` varchar(255) NOT NULL,
  `tujuan` text NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `question_banks` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `mapel` varchar(50) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `file_url` text DEFAULT NULL,
  `game_data` longtext DEFAULT NULL,
  `is_premium` tinyint(1) DEFAULT 1,
  `status` enum('draft','pending','verified','rejected') DEFAULT 'verified',
  `reviewer_notes` text DEFAULT NULL,
  `creator_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `creator_id` (`creator_id`),
  CONSTRAINT `question_banks_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `questions` (
  `id` char(36) NOT NULL,
  `content` longtext NOT NULL,
  `type` enum('single_choice','multiple_choice','true_false','match','essay','short_answer') NOT NULL,
  `options` longtext DEFAULT NULL,
  `answer_key` longtext DEFAULT NULL,
  `explanation` longtext DEFAULT NULL,
  `level` enum('Mudah','Sedang','Sukar') DEFAULT 'Sedang',
  `mapel` varchar(255) DEFAULT NULL,
  `kelas` varchar(50) DEFAULT NULL,
  `tags` longtext DEFAULT NULL,
  `creator_id` char(36) NOT NULL,
  `status` enum('draft','pending','verified','rejected') DEFAULT 'draft',
  `tp_code` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 5. System Tables
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` char(36) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `target` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `news_articles` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author_id` char(36) DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `form_data` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `gallery_images` (
  `id` char(36) NOT NULL,
  `image_url` text NOT NULL,
  `caption` text DEFAULT NULL,
  `event_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `contributor_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` char(36) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `applied_at` timestamp NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `contributor_applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;
