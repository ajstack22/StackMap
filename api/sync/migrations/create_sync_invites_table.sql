-- Create sync_invites table for secure invite code system
-- This allows sharing sync without exposing recovery phrases
-- Date: January 2025

-- Create the sync_invites table
CREATE TABLE IF NOT EXISTS sync_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invite_code VARCHAR(9) UNIQUE NOT NULL COMMENT 'Format: XXXX-XXXX',
  sync_id VARCHAR(32) NOT NULL COMMENT 'Hash of recovery phrase',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL COMMENT 'Default 24 hours from creation',
  used_at TIMESTAMP NULL COMMENT 'When invite was used',
  used_by_device VARCHAR(64) COMMENT 'Device ID that used invite',
  created_by_device VARCHAR(64) COMMENT 'Device ID that created invite',
  max_uses INT DEFAULT 1 COMMENT 'How many times invite can be used',
  use_count INT DEFAULT 0 COMMENT 'Current usage count',
  note VARCHAR(255) COMMENT 'Optional note about invite purpose',
  INDEX idx_invite_code (invite_code),
  INDEX idx_sync_id (sync_id),
  INDEX idx_expires (expires_at),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add cleanup for expired invites (optional - can be done via cron)
-- DELETE FROM sync_invites WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Example data for testing (commented out for production)
-- INSERT INTO sync_invites (invite_code, sync_id, expires_at, created_by_device, note)
-- VALUES (
--   'TEST-1234', 
--   'a1b2c3d4e5f6789012345678901234567',
--   DATE_ADD(NOW(), INTERVAL 24 HOUR),
--   'test-device-001',
--   'Test invite for development'
-- );

-- View to see active invites
CREATE OR REPLACE VIEW active_sync_invites AS
SELECT 
  invite_code,
  sync_id,
  created_at,
  expires_at,
  TIMESTAMPDIFF(HOUR, NOW(), expires_at) as hours_remaining,
  use_count,
  max_uses,
  note
FROM sync_invites
WHERE expires_at > NOW()
  AND use_count < max_uses
ORDER BY created_at DESC;

-- Summary statistics
SELECT 
  COUNT(*) as total_invites,
  SUM(CASE WHEN expires_at > NOW() AND use_count < max_uses THEN 1 ELSE 0 END) as active_invites,
  SUM(CASE WHEN use_count > 0 THEN 1 ELSE 0 END) as used_invites,
  SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired_invites
FROM sync_invites;