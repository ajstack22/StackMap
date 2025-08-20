# Pending Changes

## Title: Fixed AsyncStorage Race Condition Causing Card Reversion

### Root Cause Discovered:

**THE ISSUE WAS NOT SYNC!** Cards were reverting even with sync disabled. The real culprit was a **race condition in AsyncStorage debouncing**.

### The Problem:

1. All stores use a 1-second debounce for AsyncStorage writes (to prevent iOS freezing)
2. When you complete a card, the change is made in memory
3. The write to AsyncStorage is delayed by 1 second
4. During that 1 second, something (likely Zustand's persist middleware) reads from AsyncStorage
5. It gets OLD data (because the new data hasn't been written yet)
6. This old data overwrites your change

### The Fix:

Added to all stores (`useUserStore.js`, `useSettingsStore.js`, `useLibraryStore.js`):

```javascript
getItem: async name => {
  // CRITICAL FIX: If there's a pending write, return that instead of stale storage
  if (pendingWrite && pendingWrite.name === name) {
    console.log('[Store] Returning pending write instead of stale storage');
    return pendingWrite.value;
  }
  // ... rest of getItem logic
}
```

This ensures that if something tries to read from storage while a write is pending, it gets the pending (new) data instead of the stale data from storage.

### Other Changes Made (for debugging):

1. **Simple Sync Service** (`src/services/sync/simpleSyncService.js`)
   - Bulletproof sync using true last-write-wins
   - Auto-restores state on startup
   - Enhanced logging

2. **Central Sync Export** (`src/services/sync/index.js`)
   - Single control point for sync implementation
   - All components now use this

3. **State Debugger** (`src/utils/stateDebugger.js`)
   - Tracks all state changes with stack traces
   - This is what helped identify the race condition

### Testing:

After this fix, completing cards should:
1. Update immediately in the UI
2. Stay completed (no reversion after 1 second)
3. Save properly to storage

The console will show when the fix is applied:
```
[UserStore] Returning pending write instead of stale storage
```

### Why This Happened:

The 1-second debounce was added to prevent iOS freezing issues with AsyncStorage, but it created a race condition where reads could get stale data during the debounce period. This fix ensures consistency between memory and storage during the debounce window.