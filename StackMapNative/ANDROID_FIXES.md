# Android Build Fixes

## Problem
The app crashes on Android because:
1. `react-native-reanimated` was disabled in `react-native.config.js` 
2. `react-native-gesture-handler` was disabled (depends on reanimated)
3. `react-native-draggable-flatlist` was disabled (depends on gesture handler)
4. But the app still imports and uses these libraries, causing a crash

## Solution Options

### Option 1: Re-enable the libraries (Recommended)
1. Install proper build tools:
   ```bash
   # Install Android NDK and CMake
   sdkmanager "ndk;25.1.8937393"
   sdkmanager "cmake;3.22.1"
   ```

2. Remove the exclusions from `react-native.config.js`

3. Rebuild with new architecture enabled

### Option 2: Create Android-specific code without these features
1. Disable drag-and-drop on Android
2. Use regular FlatList instead of DraggableFlatList
3. Remove gesture handler dependencies

## Current Status
- Build succeeds but app crashes at runtime
- Error: "Native part of Reanimated doesn't seem to be initialized"
- Need to either fix the native dependencies or remove their usage