# Operation Log System Documentation

## Overview
The operation log system tracks all mutations in the StackMap application for synchronization and dirty tracking purposes. It maintains a log of all state changes with metadata about what changed, when, and by whom.

## Key Components

### 1. Operation Log (_operationLog)
An array that stores all mutation operations with the following schema:
```javascript
{
  id: 'op-timestamp-random',          // Unique operation ID
  type: 'operation-type',             // Type of operation
  timestamp: Date.now(),              // When the operation occurred
  userId: 'current-user-id',          // User who performed the operation
  data: { /* operation data */ },     // Relevant data for the operation
  syncStatus: 'pending'               // Sync status: pending, synced, or failed
}
```

### 2. Operation Types
- `add-activity` - When a new activity is added
- `update-activity` - When an activity is modified
- `remove-activity` - When an activity is deleted
- `move-activity` - When an activity is reordered
- `update-user` - When user profile is updated
- `switch-user` - When switching between users

### 3. Dirty Tracking
- `_dirtyUsers` (Set) - Tracks which users have been modified
- `_dirtyActivities` (Map) - Tracks which activities have been modified per user

## Public Methods

### Core Methods
- `isDirty()` - Check if there are any unsynced changes
- `clearDirtyFlags()` - Clear all dirty flags after successful sync
- `getChangedData()` - Get only the data that has changed since last sync
- `getOperationLog()` - Get a copy of the operation log
- `getOperationLogStats()` - Get statistics about the operation log
- `resetOperationLog()` - Reset the entire operation log (use with caution)

### Internal Methods (prefixed with _)
- `_trackOperation(type, data)` - Track a new operation
- `_getUnsyncedOperations()` - Get all operations pending sync
- `_markOperationsSynced(operationIds)` - Mark operations as synced
- `_markOperationsFailed(operationIds)` - Mark operations as failed
- `_pruneOperationLog()` - Keep only the last 1000 operations
- `_rebuildDirtyTracking()` - Rebuild dirty tracking from operation log

## Usage Example

```javascript
// The operation log is automatically managed internally
// When mutations occur, they should call _trackOperation

// Example: When adding an activity
const newActivity = { /* activity data */ };
appState._trackOperation('add-activity', {
    activityId: newActivity.id,
    title: newActivity.title,
    userId: appState.users.currentUserId,
    isToday: true
});

// Check if there are dirty changes
if (appState.isDirty()) {
    // Get only changed data for sync
    const changedData = appState.getChangedData();
    
    // After successful sync
    const syncedOperationIds = changedData.operations.map(op => op.id);
    appState._markOperationsSynced(syncedOperationIds);
    appState.clearDirtyFlags();
}
```

## Integration Notes

1. **Backward Compatibility**: The system is designed to be backward compatible. Existing functionality continues to work without modification.

2. **Automatic Tracking**: Operations should be tracked automatically when mutations occur. The next phase would be to integrate `_trackOperation` calls into existing mutation methods.

3. **Sync Integration**: The operation log is included in data exports and can be used by sync systems to determine what has changed.

4. **Performance**: The log is automatically pruned to keep only the last 1000 operations to prevent memory issues.

5. **Import/Export**: The operation log is preserved during import/export operations and dirty tracking is rebuilt from the log.

## Next Steps

To fully integrate the operation log system:

1. Add `_trackOperation` calls to all mutation methods:
   - addActivity()
   - updateActivity()
   - removeActivity()
   - moveActivity()
   - updateUser()
   - switchUser()

2. Integrate with the Google Drive sync system to:
   - Use `getChangedData()` for incremental syncs
   - Mark operations as synced/failed based on sync results
   - Clear dirty flags after successful sync

3. Add UI indicators for:
   - Showing when data is dirty (unsaved changes)
   - Sync status of operations
   - Failed operations that need retry