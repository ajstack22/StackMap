-- StackMap Sync Database Setup
-- This creates all necessary tables for the sync feature
-- 
-- IMPORTANT: Before running this:
-- 1. Select your database from the dropdown in phpMyAdmin
-- 2. Then run this script
-- 
-- This version doesn't include the USE statement to avoid permission errors

-- 1. Main sync data table
-- Stores encrypted data blobs for each sync group
CREATE TABLE IF NOT EXISTS sync_data (
  sync_id VARCHAR(36) PRIMARY KEY,
  encrypted_blob LONGBLOB NOT NULL,
  recovery_salt VARCHAR(32) NOT NULL,
  version INT DEFAULT 1,
  device_count INT DEFAULT 1,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_last_modified (last_modified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Device tracking table
-- Tracks which devices are part of each sync group
CREATE TABLE IF NOT EXISTS sync_devices (
  device_id VARCHAR(36) PRIMARY KEY,
  sync_id VARCHAR(36) NOT NULL,
  device_name VARCHAR(100),
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sync_id) REFERENCES sync_data(sync_id) ON DELETE CASCADE,
  INDEX idx_sync_id (sync_id),
  INDEX idx_last_seen (last_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Metrics table (privacy-respecting)
-- Anonymous usage metrics for monitoring
CREATE TABLE IF NOT EXISTS sync_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event VARCHAR(50) NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_date (event, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Rate limiting table
-- Prevents abuse by tracking request rates
CREATE TABLE IF NOT EXISTS rate_limits (
  identifier VARCHAR(255) PRIMARY KEY,
  endpoint VARCHAR(100) NOT NULL,
  request_count INT DEFAULT 0,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_endpoint (endpoint),
  INDEX idx_window_start (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Pairing sessions table (optional but recommended)
-- Temporary storage for QR code pairing sessions
CREATE TABLE IF NOT EXISTS pairing_sessions (
  channel_id VARCHAR(36) PRIMARY KEY,
  channel_key_hash VARCHAR(64) NOT NULL,
  initiated_by VARCHAR(36),
  expires_at TIMESTAMP NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create a stored procedure to clean up expired pairing sessions
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS cleanup_expired_sessions()
BEGIN
  DELETE FROM pairing_sessions WHERE expires_at < NOW();
  DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 HOUR);
END$$
DELIMITER ;

-- Verify tables were created
SHOW TABLES;