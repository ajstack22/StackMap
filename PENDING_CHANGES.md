# Pending Changes

## Title: Debug Why Sync Service Never Initializes

### Changes Made:

#### 1. Fixed Sync Service Initialization Race Condition
**Problem:** Sync state was being lost immediately when leaving and re-entering DataModal, not even requiring a page refresh. The `isEnabled()` method was returning false because the service hadn't finished initializing.

**Solution:** 
- Modified `isEnabled()` to wait for initialization before returning status
- Added initialization promise to prevent multiple concurrent initializations
- Added logging to track when `isEnabled()` is called before initialization

**Files Modified:**
- src/services/sync/syncServiceSimple.ts
  - Lines 624-632: Modified `isEnabled()` to wait for initialization
  - Lines 68-69: Added `initializationPromise` property
  - Lines 87-100: Refactored `initialize()` to prevent concurrent initialization
  - Added `_doInitialize()` private method for actual initialization logic

**Technical Details:**
- DataModal calls `checkSyncStatus()` every time it becomes visible
- This was calling `syncService.isEnabled()` before the service had initialized
- The service would return `false`, causing DataModal to reset the sync state
- Now `isEnabled()` ensures initialization completes before returning the actual state

#### 2. Added Comprehensive Initialization Debugging
**Problem:** Sync service may not be initializing at all, which would explain why sync state is never restored.

**Solution:** Added extensive console.warn logging (using 🚨 emoji for visibility) to track:
- Singleton creation
- Constructor execution  
- Initialize method calls
- AsyncStorage reads
- Initialization completion/failure

**New Debug Points:**
- `[Sync] 🚨 Creating SimpleSyncService singleton...`
- `[Sync] 🚨 SimpleSyncService constructor called at [timestamp]`
- `[Sync] 🚨 Calling initialize()...`
- `[Sync] 🚨 _doInitialize started`
- `[Sync] 🚨 Reading from AsyncStorage...`
- `[Sync] 🚨 Restored state from AsyncStorage: [state]`
- `[Sync] 🚨 _doInitialize COMPLETED successfully`
- `[Sync] 🚨 Initialize completed, state: [state]`
- `[Sync] isEnabled called before initialization, waiting...`
- `[Sync] isEnabled returning: [true/false]`

**Expected Output:** Should see the 🚨 messages in console showing initialization flow. If these don't appear, the service isn't being created/initialized at all.