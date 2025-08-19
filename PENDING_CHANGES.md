# Pending Changes

## Title: Fix Sync Issues - Debug Logging for Sync ID Generation

### Changes Made:
1. **Added debug logging to syncService.js**:
   - Added console logs to `generateSyncId()` to track sync ID generation process
   - Added console logs to `pullData()` to show the exact URL and sync ID being used
   - This will help debug why sync codes created on web aren't working on iPhone

2. **Created test scripts**:
   - `test_sync_nacl.js` - Uses the correct NaCl-based hashing to verify sync IDs
   - Confirmed sync code `cb3f47f1e78dc3ef0a5604906035a09f` generates ID `598303ac749d02e424f0e0325a8b67db`
   - Verified the sync exists on server with 261 versions

