# Pending Changes

## Title: Fix sync network suspension errors with retry logic

### Changes Made:

1. **Enhanced Network Error Handling** (`src/services/sync/syncService.ts`)
   - Added retry logic with exponential backoff for network suspension errors
   - Handles ERR_NETWORK_IO_SUSPENDED and ERR_SOCKS_CONNECTION_FAILED errors
   - Retries up to 3 times with delays of 1s, 2s, 4s (max 8s)
   - Both pullData() and pushData() now have retry capabilities

2. **Improved Wake/Sleep Detection** (`src/services/sync/syncService.ts`)
   - Added delay after tab visibility change to let network stabilize
   - Reset network state using navigator.onLine when tab becomes visible
   - Added offline event listener to immediately update sync status
   - Clear stale network state before each sync attempt

3. **Better Network State Management** (`src/services/sync/syncService.ts`)
   - syncWithQueue() now resets network state on web platform
   - Checks navigator.onLine to ensure accurate network status
   - Prevents sync attempts when network is truly offline

### Impact:
- Fixes sync failures after computer wakes from sleep
- Eliminates ERR_NETWORK_IO_SUSPENDED errors
- Automatically retries failed syncs with smart backoff
- Provides better feedback about network status
- Improves sync reliability for users with unstable connections