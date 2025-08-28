-- Fix foreign key constraint for sync_devices table
-- This fixes the issue where sync_devices references sync_data instead of sync_groups

-- Drop the incorrect foreign key constraint
ALTER TABLE sync_devices DROP FOREIGN KEY sync_devices_ibfk_1;

-- Add correct foreign key to sync_groups
ALTER TABLE sync_devices 
ADD CONSTRAINT sync_devices_ibfk_1 
FOREIGN KEY (sync_id) REFERENCES sync_groups(sync_id) 
ON DELETE CASCADE;

-- Add/modify columns to ensure they exist with proper defaults
ALTER TABLE sync_devices 
MODIFY COLUMN first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
MODIFY COLUMN push_count INT DEFAULT 0;

-- Verify the fix
SELECT 'Foreign key fixed successfully!' as Result;