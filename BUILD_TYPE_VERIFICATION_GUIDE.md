# BUILD_TYPE Verification Guide

This guide explains how to verify that BUILD_TYPE propagation is working correctly for all platforms after the three-tier deployment implementation.

## Overview

The BUILD_TYPE determines which API endpoint the app connects to:
- **qual**: `stackmap.app/qual/api/sync` (local testing)
- **stage**: `stackmap.app/stage/api/sync` (internal pre-production)
- **beta**: `stackmap.app/beta/api/sync` (external beta testing)
- **prod**: `stackmap.app/api/sync` (production)

## How BUILD_TYPE Works

### Android
- **Method**: Gradle product flavors with `buildConfigField`
- **Implementation**: Native module `BuildConfigModule` exposes `BUILD_TYPE_ENV`
- **File**: `android/app/build.gradle` lines 89-119
- **Access**: JavaScript reads via `NativeModules.BuildConfigModule.BUILD_TYPE_ENV`

### iOS
- **Method**: Info.plist entry set by fastlane before build
- **Implementation**: Native module `BuildConfigModule` reads from Info.plist
- **Files**:
  - `ios/StackMapNative/BuildConfigModule.swift`
  - `ios/StackMapNative/BuildConfigModule.m`
  - `ios/fastlane/Fastfile` `set_build_type_in_plist` private lane
- **Access**: JavaScript reads via `NativeModules.BuildConfigModule.BUILD_TYPE_ENV`

### Web
- **Method**: URL detection
- **Implementation**: `window.location.href` pattern matching
- **File**: `src/config/buildConfig.js` lines 74-86

## Verification Steps

### 1. Verify Android BUILD_TYPE Propagation

#### Step 1: Build a flavor-specific APK
```bash
cd android
./gradlew assembleBetaRelease
```

#### Step 2: Install on device/emulator
```bash
adb install app/build/outputs/apk/beta/release/app-beta-release.apk
```

#### Step 3: Check logs after app launch
```bash
adb logcat | grep BuildConfig
```

**Expected output:**
```
[BuildConfig] Android BuildConfigModule.BUILD_TYPE_ENV: beta
[BuildConfig] Build Type: beta
[BuildConfig] API URL: https://stackmap.app/beta/api/sync
```

#### Step 4: Verify in app settings
1. Open the app
2. Go to Settings screen
3. Look for version info or debug panel
4. Verify API endpoint shows: `stackmap.app/beta/api/sync`

#### Step 5: Test other flavors
Repeat steps 1-4 for:
- `qualRelease` → should use qual endpoint
- `stageRelease` → should use stage endpoint
- `prodRelease` → should use prod endpoint

### 2. Verify iOS BUILD_TYPE Propagation

#### Step 1: Build via fastlane
```bash
cd ios
fastlane beta_ios skip_increment:true
```

#### Step 2: Check Info.plist after build
```bash
/usr/libexec/PlistBuddy -c "Print :BUILD_TYPE_ENV" StackMapNative/Info.plist
```

**Expected output:**
```
beta
```

#### Step 3: Install IPA and check logs
If building locally:
```bash
# Extract IPA from build/release/StackMap-Release.ipa
# Install via Xcode or TestFlight
# Check device logs
```

Via Xcode device logs:
```
[BuildConfig] iOS BuildConfigModule.BUILD_TYPE_ENV: beta
[BuildConfig] Build Type: beta
[BuildConfig] API URL: https://stackmap.app/beta/api/sync
```

#### Step 4: Test different lanes
```bash
# Stage
fastlane stage_ios skip_increment:true
# Verify Info.plist has "stage"

# Production (no BUILD_TYPE_ENV or defaults to "prod")
fastlane prod_ios skip_increment:true
```

### 3. Verify Web BUILD_TYPE Detection

#### Step 1: Run local development
```bash
npm start
# Open http://localhost:3000
```

**Expected**: BUILD_TYPE = qual (localhost detection)

#### Step 2: Check browser console
```javascript
[BuildConfig] Build Type: qual
[BuildConfig] API URL: /api/sync  // Uses webpack proxy
```

#### Step 3: Test deployed environments
```bash
# Deploy to qual
./scripts/qual_deploy.sh --web

# Open https://stackmap.app/qual
# Check console:
[BuildConfig] Build Type: qual
[BuildConfig] API URL: https://stackmap.app/qual/api/sync
```

### 4. End-to-End Verification

This is the most important test - verify the app actually connects to the correct API endpoint.

#### Test Plan:

1. **Build stage app for Android**
   ```bash
   cd android
   fastlane stage_android
   ```

2. **Install and launch app**

3. **Enable sync in app**
   - Create a test account or use existing
   - Check network traffic (Chrome DevTools via USB debugging)
   - Verify requests go to: `https://stackmap.app/stage/api/sync`

4. **Create test data**
   - Add an activity
   - Trigger sync
   - Monitor network requests

5. **Verify in logs**
   ```bash
   adb logcat | grep -E "BuildConfig|Sync|API"
   ```

   **Expected patterns:**
   ```
   [BuildConfig] Android BuildConfigModule.BUILD_TYPE_ENV: stage
   [BuildConfig] API URL: https://stackmap.app/stage/api/sync
   [Sync] Pushing data to: https://stackmap.app/stage/api/sync
   ```

6. **Repeat for other environments**
   - Beta: Should use `/beta/api/sync`
   - Prod: Should use `/api/sync`
   - Qual: Should use `/qual/api/sync`

### 5. Common Issues and Debugging

#### Issue: BUILD_TYPE always returns "prod"

**Android:**
- Check if `BuildConfigModule` is registered in `MainApplication.kt`
- Verify flavor name matches in `build.gradle`
- Clean and rebuild: `./gradlew clean`

**iOS:**
- Check if `BuildConfigModule.swift` and `.m` are in Xcode project
- Verify Info.plist has `BUILD_TYPE_ENV` key after fastlane build
- Clean build folder: `rm -rf ios/build`

#### Issue: JavaScript can't read BUILD_TYPE_ENV

**Android:**
```javascript
// Add debug logging to buildConfig.js
const { NativeModules } = require('react-native');
console.log('All native modules:', Object.keys(NativeModules));
console.log('BuildConfigModule:', NativeModules.BuildConfigModule);
```

**iOS:**
```javascript
// Same debug approach
const { NativeModules } = require('react-native');
console.log('All native modules:', Object.keys(NativeModules));
console.log('BuildConfigModule:', NativeModules.BuildConfigModule);
```

#### Issue: Wrong API endpoint in use

1. Check `src/config/buildConfig.js` logs:
   ```javascript
   if (__DEV__) {
     console.log('[BuildConfig] Build Type:', BUILD_TYPE);
     console.log('[BuildConfig] API URL:', API_URL);
   }
   ```

2. Add temporary logging in production builds:
   ```javascript
   console.log('[BuildConfig] Build Type:', BUILD_TYPE);
   console.log('[BuildConfig] API URL:', API_URL);
   ```

3. Verify sync service uses correct endpoint:
   ```javascript
   // In sync service
   import { API_URL } from '../config/buildConfig';
   console.log('[Sync] Using API URL:', API_URL);
   ```

## Automated Verification Script

Create a test script to verify all flavors:

```bash
#!/bin/bash
# verify-build-types.sh

echo "Testing Android flavors..."

for flavor in qual stage beta prod; do
    echo ""
    echo "Building $flavor..."
    cd android
    ./gradlew clean assemble${flavor^}Release

    # Extract and check BuildConfig
    echo "Checking APK for BUILD_TYPE_ENV=$flavor..."
    # Use apktool or aapt to verify

    cd ..
done

echo ""
echo "Testing iOS builds..."

cd ios
for lane in stage_ios beta_ios; do
    echo ""
    echo "Building $lane..."
    fastlane $lane skip_increment:true

    # Check Info.plist
    build_type=$(/usr/libexec/PlistBuddy -c "Print :BUILD_TYPE_ENV" StackMapNative/Info.plist)
    echo "Info.plist BUILD_TYPE_ENV: $build_type"
done
cd ..

echo ""
echo "Verification complete!"
```

## Success Criteria

✅ **Android**: Each flavor builds successfully and logs show correct BUILD_TYPE_ENV
✅ **iOS**: Each fastlane lane sets correct BUILD_TYPE_ENV in Info.plist
✅ **Web**: URL detection correctly identifies qual/stage/beta/prod
✅ **End-to-End**: Network requests go to correct API endpoints
✅ **No fallbacks**: No builds falling back to prod when stage/beta expected

## Troubleshooting Matrix

| Symptom | Platform | Likely Cause | Solution |
|---------|----------|--------------|----------|
| Always prod | Android | BuildConfig not exposed | Check MainApplication.kt registration |
| Always prod | iOS | Info.plist not updated | Verify fastlane lane calls set_build_type_in_plist |
| Module not found | Android | Native module not compiled | Clean build, check kotlin files |
| Module not found | iOS | Not added to Xcode | Add .swift/.m to project in Xcode |
| Wrong endpoint | All | Old build cached | Clear app data, reinstall |
| undefined | All | JS reads before ready | Add null checks in buildConfig.js |

## Next Steps After Verification

1. Document findings in IMPLEMENTATION_SUMMARY.md
2. Update deployment docs with verification requirements
3. Add pre-deployment checklist item: "Verify BUILD_TYPE propagation"
4. Consider adding automated E2E test that checks API endpoint
