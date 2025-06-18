# Drive Sync Integration Plan

## Overview
This document outlines the step-by-step integration of the operation log system with the existing mutation methods and sync queue.

## Current Status

### ✅ Completed Components
1. **Operation Log System** - Infrastructure in place in `state.js`
2. **Sync Queue UI** - Fixed and styled with indicators
3. **Test Infrastructure** - Comprehensive test suite ready

### 🔄 Integration Required
1. Wire mutation methods to track operations
2. Connect operation log to sync queue
3. Implement granular sync processing
4. Replace full sync with incremental sync

## Integration Steps

### Step 1: Wire Mutation Methods (Current Focus)
**Files to modify**: `state.js`

Add `_trackOperation` calls to:
- [ ] `addActivity()` - line 352
- [ ] `updateActivity()` - line 408
- [ ] `removeActivity()` - line 438
- [ ] `moveActivity()` - line 463
- [ ] `addUser()` - line 607
- [ ] `updateUser()` - line 845
- [ ] `switchUser()` - line 712

### Step 2: Connect to Sync Queue
**Files to modify**: `app/StackMapApp.js`, `drive-sync.js`

Replace `this.driveSync.autoSync()` calls with:
- [ ] `this.driveSync.queueActivityUpdate()` for activity changes
- [ ] `this.driveSync.queueActivityDelete()` for removals
- [ ] `this.driveSync.queueActivityMove()` for reordering
- [ ] `this.driveSync.queueUserSwitch()` for user changes

### Step 3: Implement Granular Processing
**Files to modify**: `drive-sync.js`

Update `processSyncOperation()` to handle:
- [ ] 'update-activity' - Apply single activity change
- [ ] 'delete-activity' - Remove specific activity
- [ ] 'move-activity' - Reorder activities
- [ ] 'batch-update' - Process multiple changes

### Step 4: Testing & Validation
- [ ] Run operation log tests
- [ ] Test sync queue with granular operations
- [ ] Verify no data loss
- [ ] Check performance improvements

## Implementation Approach

### Phase 1: Safe Integration (Low Risk)
1. Add operation tracking to all mutations
2. Keep existing full sync as fallback
3. Log operations but don't change sync behavior

### Phase 2: Gradual Migration (Medium Risk)
1. Start using granular sync for new operations
2. Keep full sync for conflict resolution
3. Monitor operation log growth

### Phase 3: Full Migration (Higher Risk)
1. Replace all full sync calls
2. Implement delta sync
3. Remove legacy sync code

## Code Examples

### Example 1: Update addActivity
```javascript
addActivity(activity, position = 'bottom') {
    const user = this.getCurrentUser();
    const activityId = 'act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const newActivity = { id: activityId, ...activity };
    
    if (position === 'top') {
        user.activities.unshift(newActivity);
    } else {
        user.activities.push(newActivity);
    }
    
    // Track the operation
    this._trackOperation('add-activity', {
        userId: this.users.currentUserId,
        activityId: activityId,
        activity: newActivity,
        position: position,
        dayContext: this.ui.currentDay
    });
    
    this.saveCurrentUserData();
    this._triggerSave();
}
```

### Example 2: Connect to Sync Queue
```javascript
// In StackMapApp.js setupAutoSyncInterval()
initDriveSync() {
    this.driveSync = new GoogleDriveSync(this);
    
    // Override state save handler to use granular sync
    this.appState.onSave = () => {
        const unsyncedOps = this.appState._getUnsyncedOperations();
        
        unsyncedOps.forEach(op => {
            switch(op.type) {
                case 'add-activity':
                case 'update-activity':
                    this.driveSync.queueActivityUpdate(
                        op.data.userId,
                        op.data.activityId,
                        op.data
                    );
                    break;
                case 'delete-activity':
                    this.driveSync.queueActivityDelete(
                        op.data.userId,
                        op.data.activityId
                    );
                    break;
                // ... other cases
            }
        });
        
        // Mark operations as queued
        this.appState._markOperationsSynced(unsyncedOps.map(op => op.id));
    };
}
```

## Testing Checklist

### Unit Tests
- [ ] Operation log correctly tracks all mutations
- [ ] Dirty flags are set/cleared properly
- [ ] getChangedData() returns only modified items
- [ ] Operation pruning maintains 1000 item limit

### Integration Tests
- [ ] Sync queue receives granular operations
- [ ] Operations are deduplicated correctly
- [ ] Offline operations queue properly
- [ ] Online transition processes queue

### End-to-End Tests
- [ ] Add activity → sync → verify in Drive
- [ ] Update activity → sync → verify change
- [ ] Delete activity → sync → verify removal
- [ ] Concurrent edits → conflict resolution

## Rollback Plan

If issues arise:
1. Comment out `_trackOperation` calls
2. Revert to full sync in StackMapApp
3. Clear operation logs with `resetOperationLog()`
4. Monitor for data inconsistencies

## Success Metrics

1. **Performance**
   - Sync payload reduced by 80%+
   - Sync time <1s for single operations
   - Queue processing <100ms per operation

2. **Reliability**  
   - Zero data loss
   - All operations tracked
   - Conflicts detected accurately

3. **User Experience**
   - Seamless background sync
   - Clear sync status
   - Fast operation feedback