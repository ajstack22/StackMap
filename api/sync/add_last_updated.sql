-- Add last_updated_at column to track when shares are updated
ALTER TABLE share_links 
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP NULL DEFAULT NULL AFTER last_accessed_at;

-- Update existing shares to have last_updated_at same as created_at
UPDATE share_links 
SET last_updated_at = created_at 
WHERE last_updated_at IS NULL;