-- Complete cleanup of share_links table
-- This will remove all existing shares and start fresh

-- First, let's see what we have
SELECT COUNT(*) as total_shares, 
       SUM(CASE WHEN share_version = 1 THEN 1 ELSE 0 END) as v1_shares,
       SUM(CASE WHEN share_version = 2 THEN 1 ELSE 0 END) as v2_shares,
       SUM(CASE WHEN share_version IS NULL THEN 1 ELSE 0 END) as null_version_shares
FROM share_links;

-- Delete all existing shares
TRUNCATE TABLE share_links;

-- Now update the schema to only support V2
ALTER TABLE share_links 
MODIFY COLUMN access_token VARCHAR(255) NOT NULL,
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP NULL DEFAULT NULL AFTER last_accessed_at;

-- Make share_version required and default to 2
ALTER TABLE share_links 
MODIFY COLUMN share_version INT NOT NULL DEFAULT 2;

-- Verify the changes
DESCRIBE share_links;