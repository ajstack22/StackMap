# Pending Changes

## Title: Add AppState listener for mobile sync triggers

### Changes Made:
- Added AppState listener to trigger sync when mobile app comes to foreground
- Added triggerSync() method to syncStoreIntegration for manual sync
- Mobile apps now sync immediately when returning from background
- Fixes issue where mobile apps only synced on 30-second intervals

