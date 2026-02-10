-- Migration for Contributor System
-- Run this in your MySQL Database Manager

ALTER TABLE question_banks
ADD COLUMN creator_id CHAR(36) NULL,
ADD COLUMN status ENUM('draft', 'pending', 'verified', 'rejected') DEFAULT 'verified',
ADD COLUMN reviewer_notes TEXT NULL;

CREATE TABLE IF NOT EXISTS contributor_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
