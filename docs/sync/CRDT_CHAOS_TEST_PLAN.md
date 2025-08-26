# CRDT Sync Chaos Test Plan

*Version: 2025.08.25.16*
*Purpose: Validate CRDT sync under extreme conditions*

## 🎯 Test Objective

Prove that CRDT sync handles chaos scenarios that would break the old sync system, especially the 30-second reversion issue.

## 📱 Test Setup

### Prerequisites
- [ ] Deploy version 2025.08.25.16
- [ ] Have 4 test devices ready (mix of iOS, Android, Web browsers)
- [ ] Demo data file ready (`data/demo-data-kids.json` or similar)

### Initial Setup (Device A - Primary)
1. [ ] Open app fresh (no existing data)
2. [ ] Import demo data via Settings → Data → Import
3. [ ] Verify data imported correctly (users, activities visible)
4. [ ] Create new sync via Settings → Sync → Create
5. [ ] **SAVE RECOVERY PHRASE** (critical!)
6. [ ] Verify sync status shows "enabled"

### Join from Other Devices
**Device B (iOS/Android):**
1. [ ] Fresh app install/clear data
2. [ ] Settings → Sync → Join
3. [ ] Enter recovery phrase from Device A
4. [ ] Verify all demo data syncs over
5. [ ] Check all users and activities present

**Device C (Web Browser 1):**
1. [ ] Open app in fresh browser/incognito
2. [ ] Join sync with recovery phrase
3. [ ] Verify data syncs

**Device D (Web Browser 2/tablet):**
1. [ ] Join sync with recovery phrase
2. [ ] Verify data syncs

## 🐵 Chaos Monkey Tests

### Test 1: The 30-Second Reversion Test (CRITICAL)
**This was the main issue CRDT fixes**

1. [ ] Device A: Mark 5+ activities complete rapidly
2. [ ] Wait exactly 30 seconds (use timer)
3. [ ] **Expected**: Activities remain complete on Device A
4. [ ] Check other devices after sync
5. [ ] **Expected**: All devices show activities as complete

**Old system behavior**: Activities would revert to incomplete after ~30 seconds
**CRDT behavior**: Activities stay complete (timestamp wins)

### Test 2: Simultaneous Conflicting Edits
1. [ ] All devices: Open same user's activities
2. [ ] Device A: Mark activity 1 complete
3. [ ] Device B: Mark activity 1 incomplete (at same time)
4. [ ] Device C: Edit activity 1 text
5. [ ] Device D: Delete activity 1
6. [ ] Wait for sync (5-10 seconds)
7. [ ] **Expected**: Most recent action wins consistently across all devices

### Test 3: Rapid Toggle Chaos
1. [ ] Device A: Toggle same activity complete/incomplete 10 times rapidly
2. [ ] Device B: Do the same with different activity
3. [ ] Device C & D: Watch the chaos unfold
4. [ ] **Expected**: Final state is consistent across all devices

### Test 4: Offline/Online Chaos
1. [ ] Device A: Go offline (airplane mode)
2. [ ] Device A: Make 10+ changes (complete, edit, reorder)
3. [ ] Device B: Make different changes while A is offline
4. [ ] Device C & D: Make more changes
5. [ ] Device A: Come back online
6. [ ] **Expected**: All changes merge, most recent timestamps win

### Test 5: Add/Delete User Chaos
1. [ ] Device A: Add new user "Test User 1"
2. [ ] Device B: Add different user "Test User 2" 
3. [ ] Device C: Delete an existing user
4. [ ] Device D: Edit existing user's name and icon
5. [ ] **Expected**: All operations merge correctly

### Test 6: Reorder Mayhem
1. [ ] All devices: Reorder activities differently
2. [ ] Each device: Move different activities to position 1
3. [ ] **Expected**: Last reorder wins, no crashes

### Test 7: Share Link Chaos
1. [ ] Device A: Create share link for user
2. [ ] Device B: Update same user's activities
3. [ ] Device C: Create another share for same user
4. [ ] Check if shares auto-update correctly
5. [ ] **Expected**: Shares remain valid, auto-update works

### Test 8: Import During Sync
1. [ ] Device A: Start making changes
2. [ ] Device B: Import different demo data while A is syncing
3. [ ] **Expected**: Import succeeds, sync merges after

### Test 9: The "Impatient User" Test
1. [ ] Make change on Device A
2. [ ] Immediately check Device B (before 5s sync)
3. [ ] Rapidly refresh Device B
4. [ ] Make conflicting change on Device B
5. [ ] **Expected**: No data loss, eventual consistency

### Test 10: Maximum Stress
1. [ ] All 4 devices: Make different changes simultaneously
   - Device A: Complete 5 activities
   - Device B: Add 3 new activities  
   - Device C: Delete 2 activities
   - Device D: Reorder everything
2. [ ] Continue for 60 seconds non-stop
3. [ ] Stop and wait for sync to settle
4. [ ] **Expected**: All devices converge to same state

## 📊 Success Metrics

### MUST PASS (Critical)
- [ ] ✅ No 30-second reversions
- [ ] ✅ No data loss during chaos
- [ ] ✅ All devices eventually consistent
- [ ] ✅ No sync errors requiring manual intervention

### SHOULD PASS (Important)
- [ ] ✅ Sync completes within 5-10 seconds
- [ ] ✅ Share links remain functional
- [ ] ✅ Import doesn't break sync
- [ ] ✅ Offline changes sync when online

### NICE TO HAVE (Performance)
- [ ] ✅ UI remains responsive during sync
- [ ] ✅ No excessive battery drain
- [ ] ✅ Sync indicators work correctly

## 🐛 Debug Commands

If issues occur, use these commands in browser console:

```javascript
// Check sync status
window.syncStatus()

// View recent sync events
window.syncLogs()

// Run CRDT tests
window.testCRDT()

// Check for conflicts (should be none with CRDT)
window.eventLogger?.getRecentEvents().filter(e => e.category === 'CONFLICT')
```

## 📝 Issue Tracking

Document any issues found:

| Test | Issue | Device | Severity | Notes |
|------|-------|---------|----------|-------|
| | | | | |

## 🎉 Victory Conditions

The test is successful if:
1. **ZERO reversions** occur during any test
2. **All devices converge** to the same state
3. **No manual intervention** needed to fix sync
4. **No data loss** despite the chaos

## 🔄 Comparison with Old Sync

| Scenario | Old Sync (2200+ lines) | CRDT Sync (800 lines) |
|----------|------------------------|----------------------|
| 30-second reversion | ❌ Would fail | ✅ Impossible |
| Simultaneous edits | ❌ Unpredictable | ✅ Deterministic |
| Rapid toggles | ❌ Race conditions | ✅ Timestamp wins |
| Offline/Online | ⚠️ Complex queue | ✅ Simple merge |
| 4-device chaos | ❌ Conflicts galore | ✅ Automatic resolution |

## 🚀 Let the Chaos Begin!

Run through these tests and watch CRDT handle everything gracefully. The old sync would have failed at Test 1!