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
  `last_data_update` timestamp NULL DEFAULT NULL,
  `mengajar_tahun_ini` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Master Schools Directory
--
CREATE TABLE IF NOT EXISTS `master_schools` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `npsn` varchar(20) DEFAULT NULL,
  `nama` varchar(255) NOT NULL,
  `kecamatan` varchar(100) NOT NULL,
  `is_verified` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_school_nama` (`nama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 109 Master Schools Data for MGMP Informatika Wonosobo
INSERT INTO `master_schools` (`npsn`, `nama`, `kecamatan`, `is_verified`) VALUES
('70030618', 'SMP Al-Islah', 'Garung', 1),
('20341101', 'SMP Darul Falach', 'Garung', 1),
('20306775', 'SMP Ma\'arif Mlandi', 'Garung', 1),
('20306796', 'SMP Negeri 1 Garung', 'Garung', 1),
('20306849', 'SMP Negeri 2 Garung', 'Garung', 1),
('20306844', 'SMP Negeri 3 Garung', 'Garung', 1),
('20306776', 'SMP Ma\'arif Kalibawang', 'Kalibawang', 1),
('20306795', 'SMP Negeri 1 Kalibawang', 'Kalibawang', 1),
('20306848', 'SMP Negeri 2 Kalibawang', 'Kalibawang', 1),
('20306832', 'SMP Negeri 3 Kalibawang', 'Kalibawang', 1),
('20341092', 'SMP Negeri 4 Satu Atap Kalibawang', 'Kalibawang', 1),
('20360529', 'SMP Negeri 5 Satu Atap Kalibawang', 'Kalibawang', 1),
('20306794', 'SMP Negeri 1 Kalikajar', 'Kalikajar', 1),
('20306847', 'SMP Negeri 2 Kalikajar', 'Kalikajar', 1),
('20306831', 'SMP Negeri 3 Kalikajar', 'Kalikajar', 1),
('20306843', 'SMP Negeri 4 Kalikajar', 'Kalikajar', 1),
('20341088', 'SMP Negeri 5 Satu Atap Kalikajar', 'Kalikajar', 1),
('70011625', 'SMP Darussalam Islamic Boarding School', 'Kaliwiro', 1),
('20306772', 'SMP Muhammadiyah Kaliwiro', 'Kaliwiro', 1),
('20306793', 'SMP Negeri 1 Kaliwiro', 'Kaliwiro', 1),
('20306846', 'SMP Negeri 2 Kaliwiro', 'Kaliwiro', 1),
('20306830', 'SMP Negeri 3 Kaliwiro', 'Kaliwiro', 1),
('20306842', 'SMP Negeri 4 Kaliwiro', 'Kaliwiro', 1),
('20306838', 'SMP Negeri 5 Kaliwiro', 'Kaliwiro', 1),
('20341087', 'SMP Negeri 6 Satu Atap Kaliwiro', 'Kaliwiro', 1),
('20362777', 'SMP Negeri 7 Satu Atap Kaliwiro', 'Kaliwiro', 1),
('70028317', 'SMP Al-Munawaroh', 'Kejajar', 1),
('20306770', 'SMP Muhammadiyah Tieng', 'Kejajar', 1),
('20306792', 'SMP Negeri 1 Kejajar', 'Kejajar', 1),
('20306855', 'SMP Negeri 2 Kejajar', 'Kejajar', 1),
('20341090', 'SMP Negeri 3 Satu Atap Kejajar', 'Kejajar', 1),
('69930689', 'SMP Takhassus Al-Quran Sirojus Syuhada', 'Kejajar', 1),
('70047118', 'SMP Darul Ulum Gadingrejo', 'Kepil', 1),
('20306791', 'SMP Negeri 1 Kepil', 'Kepil', 1),
('20306856', 'SMP Negeri 2 Kepil', 'Kepil', 1),
('20306829', 'SMP Negeri 3 Kepil', 'Kepil', 1),
('20306841', 'SMP Negeri 4 Kepil', 'Kepil', 1),
('20306837', 'SMP Negeri 5 Kepil', 'Kepil', 1),
('20341095', 'SMP Negeri 6 Satu Atap Kepil', 'Kepil', 1),
('20360531', 'SMP Negeri 7 Satu Atap Kepil', 'Kepil', 1),
('20306768', 'SMP PGRI 3 Kepil', 'Kepil', 1),
('20306773', 'SMP Muhammadiyah Kertek', 'Kertek', 1),
('20306790', 'SMP Negeri 1 Kertek', 'Kertek', 1),
('20306865', 'SMP Negeri 2 Kertek', 'Kertek', 1),
('20306828', 'SMP Negeri 3 Kertek', 'Kertek', 1),
('20360623', 'SMP Negeri 4 Kertek', 'Kertek', 1),
('70048769', 'SMP Qur`aniyyah', 'Kertek', 1),
('70008284', 'SMP Takhassus Al Quran Al Fathoniyyah', 'Kertek', 1),
('20306771', 'SMP Muhammadiyah 3 Leksono', 'Leksono', 1),
('20306767', 'SMP Negeri 1 Leksono', 'Leksono', 1),
('20306863', 'SMP Negeri 2 Leksono', 'Leksono', 1),
('20331801', 'SMP Negeri 3 Leksono', 'Leksono', 1),
('20306779', 'SMP PGRI Leksono', 'Leksono', 1),
('69961599', 'SMP Alfa Ali Masykur', 'Mojotengah', 1),
('20306822', 'SMP Negeri 1 Mojotengah', 'Mojotengah', 1),
('20306862', 'SMP Negeri 2 Mojotengah', 'Mojotengah', 1),
('20306827', 'SMP Negeri 3 Mojotengah', 'Mojotengah', 1),
('20341093', 'SMP Nusantara', 'Mojotengah', 1),
('69978382', 'SMP Pelita Al Qur\'an', 'Mojotengah', 1),
('20306797', 'SMP Takhassus Al Quran Kalibeber', 'Mojotengah', 1),
('20360532', 'SMP Takhassus Al-Qur\'an 2', 'Mojotengah', 1),
('20306774', 'SMP Muhammadiyah Sapuran', 'Sapuran', 1),
('20306866', 'SMP Negeri 1 Sapuran', 'Sapuran', 1),
('20306861', 'SMP Negeri 2 Sapuran', 'Sapuran', 1),
('20341086', 'SMP Negeri 3 Satu Atap Sapuran', 'Sapuran', 1),
('20341505', 'SMP Negeri 4 Sapuran', 'Sapuran', 1),
('20360249', 'SMP Negeri 5 Satu Atap Sapuran', 'Sapuran', 1),
('20341319', 'SMP RIfaiyah 01 Sapuran', 'Sapuran', 1),
('70041244', 'SMP Entreprenuer Ar-Ridwan', 'Selomerto', 1),
('20306799', 'SMP Kristen Bendungan', 'Selomerto', 1),
('20306854', 'SMP Negeri 1 Selomerto', 'Selomerto', 1),
('20306860', 'SMP Negeri 2 Selomerto', 'Selomerto', 1),
('20306825', 'SMP Negeri 3 Selomerto', 'Selomerto', 1),
('20306798', 'SMP PGRI Selomerto', 'Selomerto', 1),
('69918284', 'SMP Takhassus Al-Quran An Nida Selomerto', 'Selomerto', 1),
('69774560', 'SMPS Alawiyah', 'Selomerto', 1),
('20306853', 'SMP Negeri 1 Sukoharjo', 'Sukoharjo', 1),
('20306859', 'SMP Negeri 2 Sukoharjo', 'Sukoharjo', 1),
('20306824', 'SMP Negeri 3 Sukoharjo', 'Sukoharjo', 1),
('20341091', 'SMP Negeri 4 Satu Atap Sukoharjo', 'Sukoharjo', 1),
('20360530', 'SMP Negeri 5 Satu Atap Sukoharjo', 'Sukoharjo', 1),
('20306813', 'SMP Islam Wadaslintang', 'Wadaslintang', 1),
('20306852', 'SMP Negeri 1 Wadaslintang', 'Wadaslintang', 1),
('20360528', 'SMP Negeri 10 Satu Atap Wadaslintang', 'Wadaslintang', 1),
('20306858', 'SMP Negeri 2 Wadaslintang', 'Wadaslintang', 1),
('20306833', 'SMP Negeri 3 Wadaslintang', 'Wadaslintang', 1),
('20306839', 'SMP Negeri 4 Wadaslintang', 'Wadaslintang', 1),
('20306835', 'SMP Negeri 5 Wadaslintang', 'Wadaslintang', 1),
('20306823', 'SMP Negeri 6 Wadaslintang', 'Wadaslintang', 1),
('20331693', 'SMP Negeri 7 Satu Atap Wadaslintang', 'Wadaslintang', 1),
('20350845', 'SMP Negeri 9 Satu Atap Wadaslintang', 'Wadaslintang', 1),
('20306851', 'SMP Negeri 1 Watumalang', 'Watumalang', 1),
('20306857', 'SMP Negeri 2 Watumalang', 'Watumalang', 1),
('20306834', 'SMP Negeri 3 Watumalang', 'Watumalang', 1),
('20341089', 'SMP Negeri 4 Satu Atap Watumalang', 'Watumalang', 1),
('20341506', 'SMP Negeri 5 Watumalang', 'Watumalang', 1),
('20350846', 'SMP Negeri 6 Satu Atap Watumalang', 'Watumalang', 1),
('69962891', 'SMP NU 1 Watumalang', 'Watumalang', 1),
('69895564', 'SMP Al-Madina Wonosobo', 'Wonosobo', 1),
('20306814', 'SMP Bhakti Mulia', 'Wonosobo', 1),
('20306812', 'SMP Islam Wonosobo', 'Wonosobo', 1),
('20306800', 'SMP Kristen 1 Wonosobo', 'Wonosobo', 1),
('20306769', 'SMP Muhammadiyah Wonosobo', 'Wonosobo', 1),
('20306850', 'SMP Negeri 1 Wonosobo', 'Wonosobo', 1),
('20306845', 'SMP Negeri 2 Wonosobo', 'Wonosobo', 1),
('20331802', 'SMP Negeri 3 Wonosobo', 'Wonosobo', 1),
('69856671', 'SMP Negeri 4 Wonosobo', 'Wonosobo', 1),
('20306778', 'SMP PGRI Wonosobo', 'Wonosobo', 1),
('69899426', 'SMPIT Insan Mulia Wonosobo', 'Wonosobo', 1)
ON DUPLICATE KEY UPDATE `kecamatan` = VALUES(`kecamatan`), `npsn` = VALUES(`npsn`);

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
  `maintenance_public` tinyint(1) DEFAULT 0,
  `maintenance_member` tinyint(1) DEFAULT 0,
  `maintenance_premium` tinyint(1) DEFAULT 0,
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
  `is_paid` tinyint(1) DEFAULT 0,
  `price` decimal(10,2) DEFAULT 0.00,
  `registration_deadline` datetime DEFAULT NULL,
  `attendance_deadline` datetime DEFAULT NULL,
  `has_lms` tinyint(1) DEFAULT 0,
  `quota` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `event_participants` (
  `event_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `is_hadir` tinyint(1) DEFAULT 0,
  `is_approved` tinyint(1) DEFAULT 0,
  `is_passed` tinyint(1) DEFAULT 0,
  `tugas_submitted` tinyint(1) DEFAULT 0,
  `task_url` text DEFAULT NULL,
  `payment_status` enum('free','pending','waiting_confirmation','confirmed','rejected') DEFAULT 'free',
  `payment_proof_url` text DEFAULT NULL,
  `payment_date` timestamp NULL DEFAULT NULL,
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
  `role` varchar(50) DEFAULT 'Admin',
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

CREATE TABLE `finance_transactions` (
  `id` char(36) NOT NULL,
  `type` enum('income', 'expense') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text NOT NULL,
  `reference_id` char(36) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

--
-- 11. Training & Registration System
--

CREATE TABLE IF NOT EXISTS `training_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_name` VARCHAR(255) NOT NULL,
  `event_date` TIMESTAMP NOT NULL,
  `price_regular` DECIMAL(10,2) NOT NULL,
  `price_premium` DECIMAL(10,2) NOT NULL,
  `description` TEXT,
  `is_open` TINYINT(1) DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_registrations` (
  `id` CHAR(36) PRIMARY KEY,
  `registration_code` VARCHAR(50) NOT NULL UNIQUE,
  `nama_lengkap` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `no_wa` VARCHAR(20) NOT NULL,
  `asal_sekolah` VARCHAR(255) NOT NULL,
  `user_id` CHAR(36) DEFAULT NULL,
  `is_premium` TINYINT(1) DEFAULT 0,
  `total_payment` DECIMAL(10,2) NOT NULL,
  `payment_status` ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
  `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial dummy settings
INSERT IGNORE INTO `training_settings` (`id`, `event_name`, `event_date`, `price_regular`, `price_premium`, `description`) 
VALUES (1, 'Pelatihan Perdana MGMP', '2026-10-10 08:00:00', 100000, 50000, 'Ini adalah pengaturan pelatihan publik default');

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `recipient_email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `status` ENUM('success', 'failed') NOT NULL,
  `error_message` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
