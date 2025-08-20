# Pending Changes

## Title: Fix Sync Overwriting Local Changes

### Changes Made:

1. **Fixed Race Condition in Sync Service** (`src/services/sync/syncService.js`)
   - Added `lastPushTime` tracking to prevent pulling immediately after pushing
   - Skip pull if we pushed within last 2 seconds (prevents overwriting our own changes)
   - Properly update `lastSyncVersion` after push to match server version
   - Include `current_version` in pull requests for server-side optimization
   - Store version immediately after push to prevent version mismatch

2. **Root Cause**
   - Settings were getting overwritten because sync was pulling immediately after pushing
   - The rapid pull-push-pull cycle caused the server version to overwrite local changes
   - Timestamps were too close together, causing conflict resolution to choose wrong version

### How It Works Now:
1. When you make a change, it syncs after 10 seconds (debounced)
2. After pushing changes, we track the push time
3. If another sync happens within 2 seconds, we skip the pull phase
4. This prevents the "sync reverting my changes" problem
5. Version tracking ensures we don't pull data we just pushed

### Testing:
- Change a setting (theme, banner position, etc.)
- Wait 10 seconds for auto-sync
- Setting should persist and not revert
- Check other devices - they should receive the update