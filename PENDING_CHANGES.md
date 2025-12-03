## Fix: Onboarding sync uses wrong recovery phrase

### Changes Made:

- Fixed critical bug where onboarding displayed one recovery phrase but created sync with a different one
- User would copy phrase A, but sync was created with phrase B, causing "sync not found" on other devices
- Root cause: `joinSync()` 404 fallback called `createSync()` without passing the user's recovery phrase

### Technical Details:

- `minimalSyncService.createSync()` now accepts optional `providedRecoveryPhrase` parameter
- `syncStoreIntegration.createSync()` passes phrase through to minimalSync
- `joinSync()` 404 fallback now passes the recovery phrase: `createSync(recoveryPhrase)`

### Files Changed:

- `src/services/sync/minimalSyncService.js` - Accept optional recovery phrase in createSync()
- `src/services/sync/syncStoreIntegration.js` - Pass recovery phrase through createSync() and 404 fallback
- `ios/StackMapNative.xcodeproj/project.pbxproj` - Version codes from prod deployment
- `ios/StackMapNative/Info.plist` - Version info from prod deployment

### Testing:

1. Fresh install → complete onboarding with sync enabled
2. Copy the displayed recovery phrase
3. Fresh install on different device/browser
4. Enter the copied phrase → should successfully join sync

### User Impact:

- **Bug Fix**: Recovery phrase shown during onboarding now matches the actual sync
- **Breaking Changes**: None
- **Migration Required**: None

### Deployment Notes:

- Low risk - changes are additive (new optional parameter)
- Backward compatible - existing calls without phrase still work
- Only affects new sync creation path, not existing syncs
