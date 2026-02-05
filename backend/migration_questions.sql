-- Migration for Advanced Question Bank (Individual Repository)

-- New Table: questions
CREATE TABLE IF NOT EXISTS `questions` (
  `id` char(36) NOT NULL,
  `content` longtext NOT NULL, -- WYSIWYG Content
  `type` enum('single_choice','multiple_choice','true_false','match','essay','short_answer') NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `answer_key` longtext DEFAULT NULL,
  `explanation` longtext DEFAULT NULL,
  `level` enum('Mudah','Sedang','Sukar') DEFAULT 'Sedang',
  `mapel` varchar(255) DEFAULT NULL,
  `kelas` varchar(50) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `creator_id` char(36) NOT NULL,
  `status` enum('draft','pending','verified','rejected') DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`creator_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
