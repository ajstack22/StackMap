-- Remove invite code system from StackMap sync
-- Date: 2025-10-04
-- Reason: Simplify sync to recovery phrase only (no invite codes)
-- Impact: Invite codes were never used in production

-- Step 1: Drop view (depends on table)
DROP VIEW IF EXISTS active_sync_invites;

-- Step 2: Drop table
DROP TABLE IF EXISTS sync_invites;

-- Verification query (should return 0 rows):
-- SELECT COUNT(*) FROM information_schema.TABLES
-- WHERE TABLE_SCHEMA = DATABASE()
-- AND TABLE_NAME LIKE '%invite%';
