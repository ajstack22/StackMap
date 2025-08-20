# Pending Changes

## Title: Fix Sync API URL Issues and AsyncStorage Race Conditions

### Changes Made:

#### 1. Fixed AsyncStorage Race Condition (Root Cause of Card Reversion)
- **Issue**: Cards were reverting even with sync disabled due to race condition in debounced AsyncStorage writes
- **Fix**: Modified all store adapters to return pending write data instead of stale storage
- **Files Modified**:
  - `src/stores/useUserStore.js` - Added pendingWrite check in getItem
  - `src/stores/useSettingsStore.js` - Added pendingWrite check in getItem  
  - `src/stores/useLibraryStore.js` - Added pendingWrite check in getItem

#### 2. Implemented Simple Sync Service
- **Created**: `src/services/sync/simpleSyncService.js` - Bulletproof sync with true last-write-wins
- **Created**: `src/services/sync/index.js` - Central export to control sync implementation
- **Features**: 
  - Atomic updates (all or nothing)
  - Clear timestamp-based decisions
  - Comprehensive debug logging
  - Compatibility methods for UI components

#### 3. Fixed Simple Sync to Use Existing API
- **Issue**: Simple sync was trying to use non-existent endpoints and relative URLs
- **Fixes**:
  - Updated to use existing complex sync API endpoints (`pull.php`, `push.php`, `delete.php`)
  - Fixed API URL to always be absolute (`https://stackmap.app/api/sync`)
  - Added proper device ID parameter for API compatibility
  - Fixed verifySyncExists to use correct endpoint

### Testing Status:
- ✅ AsyncStorage race condition fixed - cards no longer revert
- ✅ Simple sync service updated with absolute URLs
- ✅ API endpoints verified working on production
- ⏳ Ready for deployment and testing

