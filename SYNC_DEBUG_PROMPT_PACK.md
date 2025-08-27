# StackMap Sync System Critical Bug - Debug Prompt Pack

## CRITICAL ISSUE: Data Loss During Sync
**Priority: CRITICAL - Users are losing all their data**

## Current Behavior (BROKEN)
1. Browser A: User deletes starter cards, adds activities from library, reorders/renames them
2. Browser A: Creates sync (gets recovery phrase)
3. Browser B: Joins sync with recovery phrase
4. Browser B: Initially sees the correct data
5. **BUG**: Browser A's data gets COMPLETELY WIPED OUT shortly after Browser B joins
6. Both browsers end up disconnected - changes don't sync between them

## Reproduction Steps
1. Open StackMap in incognito browser (Browser A)
2. Delete all starter cards
3. Add morning routine group from library
4. Rename and reorder some cards
5. Open Data modal and click "Create New Sync"
6. Copy the recovery phrase
7. Open another incognito browser (Browser B)
8. From onboarding wizard, choose "Join existing sync"
9. Enter the recovery phrase
10. Observe: Browser B shows correct data initially
11. Switch back to Browser A
12. **BUG**: All data is gone in Browser A
13. Try adding cards in either browser - they don't sync to the other

## Technical Details

### Sync Architecture
- **Service**: `/src/services/sync/syncServiceV2.js` (CRDT-based, ~1000 lines)
- **Encryption**: TweetNaCl.js with 100,000 iterations SHA-512 hash
- **Strategy**: Last-write-wins with timestamp-based conflict resolution
- **Sync Interval**: 30 seconds periodic + 5 seconds after changes
- **Data Flow**: Stores → Normalize → Encrypt → Server → Decrypt → Merge → Apply to Stores

### Key Files to Review
```
/src/services/sync/syncServiceV2.js       # Main sync service
/src/services/sync/crdtMerger.js         # CRDT merge logic
/src/services/sync/encryptionService.js  # Encryption/decryption
/src/components/Modals/DataModal/DataModal.js  # UI for sync creation/joining
/src/hooks/useSyncOnChange.js            # Hook that triggers sync on data changes
/src/stores/useUserStore.js              # User/activity data store
/src/utils/dataNormalizer.js             # Field normalization
/App.js                                   # Main app - lines 2116-2130, 5606-5620 for activity creation
```

### What We Know
1. **Sync ID generation works** - Recovery phrases correctly generate sync IDs
2. **Encryption/decryption works** - Data can be encrypted and decrypted
3. **Server storage works** - Data is stored and retrieved from server
4. **Version tracking issue** - Browsers may have mismatched version numbers
5. **CRDT merger issue** - May produce empty results that delete all data
6. **Race condition** - Browser A's data disappears after Browser B joins

### Attempted Fixes (Already Applied)
1. ✅ Fixed sync ID generation and verification
2. ✅ Added safety check to prevent applying empty state
3. ✅ Increased sync intervals to reduce conflicts (5s → 30s)
4. ✅ Added debounce delay for user changes (5s)
5. ✅ Added modifiedAt timestamps to new activities
6. ✅ Added logging throughout sync flow
7. ✅ Fixed requestSync() to accept options parameter
8. ✅ Added immediate sync after creating sync group
9. ❌ **STILL BROKEN** - Data loss still occurs

### Critical Code Sections

#### performSync() method (syncServiceV2.js ~line 437)
- Checks if sync should run
- Pulls remote data
- Merges with local data using CRDT
- Applies merged state to stores
- Pushes result back to server

#### Key Problem Area (syncServiceV2.js ~line 505-530)
```javascript
if (remoteData && remoteData.version > this.lastVersion) {
  // Merges and applies remote data - THIS IS WHERE DATA GETS LOST
  stateToSync = crdtMerger.mergeStates(localState, normalizedRemote, this.deviceId);
  
  // Safety check was added but isn't preventing the issue
  if (!stateToSync.users || Object.keys(stateToSync.users).length === 0) {
    console.error('[SyncV2] CRITICAL: Merge resulted in empty state!');
    stateToSync = localState;
  } else {
    await this.applyState(stateToSync); // THIS OVERWRITES LOCAL DATA
  }
}
```

### Suspicious Areas to Investigate

1. **Version Number Management**
   - Browser A might have stale version after Browser B joins
   - Version stored in AsyncStorage might not match actual server version
   - Check lines 115-130, 293-294, 520-522 in syncServiceV2.js

2. **CRDT Merger Logic** (`/src/services/sync/crdtMerger.js`)
   - May not properly merge when one side has data and other doesn't
   - Check mergeActivities() and mergeStates() methods

3. **Race Condition After Join**
   - Browser B joins and gets version N
   - Browser A still has version N-1
   - Browser A pulls, sees N > N-1, and overwrites its data
   - Check _justJoinedSync flag usage

4. **Store Update Issues**
   - applyState() directly overwrites stores (line 744)
   - No validation of what's being applied
   - Could be applying stale or wrong data

### Console Logs to Watch
```
[SyncV2] performSync called
[SyncV2] Sync comparison: {localVersion, remoteVersion, willMerge}
[SyncV2] Merging remote data: {localUserCount, remoteUserCount, ...}
[SyncV2] CRITICAL: Merge resulted in empty state!
[SyncV2] Push request: {syncId, version, hasData}
[useSyncOnChange] State changed, requesting sync
```

### Environment Details
- Platform: Web (qual environment)
- URL: stackmap.app/qual
- API: stackmap.app/qual/api/sync/
- Testing with: Incognito browsers to avoid localStorage conflicts

### User's Testing Results
1. First test: Recovery phrase `c34e71829dcc68d9629ce9f42414a233`
   - Sync ID in network: `703bca6878c9ddb6f6149bd94df809e1` ✅ (verified correct)
2. Second test: Recovery phrase `9bb3a40df977f9ca1d6a5754a3a4f45c`
   - Sync ID: `1606ddbbde54c20074f62f24970ded5d` ✅ (verified correct)
3. Latest test: Recovery phrase `535ccc3795e4e46242cc5e6dd0b9846f`
   - Initial 404 expected (new sync)
   - Data loss occurs after Browser B joins

### Debugging Strategy
1. Add extensive logging to track exact data at each step
2. Log version numbers before/after every operation
3. Track what applyState() is actually applying
4. Verify CRDT merger isn't producing wrong results
5. Check if periodic sync is interfering with join process
6. Ensure version numbers are correctly synchronized

### Questions to Answer
1. Why does Browser A's data disappear AFTER Browser B successfully joins?
2. Are version numbers being correctly tracked across browsers?
3. Is the CRDT merger producing correct results when merging?
4. Is there a race condition between join and periodic sync?
5. Why don't subsequent changes sync between browsers?

### Next Steps for Debugging
1. Add console.log before EVERY store update to see what's being written
2. Track version numbers throughout entire flow
3. Log full state before and after merge
4. Verify what Browser A pulls after Browser B joins
5. Check if AsyncStorage version is getting out of sync with actual version

## IMPORTANT NOTES
- Users are actively losing data - this is CRITICAL
- The sync appears to work initially but breaks shortly after
- Both browsers end up in disconnected states
- Console logs are stripped in production - need to test in development or add alerts
- Test in incognito to avoid localStorage persistence issues

## Success Criteria
1. Browser A creates sync with their current data
2. Browser B joins and receives Browser A's data
3. Browser A KEEPS their data (no wipeout)
4. Changes in either browser sync to the other
5. Both browsers stay synchronized ongoing

---
**This is a critical production bug affecting user data. The sync system is fundamentally broken and causing data loss.**