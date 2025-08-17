# Pending Changes

## Title: Add comprehensive sync debugging logs

### Changes Made:

1. **Enhanced Sync Logging** (`src/services/sync/syncService.ts`)
   - Added console logs to track sync initialization
   - Added logs to periodic sync setup (shows if sync is starting)
   - Added logs to syncWithQueue (shows each sync attempt)
   - Added logs to debouncedSync (shows when changes trigger sync)
   - Added logs to main sync() method (shows sync progress)

### Debug Output to Look For:
```
[Sync] ============================================
[Sync] SyncService constructor initializing...
[Sync] Starting periodic sync...
[Sync] Running immediate sync...
[Sync] Setting up 30s interval for periodic sync
[Sync] Change detected, debouncing sync (5s delay)
[Sync] Periodic sync triggered
[Sync] sync() called
[Sync] Comparing timestamps:
[Sync] Pushing full state with timestamp:
```

### Impact:
- Makes it easy to diagnose why sync isn't working
- Shows exactly when sync is triggered (or not)
- Reveals if sync is disabled, offline, or not initialized
- Helps identify network issues or configuration problems

### What to Check:
1. Do you see the constructor message on app start?
2. Do you see "Starting periodic sync" when you enable sync?
3. Do you see "Change detected" when you make changes?
4. Do you see "sync() called" every 30 seconds?

If you don't see ANY of these messages, sync isn't running at all.