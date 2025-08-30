# Pending Changes

## Title: Fix sync data availability between browsers - Phase 2

### Changes Made:
- Fixed `pull_timestamp.php` to allow devices to see ALL records during initial sync (since=0)
  - Initial pulls now include records from all devices including self
  - Incremental pulls continue to exclude own device to prevent loops
  
- Updated `join_timestamp.php` to gracefully handle empty sync groups
  - Returns success with `latest_record: null` instead of error
  - Allows client to attempt direct pull as fallback
  
- Enhanced `minimalSyncService.js` joinSync method
  - Handles case when join_timestamp returns no data
  - Falls back to direct pull_timestamp call with since=0
  - Properly stores sync credentials even when no initial data exists
  
- Manually copied PHP files to qual/api/sync/ directory
  - Deployment script doesn't automatically copy PHP files
  - Files now updated and ready for testing

