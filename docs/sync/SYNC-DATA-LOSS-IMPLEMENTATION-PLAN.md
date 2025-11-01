# Sync Data Loss - Implementation Plan
**Date**: 2025-10-30
**Priority**: P0 CRITICAL
**Status**: Investigation & Fix Plan

---

## Executive Summary

**Problem**: When Device B joins an existing sync from Device A, BOTH devices lose all user data. Device A's name resets to "User" with default icon, and all activities are deleted. Device B receives no cards/activities from Device A.

**Previous Fix Attempted**: Removed sanitization in `OnboardingUserCentered.js` (lines 365-436) - **FAILED TO RESOLVE ISSUE**

**Root Cause Hypothesis**: After analyzing the code, I believe the issue is NOT in `OnboardingUserCentered.js` but in the **conflict resolution and store update flow**. Specifically:

1. **Device B joins sync** → Receives full data from Device A ✅
2. **Device B immediately pushes** → Pushes EMPTY/PARTIAL data (overwriting Device A's data) ❌
3. **Device A pulls** → Gets corrupted data from Device B ❌
4. **Result**: Both devices end up with corrupted/empty state ❌

---

## Analysis of Current Code Flow

### Join Sync Flow (Device B)

```
OnboardingUserCentered.importSyncData() (line 353)
  ↓
minimalSync.joinSync(recoveryPhrase) (line 363)
  ↓
[Server returns encrypted data]
  ↓
encryptionService.decryptData() (line 431 in minimalSync)
  ↓
OnboardingUserCentered validation (lines 372-406)
  ↓
setUsers(syncedUsers) (line 423)
  ↓
useUserStore.setUsers() (line 96 in useUserStore)
  ↓
[CRITICAL GAP: Store update triggers sync push]
  ↓
syncStoreIntegration.handleStoreChange() (line 113)
  ↓
syncStoreIntegration.pushCurrentState() (line 342)
  ↓
getCurrentState() (line 142) - READS FROM STORES
  ↓
[PROBLEM: Stores may not be fully updated yet]
  ↓
Push incomplete data to server ❌
```

### Critical Issues Identified

#### Issue #1: Race Condition in Onboarding
**Location**: `OnboardingUserCentered.js:422-429`

```javascript
// Device B sets users from sync
setUsers(syncedUsers);  // Line 423 - React setState (async)
setImportResult(result);
setUserJourney(prev => ({ ...prev, syncEnabled: true }));
await new Promise(resolve => setTimeout(resolve, 100));  // Only 100ms delay!
animateStepTransition('complete');
return;
```

**Problem**:
- `setUsers()` is a React state setter (async)
- Data is NOT immediately available in useUserStore
- Only 100ms delay before completing onboarding
- Onboarding completion may trigger sync before stores are updated

#### Issue #2: Incomplete User Data Structure
**Location**: `OnboardingUserCentered.js:372-420`

The "fixed" code validates and passes through user objects, BUT:

```javascript
const syncedUsers = Object.values(result.data.users || {})
  .filter(user => {
    // Validates id, name, icon
    // BUT: Never validates days field!
    return true;
  });
```

**Problem**:
- Validation checks `hasDays: !!u.days` (line 415) but doesn't verify structure
- Logs show the data but doesn't ensure it reaches the store correctly
- React state updates may not propagate before sync push happens

#### Issue #3: Store Update Triggers Immediate Push
**Location**: `syncStoreIntegration.js:113-136`

```javascript
handleStoreChange(field = null) {
  if (this.isSyncing) {
    return;  // Early return if syncing
  }

  // Push immediately to reduce conflicts
  this.pushCurrentState();  // Line 123 - IMMEDIATE PUSH!

  // Debounce the pull
  this.changeDebounceTimer = setTimeout(async () => {
    // Pull after delay
  }, 1000);
}
```

**Problem**:
- When `useUserStore.setUsers()` is called, it triggers `handleStoreChange()`
- `handleStoreChange()` immediately calls `pushCurrentState()`
- If React state hasn't propagated yet, `getCurrentState()` reads INCOMPLETE data
- Incomplete data gets pushed to server, overwriting Device A's data

#### Issue #4: `isSyncing` Flag Not Set During Onboarding
**Location**: `OnboardingUserCentered.js:353-451`

```javascript
const importSyncData = async () => {
  setIsImporting(true);  // Local flag, not syncStoreIntegration.isSyncing
  // ... join sync, set users ...
  // syncStoreIntegration.isSyncing is NEVER set to true!
}
```

**Problem**:
- `syncStoreIntegration.isSyncing` is used to prevent pushes during remote updates
- During onboarding import, this flag is NEVER set
- Store updates trigger immediate push even though we're importing remote data

#### Issue #5: Store Persistence Delay (AsyncStorage)
**Location**: `useUserStore.js:28-78`

```javascript
const storage = {
  setItem: async (name, value) => {
    pendingWrite = { name, value };

    // DEBOUNCED WRITE - 1 SECOND DELAY
    storageWriteTimer = setTimeout(async () => {
      // Write happens 1 second later
    }, 1000);
  }
};
```

**Problem**:
- Store writes are debounced by 1 second
- `getCurrentState()` may read stale data if called too soon
- During onboarding, this creates a window where incomplete data gets pushed

---

## Root Cause: Multi-Layered Timing Issue

The data loss is caused by a **perfect storm** of timing issues:

1. **Device B joins sync** → Receives full data from server ✅
2. **OnboardingUserCentered calls setUsers()** → React state update is async
3. **100ms delay passes** → NOT enough time for:
   - React state to propagate
   - Zustand store to update
   - AsyncStorage write to complete (1s debounce)
4. **Onboarding completes** → Navigation happens
5. **Store subscription fires** → `syncStoreIntegration.handleStoreChange()` called
6. **Push happens immediately** → `getCurrentState()` reads INCOMPLETE data
7. **Incomplete data pushed to server** → Overwrites Device A's data ❌
8. **Device A pulls** → Gets incomplete data from Device B ❌
9. **Both devices corrupted** ❌

---

## Proposed Fix Strategy

### Phase 1: Prevent Push During Onboarding Import (CRITICAL)

**File**: `src/components/Onboarding/OnboardingUserCentered/index.js`

**Change**: Set `isSyncing` flag before importing data

```javascript
// Line 353 - importSyncData function
const importSyncData = async () => {
  setIsImporting(true);
  setImportError('');

  // CRITICAL FIX: Prevent auto-push during import
  const syncIntegration = require('../../../services/sync/syncStoreIntegration').default;
  syncIntegration.isSyncing = true;  // NEW: Block all pushes during import

  try {
    if (!recoveryPhrase || recoveryPhrase.length !== 32) {
      throw new Error('Valid 32-character recovery phrase is required');
    }

    const result = await minimalSync.joinSync(recoveryPhrase);

    if (result && result.success) {
      if (result.data && result.data.users) {
        // ... existing validation code ...

        if (syncedUsers.length > 0) {
          setUsers(syncedUsers);
          setImportResult(result);
          setUserJourney(prev => ({ ...prev, syncEnabled: true }));

          // CRITICAL FIX: Wait longer for state to propagate
          await new Promise(resolve => setTimeout(resolve, 2000));  // Increase from 100ms to 2s

          animateStepTransition('complete');

          // CRITICAL FIX: Re-enable sync after delay
          setTimeout(() => {
            syncIntegration.isSyncing = false;
          }, 3000);  // 3 second grace period

          return;
        }
      }
      // ... rest of code ...
    }
  } catch (error) {
    console.error('[OnboardingSync] Error processing sync data:', error);
    syncIntegration.isSyncing = false;  // Re-enable on error
    throw new Error('Failed to import sync data. Please try again.');
  } finally {
    setIsImporting(false);
  }
}
```

**Rationale**:
- Sets `isSyncing` flag BEFORE importing data
- `handleStoreChange()` checks this flag and returns early
- Prevents ANY pushes during import process
- Waits 2 seconds for state propagation (AsyncStorage debounce is 1s)
- Re-enables sync after 3 second grace period

**Risk**: LOW - This is the safest fix. If stores don't update, Device B simply won't push (better than pushing corrupt data).

---

### Phase 2: Use Store Integration's applyState (RECOMMENDED)

**File**: `src/components/Onboarding/OnboardingUserCentered/index.js`

**Change**: Use `syncStoreIntegration.applyState()` instead of direct `setUsers()`

```javascript
// Line 422 - Instead of setUsers(syncedUsers)
if (syncedUsers.length > 0) {
  // BEFORE: Direct store update (triggers immediate push)
  // setUsers(syncedUsers);

  // AFTER: Use syncStoreIntegration.applyState (sets isSyncing automatically)
  const syncIntegration = require('../../../services/sync/syncStoreIntegration').default;

  // Convert array to object format (syncStoreIntegration expects object)
  const usersObject = {};
  syncedUsers.forEach(user => {
    usersObject[user.id] = user;
  });

  // Apply state using integration layer (automatically sets isSyncing)
  await syncIntegration.applyState({
    users: usersObject,
    library: result.data.library || {},
    settings: result.data.settings || {},
    metadata: result.data.metadata || {}
  });

  setImportResult(result);
  setUserJourney(prev => ({ ...prev, syncEnabled: true }));
  await new Promise(resolve => setTimeout(resolve, 500));
  animateStepTransition('complete');
  return;
}
```

**Rationale**:
- `applyState()` already has `isSyncing` flag management (line 192)
- Handles store updates correctly
- Includes `flushStores()` to force persistence (line 237)
- Creates backup for safety (line 240)
- Uses normalized data path

**Risk**: MEDIUM - Changes the data flow, but uses existing tested code path.

---

### Phase 3: Add Comprehensive Logging (DIAGNOSTIC)

**Files**:
- `src/services/sync/minimalSyncService.js`
- `src/services/sync/syncStoreIntegration.js`
- `src/components/Onboarding/OnboardingUserCentered/index.js`

**Logging Points**:

```javascript
// 1. minimalSyncService.js - After decryption (line 431)
console.log('[DEVICE B - DECRYPT] Received data:', {
  hasUsers: !!decodedData.users,
  userCount: Object.keys(decodedData.users || {}).length,
  sampleUser: decodedData.users ? Object.values(decodedData.users)[0] : null,
  fullStructure: JSON.stringify(decodedData).substring(0, 500)
});

// 2. OnboardingUserCentered.js - Before setUsers (line 422)
console.log('[ONBOARDING] About to set users:', {
  count: syncedUsers.length,
  users: syncedUsers.map(u => ({
    id: u.id,
    name: u.name,
    hasDays: !!u.days,
    daysKeys: u.days ? Object.keys(u.days) : [],
    todayActivities: u.days?.today?.activities?.length || 0
  }))
});

// 3. syncStoreIntegration.js - getCurrentState (line 142)
console.log('[SYNC-PUSH] Getting current state:', {
  isSyncing: this.isSyncing,
  userCount: Object.keys(useUserStore.getState().users).length,
  sampleUser: Object.values(useUserStore.getState().users)[0],
  timestamp: Date.now()
});

// 4. syncStoreIntegration.js - handleStoreChange (line 113)
console.log('[SYNC-TRIGGER] Store changed:', {
  field,
  isSyncing: this.isSyncing,
  willPush: !this.isSyncing,
  userCount: Object.keys(useUserStore.getState().users).length
});
```

**Rationale**:
- Traces exact data at each step
- Identifies WHERE data is lost
- Verifies timing of store updates vs pushes
- Confirms `isSyncing` flag behavior

---

## Implementation Steps

### Step 1: Add Diagnostic Logging (30 min)
1. Add logging points from Phase 3 above
2. Deploy to QUAL environment
3. Reproduce issue on physical devices
4. Collect logs from both devices
5. Analyze where data is lost

**Expected Outcome**: Logs will show either:
- Data missing after decryption → Server/encryption issue
- Data present but lost during setUsers → Store update issue
- Data present but push happens before store update → Timing issue (most likely)

### Step 2: Implement Phase 1 Fix (15 min)
1. Add `isSyncing` flag management to `importSyncData()`
2. Increase delay from 100ms to 2000ms
3. Add grace period before re-enabling sync
4. Keep diagnostic logging in place

**Test**:
- Deploy to QUAL
- Device A: Create user "Alice" 🎯, add 10 activities
- Device B: Join sync
- **Expected**: Device B receives all data, NO push happens during import
- **Verify**: Check logs for "isSyncing: true" during import

### Step 3: Implement Phase 2 Fix (30 min)
1. Replace `setUsers()` with `syncStoreIntegration.applyState()`
2. Convert array format to object format
3. Include all data fields (library, settings, metadata)
4. Keep logging in place

**Test**:
- Deploy to QUAL
- Same test as Step 2
- **Expected**: Data applied correctly, stores flushed, backup created
- **Verify**: Both devices show identical data

### Step 4: Verify on Physical Devices (60 min)
1. Deploy final fix to STAGE
2. Test on iPad + iPhone (STAGE environment)
3. Repeat scenario from bug report exactly:
   - Device A: Create user, add 10 morning activities
   - Device A: Create sync
   - Device B: Fresh install, join sync
4. Verify:
   - Device B receives all data ✅
   - Device A retains all data ✅
   - Both devices show identical state ✅
   - No animation lag ✅
   - Sync config persists ✅

### Step 5: Remove Diagnostic Logging (15 min)
1. Remove or comment out verbose logging
2. Keep error logging in place
3. Deploy to BETA for broader testing

---

## Testing Protocol

### Test Case 1: Basic Join Sync
**Setup**:
- Device A: Create user "Test User" with 🎯 icon
- Device A: Add 5 activities to today
- Device A: Create new sync, copy recovery phrase

**Actions**:
- Device B: Complete onboarding
- Device B: Join sync using recovery phrase

**Expected Results**:
- ✅ Device B shows "Test User" with 🎯 icon
- ✅ Device B shows all 5 activities
- ✅ Device A retains all data (no changes)
- ✅ Both devices show identical state
- ✅ Edit mode works normally on both devices

### Test Case 2: Multiple Users
**Setup**:
- Device A: Create 3 users (Alice 🎯, Bob 🚀, Carol 🌟)
- Device A: Add 3 activities to Alice's today
- Device A: Add 2 activities to Bob's today
- Device A: Create sync

**Actions**:
- Device B: Join sync

**Expected Results**:
- ✅ Device B shows all 3 users with correct icons
- ✅ Device B shows all activities for all users
- ✅ Device A unchanged
- ✅ Both devices identical

### Test Case 3: Empty User (Edge Case)
**Setup**:
- Device A: Create user "Empty" 👤
- Device A: DO NOT add any activities
- Device A: Create sync

**Actions**:
- Device B: Join sync

**Expected Results**:
- ✅ Device B shows "Empty" user
- ✅ Device B shows empty activity list (not starter cards)
- ✅ Device A unchanged

### Test Case 4: Rapid Join (Stress Test)
**Setup**:
- Device A: Create user, add 10 activities
- Device A: Create sync

**Actions**:
- Device B: Join sync
- Device C: Join sync (within 5 seconds of Device B)

**Expected Results**:
- ✅ Both Device B and C receive all data
- ✅ No devices lose data
- ✅ All 3 devices show identical state

---

## Rollback Plan

### If Phase 1 Fix Fails:
1. Revert `OnboardingUserCentered.js` changes
2. Keep diagnostic logging
3. Analyze logs to identify real root cause
4. DO NOT proceed to Phase 2 until Phase 1 works

### If Phase 2 Fix Fails:
1. Revert to Phase 1 only (simpler fix)
2. Phase 1 prevents data loss even if it's not optimal
3. Investigate `applyState()` issues separately

### Emergency Rollback:
```bash
# Revert all changes
git checkout main -- src/components/Onboarding/OnboardingUserCentered/index.js
git checkout main -- src/services/sync/syncStoreIntegration.js
git checkout main -- src/services/sync/minimalSyncService.js

# Deploy clean version
./scripts/deploy.sh qual --all
```

---

## Risk Assessment

### High Risk Areas:
1. **Timing assumptions**: If AsyncStorage debounce changes, fix may break
2. **Platform differences**: iOS vs Android vs Web may have different timing
3. **Store subscription order**: If store subscriptions fire in wrong order, partial data may be pushed

### Mitigation:
1. **Phase 1 (safest)**: Simply blocks pushes during import. If it fails, no data loss (just no sync).
2. **Phase 2 (recommended)**: Uses existing tested code path (`applyState`). If it fails, Phase 1 still protects.
3. **Logging**: Comprehensive logging identifies issues before they cause data loss.
4. **Testing**: Test on physical devices in STAGE before BETA/PROD.

### Impact on Existing Users:
- **No data migration needed**: Fix only affects new sync joins
- **Existing syncs unaffected**: Current users continue working normally
- **No breaking changes**: All APIs remain compatible

---

## Alternative Theories (Lower Priority)

### Theory A: Server Returns Incomplete Data
**Hypothesis**: Server's `join_timestamp.php` returns corrupted data

**Test**: Add logging after server response (before decryption)
```javascript
// minimalSyncService.js line 428
const result = await response.json();
console.log('[SERVER-RESPONSE] Raw result:', {
  success: result.success,
  hasRecord: !!result.latest_record,
  blobLength: result.latest_record?.encrypted_blob?.length
});
```

**If True**: Would see missing/truncated `encrypted_blob` in logs

**Likelihood**: LOW - Previous fix showed data present after decryption

---

### Theory B: Encryption/Decryption Corruption
**Hypothesis**: NaCl decryption corrupts nested structures (days field)

**Test**: Log decrypted data immediately after decryption
```javascript
// minimalSyncService.js line 431
const decodedData = encryptionService.decryptData(result.latest_record.encrypted_blob);
console.log('[DECRYPT] Raw decoded:', JSON.stringify(decodedData));
```

**If True**: Would see malformed/missing data in decoded output

**Likelihood**: LOW - Encryption service is well-tested, works for other operations

---

### Theory C: dataNormalizer Destroys Structure
**Hypothesis**: `normalizeSyncData()` removes days field

**Test**: Log before and after normalization
```javascript
// syncStoreIntegration.js line 196
const normalized = normalizeSyncData(syncedData);
console.log('[NORMALIZE] Before:', syncedData.users);
console.log('[NORMALIZE] After:', normalized.users);
```

**If True**: Would see days field present before, missing after

**Likelihood**: MEDIUM - Normalizer only touches activity fields, but worth checking

**Previous Analysis**: Examined `dataNormalizer.js` (lines 76-160) - it preserves days field in `normalizeUserDays()` function

---

## Success Criteria

### Must Have (P0):
- ✅ Device B receives ALL user data from Device A (name, icon, activities)
- ✅ Device A retains ALL original data (no changes)
- ✅ Both devices show identical state after sync join
- ✅ No animation lag or performance issues
- ✅ Works consistently across 10 test runs

### Should Have (P1):
- ✅ Comprehensive logging for future debugging
- ✅ Fix works on all platforms (iOS, Android, Web)
- ✅ Fix works with multiple users
- ✅ Fix works with empty users (edge case)

### Nice to Have (P2):
- ✅ Remove sanitization code entirely (clean up technical debt)
- ✅ Document sync flow in `/docs/sync/`
- ✅ Add automated test for sync join

---

## Timeline

### Immediate (Today - 2 hours):
- [ ] Add diagnostic logging
- [ ] Deploy to QUAL
- [ ] Reproduce issue and collect logs
- [ ] Analyze logs to confirm root cause

### Short Term (Tomorrow - 2 hours):
- [ ] Implement Phase 1 fix
- [ ] Test on QUAL
- [ ] If successful, implement Phase 2 fix
- [ ] Test on QUAL

### Medium Term (This Week - 4 hours):
- [ ] Deploy to STAGE
- [ ] Test on physical devices (iPad + iPhone)
- [ ] Verify all test cases pass
- [ ] Deploy to BETA

### Long Term (Next Week):
- [ ] Monitor BETA for issues
- [ ] Remove diagnostic logging
- [ ] Deploy to PROD
- [ ] Document fix in `/docs/sync/`

---

## Questions for Review

1. **Should we implement Phase 1 only, or go straight to Phase 2?**
   - Recommendation: Implement Phase 1 first, verify it works, then add Phase 2

2. **Should we keep sanitization removal from previous fix?**
   - Recommendation: YES - it's still a valid improvement (removes double sanitization)

3. **Should we revert conflictResolver.js changes?**
   - Recommendation: NO - the destructuring fix is defensive and low-risk

4. **How long should the grace period be?**
   - Recommendation: 3 seconds (covers AsyncStorage 1s debounce + safety margin)

5. **Should we add automated tests?**
   - Recommendation: YES, but as follow-up work (not blocking fix)

---

## Related Issues

- **Edit Mode Animation Lag**: Likely caused by repeated store updates from corrupted data. Should resolve with data fix.
- **Sync Config Loss**: Related to state corruption. May need separate fix in `SyncManagement.js`.

---

## Conclusion

**Recommended Approach**:
1. Implement Phase 1 (isSyncing flag) immediately
2. Deploy to QUAL and verify logs
3. If successful, add Phase 2 (applyState) for robustness
4. Test thoroughly on physical devices before BETA

**Confidence Level**: HIGH - Analysis clearly identifies timing race condition between store updates and sync pushes.

**Expected Outcome**: Fix will prevent Device B from pushing incomplete data during import, resolving data loss for both devices.

---

## Appendix: Code Locations

### Files to Modify:
1. `/src/components/Onboarding/OnboardingUserCentered/index.js` (lines 353-451)
2. `/src/services/sync/syncStoreIntegration.js` (lines 113-136, 142-184)
3. `/src/services/sync/minimalSyncService.js` (lines 390-521)

### Files to Monitor:
1. `/src/stores/useUserStore.js` (store update behavior)
2. `/src/services/sync/conflictResolver.js` (merge logic)
3. `/src/utils/dataNormalizer.js` (data transformation)

### Related Documentation:
1. `/docs/sync/SYNC-INVESTIGATION-HANDOFF.md` (previous session)
2. `/docs/sync/README.md` (sync system overview)
3. `/PENDING_CHANGES.md` (deployment notes)
