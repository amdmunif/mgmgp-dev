-- Migration: Add fields for Public Training Registration
-- Run this on your MySQL/MariaDB database

-- Create training_settings table to store event price, event date, etc.
CREATE TABLE IF NOT EXISTS training_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    price_regular DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    price_premium DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) DEFAULT 1,
    header_image VARCHAR(255) DEFAULT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings if empty
INSERT INTO training_settings (event_name, event_date, price_regular, price_premium, description) 
SELECT 'Pelatihan Nasional MGMP', '2026-06-01', 150000, 100000, 'Pelatihan peningkatan kompetensi guru secara nasional.' 
WHERE NOT EXISTS (SELECT 1 FROM training_settings);

-- Create training_registrations table for public and member users
CREATE TABLE IF NOT EXISTS training_registrations (
    id VARCHAR(36) PRIMARY KEY,
    registration_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'TRX-YYYYMMDD-XXXX',
    nama_lengkap VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL,
    no_wa VARCHAR(20) NOT NULL,
    asal_sekolah VARCHAR(150) NOT NULL,
    user_id VARCHAR(36) DEFAULT NULL COMMENT 'Null if public guest, linked to users if member',
    is_premium TINYINT(1) DEFAULT 0 COMMENT '0=Reguler, 1=Premium',
    total_payment DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending|paid|failed|cancelled',
    payment_proof VARCHAR(255) DEFAULT NULL,
    invoice_path VARCHAR(255) DEFAULT NULL COMMENT 'Path to generated PDF invoice',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL DEFAULT NULL,
    verified_by VARCHAR(36) DEFAULT NULL
);

-- Add index for search optimization
CREATE INDEX idx_training_reg_email ON training_registrations(email);
CREATE INDEX idx_training_reg_code ON training_registrations(registration_code);
CREATE INDEX idx_training_reg_status ON training_registrations(payment_status);
