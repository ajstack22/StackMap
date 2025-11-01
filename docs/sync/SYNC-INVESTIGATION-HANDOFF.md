# Sync Data Loss Investigation - Session Handoff

**Date**: 2025-10-30
**Session Context**: Critical data loss during sync join - attempted fix did not resolve issue
**Status**: 🔴 ISSUE NOT RESOLVED - Changes may need to be reverted

---

## 🚨 ORIGINAL ISSUE DESCRIPTION (Physical Devices - STAGE Environment)

### Reproduction Steps

1. **Device A Setup (iPad):**
   - Create user with custom name and icon (e.g., "Alice" 🎯)
   - Add 10 morning activities from the library to today's view
   - Go to Data → Sync
   - Set up a new sync (create recovery phrase)
   - Keep Device A running with sync active

2. **Device B Setup (iPhone):**
   - Fresh app install (or cleared data - "still with demo cards")
   - Complete onboarding
   - On the sync import screen, enter Device A's recovery phrase
   - Join the existing sync

### Observed Failures (ALL happening together)

#### Failure #1: Device B Data Issues
- ❌ Device B receives user name and icon correctly
- ❌ **BUT** Device B shows NO cards/activities from Device A
- ❌ When opening edit mode, Device B shows STARTER CARDS (not Device A's 10 morning activities)

#### Failure #2: Device A Data Loss (CATASTROPHIC)
- ❌ Device A's user pill changes to "User" with dog icon (default)
- ❌ Device A loses ALL 10 activities - complete wipe
- ❌ Main screen on Device A is empty (no cards)

#### Failure #3: Edit Mode Animation Slowness (Device A)
- ❌ When opening edit mode on Device A:
  - Background overlay opens quickly (normal speed)
  - Button icons and text slide up VERY slowly (severe lag)
  - Noticeable performance degradation

#### Failure #4: Sync Configuration Loss (Both Devices)
- ❌ Both devices lose sync configuration when checking Data → Sync modal
- ❌ BUT recovery phrase/keys are still present and match
- ❌ Closing and reopening the modal restores the configuration display
- ❌ However, data remains desynced

### Final State After Sync Join

**Device A (Original - iPad)**:
- User: "User" with dog icon (was "Alice" 🎯)
- Activities: 0 (was 10 morning activities)
- Access → Users modal: Shows CORRECT name
- User pill: Shows INCORRECT "User"
- Edit mode: Buttons animate slowly

**Device B (Joining - iPhone)**:
- User: Correct name in user pill
- Activities: Demo/starter cards (not Device A's cards)
- Access → Users modal: Blue box with very light font, looks different than Device A
- When editing user: Correct name appears
- Edit mode: Normal animation speed

**Data Inconsistency**: Both devices show different data despite sync being "active"

---

## 🎯 EXPECTED BEHAVIOR

1. Device B joins sync → Receives ALL of Device A's data
   - User name: "Alice" 🎯
   - Activities: All 10 morning activities in today's view
   - Settings: Any custom settings from Device A

2. Device A retains ALL of its original data
   - No changes to user name or icon
   - All 10 activities remain
   - No performance degradation

3. Both devices show IDENTICAL state
   - Same user data
   - Same activities
   - Same day structure

4. Sync configuration persists correctly on both devices

5. Edit mode animations work smoothly on both devices

---

## 📊 INVESTIGATION FINDINGS

### Session 1: Initial Investigation (INCORRECT DIAGNOSIS)

**Initial Theory**: Multiple issues:
1. Double sanitization causing user names to reset
2. Spread operator in conflict resolver overriding activities
3. Multiple store updates causing animation slowness

**Changes Made (INCORRECT FIX)**:

#### Change #1: useUserStore.js (Lines 107-118)
**File**: `/Users/adamstack/StackMap/StackMap/src/stores/useUserStore.js`

**Before**:
```javascript
if (!sanitizedUser.name || typeof sanitizedUser.name !== 'string') {
  if (typeof sanitizedUser.name === 'object' && sanitizedUser.name !== null) {
    // Try to extract string from object
    if (sanitizedUser.name.name && typeof sanitizedUser.name.name === 'string') {
      sanitizedUser.name = sanitizedUser.name.name;
    } else if (sanitizedUser.name.text && typeof sanitizedUser.name.text === 'string') {
      sanitizedUser.name = sanitizedUser.name.text;
    } else {
      sanitizedUser.name = 'User';
    }
  } else {
    sanitizedUser.name = 'User';
  }
}
```

**After**:
```javascript
// Trust dataNormalizer.js for name normalization (sync data path)
// For non-sync data, validate but preserve original value for debugging
if (!sanitizedUser.name || typeof sanitizedUser.name !== 'string') {
  console.warn(
    '[useUserStore] User name is invalid:',
    userId,
    sanitizedUser.name,
    '- should be normalized before setUsers()'
  );
  // Preserve original value rather than defaulting to 'User'
  // This allows debugging which normalization step failed
}
```

**Rationale**: Prevent useUserStore from overwriting names to "User" - log warning instead

**Likely Impact**: Minimal - this was defensive but probably not the root cause

---

#### Change #2: conflictResolver.js (Lines 328-342)
**File**: `/Users/adamstack/StackMap/StackMap/src/services/sync/conflictResolver.js`

**Before**:
```javascript
} else {
  // Merge activities for this day
  merged[day] = {
    ...localDay,
    ...remoteDay,
    activities: this.mergeActivitiesArray(
      localDay.activities || [],
      remoteDay.activities || []
    )
  };
}
```

**After**:
```javascript
} else {
  // Merge activities for this day
  // Explicitly exclude activities from spread to prevent override
  const { activities: _localAct, ...localWithoutActivities } = localDay;
  const { activities: _remoteAct, ...remoteWithoutActivities } = remoteDay;

  merged[day] = {
    ...localWithoutActivities,
    ...remoteWithoutActivities,
    // Explicitly merge activities - guaranteed not overridden by spread
    activities: this.mergeActivitiesArray(
      localDay.activities || [],
      remoteDay.activities || []
    )
  };
}
```

**Rationale**: Prevent spread operator from overriding activities array with empty array from remote

**Likely Impact**: Defensive but probably not the issue - if data is corrupted before merge, this won't help

---

#### Change #3: syncStoreIntegration.js (Lines 11, 198-238) - LATER REVERTED
**File**: `/Users/adamstack/StackMap/StackMap/src/services/sync/syncStoreIntegration.js`

**Original Change** (Session 1):
```javascript
// Added import
import { Platform, unstable_batchedUpdates } from 'react-native';

// Wrapped updates
unstable_batchedUpdates(() => {
  useUserStore.getState().setUsers(normalized.users);
  useUserStore.getState().setCurrentUser(normalized.currentUser);
  useLibraryStore.getState().setLibrary(normalized.library);
  useSettingsStore.getState().updateSettings(normalized.settings);
});
```

**Then Reverted** (Session 2):
```javascript
// Removed import
import { Platform } from 'react-native';

// Unwrapped updates (back to sequential)
if (normalized.users && typeof normalized.users === 'object') {
  useUserStore.getState().setUsers(normalized.users);
}

if (normalized.currentUser) {
  useUserStore.getState().setCurrentUser(normalized.currentUser);
}
// ... etc (sequential updates)
```

**Rationale**:
- Session 1: Batch updates to reduce re-renders and fix animation slowness
- Session 2: Animation likely a symptom of data corruption, not cause - revert complexity

**Likely Impact**: Minimal - animation fix was addressing symptom, not root cause

---

### Session 2: Deep Investigation with Explore Agent (CORRECT DIAGNOSIS)

**Root Cause Identified**: `OnboardingUserCentered.js` sanitizes sync data, destroying nested structures

**Evidence**:
```javascript
// OnboardingUserCentered.js:369-379 (BEFORE FIX)
const sanitizedUsersObj = sanitizeUsers(result.data.users);  // ❌ Destroys days field
const syncedUsers = Object.values(sanitizedUsersObj)
  .filter(user => !user.deleted)
  .map(user => sanitizeUser({           // ❌ Double sanitization
    id: user.id,
    name: user.name,
    icon: user.icon || user.emoji || '👤'
  }))  // ❌ Only 3 fields preserved, full object discarded
  .filter(user => user !== null);
```

**Problem**:
- `sanitizeUsers()` calls `sanitizeUser()` which returns: `{id, name, icon, activities: {}, settings: {}}`
- The `days` field (which contains ALL user activity history) is completely destroyed
- Then `.map()` calls `sanitizeUser()` AGAIN with only 3 fields
- Result: Complete data loss

**Data Flow**:
```
Device A: Creates sync → Server stores encrypted full data ✅
Device B: Joins → Decrypts → Gets full data ✅
Device B: OnboardingUserCentered sanitizes → DESTROYS days/activities ❌
Device B: Pushes corrupted data → Server ❌
Device A: Pulls corrupted data → LOSES everything ❌
```

---

#### Change #4: OnboardingUserCentered.js (Lines 365-436) - THE MAIN FIX
**File**: `/Users/adamstack/StackMap/StackMap/src/components/Onboarding/OnboardingUserCentered/index.js`

**Before**:
```javascript
if (result.data && result.data.users) {
  const sanitizedUsersObj = sanitizeUsers(result.data.users);
  const syncedUsers = Object.values(sanitizedUsersObj)
    .filter(user => !user.deleted)
    .map(user => sanitizeUser({
      id: user.id,
      name: user.name,
      icon: user.icon || user.emoji || '👤'
    }))
    .filter(user => user !== null);

  if (syncedUsers.length > 0) {
    setUsers(syncedUsers);
    setImportResult(result);
    setUserJourney(prev => ({ ...prev, syncEnabled: true }));
    await new Promise(resolve => setTimeout(resolve, 100));
    animateStepTransition('complete');
    return;
  }
}
```

**After**:
```javascript
if (result.data && result.data.users) {
  // CRITICAL: Do NOT sanitize sync data!
  // Sync data is TRUSTED - encrypted from user's own device
  // sanitizeUsers() destroys the days field causing catastrophic data loss
  // Only validate required fields to prevent crashes
  try {
    const syncedUsers = Object.values(result.data.users || {})
      .filter(user => {
        // Validate structure without destroying data
        if (!user || typeof user !== 'object') {
          console.warn('[OnboardingSync] Invalid user: not an object');
          return false;
        }

        // Required fields check
        if (!user.id || typeof user.id !== 'string') {
          console.warn('[OnboardingSync] Invalid user missing id:', {
            hasId: !!user.id,
            idType: typeof user.id
          });
          return false;
        }

        if (!user.name || typeof user.name !== 'string') {
          console.warn('[OnboardingSync] Invalid user missing name:', {
            userId: user.id,
            hasName: !!user.name,
            nameType: typeof user.name
          });
          return false;
        }

        // Skip deleted users
        if (user.deleted) {
          console.log('[OnboardingSync] Skipping deleted user:', user.id);
          return false;
        }

        return true;
      });

    // Log successful import for debugging
    console.log('[OnboardingSync] Successfully imported users:', {
      count: syncedUsers.length,
      users: syncedUsers.map(u => ({
        id: u.id,
        name: u.name,
        hasIcon: !!u.icon,
        hasDays: !!u.days,
        hasActivities: !!u.activities,
        daysKeys: u.days ? Object.keys(u.days) : [],
        activitiesType: typeof u.activities
      }))
    });

    if (syncedUsers.length > 0) {
      setUsers(syncedUsers);
      setImportResult(result);
      setUserJourney(prev => ({ ...prev, syncEnabled: true }));
      await new Promise(resolve => setTimeout(resolve, 100));
      animateStepTransition('complete');
      return;
    }
  } catch (error) {
    console.error('[OnboardingSync] Error processing sync data:', error);
    throw new Error('Failed to import sync data. Please try again.');
  }
}
```

**Rationale**:
- Remove `sanitizeUsers()` and `sanitizeUser()` calls entirely
- Sync data is TRUSTED (encrypted, from user's own device)
- Only validate required fields to prevent crashes
- Preserve full user object including `days`, `activities`, `settings`
- Add comprehensive logging for debugging

**Expected Impact**: This SHOULD fix the data loss issue

---

## 📋 SUMMARY OF ALL CHANGES

### Files Modified (3 files)

1. **`src/stores/useUserStore.js`** (Lines 107-118)
   - Changed name sanitization to log warning instead of overwriting to "User"
   - **Keep or Revert**: Keep - defensive, low risk

2. **`src/services/sync/conflictResolver.js`** (Lines 328-342)
   - Destructured spread to prevent activities override
   - **Keep or Revert**: Keep - defensive, low risk

3. **`src/components/Onboarding/OnboardingUserCentered/index.js`** (Lines 365-436)
   - Removed sanitization of sync data (main fix)
   - Added validation and logging
   - **Keep or Revert**: THIS IS THE KEY CHANGE - if issue persists, this approach is wrong

4. **`src/services/sync/syncStoreIntegration.js`** (Lines 11, 198-234)
   - Batched updates added, then reverted
   - **Current State**: Back to sequential updates (original)

---

## 🔄 HOW TO REVERT ALL CHANGES

### Option A: Git Revert (Clean)

```bash
# Find the commit(s) made during this session
git log --oneline -20

# Revert the commits (replace with actual commit hashes)
git revert <commit-hash-1> <commit-hash-2>

# Or reset to before the changes (DESTRUCTIVE)
git reset --hard <commit-before-changes>
```

### Option B: Manual Revert

#### Revert useUserStore.js
```javascript
// Restore lines 107-130 to original sanitization logic
if (!sanitizedUser.name || typeof sanitizedUser.name !== 'string') {
  if (typeof sanitizedUser.name === 'object' && sanitizedUser.name !== null) {
    if (sanitizedUser.name.name && typeof sanitizedUser.name.name === 'string') {
      sanitizedUser.name = sanitizedUser.name.name;
    } else if (sanitizedUser.name.text && typeof sanitizedUser.name.text === 'string') {
      sanitizedUser.name = sanitizedUser.name.text;
    } else {
      sanitizedUser.name = 'User';
    }
  } else {
    sanitizedUser.name = 'User';
  }
}
```

#### Revert conflictResolver.js
```javascript
// Restore lines 328-341 to simple spread
} else {
  merged[day] = {
    ...localDay,
    ...remoteDay,
    activities: this.mergeActivitiesArray(
      localDay.activities || [],
      remoteDay.activities || []
    )
  };
}
```

#### Revert OnboardingUserCentered.js
```javascript
// Restore lines 367-379 to original sanitization
if (result.data && result.data.users) {
  const sanitizedUsersObj = sanitizeUsers(result.data.users);
  const syncedUsers = Object.values(sanitizedUsersObj)
    .filter(user => !user.deleted)
    .map(user => sanitizeUser({
      id: user.id,
      name: user.name,
      icon: user.icon || user.emoji || '👤'
    }))
    .filter(user => user !== null);

  if (syncedUsers.length > 0) {
    setUsers(syncedUsers);
    setImportResult(result);
    setUserJourney(prev => ({ ...prev, syncEnabled: true }));
    await new Promise(resolve => setTimeout(resolve, 100));
    animateStepTransition('complete');
    return;
  }
}
```

---

## 🔍 WHAT STILL NEEDS INVESTIGATION

Since the fix didn't work, here are alternative theories to explore:

### Theory 1: Server-Side Data Corruption
**Hypothesis**: Server is storing incomplete data or returning wrong data

**Investigation Steps**:
1. Add logging to `minimalSyncService.js` AFTER decryption
2. Log the EXACT data structure received from server
3. Check if `result.data.users[userId].days` exists after decryption
4. Compare what Device A sends vs what Device B receives

**Files to Check**:
- `/Users/adamstack/StackMap/StackMap/src/services/sync/minimalSyncService.js`
- Server-side: `join_timestamp.php`, `push.php`

### Theory 2: Data Normalization Destroying Structure
**Hypothesis**: `dataNormalizer.js` is destroying the `days` field

**Investigation Steps**:
1. Check `normalizeSyncData()` in `dataNormalizer.js`
2. Add logging before and after normalization
3. Verify `normalizeUser()` preserves `days` field

**Files to Check**:
- `/Users/adamstack/StackMap/StackMap/src/utils/dataNormalizer.js` (line 76-91)
- Look for ANY code that creates empty `activities: {}` or removes `days`

### Theory 3: User Object Structure Mismatch
**Hypothesis**: Device A stores activities in a different location than Device B expects

**Investigation Steps**:
1. On Device A, log the EXACT structure before creating sync:
   ```javascript
   console.log('[Device A] Creating sync with user:', JSON.stringify(users, null, 2));
   ```
2. On Device B, log the EXACT structure after receiving sync:
   ```javascript
   console.log('[Device B] Received sync data:', JSON.stringify(result.data, null, 2));
   ```
3. Compare the structures - are they identical?

**Locations**:
- Device A: Where sync is created (SyncManagement.js or minimalSyncService.createSync)
- Device B: OnboardingUserCentered.js after minimalSync.joinSync()

### Theory 4: Stores Rejecting Valid Data
**Hypothesis**: useUserStore.setUsers() is rejecting or corrupting the data

**Investigation Steps**:
1. Add logging INSIDE useUserStore.setUsers()
2. Log the input parameter: `console.log('[useUserStore] setUsers called with:', users)`
3. Log after sanitization: `console.log('[useUserStore] After sanitization:', sanitizedUsers)`
4. Check if `days` field exists in input but missing in output

**File**: `/Users/adamstack/StackMap/StackMap/src/stores/useUserStore.js` (lines 96-149)

### Theory 5: Multiple Sync Operations Overwriting
**Hypothesis**: Device B joins, gets data, but then periodic sync immediately overwrites with empty data

**Investigation Steps**:
1. Add logging to periodic sync
2. Check if periodic sync runs immediately after join
3. Verify what data is pushed during first periodic sync after join

**File**: `/Users/adamstack/StackMap/StackMap/src/services/sync/syncStoreIntegration.js`

---

## 🎯 RECOMMENDED NEXT STEPS FOR NEW SESSION

### Phase 1: Verify Data at Each Step (30 minutes)

Add comprehensive logging at every step of the sync join flow:

1. **Device A - Before Creating Sync**:
```javascript
// In SyncManagement.js or wherever sync is created
console.log('[DEVICE A - PRE-SYNC] User data structure:', {
  users: Object.keys(useUserStore.getState().users).map(userId => {
    const user = useUserStore.getState().users[userId];
    return {
      id: userId,
      name: user.name,
      hasDays: !!user.days,
      daysKeys: user.days ? Object.keys(user.days) : [],
      sampleDay: user.days?.today ? {
        hasActivities: !!user.days.today.activities,
        activityCount: user.days.today.activities?.length || 0
      } : null
    };
  })
});
```

2. **Device A - After Encryption (Before Send)**:
```javascript
// In minimalSyncService.js createSync()
console.log('[DEVICE A - POST-ENCRYPT] Data being sent to server:', {
  dataSize: encryptedBlob.length,
  hasUsers: !!dataToEncrypt.users,
  userCount: Object.keys(dataToEncrypt.users || {}).length,
  sampleUser: dataToEncrypt.users ? Object.values(dataToEncrypt.users)[0] : null
});
```

3. **Device B - After Decryption (Before Processing)**:
```javascript
// In minimalSyncService.js joinSync() - AFTER line 431
console.log('[DEVICE B - POST-DECRYPT] Received data structure:', {
  hasUsers: !!decodedData.users,
  userCount: Object.keys(decodedData.users || {}).length,
  fullUserStructure: decodedData.users ? Object.values(decodedData.users)[0] : null
});
```

4. **Device B - After Onboarding Processing**:
```javascript
// In OnboardingUserCentered.js - Already added in our fix
// Check console logs for this
```

5. **Device B - After Store Update**:
```javascript
// In useUserStore.js setUsers() - line 148
console.log('[DEVICE B - STORE-UPDATE] Users set in store:', {
  userCount: Object.keys(users).length,
  sampleUser: Object.values(users)[0]
});
```

### Phase 2: Test with Logging (15 minutes)

1. Deploy to QUAL with all logging added
2. Reproduce the issue
3. Collect console logs from both devices
4. Identify EXACTLY where `days` field disappears

### Phase 3: Based on Findings

**If `days` is present in decrypted data but missing after onboarding**:
→ Issue is in OnboardingUserCentered.js (our fix didn't work because there's another problem)

**If `days` is missing in decrypted data**:
→ Issue is server-side or encryption-side

**If `days` is present all the way through but Device A still loses data**:
→ Issue is in conflict resolution or periodic sync

---

## 📄 SUPPORTING DOCUMENTS CREATED

1. **Story Document**: `/Users/adamstack/StackMap/StackMap/docs/stories/STORY-SYNC-DATA-LOSS-FIX-SIMPLIFIED.md`
   - Comprehensive technical story
   - Implementation plan
   - Testing strategy

2. **Pending Changes**: `/Users/adamstack/StackMap/StackMap/PENDING_CHANGES.md`
   - Deployment notes
   - Risk assessment
   - Rollback plan

3. **This Handoff**: `/Users/adamstack/StackMap/StackMap/docs/sync/SYNC-INVESTIGATION-HANDOFF.md`
   - Complete issue description
   - All changes made
   - Revert instructions

---

## 💡 KEY INSIGHTS FROM INVESTIGATION

1. **Trusted vs Untrusted Data**:
   - Sync data is encrypted from user's own device (TRUSTED)
   - Should NOT be sanitized like form input (UNTRUSTED)

2. **Sanitization Destroys Structure**:
   - `sanitizeUser()` returns only: `{id, name, icon, activities: {}, settings: {}}`
   - `days` field completely removed
   - This is BY DESIGN for form input validation

3. **Double Sanitization**:
   - OnboardingUserCentered calls `sanitizeUsers()` AND `sanitizeUser()`
   - Then only passes 3 fields to second call
   - Guaranteed data loss

4. **Conflict Resolution is Secondary**:
   - If data is already corrupted before merge, conflict resolution can't help
   - Fix the input, not the merge

5. **Animation is Likely a Symptom**:
   - Appeared at same time as data corruption
   - Components rendering with broken state
   - Fix data, animations probably fix themselves

---

## ❓ UNANSWERED QUESTIONS

1. Why didn't removing sanitization fix the issue?
2. Where exactly does the `days` field disappear?
3. Is the server storing incomplete data?
4. Is there another location where data gets sanitized/corrupted?
5. Why does Device B show starter cards instead of no cards?
6. Why does closing/reopening the sync modal restore configuration display?
7. Is there a race condition where periodic sync overwrites data immediately?

---

## 🎨 PROMPT FOR NEW SESSION

```
I'm debugging a catastrophic sync data loss issue in StackMap. When Device B joins an existing sync from Device A, BOTH devices lose all user data.

Please read the complete investigation handoff document:
/Users/adamstack/StackMap/StackMap/docs/sync/SYNC-INVESTIGATION-HANDOFF.md

Key points:
1. We attempted a fix (removing sanitization in OnboardingUserCentered.js)
2. The fix did NOT resolve the issue
3. We may need to revert changes and try a different approach
4. We need comprehensive logging to identify exactly where data is lost

Start by:
1. Reading the handoff document
2. Understanding what we tried and why it didn't work
3. Proposing a new investigation strategy with logging
4. Help me identify the REAL root cause

The issue is P0 CRITICAL - users are losing all their data during sync.
```

---

**Status**: 🔴 ISSUE UNRESOLVED
**Changes Made**: 3 files modified (may need revert)
**Next Steps**: Add comprehensive logging, identify real root cause
**Priority**: P0 - CRITICAL
