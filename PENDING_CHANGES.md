# Pending Changes

## Title: Fix Critical Sync State Loss on Device Join

### Root Cause Identified:
Device B successfully joins and receives data but **loses sync state on restart** because:
1. Recovery phrase was NOT being stored during join flow
2. Without recovery phrase, encryption can't initialize on restart
3. Device appears "not synced" despite having sync_id stored
4. Re-joining wipes data instead of recognizing existing sync

### Changes Made:

#### 1. **Fixed Recovery Phrase Storage on Join** (CRITICAL FIX)
- Added `encryptionService.storeRecoveryPhrase()` call in join flow
- Recovery phrase now persists across app restarts
- Sync state properly maintained after joining

#### 2. **All Previous Fixes from Earlier Session**
- Protection period enforcement with error status
- 429 error handling for rate limits
- New endpoints: join_timestamp.php, verify_timestamp.php
- Server timestamp authority
- Proper join flow with data clearing

### Technical Details:
```javascript
// The missing line that caused all the problems:
await encryptionService.storeRecoveryPhrase(recoveryPhrase, this.syncId);
```

Without this, Device B would:
1. Join successfully and get data
2. Lose recovery phrase on restart
3. Can't initialize encryption without phrase
4. Appear "not synced" in UI
5. Re-join attempts wipe data

### Testing Required:
1. **Device A**: Create sync group
2. **Device B**: Join via wizard
3. **Device B**: Refresh/restart app
4. **Device B**: Should still show as synced
5. **Device B**: Should continue periodic syncing

### Why This Happened:
The timestamp sync implementation was storing recovery phrase for CREATE flow but not JOIN flow. This was an oversight in the original implementation that's been live for 38+ deployments.

### Impact:
- Fixes "sync not recognized after join" issue
- Prevents data wipes on rejoin attempts
- Ensures sync persists across app restarts