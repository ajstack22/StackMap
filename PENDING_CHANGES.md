## Title: Sync QR Code Scanner Implementation - Complete Sync Flow Enhancement

### Changes Made:

**Core QR Scanner Component**:
- ✅ Created `SyncQRScanner.js` - Universal QR scanning component
  - Platform-specific implementations:
    - iOS/Android: `react-native-qrcode-scanner` + `react-native-camera`
    - Web: `html5-qrcode` library
  - Smart URL parsing supporting multiple environments:
    - Production: `stackmap.app/?sync=<key>`
    - Beta: `stackmap.app/beta/?sync=<key>`
    - Stage: `stackmap.app/stage/?sync=<key>`
    - Qual: `stackmap.app/qual/?sync=<key>`
    - Direct key: 32-character hexadecimal string
  - Validation: `/^[a-f0-9]{32}$/i` regex for sync keys
  - Error handling with retry functionality
  - Graceful fallbacks for unsupported platforms

**QR Code Display Restoration**:
- ✅ `RecoveryPhrase.js` - Restored production QR code display
  - QR code always visible (200x200px, high contrast)
  - Copy Key button (copies sync key to clipboard)
  - Copy URL button (copies full sync URL with current environment)
  - Show/Hide toggle for sync key text
  - Security warnings and instructions
  - Environment-aware URL generation (prod/beta/stage/qual)

**DataModal Integration**:
- ✅ `SyncManagement.js` - Added QR scanner to "Restore from Sync Key" flow
  - "Scan QR Code" button below manual entry field
  - Scanned key auto-populates recovery phrase input
  - Seamless modal transition (scanner → restore flow)

**Onboarding Integration**:
- ✅ `SyncImportScreen.js` - Added QR scanner to "Join Sync" flow
  - "Scan QR Code" button in sync setup screen
  - Scanned key auto-populates sync key input
  - Consistent UX with DataModal scanner

**Styling Updates**:
- ✅ `styles.js` - Added QR-related styles
  - `qrCodeContainer` - QR code display wrapper
  - `scannerContainer`, `scannerHeader`, `scannerTitle` - Scanner UI
  - `scannerError`, `retryButton` - Error states
  - `keyActionButtonRow` - Button layout for Copy Key/URL
  - `keyToggleContainer` - Show/Hide key toggle

**Testing**:
- ✅ Created `SyncQRScanner.test.js` (25 comprehensive tests)
  - URL parsing for all environments (prod/beta/stage/qual)
  - Direct sync key validation
  - Error handling (invalid URLs, malformed keys, empty data)
  - Edge cases (spaces, case sensitivity, missing sync param)

**Platform Permissions**:
- ✅ iOS: Added camera permission to `Info.plist`
  - `NSCameraUsageDescription`: "StackMap needs camera access to scan sync QR codes"
- ✅ Android: Added permissions to `AndroidManifest.xml`
  - `CAMERA` permission for QR scanning
  - `VIBRATE` permission for scan feedback (fixes crash on successful scan)

**Dependencies**:
- ✅ Added QR scanning libraries:
  - `html5-qrcode@^2.3.8` (Web QR scanning)
  - `react-native-qrcode-scanner@^1.5.5` (Mobile QR scanning)
  - `react-native-camera@^4.2.1` (Camera access for mobile)
  - `react-native-qrcode-svg@^6.3.15` (QR code generation - already present)

**Android Build Fixes**:
- ✅ Fixed TLS handshake errors with `patch-package`
  - Root cause: `@react-native-clipboard/clipboard` v1.16.3 had outdated Gradle plugin (3.2.1)
  - Solution: Created automated patch removing buildscript block
  - Added `postinstall` script for automatic patch application
  - Documented fix in `docs/troubleshooting/android-tls-build-fix.md`
- ✅ Fixed product flavor conflict with `react-native-camera`
  - Added `missingDimensionStrategy 'react-native-camera', 'general'` to build.gradle
- ✅ Updated simulator configuration in `app-config.sh`
  - Changed from "iPhone 16 Pro" to "iPhone 15 Pro Max"
  - Changed from "iPad Pro 11-inch (M4)" to "iPad Pro 12.9-inch"
  - Matches actual running simulators

**Babel Configuration**:
- ✅ Added missing dev dependency: `babel-plugin-transform-inline-environment-variables`
  - Required by babel.config.js but was not in package.json

### Key Benefits:

**User Experience**:
- One-tap sync setup via QR code scanning
- No manual typing of 32-character hex keys
- Cross-device sync made trivial (scan code on Device A, share to Device B)
- Works across all platforms (iOS, Android, Web)

**Technical Robustness**:
- Environment-aware URL generation (respects qual/stage/beta/prod)
- Validates sync keys before accepting
- Graceful error handling with retry functionality
- Platform-specific optimizations

**Security**:
- Camera permissions properly requested
- QR codes never expose raw keys (always URL-encoded)
- Validation prevents malformed keys from being processed

### Testing Verification (QUAL):

**Platforms Tested**:
- ✅ Web (qual): https://stackmap.app/qual
  - QR code displays correctly in DataModal
  - Scanner works in both DataModal and Onboarding
- ✅ iOS: iPhone 15 Pro Max & iPad Pro 12.9-inch simulators
  - QR code generation works
  - Scanner functional in both flows
- ✅ Android: Physical device (R5CXC3F2VQE)
  - QR scanning in onboarding flow working
  - No crashes after VIBRATE permission fix

**Test Scenarios**:
- Scanning production QR codes
- Scanning beta/qual/stage QR codes
- Direct sync key entry (fallback)
- Error handling (invalid codes, camera denied)
- Cross-environment sync (qual → prod URLs work)

### Files Modified (22 files):

**New Files Created**:
- `src/components/Modals/DataModal/SyncQRScanner.js`
- `src/components/Modals/DataModal/__tests__/SyncQRScanner.test.js`
- `patches/@react-native-clipboard+clipboard+1.16.3.patch` (391KB)
- `docs/troubleshooting/android-tls-build-fix.md`

**Modified Files**:
- `src/components/Modals/DataModal/RecoveryPhrase.js` (QR display restoration)
- `src/components/Modals/DataModal/SyncManagement.js` (scanner integration)
- `src/components/Modals/DataModal/styles.js` (QR styles)
- `src/components/Onboarding/OnboardingUserCentered/screens/SyncImportScreen.js` (scanner in onboarding)
- `android/app/src/main/AndroidManifest.xml` (CAMERA + VIBRATE permissions)
- `android/app/build.gradle` (product flavor fix, version bump)
- `ios/StackMapNative/Info.plist` (camera permission)
- `package.json` (dependencies + postinstall script)
- `package-lock.json` (lockfile updates)
- `scripts/deploy/app-config.sh` (simulator names)
- Version files (app.json, src/utils/version.js, buildConfig.js, constants/index.js)

**Untouched Files** (verified intentionally):
- All other DataModal files (no regressions)
- Sync service logic (unchanged)
- Store architecture (unchanged)

### Deployment Notes:

**Version**: 2025.10.29.5 (QUAL)
**Deployment Tier**: QUAL → STAGE → BETA → PROD
**Risk Level**: Low (additive feature, no breaking changes)
**Rollback Plan**: Revert commit, sync still works with manual key entry

**Pre-Stage Checklist**:
- ✅ QUAL deployment successful (web, iOS, Android)
- ✅ Physical device testing completed
- ✅ All tests passing (25 new tests)
- ✅ No console errors or warnings
- ✅ Camera permissions working correctly
- ✅ Cross-platform QR scanning verified

**Post-Stage Verification**:
- Test QR scanning on internal team devices
- Verify sync works with scanned keys
- Check iOS TestFlight build includes camera permission
- Confirm Android internal track build functional

### Related Documentation:

- Android TLS Fix: `docs/troubleshooting/android-tls-build-fix.md`
- Sync System: `docs/sync/README.md`
- Field Conventions: `docs/features/field-conventions.md`

---

**Status**: ✅ Tested on QUAL (all platforms), Ready for STAGE deployment
**Impact**: High value (major UX improvement), Low risk (additive feature)
**Breaking Changes**: None
**Migration Required**: None (users can continue using manual key entry)
