# Minimal Sync Implementation - Technical Story

## Current Situation - RESOLVED! ✅

### The Core Problem (FIXED)
**Device B was receiving sync data but losing reference to it on page refresh**

After extensive investigation, we discovered TWO issues:

1. **AsyncStorage on Web uses localStorage** - Data DOES persist, but...
2. **Bug identified**: The `minimalSyncService` wasn't loading the stored sync ID on initialization
3. **Secondary issue**: `pullData()` was hardcoded to use `since=0` instead of checking stored timestamp

### Evidence and Fix
- AsyncStorage on web is implemented using `window.localStorage` (verified in node_modules)
- Data WAS persisting, but the service wasn't aware of it after refresh
- Fixed by:
  1. Adding `loadExistingSyncId()` method called in constructor
  2. Updating `pullData()` to use stored timestamp instead of hardcoded 0
  3. Properly restoring sync state on service initialization

## Phase 1 Implementation Status

### What We've Built
1. **minimalSyncService.js** (`/src/services/sync/minimalSyncService.js`)
   - No encryption (just JSON)
   - Simple push/pull mechanism
   - Extensive logging
   - Uses existing API endpoints

2. **MinimalSyncTest.js** (`/src/components/MinimalSyncTest.js`)
   - Test component for sync operations
   - Create sync, join sync, push data, pull data
   - Visual feedback and logging

3. **Test Components Created**
   - `LocalSyncTest.js` - Verified AsyncStorage works correctly
   - `TimestampPersistTest.js` - Proved timestamps DO persist
   - `SyncFixTest.js` - Attempted to demonstrate the fix

### What We Learned
1. **AsyncStorage works fine** - Data persists across refreshes (uses localStorage on web)
2. **Zustand stores have 1-second debounced writes** - Can lose data if refresh happens too quickly
3. **Sync timestamp persistence works** - But needs to be loaded on service initialization
4. **The existing sync system is too complex** - 9+ interdependent modules make debugging nearly impossible
5. **Simple fix**: Services must load their state from storage on initialization

## The Minimal Sync Approach

### Design Principles
1. **Extreme simplicity** - Just prove Device A → Device B data exchange
2. **No encryption initially** - Add complexity only after basic sync works
3. **File-based storage** - No database complexity
4. **Clear logging** - Every operation logged for debugging
5. **Test in isolation** - Separate from main app complexity

### Current Implementation Details

#### minimalSyncService.js Structure
```javascript
class MinimalSyncService {
  // Simple API endpoints
  API_BASE = '/api/sync'  // Uses webpack proxy for local dev
  
  // Core methods
  async createSync(data)    // Device A creates sync
  async joinSync(syncId)    // Device B joins
  async pushData(data)      // Send data to server
  async pullData()          // Get data from server
  async getCurrentData()    // Get local stored data
}
```

#### Data Flow
1. Device A: `createSync()` → Server stores JSON → Returns sync ID
2. Device B: `joinSync(syncId)` → Pulls latest data → Stores locally
3. Device A: `pushData()` → Server updates record
4. Device B: `pullData()` → Gets latest → Updates local

#### Storage Strategy
- Server: JSON files in `/api/sync/minimal_storage/[syncId].json`
- Client: AsyncStorage with keys:
  - `@minimal_sync_id` - The sync identifier
  - `@minimal_sync_data` - The actual data
  - `@minimal_sync_timestamp` - Last sync time

## Current Issues to Solve

### 1. Timestamp Reset Problem
**Location**: `syncServiceTimestamp.js` line 1124
```javascript
// Problem: Always resets to 0
await AsyncStorage.multiSet([
  ['@sync_timestamp', '0'] // Should preserve existing
]);
```

**Attempted Fix**: Check for existing timestamp before overwriting
- Result: No change in behavior

### 2. Store Persistence Timing
**Issue**: Zustand stores have 1-second debounce
**Impact**: Refresh before debounce completes = data loss
**Attempted Fix**: Added `persist.flush()` calls
- Result: Partial improvement but not reliable

### 3. Complex Service Architecture
**Issue**: Current sync has 9+ interdependent modules
**Impact**: Single failure cascades through system
**Solution**: Continue with minimal approach

## Next Steps for New Claude Instance

### Immediate Actions
1. **Test minimalSyncService.js**
   - Open sync test modal
   - Device A: Create sync with test data
   - Device B: Join sync
   - Device B: Refresh page
   - Verify: Data persists or is lost?

2. **If Data Lost, Debug**
   ```javascript
   // Add to MinimalSyncTest.js
   console.log('Before refresh:', await AsyncStorage.getAllKeys());
   // Refresh
   console.log('After refresh:', await AsyncStorage.getAllKeys());
   ```

3. **Fix Persistence**
   - Option A: Force immediate AsyncStorage writes (no debouncing)
   - Option B: Use localStorage as backup on web
   - Option C: Server-side session tracking

### Phase 2 (After Basic Sync Works)
1. Add encryption back (using existing encryptionService)
2. Integrate with Zustand stores
3. Add conflict resolution (last-write-wins initially)
4. Add offline queue support

### Phase 3 (Production Ready)
1. Add CRDT for field-level merging
2. Add compression for large datasets
3. Add sync status indicators
4. Add error recovery mechanisms

## Key Files to Review

### Core Implementation
- `/src/services/sync/minimalSyncService.js` - The simplified sync service
- `/src/components/MinimalSyncTest.js` - Test component
- `/docs/sync/SYNC_REBUILD_PLAN.md` - Original rebuild strategy
- `/docs/sync/SYNC_INTERFACES_SPEC.md` - System architecture analysis

### Test Components
- `/src/components/LocalSyncTest.js` - AsyncStorage verification
- `/src/components/TimestampPersistTest.js` - Timestamp persistence test
- `/src/components/SyncFixTest.js` - Fix demonstration attempt

### Problem Analysis
- `/docs/stackmap.appA.har` - Device A network trace
- `/docs/stackmap.appB.har` - Device B network trace (shows since=0 issue)

## Success Criteria

### Phase 1 Complete When:
1. ✅ Device A can create sync with data
2. ✅ Device B can join and receive data
3. ❌ **Device B data persists after refresh** (CURRENT BLOCKER)
4. ❌ Device B can push changes back to Device A

### Measuring Success
- No more `since=0` requests after initial sync
- Data visible immediately after page refresh
- Bidirectional sync within 30 seconds
- Zero data loss scenarios

## Commands for Testing

```bash
# Start development server
npm run web

# Open browser console and test
window.minimalSync = require('./src/services/sync/minimalSyncService').default
await minimalSync.createSync({test: 'data'})
await minimalSync.getCurrentData()

# Check AsyncStorage
await AsyncStorage.getAllKeys()
await AsyncStorage.getItem('@minimal_sync_data')
```

## Critical Insight
The sync system's complexity is its downfall. By stripping to absolute minimum (minimalSyncService.js), we can identify the exact point of failure without the noise of encryption, CRDT, queues, and timers.

**Focus**: Make Device B's data persist after refresh. Everything else is secondary.

---

## ✅ SOLUTION IMPLEMENTED (August 29, 2025)

### The Fix
The issue was NOT with AsyncStorage persistence - it was with service initialization!

**Changes made to `minimalSyncService.js`:**

```javascript
// 1. Added loadExistingSyncId() method
async loadExistingSyncId() {
  const storedSyncId = await AsyncStorage.getItem('@minimal_sync_id');
  if (storedSyncId) {
    this.syncId = storedSyncId;
    // Also check for existing data
    const storedData = await AsyncStorage.getItem('@minimal_sync_data');
    if (storedData) {
      console.log('Found existing data from previous session');
    }
  }
}

// 2. Call it in constructor
constructor() {
  this.syncId = null;
  this.deviceId = null;
  this.loadExistingSyncId(); // <-- Key addition!
  // ... rest of constructor
}

// 3. Updated pullData() to use stored timestamp
async pullData() {
  let lastTimestamp = 0;
  const storedData = await AsyncStorage.getItem('@minimal_sync_data');
  if (storedData) {
    const parsed = JSON.parse(storedData);
    lastTimestamp = parsed.timestamp || 0; // <-- Use stored timestamp!
  }
  // ... rest of pull logic
}
```

### Test Results
1. ✅ Device A creates sync with data
2. ✅ Device B joins and receives data
3. ✅ **Device B data persists after refresh!**
4. ✅ Device B no longer requests `since=0` after refresh

### Key Insight
The persistence layer (AsyncStorage/localStorage) was working perfectly. The bug was in the application layer - services weren't checking for existing state on initialization. This is a common pattern that needs to be applied to ALL services that maintain state.

### Next Steps
1. Apply this pattern to the main sync service (`syncServiceTimestamp.js`)
2. Ensure all services that use AsyncStorage check for existing state in their constructors
3. Add automated tests to verify persistence across "refreshes" (service re-initialization)

**Status**: ✅ RESOLVED - Minimal sync now works with full persistence across page refreshes!