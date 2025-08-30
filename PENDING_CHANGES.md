# Pending Changes

## Title: Fix sync data availability issue between browsers

### Changes Made:
- Fixed `pull_timestamp.php` to allow devices to see ALL records during initial sync (since=0)
  - Initial pulls (since=0) now include records from all devices including self
  - Incremental pulls (since>0) continue to exclude own device to prevent loops
  
- Updated `join_timestamp.php` to gracefully handle empty sync groups
  - Returns success with `latest_record: null` instead of error when no data exists
  - Allows client to attempt direct pull as fallback
  
- Enhanced `minimalSyncService.js` joinSync method
  - Handles case when join_timestamp returns no data
  - Falls back to direct pull_timestamp call with since=0
  - Properly stores sync credentials even when no initial data exists

