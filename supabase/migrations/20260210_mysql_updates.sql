-- 1. Add Code Column to Learning Materials
-- Note: Removing 'public.' prefix because MySQL treats it as a database name
ALTER TABLE learning_materials 
ADD COLUMN code VARCHAR(50);

-- 2. Create Questions Table (if not exists)
CREATE TABLE IF NOT EXISTS questions (
    id CHAR(36) PRIMARY KEY, -- Changed from UUID to CHAR(36) for MySQL
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, 
    options JSON, -- Changed from JSONB to JSON
    answer_key TEXT, 
    explanation TEXT,
    level VARCHAR(20), 
    mapel VARCHAR(50) NOT NULL,
    kelas VARCHAR(10) NOT NULL,
    tp_id CHAR(36), -- Reference to Learning Material (TP)
    tp_code VARCHAR(50), 
    creator_id CHAR(36),
    creator_name TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Cleanup Unused Tables
DROP TABLE IF EXISTS learning_cp;
DROP TABLE IF EXISTS learning_tp;
DROP TABLE IF EXISTS teaching_resources;

-- (RLS and Policies sections are removed as they are specific to Supabase/Postgres)
