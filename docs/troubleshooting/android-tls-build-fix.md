# Android Build Failure - TLS Handshake Fix

## Problem Summary

**Date Identified:** October 29, 2025
**Affected Environment:** Android QUAL builds
**Error Type:** TLS handshake failure during Gradle dependency resolution

### Error Message
```
FAILURE: Build failed with an exception.

* What went wrong:
A problem occurred configuring project ':react-native-clipboard_clipboard'.
> Could not resolve all dependencies for configuration 'classpath'.
   > Could not resolve com.android.tools.layoutlib:layoutlib-api:26.2.1.
      > Could not GET 'https://dl.google.com/dl/android/maven2/com/android/tools/layoutlib/layoutlib-api/26.2.1/layoutlib-api-26.2.1.pom'.
         > The server may not support the client's requested TLS protocol versions: (TLSv1.2, TLSv1.3).
            > Remote host terminated the handshake
```

### Symptoms
- Android APK build fails during Gradle dependency resolution
- Multiple TLS handshake errors for various Android build tools dependencies (layoutlib-api, dvlib, repository)
- Deployment script reports success but APK file is never created
- Emulators remain on old versions

## Root Cause Analysis

### Primary Issue
The `@react-native-clipboard/clipboard` package (v1.16.3) contains an outdated `build.gradle` configuration that specifies:
```gradle
classpath 'com.android.tools.build:gradle:3.2.1'
```

This Gradle plugin version (3.2.1) is from 2018 and attempts to download Android build tools version 26.2.1, which are no longer available via modern TLS protocols on Google's Maven servers.

### Secondary Issue
The `react-native-camera` package uses product flavors with a dimension name that conflicts with our environment-based product flavors (qual/stage/beta/prod).

## Solution Implemented

### 1. Patch @react-native-clipboard Package

**Tool Used:** `patch-package` (automated patching system)

**Changes Made:**
- Removed the outdated `buildscript` block from `@react-native-clipboard/clipboard/android/build.gradle`
- The library now inherits the modern Gradle plugin from the root project's build.gradle

**Files Modified:**
- Created patch file: `/patches/@react-native-clipboard+clipboard+1.16.3.patch`
- Updated `package.json` to run `patch-package` on `postinstall`

**Patch Content:**
```diff
-buildscript {
-    repositories {
-        google()
-        mavenCentral()
-    }
-
-    dependencies {
-        classpath 'com.android.tools.build:gradle:3.2.1'
-    }
-}
+// Removed outdated buildscript block - inherits from root project
+// which uses modern Gradle plugin compatible with current Android SDK
```

### 2. Resolve Product Flavor Conflict

**Issue:** react-native-camera defines product flavors with dimension "react-native-camera" (general/mlkit), conflicting with our "environment" dimension (qual/stage/beta/prod).

**Solution:** Added `missingDimensionStrategy` to `/android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.stackmapnative"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 251029004
    versionName "25.10.29"

    // Handle react-native-camera product flavor dimension
    missingDimensionStrategy 'react-native-camera', 'general'
}
```

This tells Gradle to always use the 'general' flavor of react-native-camera for all our environment flavors.

### 3. Clean Gradle Cache

Corrupted Gradle cache from failed builds needed to be removed:
```bash
rm -rf ~/.gradle/caches/8.11.1
cd android && ./gradlew clean --no-daemon
```

## Verification Steps

1. **Build Success:**
   ```bash
   cd /Users/adamstack/StackMap/StackMap/android
   ./gradlew assembleQualDebug --no-daemon
   # Result: BUILD SUCCESSFUL in 1m 50s
   ```

2. **APK Created:**
   ```bash
   ls -lh android/app/build/outputs/apk/qual/debug/app-qual-debug.apk
   # Result: 119MB APK file exists
   ```

3. **Deployment Successful:**
   ```bash
   adb devices
   # emulator-5554 (Pixel 9 Pro XL)
   # emulator-5556 (Pixel Tablet)

   adb -s emulator-5554 install -r android/app/build/outputs/apk/qual/debug/app-qual-debug.apk
   adb -s emulator-5556 install -r android/app/build/outputs/apk/qual/debug/app-qual-debug.apk
   # Both: Success
   ```

4. **Version Verification:**
   ```bash
   adb -s emulator-5554 shell dumpsys package com.stackmapnative.qual | grep versionName
   # Result: versionName=25.10.29-qual

   adb -s emulator-5556 shell dumpsys package com.stackmapnative.qual | grep versionName
   # Result: versionName=25.10.29-qual
   ```

## Prevention Strategy

### 1. Automated Patch Application
The `postinstall` script in `package.json` ensures patches are automatically applied after:
- `npm install`
- `npm ci`
- Fresh repository clones

**Configuration:**
```json
"scripts": {
  "postinstall": "patch-package"
}
```

### 2. Patch File Maintenance
- Patch files are committed to the repository in `/patches/` directory
- Version-specific patches (e.g., `@react-native-clipboard+clipboard+1.16.3.patch`)
- If package is updated, patches may need to be recreated

### 3. Dependency Monitoring
Monitor these packages for updates that may resolve the underlying issues:
- `@react-native-clipboard/clipboard` - Currently at 1.16.3
- `react-native-camera` - Currently at 4.2.1

### 4. Future Build Failures
If similar TLS errors occur with other packages:

1. Identify the package with outdated Gradle configuration:
   ```bash
   grep -r "com.android.tools.build:gradle:3" node_modules/*/android/build.gradle
   ```

2. Modify the problematic build.gradle file

3. Create a patch:
   ```bash
   npx patch-package <package-name>
   ```

4. Verify the patch works:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleQualDebug
   ```

## Technical Details

### Environment
- **Gradle Version:** 8.11.1
- **Android Gradle Plugin:** 8.9.2 (via root project)
- **Build Tools Version:** 35.0.0
- **Compile SDK Version:** 35
- **Target SDK Version:** 35
- **Min SDK Version:** 24
- **JVM:** 17.0.15 (Homebrew)
- **Kotlin:** 2.0.20

### Build Configuration
- **Product Flavors:** qual, stage, beta, prod (dimension: "environment")
- **Build Types:** debug, release
- **Architecture:** arm64-v8a (for emulators)
- **Hermes:** Enabled

### Affected Packages
1. **@react-native-clipboard/clipboard@1.16.3**
   - Issue: Outdated Gradle plugin (3.2.1 from 2018)
   - Solution: Removed buildscript block via patch

2. **react-native-camera@4.2.1**
   - Issue: Product flavor dimension conflict
   - Solution: Added missingDimensionStrategy

## Related Files

### Modified Files
- `/package.json` - Added postinstall script
- `/android/app/build.gradle` - Added missingDimensionStrategy and updated version
- `/patches/@react-native-clipboard+clipboard+1.16.3.patch` - Patch file for clipboard package

### Reference Documentation
- [Gradle Product Flavors Documentation](https://developer.android.com/studio/build/build-variants#product-flavors)
- [patch-package Documentation](https://github.com/ds300/patch-package)
- [React Native Android Build Guide](https://reactnative.dev/docs/signed-apk-android)

## Lessons Learned

1. **Legacy Dependencies:** Third-party React Native packages may contain outdated Android build configurations that break with modern tooling
2. **TLS Protocol Changes:** Google's Maven servers have deprecated older TLS protocols, causing build failures for packages using ancient Android build tools
3. **Product Flavor Conflicts:** Multiple libraries using product flavors can create dimension conflicts requiring explicit resolution strategies
4. **Gradle Cache:** Build failures can corrupt Gradle cache, requiring full cleanup before successful rebuild
5. **patch-package:** Essential tool for maintaining forked dependencies without manual modifications after each `npm install`

## Status

- **Status:** Resolved
- **Date Fixed:** October 29, 2025
- **Tested:** Yes - Both Pixel 9 Pro XL and Pixel Tablet emulators
- **Production Impact:** None (QUAL environment only)
- **Follow-up Required:** Monitor for package updates that may resolve underlying issues
