# Pending Changes

## Title: Refactor Sync System to Timestamp-Based Architecture

### Changes Made:
- Complete refactor from version-based to timestamp-based sync system
- Implemented immutable append-only sync records for better reliability
- Added comprehensive protection mechanisms:
  - 60-second server-side protection for new devices
  - 61-second client-side protection (redundant safety layer)
  - Clock skew detection between client and server (5-minute tolerance)
  - Catastrophic data loss prevention (50% reduction check)
- Fixed sync ID reuse issue - now properly disables existing sync when creating new one
- Created new database schema with sync_records table for append-only storage
- Built new PHP endpoints (create_timestamp.php, push_timestamp.php, pull_timestamp.php)
- Implemented proper Last-Write-Wins (LWW) with timestamp + device_id tiebreaking
- Updated sync service index to use new timestamp implementation
- Maintains zero-knowledge encryption with deterministic sync IDs

