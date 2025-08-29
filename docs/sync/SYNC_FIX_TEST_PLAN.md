# Sync System Fix - Test Plan

## Critical Bug Fixed
**Issue**: Device B receives data but loses it on page refresh  
**Root Cause**: Store debounce timer (1 second) doesn't complete before page refresh  
**Solution**: Force immediate persistence with `persist.flush()` after applying sync data

## Changes Made

### 1. simpleSyncService.js
- Added `await` to `setCompleteState()` method
- Added `persist.flush()` calls for all stores after state updates
- This ensures data is immediately written to AsyncStorage

### 2. syncServiceTimestamp.js  
- Added same `persist.flush()` calls to `applyState()` method
- Both services now force immediate persistence

## Test Instructions

### Setup Test Environment
```bash
# Terminal 1: Run web on port 3000
npm run web

# Terminal 2: Run web on port 3001  
PORT=3001 npm run web
```

### Test Scenario 1: Basic Two-Device Sync ✅
1. **Tab A (port 3000)**: 
   - Open Chrome DevTools Console
   - Create 3 activities
   - Create sync (note recovery phrase)

2. **Tab B (port 3001)**:
   - Open Chrome DevTools Console  
   - Join sync with recovery phrase
   - Verify: All 3 activities appear
   - **CRITICAL TEST**: Refresh Tab B (Cmd+R)
   - ✅ **SUCCESS**: All 3 activities still visible after refresh

3. **Tab B**: 
   - Add a 4th activity
   - Wait 30 seconds for periodic sync

4. **Tab A**:
   - Refresh page
   - ✅ **SUCCESS**: 4th activity appears

### Test Scenario 2: Immediate Refresh Test ✅
1. **Tab A**: Create sync with activities
2. **Tab B**: Join sync
3. **Tab B**: IMMEDIATELY refresh (within 1 second)
4. ✅ **SUCCESS**: Data persists

### What to Look for in Console

**Good Signs**:
```
🔄 SIMPLE SYNC: Forcing immediate persistence to storage...
✅ User store persisted
✅ Settings store persisted  
✅ Library store persisted
✅ App store persisted
🔄 SIMPLE SYNC: All stores persisted successfully
```

Or for timestamp service:
```
[SyncTS] Forcing immediate persistence to storage...
[SyncTS] ✅ User store persisted
[SyncTS] ✅ Settings store persisted
[SyncTS] ✅ Library store persisted
[SyncTS] All stores persisted successfully
```

**Bad Signs**:
- No "persisted" messages
- Data disappears after refresh
- "Cannot read property 'flush' of undefined"

### Test Scenario 3: Concurrent Edits
1. Both tabs have same 5 activities
2. Tab A marks activity 2 complete
3. Tab B marks activity 3 complete (within 5s)
4. Wait 30 seconds
5. ✅ Both tabs show activities 2 & 3 complete

### Test Scenario 4: Network Failure Recovery
1. Tab A creates sync
2. Tab B joins sync
3. Disconnect network (Chrome DevTools > Network > Offline)
4. Make changes in Tab B
5. Reconnect network
6. ✅ Changes sync when online

## Deployment Instructions

### To Deploy Fix to QUAL
```bash
# Update PENDING_CHANGES.md first:
echo "## Fix: Sync data persistence on Device B
### Changes Made:
- Force immediate AsyncStorage persistence after receiving sync data
- Added persist.flush() calls to both sync services
- Fixes bug where Device B loses data on refresh
" >> PENDING_CHANGES.md

# Deploy to QUAL for testing
./scripts/qual_deploy.sh
```

### To Deploy to Production (after testing)
```bash
./scripts/prod_deploy.sh web
```

## Verification Checklist

- [ ] Two browser tabs can exchange data
- [ ] Data persists after refresh on Device B  
- [ ] Concurrent edits resolve correctly
- [ ] Console shows "persisted" messages
- [ ] No errors in console
- [ ] Works with both port 3000 and 3001
- [ ] Works in Chrome, Safari, Firefox

## Rollback Plan

If issues occur, revert the changes:
```bash
git revert HEAD
./scripts/qual_deploy.sh
```

## Next Steps

After this fix is verified:
1. **Phase 2**: Better conflict resolution (currently last-write-wins)
2. **Phase 3**: Optimize performance (batch updates)
3. **Phase 4**: Add offline queue
4. **Phase 5**: Production hardening

## Success Metrics

- Zero "data lost on refresh" reports
- Sync completes in < 3 seconds
- No UI freezing during sync
- 99% sync success rate