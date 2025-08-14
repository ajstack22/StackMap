-- Update share_links table for zero-knowledge sharing (v2)
-- Adds version field to distinguish between legacy and encrypted shares

-- Add share_version column if it doesn't exist
ALTER TABLE share_links 
ADD COLUMN IF NOT EXISTS share_version INT DEFAULT 1 AFTER created_by_device;

-- Add auto_update column for shares that refresh automatically
ALTER TABLE share_links
ADD COLUMN IF NOT EXISTS auto_update BOOLEAN DEFAULT FALSE AFTER share_version;

-- Update index to include version for faster queries
CREATE INDEX IF NOT EXISTS idx_version ON share_links(share_version);

-- Index for finding auto-update shares
CREATE INDEX IF NOT EXISTS idx_auto_update ON share_links(user_id, auto_update, expires_at);

-- Future cleanup: After all shares expire, can remove version 1 support
-- SELECT COUNT(*) FROM share_links WHERE share_version = 1 AND expires_at > NOW();