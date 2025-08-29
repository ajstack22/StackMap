# StackMap Sync System Rebuild Plan

## Executive Summary

After 40+ deployment attempts, the StackMap sync system requires a strategic rebuild. This document outlines the root causes of current failures and proposes a phased, testable approach to building a reliable sync system.

## Problem Statement

### Current State
The sync system has been deployed over 40 times with persistent failures:
- **Device B receives initial data but fails to persist after page refresh**
- **Changes don't propagate bidirectionally between devices**
- **Intermittent data loss and corruption**
- **Race conditions during initial sync**
- **Unclear error states and poor observability**

### Impact
- Users lose data when switching devices
- Sync appears to work initially but fails silently
- Support burden from confused users
- Loss of trust in the product

## Root Cause Analysis

Based on the interface analysis in `SYNC_INTERFACES_SPEC.md`, the core issues are:

### 1. Architectural Complexity
- **Problem**: 9+ interdependent modules (sync, queue, network, encryption, storage, etc.)
- **Impact**: Single point of failure cascades through entire system
- **Evidence**: Device B receives data (network works) but loses it (storage fails)

### 2. Unclear Boundaries
- **Problem**: Sync logic mixed with storage, encryption, and state management
- **Impact**: Can't test or debug individual components
- **Evidence**: Protection periods and timers create hidden dependencies

### 3. Race Conditions
- **Problem**: Multiple async operations without proper coordination
- **Impact**: Data written but overwritten before persistence
- **Evidence**: 60-second protection period band-aid solution

### 4. No State Machine
- **Problem**: Sync status managed ad-hoc with boolean flags
- **Impact**: Invalid state transitions and stuck states
- **Evidence**: Sync can be "enabled" but not "syncing" or "error"

### 5. Poor Observability
- **Problem**: Limited logging at interface boundaries
- **Impact**: Can't trace data flow or identify failure points
- **Evidence**: "It works on Device A" with no insight into Device B

## Success Criteria

### Functional Requirements
1. **Bidirectional Sync**: Device A change visible on Device B within 30 seconds
2. **Persistence**: Data survives page refresh on all devices
3. **Conflict Resolution**: Concurrent edits resolve predictably
4. **Offline Support**: Changes queue and sync when online
5. **Error Recovery**: Clear error messages and recovery paths

### Test Scenarios

#### Scenario 1: Basic Two-Device Sync
```
1. Device A creates sync with 3 activities
2. Device B joins with recovery phrase
3. Device B sees all 3 activities
4. Device B refreshes page
5. ✓ All 3 activities still visible
6. Device B adds 4th activity
7. Device A refreshes
8. ✓ Device A sees 4th activity
```

#### Scenario 2: Concurrent Edits
```
1. Both devices have same 5 activities
2. Device A marks activity 2 complete
3. Device B marks activity 3 complete (within 5s)
4. Wait 30 seconds
5. ✓ Both devices show activities 2 & 3 complete
```

#### Scenario 3: Offline/Online Transition
```
1. Device A goes offline
2. Device A makes 3 changes
3. Device A comes online
4. ✓ Changes sync to Device B within 30s
```

#### Scenario 4: Large Data Set
```
1. Sync 100 activities across 10 users
2. ✓ All data syncs without timeout
3. ✓ Performance remains responsive
```

### Performance Metrics
- Initial sync: < 3 seconds
- Periodic sync: < 1 second
- Conflict resolution: < 500ms
- Storage operations: < 100ms
- Memory usage: < 50MB

## Recommended Approach: Phased Rebuild

### Phase 1: Core Sync Protocol (Week 1, Days 1-3)

#### Goals
- Establish reliable data exchange between devices
- Ensure persistence across refreshes
- Clear logging at every step

#### Implementation
```javascript
// SimpleSyncService.js
class SimpleSyncService {
  async push(data) {
    console.log('[Sync] Pushing:', data);
    const response = await fetch('/api/push', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    console.log('[Sync] Push response:', response);
    return response;
  }
  
  async pull() {
    console.log('[Sync] Pulling data');
    const response = await fetch('/api/pull');
    const data = await response.json();
    console.log('[Sync] Pulled:', data);
    return data;
  }
}
```

#### Tests
- Raw data exchange works
- Data persists in AsyncStorage
- Clear error messages on failures

### Phase 2: State Management Integration (Week 1, Days 4-5)

#### Goals
- Connect sync to Zustand stores
- Proper state updates using store methods
- Maintain data integrity

#### Implementation
```javascript
// StateSync.js
async function syncState() {
  const localState = {
    users: useUserStore.getState().users,
    settings: useSettingsStore.getState(),
    library: useLibraryStore.getState()
  };
  
  const remoteState = await simpleSyncService.pull();
  const merged = mergeStates(localState, remoteState);
  
  // Apply using proper store methods
  useUserStore.getState().setUsers(merged.users);
  useSettingsStore.getState().updateSettings(merged.settings);
  useLibraryStore.getState().setLibrary(merged.library);
}
```

### Phase 3: Conflict Resolution (Week 2, Days 1-3)

#### Goals
- Implement Last-Write-Wins with timestamps
- Handle concurrent edits gracefully
- Preserve user intent

#### Implementation
```javascript
// ConflictResolver.js
function mergeStates(local, remote) {
  // Simple LWW for MVP
  if (remote.timestamp > local.timestamp) {
    return remote;
  }
  return local;
}

// Later: Field-level CRDT
function mergeActivities(localAct, remoteAct) {
  return {
    text: remoteAct.textTimestamp > localAct.textTimestamp 
      ? remoteAct.text : localAct.text,
    completed: remoteAct.completedAt > localAct.completedAt
      ? remoteAct.completed : localAct.completed
  };
}
```

### Phase 4: Encryption Layer (Week 2, Days 4-5)

#### Goals
- Add transparent encryption
- Zero-knowledge architecture
- Key management

#### Implementation
```javascript
// EncryptionLayer.js
class EncryptedSync {
  constructor(syncService, encryptionKey) {
    this.sync = syncService;
    this.key = encryptionKey;
  }
  
  async push(data) {
    const encrypted = encrypt(data, this.key);
    return this.sync.push(encrypted);
  }
  
  async pull() {
    const encrypted = await this.sync.pull();
    return decrypt(encrypted, this.key);
  }
}
```

### Phase 5: Production Hardening (Week 3)

#### Goals
- Add protection periods
- Implement rate limiting
- Error recovery
- Performance optimization

#### Features to Add
1. **Queue System**: For offline support
2. **Retry Logic**: With exponential backoff
3. **State Machine**: Formal sync states
4. **Monitoring**: Performance metrics
5. **Cleanup**: Remove old sync records

## Implementation Strategy

### Development Environment
1. **Two Browser Tabs**: Primary testing environment
2. **Device Simulators**: iOS/Android for platform testing
3. **Network Conditions**: Simulate offline/slow connections
4. **Debug Logging**: Verbose logging at every interface

### Testing Protocol

#### Daily Testing Checklist
- [ ] Basic sync between two tabs
- [ ] Data persists after refresh
- [ ] Concurrent edits resolve correctly
- [ ] Offline changes sync when online
- [ ] Error messages are clear

#### Before Each Phase Completion
- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Performance metrics met
- [ ] Code reviewed and documented

### Risk Mitigation

#### Risk 1: AsyncStorage Issues on iOS
- **Mitigation**: Use debounced writes (already implemented)
- **Fallback**: In-memory cache with periodic flush

#### Risk 2: Race Conditions
- **Mitigation**: Protection periods for new devices
- **Fallback**: Optimistic locking with version numbers

#### Risk 3: Data Corruption
- **Mitigation**: Validation at every boundary
- **Fallback**: Local backup before sync operations

## Recommendations for Developer Handoff

### Why Not "Just Fix It"?
The current system's complexity makes debugging nearly impossible. After 40+ attempts, incremental fixes have proven ineffective. A phased rebuild allows:
- Testing each layer independently
- Clear progress milestones
- Early detection of issues
- Confidence in the solution

### What Makes This Different?
1. **Start Simple**: No encryption, no CRDT, just data exchange
2. **Test First**: Each phase has clear test criteria
3. **Observable**: Logging at every step
4. **Incremental**: Add complexity only after basics work
5. **Documented**: Clear interfaces and boundaries

### How to Use These Documents

1. **Start with SYNC_INTERFACES_SPEC.md**
   - Understand current system architecture
   - Identify which interfaces to implement
   - Use as reference during development

2. **Follow This Rebuild Plan**
   - Implement phases in order
   - Don't skip to Phase 5
   - Test thoroughly between phases

3. **Use Existing Code as Reference**
   - Don't copy wholesale
   - Extract useful utilities (normalizer, etc.)
   - Learn from past mistakes

### Critical Success Factors

1. **Patience**: Don't rush to add features
2. **Testing**: Manual testing after every change
3. **Logging**: Console.log is your friend
4. **Simplicity**: If it seems complex, it probably is
5. **Communication**: Daily updates on progress

## Timeline & Milestones

### Week 1: Foundation
- **Day 1-3**: Core sync protocol
- **Day 4-5**: State management integration
- **Milestone**: Two-tab sync working

### Week 2: Reliability
- **Day 1-3**: Conflict resolution
- **Day 4-5**: Encryption layer
- **Milestone**: Secure sync with conflict handling

### Week 3: Production Ready
- **Day 1-2**: Protection & rate limiting
- **Day 3-4**: Error recovery & offline support
- **Day 5**: Performance optimization
- **Milestone**: All test scenarios passing

## Conclusion

The StackMap sync system needs a strategic rebuild, not another patch. By following this phased approach with clear interfaces and test criteria, we can build a reliable sync system that actually works. The key is to start simple, test thoroughly, and add complexity only when the foundation is solid.

**Next Step**: Hand this plan to a developer and start with Phase 1. Don't skip ahead. Test everything. Success is measured by working sync, not lines of code.