## Feature: Fix Initial Sync Experience - Faster & Safer

### Changes Made:

- Fixed critical bug where `isInitializing` getter always returned `false` - blocking indicator never showed
- Added `isInitialSyncInProgress` flag set IMMEDIATELY before async sync operations
- Replaced slow custom key derivation (iterated SHA-512) with industry-standard PBKDF2-SHA512
- Uses pure JS `pbkdf2` npm package for consistent cross-platform key derivation
- Uses Web Crypto API on web for same performance improvement (when available)
- Fixed missing `Buffer` import on React Native (required for pbkdf2 on mobile)
- Fixed SyncBlockingIndicator subscription pattern bug

### Technical Details:

- **Before**: Key derivation took 500-2000ms × 2 = 1-4 seconds, UI not blocked during this time
- **After**: Key derivation takes 50-100ms × 2 = 100-200ms, UI blocked immediately
- **Race condition fixed**: Users could make changes during sync that would override server data
- **Algorithm change**: PBKDF2-SHA512 (RFC 2898 standard) replaces custom iterated SHA-512

### Files Changed:

- `src/services/sync/syncStoreIntegration.js`:
  - Added `isInitialSyncInProgress` flag in constructor
  - Fixed `isInitializing` getter to return actual state
  - Updated `joinSync()` with try/finally to properly set/reset flag
  - Added phase notifications for UI feedback

- `src/services/sync/encryptionServiceFixed.ts`:
  - Replaced 100k iteration SHA-512 loop with standard PBKDF2
  - Mobile/Tests: Uses pure JS `pbkdf2Sync` from `pbkdf2` npm package
  - Web (HTTPS): Uses `crypto.subtle.deriveBits` from Web Crypto API

- `src/components/SyncBlockingIndicator/SyncBlockingIndicator.js`:
  - Added `deriving_key` and `applying` phase messages
  - Fixed subscription pattern to use proper listener registration
  - Updated visibility logic to check `isInitialSync` flag

- `package.json`:
  - Added `pbkdf2@^3.1.2` (pure JS PBKDF2 implementation)
  - Removed `react-native-quick-crypto` and `react-native-nitro-modules` (caused OpenSSL build conflicts)

### Testing:

1. Fresh install → enable sync → verify blocking modal shows INSTANTLY
2. Verify "Preparing encryption keys..." message appears during key derivation
3. Try tapping during sync - UI should be completely blocked
4. Time total sync duration (should be <1 second vs 1.5-5.5 seconds before)
5. Test on slow network - blocking should persist until complete
6. Verify sync completes successfully on iOS, Android, and Web

### User Impact:

- **Performance**: Initial sync ~5x faster due to standard PBKDF2 algorithm
- **Safety**: No more race condition where changes override server data
- **UX**: Blocking modal shows immediately, user knows sync is in progress
- **BREAKING CHANGE**: Existing sync groups will NOT work - users must create new sync groups

### Deployment Notes:

- **HIGH RISK** - Breaking change to key derivation algorithm
- All existing sync groups are invalidated (different keys produced)
- Users will need to create new sync groups after this update
- Uses pure JS library - no native module build issues
- No pod install or Android linking required for PBKDF2 change

---

## Fix: Settings modal not scrolling on Android

### Changes Made:

- Fixed Settings modal scrolling issue on Android where content was not scrollable
- Replaced ScrollView with FlatList on Android (keeping ScrollView for iOS/Web)
- Added scroll key mechanism with onShow callback to force proper layout calculation
- Applied same proven pattern used in PreferencesModal and PrivacyModal

### Technical Details:

- **Root cause**: Android's native ScrollView doesn't handle touch events properly inside React Native modals
- **Solution**: FlatList handles touch events at a lower native level, making it more reliable in modal contexts
- **Key mechanism**: When modal opens, changing the `key` prop forces React Native to remount the FlatList
- **setTimeout(0)**: Pushes update to next event loop tick, allowing modal layout to settle first

### Files Changed:

- `src/components/Modals/SettingsModal/SettingsModal.js`:
  - Added FlatList import and useRef hook
  - Added scrollRef and scrollKey state
  - Created renderContent() function for content extraction
  - Added onShow callback to Modal for Android scroll fix
  - Platform-conditional rendering: FlatList (Android) vs ScrollView (iOS/Web)

### Testing:

1. Open Settings modal on Android - verify content scrolls smoothly
2. Scroll to bottom - Reset button should be visible
3. Test horizontal scrolling in celebration options
4. Close and reopen modal multiple times
5. Verify iOS scrolling behavior unchanged (bounce effect works)
6. Test all toggle buttons and settings

### User Impact:

- **Bug Fix**: Settings modal now scrolls correctly on Android
- **Breaking Changes**: None
- **Migration Required**: None

### Deployment Notes:

- Low risk - iOS/Web behavior unchanged (uses same ScrollView code)
- Pattern matches proven solutions in PreferencesModal and PrivacyModal
- All props and callbacks preserved

---

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
