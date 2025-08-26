# StackMap Sync - Known Issues Tracker
*Last Updated: August 25, 2025*
*Version: 2025.08.25.x*

## 🔴 Critical Issues (Data Loss)

### 1. Completion State Reversion
- **Status**: ACTIVE - Affecting users
- **Severity**: CRITICAL
- **Description**: Marking items complete reverts after ~30 seconds
- **Frequency**: Reproducible
- **Impact**: Users lose work, trust eroded
- **Attempted Fixes**:
  - ✅ Added modifiedAt timestamps to toggle operations
  - ✅ Increased debounce from 5s to 10s
  - ❌ Still occurring despite fixes

### 2. Rapid Edit Reversion
- **Status**: PARTIALLY FIXED
- **Severity**: HIGH
- **Description**: Edit card → reorder another → first edit reverts
- **Root Cause**: Stale React props in EditModeList
- **Attempted Fixes**:
  - ✅ Added fresh store data merge in onUpdate
  - ✅ Added timestamps to all operations
  - ⚠️ May still occur under load

## 🟡 Major Issues (Poor UX)

### 3. Sync Join Race Condition
- **Status**: MITIGATED
- **Severity**: MEDIUM
- **Description**: "No valid users found" when joining sync
- **Platform**: Primarily iOS
- **Attempted Fixes**:
  - ✅ Added 3-retry logic with 2s delays
  - ✅ Better error messages
  - ⚠️ Root cause unclear

### 4. Import Data Overwrite
- **Status**: FIXED (needs testing)
- **Severity**: HIGH
- **Description**: Imported data immediately overwritten by sync pull
- **Root Cause**: startPeriodicSync() pulling after import
- **Fix Applied**:
  - ✅ Added initializeForImport() method
  - ✅ Skip initial sync after import
  - ✅ Clear URL parameters

### 5. Double Import Modal
- **Status**: FIXED (needs testing)
- **Severity**: MEDIUM
- **Description**: Import modal appears twice, second time deletes data
- **Root Cause**: URL parameter not cleared after import
- **Fix Applied**:
  - ✅ Clear syncSetupPhrase after import
  - ✅ Remove sync param from URL

## 🟢 Minor Issues

### 6. Missing Timestamps
- **Status**: FIXED
- **Severity**: LOW
- **Description**: Some operations don't set modifiedAt
- **Operations Fixed**:
  - ✅ Toggle completion
  - ✅ Toggle pin
  - ✅ Reorder activities
  - ✅ Add from library

### 7. Starter Cards Initialization
- **Status**: FIXED
- **Severity**: LOW
- **Description**: Default user created after import
- **Root Cause**: Race between state update and useEffect
- **Fix**: Check store directly, not React state

## 📊 Issue Patterns

### Timing-Related (Most Common)
- 30-second periodic sync interval
- 10-second debounce after changes
- 5-second skip window after push
- 3-second "too recent" protection
- React state propagation delays

### Architecture Complexity
- 2200+ lines in syncService.js
- 9 supporting modules
- 4 Zustand stores to coordinate
- Multiple conflict resolution strategies
- Scattered encryption/decryption logic

### Platform Differences
- iOS: AsyncStorage performance issues
- Web: Service worker caching
- Android: Layout calculation differences

## 🔍 Root Cause Analysis

### Primary Suspects for Reversion Issue

1. **Periodic Sync Logic** (syncService.js:1670-1676)
   ```javascript
   this.syncInterval = setInterval(() => {
     this.syncWithQueue();
   }, this.syncIntervalDuration); // 30 seconds
   ```

2. **Conflict Resolution** (conflictResolver.js:728-772)
   - May prefer server state incorrectly
   - Timestamp comparison could be flawed
   - Missing timestamps default to 0

3. **Protection Mechanisms** (syncService.js:1102-1112)
   - 3-second "too recent" protection
   - Might block valid updates
   - Could cause stale server data to persist

## 📈 Impact Metrics

### User Impact
- **Trust**: Users question if app is reliable
- **Productivity**: Lost work requires re-doing tasks
- **Accessibility**: Neurodivergent users need consistency
- **Adoption**: Sync issues prevent multi-device use

### Development Impact
- **Debugging Time**: ~40% of dev time on sync issues
- **Code Complexity**: Difficult to maintain/modify
- **Testing**: Hard to reproduce edge cases
- **Confidence**: Hesitant to make changes

## 🎯 Resolution Priority

### Immediate (This Week)
1. Fix 30-second reversion issue
2. Add comprehensive logging for debugging
3. Create reproducible test cases

### Short-term (This Month)
1. Simplify conflict resolution logic
2. Reduce syncService.js complexity
3. Improve error recovery

### Long-term (This Quarter)
1. Consider architectural redesign
2. Evaluate CRDT implementation
3. Implement comprehensive E2E tests

## 🔧 Debugging Checklist

When investigating sync issues:

- [ ] Check all timestamps (modifiedAt, completedAt, etc.)
- [ ] Verify debounce and sync timing
- [ ] Look for React prop/state mismatches
- [ ] Check server data vs local data
- [ ] Review conflict resolution decisions
- [ ] Monitor network timing
- [ ] Test with sync disabled
- [ ] Check for race conditions
- [ ] Verify encryption/decryption
- [ ] Look for protection mechanism blocks

## 📚 Related Documentation

- [Sync Architecture](./README.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Investigation Prompt Pack](./SYNC_INVESTIGATION_PROMPT_PACK.md)
- [API Reference](./SYNC_API_REFERENCE.md)
- [Security Implementation](./security-architecture.md)