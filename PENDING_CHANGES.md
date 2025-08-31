# Pending Changes

## Title: Fix "Malformed decodeURI input" Error in Sync

### Changes Made:
- Fixed minimalSyncService.js to properly encode URL parameters using URLSearchParams
- This prevents "Malformed decodeURI input" errors when sync IDs or device IDs contain special characters
- Fixed both pullData() and joinSync() URL construction
- Also fixed initializeEncryption() to set this.syncId for pullData to work

