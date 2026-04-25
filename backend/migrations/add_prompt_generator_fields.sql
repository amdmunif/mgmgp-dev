-- Migration: Add fields for Prompt Generator feature
-- Run this on your MySQL/MariaDB database

ALTER TABLE prompt_library 
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) DEFAULT NULL COMMENT 'User ID who created this prompt',
  ADD COLUMN IF NOT EXISTS is_published TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=visible to all premium, 0=only creator',
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) NOT NULL DEFAULT 'manual' COMMENT 'manual|generator',
  ADD COLUMN IF NOT EXISTS generator_meta TEXT DEFAULT NULL COMMENT 'Stores generator form data as JSON';

-- Index for filtering by creator
CREATE INDEX IF NOT EXISTS idx_prompt_library_created_by ON prompt_library(created_by);
CREATE INDEX IF NOT EXISTS idx_prompt_library_published ON prompt_library(is_published, source_type);
