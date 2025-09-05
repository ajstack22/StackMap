-- Database migration for secure share URLs
-- Run this before deploying the V3 share implementation
-- Date: January 2025

-- Check if share_id column already exists (for safety)
-- Note: This syntax works for MySQL. Adjust for other databases.

-- Add share_id column if it doesn't exist
-- The share_id is shorter (16 chars) for cleaner URLs
ALTER TABLE share_links 
ADD COLUMN IF NOT EXISTS share_id VARCHAR(32) AFTER id;

-- Create index on share_id for fast lookups
ALTER TABLE share_links 
ADD INDEX IF NOT EXISTS idx_share_id (share_id);

-- Update existing shares to have a share_id based on their token
-- For existing V2 shares, use first 16 chars of token as share_id
UPDATE share_links 
SET share_id = LEFT(MD5(CONCAT(access_token, id)), 16)
WHERE share_id IS NULL OR share_id = '';

-- Make share_id unique going forward (after populating existing)
-- Note: Run this only after confirming all rows have share_id
-- ALTER TABLE share_links 
-- ADD UNIQUE INDEX idx_share_id_unique (share_id);

-- Optional: Add share_version column if it doesn't exist
-- This helps track which format each share uses
ALTER TABLE share_links 
ADD COLUMN IF NOT EXISTS share_version INT DEFAULT 2 AFTER share_id;

-- Mark all existing shares as version 2
UPDATE share_links 
SET share_version = 2 
WHERE share_version IS NULL;

-- Optional: Create a view for easier querying of V3 shares
CREATE OR REPLACE VIEW v3_shares AS
SELECT 
    share_id,
    encrypted_data,
    recipient_name,
    share_note,
    expires_at,
    accessed_count,
    created_at,
    last_accessed_at
FROM share_links
WHERE share_version = 3
AND expires_at > NOW();

-- Cleanup: Remove expired shares older than 30 days
DELETE FROM share_links 
WHERE expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Display migration summary
SELECT 
    COUNT(*) as total_shares,
    SUM(CASE WHEN share_version = 2 THEN 1 ELSE 0 END) as v2_shares,
    SUM(CASE WHEN share_version = 3 THEN 1 ELSE 0 END) as v3_shares,
    SUM(CASE WHEN share_id IS NULL THEN 1 ELSE 0 END) as missing_share_id
FROM share_links;