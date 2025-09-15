-- Migration: Create Users Table for Dev API Authentication
-- Created: 2024-01-14
-- Security Fix: Replace mock authentication with real user validation

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'developer', 'readonly') NOT NULL DEFAULT 'readonly',
    permissions JSON,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,

    -- Security indices
    INDEX idx_email (email),
    INDEX idx_active_users (is_active, role),
    INDEX idx_login_attempts (login_attempts, locked_until)
);

-- Create default admin user (password should be changed immediately)
-- Default password: 'ChangeMe123!' (hashed with bcrypt)
INSERT INTO users (id, email, password_hash, role, is_active, permissions) VALUES
('admin-001', 'admin@stackmap.dev', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN/Z3XlPgKr2QlUxQoI1.', 'admin', 1, '["read", "write", "admin", "delete"]')
ON DUPLICATE KEY UPDATE
    email = VALUES(email),
    role = VALUES(role),
    permissions = VALUES(permissions);

-- Security notes:
-- 1. Default admin password MUST be changed on first deployment
-- 2. Passwords are hashed with bcrypt (12 rounds minimum)
-- 3. Account lockout after 5 failed attempts for 30 minutes
-- 4. Regular users should be created through proper API endpoints