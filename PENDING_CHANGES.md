# Pending Changes

## Title: Fix sync not updating with latest changes after creation

### Changes Made:

- Added immediate sync after creating new sync group to ensure current data is pushed
- Fixed `requestSync()` to accept options parameter for compatibility with useSyncOnChange hook
- Added comprehensive logging to track sync operations and identify issues
- Enhanced periodic sync timer logging to verify sync is running
- Added detailed performSync logging to identify why syncs might be skipped

### Technical Details:
- The issue was that after creating a sync, the initial data wasn't being pushed immediately
- The useSyncOnChange hook was calling requestSync with options but syncServiceV2 didn't accept parameters
- Added forced sync after creation to ensure current state is pushed to server
- Enhanced logging will help identify if syncs are running and why they might be skipped

