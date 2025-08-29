# Sync Service Replacement Roadmap

## Current Status (Aug 29, 2025)

### ✅ What's Working
- **Minimal sync service** successfully exchanges data between devices
- **Data persistence** fixed - devices retain data after refresh
- **60-second protection period** prevents new devices from causing conflicts
- **Basic test component** validates core functionality

### ⚠️ Current Limitations
- No encryption (just base64 encoding)
- No conflict resolution (last-write-wins only)
- No integration with app stores
- Protection period blocks immediate bidirectional sync
- No offline queue support

## Implementation Phases

### Phase 1: Core Bidirectional Sync (2-3 days) ✅ READY TO START

**Goal**: Reliable two-way data exchange with proper timing

**Tasks**:
1. ✅ Add protection period handling in `minimalSyncService.js`
2. Add periodic pull mechanism (every 30 seconds)
3. Add change detection to trigger automatic push (after protection period)
4. Create integration test that validates full bidirectional flow
5. Test across web, iOS, and Android platforms

**Success Criteria**:
- Device A creates sync → Device B joins → waits 60s → Device B pushes → Device A pulls
- All changes propagate within 90 seconds
- No data loss on refresh

### Phase 2: Store Integration (3-4 days)

**Goal**: Connect minimal sync to Zustand stores

**Implementation**:
```javascript
// New file: src/services/sync/storeIntegration.js
class StoreIntegration {
  async getCurrentState() {
    return {
      users: useUserStore.getState().users,
      settings: useSettingsStore.getState(),
      library: useLibraryStore.getState()
    };
  }
  
  async applyState(syncedData) {
    // Use proper store methods
    useUserStore.getState().setUsers(syncedData.users);
    useSettingsStore.getState().updateSettings(syncedData.settings);
    useLibraryStore.getState().setLibrary(syncedData.library);
    
    // Force immediate persistence
    await useUserStore.persist.flush();
    await useSettingsStore.persist.flush();
    await useLibraryStore.persist.flush();
  }
}
```

**Key Requirements**:
- Use store-specific update methods (never `setState` directly)
- Call `persist.flush()` after updates
- Normalize data using existing `dataNormalizer.js`
- Handle field naming (activities use `text` not `name`)

### Phase 3: Encryption Layer (2 days)

**Goal**: Zero-knowledge encryption

**Implementation**:
```javascript
// Wrap minimal sync with encryption
class EncryptedSyncService {
  constructor() {
    this.minimalSync = minimalSyncService;
    this.encryption = encryptionService;
  }
  
  async push(data) {
    const encrypted = await this.encryption.encrypt(data);
    return this.minimalSync.pushData(encrypted);
  }
  
  async pull() {
    const encrypted = await this.minimalSync.pullData();
    return this.encryption.decrypt(encrypted.data);
  }
}
```

**Requirements**:
- Use existing NaCl encryption with 100k iterations
- Maintain backward compatibility with existing sync IDs
- Test with existing recovery phrases

### Phase 4: Conflict Resolution (2-3 days)

**Goal**: Handle concurrent edits gracefully

**Strategy**:
1. Start with timestamp-based Last-Write-Wins
2. Track per-field timestamps for granular merging
3. Add user notification for conflicts

**Implementation Approach**:
```javascript
function mergeStates(local, remote) {
  // Phase 4a: Document-level LWW
  if (remote.timestamp > local.timestamp) {
    return remote;
  }
  
  // Phase 4b: Field-level merging
  return {
    users: mergeUsers(local.users, remote.users),
    activities: mergeActivities(local.activities, remote.activities)
  };
}
```

### Phase 5: Production Hardening (3-4 days)

**Goal**: Production-ready reliability

**Features to Add**:
1. **Offline Queue**: Store changes when offline, sync when online
2. **Retry Logic**: Exponential backoff for failed requests
3. **State Machine**: Clear sync states (idle, syncing, error, etc.)
4. **Performance Monitoring**: Track sync times and success rates
5. **Error Recovery**: Automatic recovery from common failures
6. **Cleanup**: Remove old sync records after 30 days

## Migration Strategy

### Step 1: Deploy Minimal Sync in Parallel
- Deploy new sync alongside existing system
- Add feature flag to enable new sync
- Test with internal users first

### Step 2: Gradual Rollout
- Enable for 10% of users
- Monitor for issues
- Increase to 50%, then 100%

### Step 3: Deprecate Old System
- Keep old sync running for 30 days
- Migrate remaining users
- Remove old sync code

## Testing Requirements

### Unit Tests
- Each phase should have comprehensive unit tests
- Mock API responses for offline testing
- Test error conditions and edge cases

### Integration Tests
- Two-device sync scenarios
- Offline/online transitions
- Conflict resolution cases
- Large dataset handling (100+ activities)

### Platform Tests
- Web (Chrome, Safari, Firefox)
- iOS (Safari WebView)
- Android (Chrome WebView)

## Risk Mitigation

### Risk: Data Loss
**Mitigation**: 
- Keep backups before each sync operation
- Implement versioning for rollback
- Extensive logging for debugging

### Risk: Performance Issues
**Mitigation**:
- Batch sync operations
- Implement progressive sync for large datasets
- Add caching layer

### Risk: Breaking Existing Users
**Mitigation**:
- Feature flag for gradual rollout
- Maintain backward compatibility
- Keep old sync as fallback

## Success Metrics

- **Reliability**: 99.9% sync success rate
- **Performance**: < 3s for initial sync, < 1s for updates
- **User Experience**: Zero reports of data loss
- **Adoption**: 100% of users successfully using new sync

## Next Immediate Actions

1. **Today**: Test protection period fix in QUAL
2. **Tomorrow**: Begin Phase 1 - add periodic sync
3. **This Week**: Complete Phase 1 and begin Phase 2
4. **Next Week**: Complete Phases 2-3
5. **Following Week**: Phases 4-5 and testing

## Key Files

### Existing
- `/src/services/sync/minimalSyncService.js` - Foundation service
- `/src/components/MinimalSyncTest.js` - Test component
- `/src/services/sync/encryptionService.js` - Encryption logic
- `/src/utils/dataNormalizer.js` - Field normalization

### To Create
- `/src/services/sync/storeIntegration.js` - Store connection
- `/src/services/sync/conflictResolver.js` - Conflict handling
- `/src/services/sync/syncQueue.js` - Offline queue
- `/src/services/sync/syncStateMachine.js` - State management

## Important Notes

1. **Don't rebuild everything** - Use minimal sync as foundation
2. **Test at each phase** - Don't add features until basics work
3. **Keep it simple** - Complexity killed the original sync
4. **Log everything** - Essential for debugging
5. **Protection period is good** - Prevents sync storms, keep it

---

**Status**: Ready to begin Phase 1 implementation
**Owner**: Development team
**Timeline**: 2-3 weeks total
**Priority**: High - Current sync is complex and fragile