# Pending Changes

## Title: Clean Timestamp-Only Schema Implementation

### Changes Made:
- Rewrote all timestamp PHP endpoints to use ONLY the timestamp schema
- Removed all compatibility hacks for mixed database schema
- Created proper references to sync_groups table throughout
- Added proper device protection with first_seen and push_count columns
- Created migration script for database admin to fix foreign key constraints
- All endpoints now expect proper timestamp schema tables with correct structure

