# Pending Changes

## Title: Fix CRDT sync service integration issues

### Changes Made:
- Fixed missing device_id parameter in pull requests by using URL query params instead of POST body
- Added initializeForImport() method for sync import during onboarding flow
- Added retryFailed() method for SyncStatusIndicator component compatibility
- Fixed 400 errors when joining sync by properly sending required parameters
- Maintained V2 simplification - only added methods actually being called

