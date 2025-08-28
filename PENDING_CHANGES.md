# Pending Changes

## Title: Fix Onboarding Sync Join Not Persisting State

### Root Causes Found:
1. **initializeForImport() was a stub** - It only set IDs but didn't enable sync
2. **Recovery phrase not stored during onboarding join** - Same issue as regular join
3. **Sync state not persisted** - No AsyncStorage calls to save sync_enabled, sync_id
4. **Encryption not initialized** - No encryption setup for future syncs
5. **Sync timer not started** - No periodic syncing after onboarding

### Changes Made:

#### 1. **Fixed initializeForImport() Method** (CRITICAL)
The method now properly:
- Stores recovery phrase for persistence
- Initializes encryption properly
- Saves sync state to AsyncStorage
- Sets syncEnabled = true
- Starts the sync timer
- Applies protection period

#### 2. **Fixed Recovery Phrase Storage in Join Flow**
- Added missing `encryptionService.storeRecoveryPhrase()` in regular join
- Ensures sync persists after app restart

### Why Device B Appeared "Not Synced":
When joining via onboarding wizard:
1. Data was imported successfully
2. But `initializeForImport()` was essentially a no-op
3. Sync state was never saved
4. On checking sync status: appears disabled
5. Trying to rejoin would wipe data

### Testing Required:
1. Join sync via onboarding wizard
2. Go to Data -> Sync immediately
3. Should show as synced (with protection period message)
4. Refresh/restart app
5. Should still show as synced

### Impact:
- Onboarding sync join now properly persists
- Sync status correctly shows after onboarding
- No more data loss from rejoining