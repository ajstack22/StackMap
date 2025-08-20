# Pending Changes

## Title: Restore Complex Sync Service (Was Trying to Fix Simple Sync)

### Changes Made:

1. **SWITCHED BACK TO COMPLEX SYNC SERVICE** - Set USE_SIMPLE_SYNC = false in index.js

2. **Created comparison document** - /docs/sync/SYNC_SERVICE_COMPARISON.md explains why simple sync failed

3. **Why this change**: After spending time fixing the "simple" sync, realized we were just recreating the complex sync piece by piece. The simple sync is now 957 lines and still missing critical features like offline support, conflict resolution, and proper device management.

4. **Previous fixes to simple sync** (now irrelevant but kept for reference):
   - Fixed key derivation to match complex sync 
   - Added initializeForPreview method
   - Fixed encryption/decryption compatibility

