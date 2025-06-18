# StackMap Drive Sync Improvement Plan

## Overview
This document outlines the comprehensive plan to enhance the Google Drive sync functionality in StackMap, building upon the existing sync queue infrastructure to create a robust, efficient, and user-friendly synchronization system.

## Current State Summary

### ✅ Implemented
- Offline sync queue with persistence
- Basic conflict detection and resolution UI
- Auto-sync with debouncing
- Network status monitoring
- Token refresh and authentication

### ⚠️ Partially Implemented
- Granular sync methods exist but aren't integrated
- Sync queue UI needs proper styling
- Operation transformation logic exists but isn't utilized

### ❌ Missing
- Activity-level change tracking
- Delta sync capabilities
- Compression for large datasets
- Sync history and rollback
- Advanced conflict resolution

## Implementation Phases

### Phase 1: Foundation - Change Tracking System
**Priority: Critical | Timeline: 3-4 days**

#### 1.1 Implement Operation Log in AppState
- Add `_operationLog` array to track all mutations
- Record operation type, timestamp, userId, and affected data
- Implement log rotation to prevent memory issues

#### 1.2 Add Change Detection Helpers
- Create `_trackChange(operation, data)` method
- Implement dirty flags for users and activities
- Add `getChangedData()` method to extract only modified items

#### 1.3 Update All Mutation Methods
- Modify `addActivity`, `updateActivity`, `removeActivity`
- Update `moveActivity`, `updateUser`, `switchUser`
- Ensure all changes are logged with appropriate metadata

### Phase 2: Granular Sync Integration
**Priority: High | Timeline: 2-3 days**

#### 2.1 Wire Up Queue Methods
- Connect AppState mutations to sync queue operations
- Replace `_triggerSave()` calls with specific queue operations
- Maintain backward compatibility with full sync

#### 2.2 Implement Granular Sync Processing
- Update `processSyncOperation` to handle activity-level changes
- Implement merge strategies for each operation type
- Add validation for operation sequences

#### 2.3 Add Activity-Level Conflict Detection
- Compare activity versions, not just app versions
- Implement field-level change detection
- Create conflict resolution strategies per field type

### Phase 3: Performance Optimizations
**Priority: Medium | Timeline: 3-4 days**

#### 3.1 Implement Delta Sync
- Create `generateSyncDelta()` method
- Implement patch application logic
- Add checksum validation for data integrity

#### 3.2 Add Data Compression
- Implement gzip compression for large payloads
- Add compression threshold configuration
- Measure and log compression ratios

#### 3.3 Intelligent Operation Batching
- Group related operations together
- Implement operation coalescing (multiple edits → single update)
- Add batch size limits and timeout handling

### Phase 4: Advanced Conflict Resolution
**Priority: High | Timeline: 4-5 days**

#### 4.1 Field-Level Merge Strategies
- Implement three-way merge for text fields
- Add last-write-wins for simple fields
- Create union merge for arrays (activities, tags)

#### 4.2 Automated Resolution Rules
- Add user preferences for conflict resolution
- Implement auto-resolution for non-conflicting changes
- Create resolution history log

#### 4.3 Enhanced Conflict UI
- Show field-by-field differences
- Add preview of merge results
- Implement undo/redo for resolutions

### Phase 5: Sync History & Monitoring
**Priority: Low | Timeline: 2-3 days**

#### 5.1 Sync History Implementation
- Store last N sync operations
- Add ability to view sync history
- Implement rollback to previous versions

#### 5.2 Performance Monitoring
- Track sync duration and payload sizes
- Monitor queue processing times
- Add performance alerts for slow syncs

#### 5.3 Sync Analytics Dashboard
- Create sync statistics view
- Show sync frequency and data volume
- Display error rates and retry patterns

### Phase 6: Testing & Reliability
**Priority: Medium | Timeline: 3-4 days**

#### 6.1 Automated Test Suite
- Unit tests for sync queue operations
- Integration tests for conflict scenarios
- Performance tests for large datasets

#### 6.2 Error Recovery Scenarios
- Test network interruption handling
- Verify data consistency after failures
- Test authentication expiry scenarios

#### 6.3 Cross-Device Testing
- Test multi-device sync scenarios
- Verify conflict resolution across platforms
- Test offline-to-online transitions

## Technical Implementation Details

### Change Tracking Schema
```javascript
operationLog: [
  {
    id: 'op-123',
    type: 'update-activity',
    timestamp: 1234567890,
    userId: 'user-1',
    activityId: 'act-456',
    changes: {
      title: { old: 'Old Title', new: 'New Title' },
      completed: { old: false, new: true }
    },
    syncStatus: 'pending' // pending, synced, failed
  }
]
```

### Delta Sync Format
```javascript
{
  baseVersion: 10,
  targetVersion: 15,
  operations: [
    { op: 'add', path: '/users/user-1/activities/2', value: {...} },
    { op: 'update', path: '/users/user-1/activities/0/title', value: 'New' },
    { op: 'remove', path: '/users/user-1/activities/1' }
  ],
  checksum: 'sha256-hash'
}
```

### Conflict Resolution Rules
1. **Title/Description**: Three-way merge with conflict markers
2. **Completed Status**: Most recent change wins
3. **Position/Order**: Preserve both positions, deduplicate
4. **User Data**: Merge activities from both versions
5. **Delete vs Update**: Update wins, with user confirmation

## Success Metrics

1. **Sync Performance**
   - Reduce average sync payload by 80%
   - Decrease sync time for typical operations to <1s
   - Handle datasets with 1000+ activities efficiently

2. **Reliability**
   - Zero data loss in offline scenarios
   - 100% sync queue recovery after crashes
   - <0.1% unresolved conflict rate

3. **User Experience**
   - Transparent background syncing
   - Clear conflict resolution process
   - Visible sync status and history

## Migration Strategy

1. **Phase 1**: Deploy change tracking without breaking existing sync
2. **Phase 2**: Enable granular sync for new operations only
3. **Phase 3**: Migrate existing data to new format gradually
4. **Phase 4**: Deprecate full-sync mode after validation
5. **Phase 5**: Remove legacy sync code

## Risk Mitigation

1. **Data Loss**: Implement comprehensive backup before each phase
2. **Performance**: Add feature flags to disable new features if needed
3. **Compatibility**: Maintain backward compatibility for 30 days
4. **User Impact**: Gradual rollout with monitoring

## Timeline Summary

- **Total Duration**: 17-23 days
- **Phase 1**: Days 1-4 (Foundation)
- **Phase 2**: Days 5-7 (Integration)
- **Phase 3**: Days 8-11 (Performance)
- **Phase 4**: Days 12-16 (Conflict Resolution)
- **Phase 5**: Days 17-19 (Monitoring)
- **Phase 6**: Days 20-23 (Testing)

## Next Steps

1. Review and approve this plan
2. Set up development environment for sync testing
3. Create feature branch for Phase 1 implementation
4. Begin implementation of operation log system