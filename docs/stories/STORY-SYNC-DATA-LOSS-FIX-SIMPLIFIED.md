# STORY: Fix Catastrophic Sync Data Loss - Simplified Approach

**Story ID**: SYNC-CRITICAL-001-SIMPLIFIED
**Priority**: P0 - CRITICAL
**Type**: Bug Fix - Data Loss
**Estimated Effort**: 15-30 minutes
**Risk Level**: LOW (minimal code change, high test coverage)

---

## Executive Summary

**Problem**: Device B joining sync destroys all user data (activities, days) on both devices due to aggressive sanitization of TRUSTED sync data.

**Root Cause**: OnboardingUserCentered.js sanitizes data received from sync server as if it were untrusted user input, destroying nested structures.

**Solution**: Remove sanitization from sync import path. Sync data is TRUSTED (encrypted, from user's own device). Only sanitize UNTRUSTED form input.

**Impact**: 3-line code change, zero new functions, minimal risk.

---

## Problem Statement

### Current Broken Flow

```
Device A: User + 10 activities → Creates sync → Server stores encrypted data ✅
Device B: Joins sync → Receives encrypted data → Decrypts successfully ✅
Device B: Onboarding calls sanitizeUsers() → 💥 DESTROYS activities/days
Device B: Sets corrupted data to stores → Pushes back to server
Device A: Pulls corrupted data → 💥 LOSES all activities
Result: Complete data loss on both devices
```

### Root Cause (OnboardingUserCentered.js:369-379)

```javascript
// BROKEN CODE:
const sanitizedUsersObj = sanitizeUsers(result.data.users);  // ❌ Destroys nested data
const syncedUsers = Object.values(sanitizedUsersObj)
  .filter(user => !user.deleted)
  .map(user => sanitizeUser({           // ❌ Double sanitization
    id: user.id,
    name: user.name,
    icon: user.icon || user.emoji || '👤'
  }))  // ❌ Only passes 3 fields, discards full object
  .filter(user => user !== null);
```

**Why This is Wrong**:
- `sanitizeUsers()` is for UNTRUSTED form input (new user creation)
- Sync data is TRUSTED - it came from user's own device, encrypted correctly
- Sanitization destroys `days`, `activities`, `settings` fields
- Data that was complete becomes empty

---

## Solution: Remove Sanitization for Trusted Sync Data

### The Fix (3 Lines)

**File**: `src/components/Onboarding/OnboardingUserCentered/index.js`

**Change lines 369-379**:

```javascript
// BEFORE (BROKEN):
const sanitizedUsersObj = sanitizeUsers(result.data.users);
const syncedUsers = Object.values(sanitizedUsersObj)
  .filter(user => !user.deleted)
  .map(user => sanitizeUser({
    id: user.id,
    name: user.name,
    icon: user.icon || user.emoji || '👤'
  }))
  .filter(user => user !== null);

// AFTER (FIXED):
const syncedUsers = Object.values(result.data.users || {})
  .filter(user => user && !user.deleted);
```

**That's it. 3 lines. No sanitization.**

### Why This Works

1. **Data is Already Valid**: Created on Device A using proper validation
2. **Encryption Guarantees Integrity**: Data hasn't been tampered with
3. **Sync Service Validates**: minimalSyncService checks data structure
4. **Stores Normalize**: useUserStore.setUsers() already handles normalization if needed

### What We're NOT Doing

❌ Creating new `sanitizeUserForSync()` function (unnecessary)
❌ Adding validation layers (over-engineering)
❌ Adding conflict resolution guards (wrong problem)
❌ Adding 200+ lines of defensive code (security risk)

---

## Additional Safety: Minimal Null Checks

Add lightweight null checks without sanitization:

```javascript
const syncedUsers = Object.values(result.data.users || {})
  .filter(user => {
    if (!user) return false;
    if (!user.id || !user.name) {
      console.warn('[OnboardingSync] Invalid user missing required fields:', user);
      return false;
    }
    return !user.deleted;
  });

console.log('[OnboardingSync] Imported users:', syncedUsers.map(u => ({
  id: u.id,
  name: u.name,
  hasActivities: !!u.activities,
  hasDays: !!u.days
})));
```

**Total change**: 10 lines (removing 10, adding 10).

---

## Revert Previous "Fixes"

The earlier comprehensive approach made changes that are now unnecessary:

### Revert #1: useUserStore.js sanitization removal
**File**: `src/stores/useUserStore.js:107-118`

**Revert to original**:
```javascript
// Restore original sanitization (this is for FORM INPUT, not sync)
if (!sanitizedUser.name || typeof sanitizedUser.name !== 'string') {
  if (typeof sanitizedUser.name === 'object' && sanitizedUser.name !== null) {
    // Extract from object
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

**Why**: This sanitization is CORRECT for form input. The bug was using it on sync data.

### Revert #2: conflictResolver.js spread operator fix
**File**: `src/services/sync/conflictResolver.js:328-342`

**Revert to original**:
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

**Why**: This was a red herring. The real issue is that remoteDay has empty activities DUE TO SANITIZATION. Fix the sanitization, and this merge works fine.

### Revert #3: syncStoreIntegration.js batched updates
**File**: `src/services/sync/syncStoreIntegration.js:11,198-238`

**Revert to original** (remove `unstable_batchedUpdates`):
```javascript
// Remove import
// Remove wrapping unstable_batchedUpdates()

// Return to sequential updates:
if (normalized.users && typeof normalized.users === 'object') {
  useUserStore.getState().setUsers(normalized.users);
}

if (normalized.currentUser) {
  useUserStore.getState().setCurrentUser(normalized.currentUser);
}
// ... etc
```

**Why**: Animation slowness is likely a symptom of data corruption (re-rendering with broken state), not the cause. Fix the data, animations will be fine.

---

## Testing Strategy

### Unit Test
```javascript
// src/components/Onboarding/__tests__/OnboardingUserCentered.test.js

test('importSyncData preserves full user structure', async () => {
  const mockSyncData = {
    users: {
      user1: {
        id: 'user1',
        name: 'Alice',
        icon: '🎯',
        days: {
          today: {
            activities: [
              {id: 'a1', text: 'Morning run'},
              {id: 'a2', text: 'Breakfast'}
            ]
          }
        },
        settings: {
          theme: 'light'
        }
      }
    }
  };

  minimalSync.joinSync.mockResolvedValue({
    success: true,
    data: mockSyncData
  });

  const result = await importSyncData('test-phrase');

  // Verify full structure preserved
  expect(result.users[0].days).toBeDefined();
  expect(result.users[0].days.today.activities).toHaveLength(2);
  expect(result.users[0].settings).toEqual({theme: 'light'});
});
```

### Manual Test Protocol

**Test 1: Basic Sync Join**
```
Setup:
1. Device A: Create user "Alice" 🎯 + 10 activities
2. Device A: Data → Sync → Create New Sync
3. Device B: Onboarding → Join Existing Sync

Verify:
✅ Device B shows user "Alice" 🎯
✅ Device B shows all 10 activities
✅ Device A retains all data
✅ Both devices identical
```

**Test 2: No Regression on New User Creation**
```
Setup:
1. Device C: Fresh install → Onboarding → Create New User

Verify:
✅ New user creation still works
✅ Form validation still works
✅ No sync data involved
```

**Test 3: Periodic Sync After Join**
```
Setup:
1. Complete Test 1
2. Wait 60 seconds for periodic sync
3. Check both devices

Verify:
✅ No data loss
✅ Both devices still in sync
```

---

## Risk Assessment

### Risks (VERY LOW)

1. **Malformed Sync Data from Server**
   - **Likelihood**: Very low (encryption prevents tampering)
   - **Mitigation**: Minimal null checks
   - **Impact**: User sees error, can retry

2. **Breaking New User Creation**
   - **Likelihood**: Zero (different code path)
   - **Mitigation**: Test both paths
   - **Impact**: None

3. **Missing Edge Case**
   - **Likelihood**: Low (fixing root cause, not symptoms)
   - **Mitigation**: Comprehensive testing
   - **Impact**: Easy to patch

### Why This is Safe

- ✅ Minimal code change (3 lines)
- ✅ Clear separation: sync data vs form input
- ✅ Easy to understand and review
- ✅ Easy to revert if needed
- ✅ No new attack surface
- ✅ No performance impact

---

## Rollback Plan

### If Issues Arise

**Immediate Rollback** (1 minute):
```bash
git revert <commit-hash>
./scripts/deploy.sh stage --all
```

**Selective Fix** (5 minutes):
Add back minimal sanitization with structure preservation:
```javascript
const syncedUsers = Object.values(result.data.users || {})
  .filter(user => user && !user.deleted)
  .map(user => ({
    ...user,  // Keep everything
    name: typeof user.name === 'string' ? user.name : 'User',
    icon: user.icon || user.emoji || '👤'
  }));
```

---

## Implementation Checklist

### Code Changes (15 minutes)
- [ ] Revert useUserStore.js changes (restore original sanitization)
- [ ] Revert conflictResolver.js changes (restore original spread)
- [ ] Revert syncStoreIntegration.js changes (remove batched updates)
- [ ] Update OnboardingUserCentered.js:369-379 (remove sanitization)
- [ ] Add minimal null checks with logging

### Testing (15 minutes)
- [ ] Write unit test for importSyncData
- [ ] Manual Test 1: Basic sync join ✅
- [ ] Manual Test 2: New user creation (regression) ✅
- [ ] Manual Test 3: Periodic sync ✅
- [ ] Run full test suite

### Documentation (5 minutes)
- [ ] Update PENDING_CHANGES.md
- [ ] Add comment explaining why sync data isn't sanitized
- [ ] Document the distinction: TRUSTED vs UNTRUSTED data

### Deployment (30 minutes)
- [ ] Deploy to QUAL
- [ ] Manual testing on physical devices
- [ ] Verify fix
- [ ] Deploy to STAGE

---

## Success Criteria

### Must Have
- ✅ Device B receives complete user data (metadata + activities + days + settings)
- ✅ Device A retains all data after Device B joins
- ✅ No data loss during periodic sync
- ✅ New user creation still works (no regression)
- ✅ All tests pass

### Validation
- ✅ Manual Test 1 passes 100%
- ✅ Manual Test 2 passes 100%
- ✅ Manual Test 3 passes 100%
- ✅ No console errors or warnings
- ✅ Sync configuration persists correctly

---

## Why This is Better Than the Complex Approach

### Complex Approach Issues
- ❌ 200+ lines of new code
- ❌ New security attack surface (preserving unknown fields)
- ❌ Potential deadlocks in conflict resolution
- ❌ Over-engineering for a simple problem
- ❌ Hard to review and maintain
- ❌ 4-6 hours of implementation time

### Simple Approach Benefits
- ✅ 3 lines of code
- ✅ No new functions or complexity
- ✅ Clear and obvious fix
- ✅ Easy to review and test
- ✅ 15-30 minutes total time
- ✅ Addresses root cause directly
- ✅ No security concerns
- ✅ Easy rollback if needed

---

## Timeline

**Total Time: 1 hour**

- 15 min: Revert previous changes
- 15 min: Implement fix
- 15 min: Write test
- 15 min: Manual testing on QUAL

---

## Related Files

**Modified**:
- `src/components/Onboarding/OnboardingUserCentered/index.js` (3-line fix)
- `src/stores/useUserStore.js` (revert to original)
- `src/services/sync/conflictResolver.js` (revert to original)
- `src/services/sync/syncStoreIntegration.js` (revert to original)

**Test Added**:
- `src/components/Onboarding/__tests__/OnboardingUserCentered-sync.test.js`

---

**Prepared By**: Claude Code
**Peer Review Status**: ⏳ Pending
**Approval Status**: ⏳ Pending
**Implementation Status**: 🔴 Not Started
