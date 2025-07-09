# 🚨 CRITICAL: Android Build Setup - READ THIS FIRST! 🚨

## ⚠️ IMPORTANT: Java Version Requirements ⚠️

This React Native app **REQUIRES Java 17** to build for Android. Using any other Java version (especially Java 24) will cause build failures!

## Quick Start Commands

### 🎯 To Run Android App:
```bash
./run-android.sh
```

### 🔨 To Build Android APK:
```bash
./build-android.sh assembleRelease
```

### 🧹 To Clean Android Build:
```bash
./build-android.sh clean
```

## Why These Scripts?

The system might have multiple Java versions installed. These scripts **FORCE Java 17** to be used, preventing version conflicts.

## Manual Setup (if scripts don't work)

### 1. Install Java 17 (if not already installed)
```bash
# On macOS with Homebrew
brew install openjdk@17

# Verify installation
ls /opt/homebrew/opt/openjdk@17
```

### 2. Set JAVA_HOME for your session
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

### 3. Verify Java version
```bash
java -version
# Should show: openjdk version "17.x.x"
```

### 4. Run Android commands
```bash
npm run android
# OR
cd android && ./gradlew assembleDebug
```

## Common Issues and Fixes

### Issue: "Unsupported class file major version 68"
**Cause**: Using Java 24 instead of Java 17
**Fix**: Use the provided scripts or manually set JAVA_HOME to Java 17

### Issue: "Could not create task ':react-native-reanimated:outgoingVariants'"
**Cause**: Gradle version incompatibility
**Fix**: 
1. Use the provided scripts which set the correct Java version
2. Clean build: `./build-android.sh clean`
3. Rebuild: `./run-android.sh`

### Issue: Build fails with gradle errors
**Fix**:
```bash
# Clear all caches and rebuild
cd android
./gradlew clean
./gradlew --stop
rm -rf ~/.gradle/caches/
cd ..
./run-android.sh
```

## Project Configuration

Current versions (DO NOT CHANGE without testing):
- **Java**: 17 (OpenJDK)
- **Gradle**: 8.8
- **Android Gradle Plugin**: 8.9.2
- **Build Tools**: 35.0.0
- **Compile SDK**: 35
- **Min SDK**: 24
- **Target SDK**: 35

## 📝 Notes

1. **Always use the provided scripts** (`run-android.sh`, `build-android.sh`) to ensure correct Java version
2. **Do NOT use system Java** if it's version 24 or higher
3. **Scripts location**: `/Users/adamstack/StackMap/StackMap/StackMapNative/`
4. **Scripts are executable**: If not, run `chmod +x run-android.sh build-android.sh`

## Verification Checklist

Before reporting Android build issues:
- [ ] Did you use `./run-android.sh` instead of `npm run android`?
- [ ] Does `java -version` show version 17 when inside the script?
- [ ] Have you tried `./build-android.sh clean` first?
- [ ] Is Java 17 installed at `/opt/homebrew/opt/openjdk@17`?

---

**Last Updated**: January 2025
**Reason**: Java 24 incompatibility with Gradle 8.8