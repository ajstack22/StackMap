# Android Build Fixes

## Java Version Issue - FIXED (January 2025)

### Problem
The Android build was failing with:
```
Unsupported class file major version 68
```

This was caused by:
- System had Java 24 installed (class file major version 68)
- React Native requires Java 17 
- Gradle 8.11.1 is incompatible with Java 24

### Solution
Created shell scripts that force Java 17 usage:
- `./run-android.sh` - For running the app
- `./build-android.sh` - For building APKs

These scripts set:
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

### How to Use
1. **Always use the provided scripts:**
   ```bash
   # To run the app
   ./run-android.sh
   
   # To build APK
   ./build-android.sh assembleRelease
   
   # To clean build
   ./build-android.sh clean
   ```

2. **Verify Java version in script:**
   The scripts will output: `openjdk version "17.0.15"`

### If Scripts Don't Work
1. Install Java 17: `brew install openjdk@17`
2. Set JAVA_HOME manually before running gradle
3. See [ANDROID_BUILD_SETUP.md](./ANDROID_BUILD_SETUP.md) for detailed instructions

## Previous Issues (Resolved)

### Problem
The app crashes on Android because:
1. `react-native-reanimated` was disabled in `react-native.config.js` 
2. `react-native-gesture-handler` was disabled (depends on reanimated)
3. `react-native-draggable-flatlist` was disabled (depends on gesture handler)
4. But the app still imports and uses these libraries, causing a crash

### Solution Options

#### Option 1: Re-enable the libraries (Recommended)
1. Install proper build tools:
   ```bash
   # Install Android NDK and CMake
   sdkmanager "ndk;25.1.8937393"
   sdkmanager "cmake;3.22.1"
   ```

2. Remove the exclusions from `react-native.config.js`

3. Rebuild with new architecture enabled

#### Option 2: Create Android-specific code without these features
1. Disable drag-and-drop on Android
2. Use regular FlatList instead of DraggableFlatList
3. Remove gesture handler dependencies

### Current Status
- iOS builds work fine
- Android has gradle configuration issues with react-native-reanimated
- App functionality is complete, just need to resolve build toolchain issues