# Android Platform Guide - StackMap

This guide consolidates all Android-specific development information for StackMap.

## Quick Reference

### Development Commands
```bash
# AUTOMATED DEPLOYMENT (Recommended)
./scripts/deploy-android-all.sh  # Full deployment with version increment
./scripts/deploy-android-quick.sh  # Quick reload for minor changes

# Manual commands (if needed)
npx react-native run-android  # Run with Metro
adb devices  # List available devices
cd android && ./gradlew clean && cd ..  # Clean build
cd android && ./gradlew assembleDebug  # Build debug APK
```

### Project Requirements
- **React Native**: 0.74.3
- **Android**: 6.0+ (API 23)
- **Java**: 17 (CRITICAL - see build setup)
- **Gradle**: 8.8
- **Android SDK**: API 35

## Project Structure

```
android/
├── app/build.gradle     # compileSdkVersion 34, minSdkVersion 23
├── app/src/main/AndroidManifest.xml  # Permissions
├── build.gradle        # Project-level config
└── gradle.properties   # Build settings
```

## Critical Build Setup

### 🚨 Java 17 Requirement
**CRITICAL:** This app REQUIRES Java 17. Using Java 24 will cause build failures!

```bash
# Quick verification
java -version
# Should show: openjdk version "17.x.x"
```

### Project Configuration (DO NOT CHANGE)
- **Java**: 17 (OpenJDK)
- **Gradle**: 8.8
- **Android Gradle Plugin**: 8.9.2
- **Build Tools**: 35.0.0
- **Compile SDK**: 35
- **Min SDK**: 24
- **Target SDK**: 35

### Build Scripts (Recommended)
Use the provided scripts that force Java 17:
```bash
# To run the app
./scripts/react-native/run-android.sh

# To build APK
./scripts/react-native/build-android.sh assembleRelease

# To clean build
./scripts/react-native/build-android.sh clean
```

### Manual Java 17 Setup (if scripts don't work)
```bash
# Install Java 17 (macOS with Homebrew)
brew install openjdk@17

# Set JAVA_HOME for session
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

# Verify
java -version  # Should show version 17
```

## Android-Specific Issues & Solutions

### 1. FlexWrap Card Layouts (CRITICAL)
**Problem:** Android needs specific layout approach for multi-column grids.
**Solution:** Use percentage widths with alignContent:

```javascript
// ❌ DON'T use calculateCardWidth() on Android
// ✅ DO use percentage widths
flexWrap: 'wrap',
alignContent: 'flex-start',
// Card widths: 48% for 2-column, etc.
```

### 2. Font Weight Differences (CRITICAL)
**Problem:** Android renders fonts differently than iOS.
**Solution:** Use font variants without fontWeight property:

```javascript
// Typography component handles this automatically
// ❌ DON'T do this on Android:
fontWeight: 'bold',
fontFamily: 'Comic Relief'

// ✅ DO this (Typography component handles):
fontWeight: 'bold'  // Component uses ComicRelief-Bold variant
```

**Key Points:**
- iOS/Web: Uses fontWeight with "Comic Relief" font
- Android: Uses font variants (ComicRelief-Bold/Regular) without fontWeight
- Typography component handles this automatically

### 3. Tablet Layout (2-Column Grid)
**Problem:** Activities need responsive grid layout on tablets.
**Solution:** Dynamic column calculation:

```javascript
const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && aspectRatio > 1.2;
};

const numColumns = isTablet() && width >= 768 ? 2 : 1;
```

### 4. Swipe Gesture Sensitivity
**Problem:** Android needs lower thresholds for swipe detection.
**Solution:** Platform-specific thresholds:

```javascript
const swipeThreshold = Platform.OS === 'android' ? screenWidth * 0.1 : screenWidth * 0.2;
const velocityThreshold = Platform.OS === 'android' ? 0.3 : 0.5;
```

### 5. StatusBar Handling
**Problem:** Android needs explicit StatusBar management.
**Solution:** Add StatusBar height compensation:

```javascript
{Platform.OS === 'android' && (
  <View style={{ 
    backgroundColor: theme.primary, 
    height: StatusBar.currentHeight || 24 
  }} />
)}
```

### 6. TextInput Color Issues
**Problem:** TextInput shows white text on white background on some Android devices.
**Solution:** Force black text color in Typography component:

```javascript
// In Typography/index.js TextInput component
style={[
  style,
  { 
    fontFamily,
    ...(Platform.OS === 'android' && { color: '#000000' })
  }
]}
```

### 7. ScrollView Touch Initialization
**Problem:** ScrollView inside modals won't scroll until a touchable element is pressed first.
**Solution:** Add nestedScrollEnabled prop:

```javascript
<ScrollView 
  nestedScrollEnabled={true}
  // other props
>
```

## Build Issues & Fixes

### 1. Java Version Error
**Error:** "Unsupported class file major version 68"
**Cause:** Using Java 24 instead of Java 17
**Fix:** Use provided scripts or manually set JAVA_HOME to Java 17

### 2. Gradle Build Failures
```bash
# Fix most build issues
cd android
./gradlew clean
./gradlew --stop  # Stop Gradle daemon
cd ..
npx react-native run-android
```

### 3. Emulator Not Starting
```bash
# List AVDs
emulator -list-avds

# Start emulator manually
emulator -avd Pixel_8_Pro_API_34

# Cold boot if frozen
emulator -avd Pixel_8_Pro_API_34 -no-snapshot-load
```

### 4. Metro Bundler Issues
```bash
# Reset Metro
npx react-native start --reset-cache

# If port 8081 is in use
npx react-native start --port=8082
```

### 5. ADB Connection Issues
```bash
# Restart ADB
adb kill-server
adb start-server

# Reverse port for Metro
adb reverse tcp:8081 tcp:8081
```

### 6. react-native-reanimated Issues (Legacy)
**Problem:** App crashes due to disabled react-native-reanimated
**Solution:** Libraries were re-enabled with proper build tools:
- NDK and CMake installed
- New architecture enabled
- Proper gradle configuration

## Building for Release

### Debug APK
```bash
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK
```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Bundle for Play Store
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## Performance Optimizations

### Android-Specific Patterns
- Use `removeClippedSubviews` for large FlatLists
- Set appropriate `windowSize` for FlatLists
- Use `getItemLayout` when possible
- Optimize image sizes and formats

### Memory Management
- Be careful with large images
- Use `resizeMode: 'contain'` for images
- Clean up event listeners in useEffect cleanup

## Debugging Tools

### Logcat Filtering
```bash
# View StackMap-specific logs
adb logcat | grep -i stackmap

# View React Native logs
adb logcat | grep -i "ReactNativeJS"
```

### React Native Debug Menu
- Press Cmd+M (Mac) or Ctrl+M (Windows/Linux) in emulator
- Options: Reload, Debug, Dev Settings

### Device Testing
```bash
# List devices
adb devices

# Run on specific device
npx react-native run-android --deviceId="emulator-5554"

# Install APK directly
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Key Testing Devices

- **Phone**: Pixel 8 Pro (API 34)
- **Tablet**: Pixel Tablet (API 34)
- **Test orientations**: Portrait & landscape
- **API compatibility**: 23+ (Android 6.0+)

## Common Android Gotchas

- FlatList vs DraggableFlatList behavior differences
- Shadow/elevation differences from iOS
- Back button handling with BackHandler
- Keyboard avoiding view differences
- Different animation performance characteristics

## Key Files Reference

- `App.js` - Grid layout and responsive logic
- `src/constants/index.js` - isTablet() utility
- `src/components/Typography/index.js` - Font handling
- Styles files with Platform.OS checks

## Testing Checklist

Before committing Android changes:
- [ ] Test on Pixel 8 Pro emulator (phone)
- [ ] Test on Pixel Tablet emulator (tablet)
- [ ] Check portrait and landscape orientations
- [ ] Verify 2-column layout on tablets
- [ ] Test swipe gestures and touch responsiveness
- [ ] Check font rendering (Comic Relief)
- [ ] Verify TextInput color and keyboard behavior
- [ ] Test StatusBar appearance
- [ ] Check card layout alignment (FlexWrap)

## Update Instructions

When fixing Android issues:
1. Test on both phone and tablet emulators
2. Check landscape/portrait orientations
3. Document any platform-specific code added
4. Always use the provided build scripts
5. Verify Java 17 is being used
6. Test APK generation for releases

## Verification Checklist

Before reporting Android build issues:
- [ ] Did you use `./scripts/react-native/run-android.sh` instead of `npm run android`?
- [ ] Does `java -version` show version 17?
- [ ] Have you tried `./scripts/react-native/build-android.sh clean` first?
- [ ] Is Java 17 installed at `/opt/homebrew/opt/openjdk@17`?