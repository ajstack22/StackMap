# Pending Changes

## Title: Fix Sync API and AsyncStorage Race Conditions

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
- **Issue**: Simple sync was trying to use non-existent endpoints (get.php, save.php)
- **Fix**: Updated simple sync service to use existing complex sync API endpoints:
  - Now uses `/api/sync/pull.php` for fetching data
  - Now uses `/api/sync/push.php` for saving data  
  - Now uses `/api/sync/delete.php` for deleting data
- **Note**: The complex sync API is already deployed and working on production

### Testing Status:
- ✅ AsyncStorage race condition fixed - cards no longer revert
- ✅ Simple sync service working locally
- ✅ API endpoints verified working on production
- ⏳ Onboarding wizard sync join needs testing

### Next Steps:
1. Test end-to-end sync flow with onboarding wizard
2. Verify sync works across multiple devices

