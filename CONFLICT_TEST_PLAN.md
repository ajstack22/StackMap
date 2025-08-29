# Conflict Resolution Test Plan

## Current Implementation
- **Strategy**: Last-Write-Wins (LWW) with field-level timestamps
- **Granularity**: 
  - Users: Entire object
  - Activities: Per activity
  - Settings: Entire object
  - Library: Entire object

## Critical Test Scenarios

### ✅ Test 1: Different Fields (Should Pass)
**Setup**: 3 devices with same sync
**Actions** (simultaneous):
- Device A: Adds new user "Alice"
- Device B: Changes theme to "blue"
- Device C: Adds library category "Fitness"

**Expected**: All changes merge without conflict
**Actual**: _To be tested_

### ⚠️ Test 2: Same User Conflict
**Setup**: All devices have user "TestUser"
**Actions** (within 5 seconds):
- Device A: Renames to "Alice"
- Device B: Renames to "Bob"  
- Device C: Renames to "Charlie"

**Expected**: Last timestamp wins, all converge to same name
**Actual**: _To be tested_

### ⚠️ Test 3: Activity Array Merging
**Setup**: Same user selected on all devices
**Actions** (simultaneous):
- Device A: Adds "Morning Routine", "Exercise"
- Device B: Adds "Work", "Lunch"
- Device C: Adds "Evening", "Sleep"

**Expected**: User has all 6 activities (additive merge)
**Concern**: Currently using LWW on entire user object - might lose activities!
**Actual**: _To be tested_

### 🔴 Test 4: Library Structure Preservation
**Setup**: Existing library with categories
**Actions**:
- Device A: Modifies library.categories
- Device B: Modifies library.templates
- Device C: Modifies library.userAddedActivityIds

**Expected**: All modifications preserved
**Concern**: LWW on entire library object might lose changes!
**Actual**: _To be tested_

### ⚠️ Test 5: Offline Rejoining
**Setup**: Device C goes offline
**Actions**:
1. Device C offline: Adds users/activities
2. Device A & B online: Make different changes
3. Device C comes back online with stale timestamp

**Expected**: Merge should preserve all changes
**Concern**: Stale timestamp might cause C's changes to be lost
**Actual**: _To be tested_

### ⚠️ Test 6: Rapid Successive Updates
**Setup**: All devices online
**Actions**: Each device rapidly adds 10 items
**Expected**: All 30 items present on all devices
**Concern**: Debouncing might cause data loss
**Actual**: _To be tested_

## Potential Issues to Watch For

### 1. Activity Loss
- **Problem**: LWW on entire user object means if Device A adds activities and Device B renames the user, one change is lost
- **Solution Needed**: More granular merge for activities array

### 2. Library Corruption  
- **Problem**: Complex nested structure + LWW = potential data loss
- **Solution Needed**: Deep merge for library object

### 3. Timestamp Precision
- **Problem**: Same millisecond updates could happen
- **Current**: Uses device ID as tiebreaker
- **Test**: Verify tiebreaker works consistently

### 4. Offline Data Loss
- **Problem**: Device with old timestamp rejoins, all its changes lost
- **Solution Needed**: Track "unseen" changes per device?

## Test Execution Steps

1. Open `test-conflict-resolution.html`
2. Initialize sync on all 3 devices
3. Run each test scenario
4. Document actual results
5. Note any console errors
6. Check for data loss

## Success Criteria

- ✅ No "reduce is not a function" errors
- ✅ No data loss in different-field updates
- ✅ Consistent convergence in same-field conflicts
- ✅ Activities merge additively (not replacement)
- ✅ Library structure preserved
- ✅ Offline changes not lost
- ✅ All devices eventually consistent

## Current Status
**Not Yet Tested** - Need to run through all scenarios with actual implementation