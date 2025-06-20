# StackMap Android App

This is the Android platform for StackMap, built using Capacitor. The app provides a native Android experience while leveraging the web-based StackMap application.

## Prerequisites

- Android Studio Arctic Fox (2020.3.1) or later
- Android SDK (API level 22 minimum, 34 recommended)
- Java JDK 11 or later
- Node.js 14.0.0 or later
- npm or yarn

## Quick Start

1. **Sync Capacitor**
   ```bash
   npm run android:sync
   # or from project root:
   npx cap sync android
   ```

2. **Build Debug APK**
   ```bash
   cd android
   ./build-debug.sh
   ```

3. **Install on Device**
   ```bash
   ./install-debug.sh
   ```

## Build Scripts

### Debug Build
```bash
./build-debug.sh
```
Generates: `stackmap-debug.apk`

### Release Build
```bash
./build-release.sh
```
Generates: 
- `release-builds/stackmap-v{version}-release.apk`
- `release-builds/stackmap-v{version}-release.aab`

### Install Debug on Device
```bash
./install-debug.sh
```
Builds and installs debug APK on connected devices.

## Configuration

### App Information
- **Package Name**: `com.stackmap.app`
- **App Name**: StackMap
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 34 (Android 14)

### Signing Configuration

1. **Generate Release Key**
   ```bash
   ./generate-release-key.sh
   ```

2. **Configure Signing**
   
   Update `gradle.properties` or set environment variables:
   ```properties
   STACKMAP_UPLOAD_STORE_FILE=../stackmap-release.keystore
   STACKMAP_UPLOAD_STORE_PASSWORD=your_store_password
   STACKMAP_UPLOAD_KEY_ALIAS=stackmap-key
   STACKMAP_UPLOAD_KEY_PASSWORD=your_key_password
   ```

### Digital Asset Links (TWA)

1. **Generate Asset Links**
   ```bash
   ./generate-asset-links.sh --keystore path/to/keystore --alias key-alias
   ```

2. **Upload to Website**
   
   Upload the generated `assetlinks.json` to:
   ```
   https://stackmap.app/.well-known/assetlinks.json
   ```

## Features

### Offline Support
- Service Worker integration for offline functionality
- Cached assets for offline access
- Offline page fallback

### App Icons
- Adaptive icons for Android 8.0+
- Legacy icons for older devices
- Notification icons

Run `./generate-android-icons.sh` to regenerate icons.

### Splash Screens
- Android 12+ splash screen API
- Legacy splash screens for older devices

Run `./generate-splash-screens.sh` to regenerate splash screens.

### Security
- Network Security Configuration
- ProGuard optimization for release builds
- No cleartext traffic allowed
- Certificate pinning for stackmap.app

## VS Code Integration

Use VS Code tasks (Cmd/Ctrl + Shift + P → "Tasks: Run Task"):
- `Android: Sync Capacitor`
- `Android: Build Debug APK`
- `Android: Build Release`
- `Android: Install Debug`
- `Android: Generate Icons`
- `Android: Generate Splash Screens`
- `Android: Open in Android Studio`

## Testing

Run unit tests:
```bash
./gradlew test
```

Run instrumented tests:
```bash
./gradlew connectedAndroidTest
```

## Troubleshooting

### Build Failures
1. Clean the build:
   ```bash
   ./gradlew clean
   ```

2. Sync Capacitor:
   ```bash
   npx cap sync android
   ```

3. Check Java version:
   ```bash
   java -version  # Should be 11 or later
   ```

### Signing Issues
- Ensure keystore file exists
- Check password configuration in gradle.properties
- Verify key alias matches

### Device Installation
- Enable USB debugging on device
- Accept RSA fingerprint on first connection
- Check device appears in `adb devices`

## Google Play Store Submission

1. **Build Release Bundle**
   ```bash
   ./build-release.sh
   ```

2. **Test Release Build**
   ```bash
   java -jar bundletool.jar build-apks --bundle=release-builds/stackmap-v1.3.0-release.aab --output=test.apks
   java -jar bundletool.jar install-apks --apks=test.apks
   ```

3. **Upload to Play Console**
   - Use the `.aab` file for production releases
   - Update version code for each release
   - Complete store listing requirements

## Maintenance

### Update Dependencies
```bash
./gradlew dependencies --write-locks
```

### Update Capacitor
```bash
npm update @capacitor/android @capacitor/core
npx cap sync android
```

### Clean Build Cache
```bash
./gradlew cleanBuildCache
rm -rf ~/.gradle/caches/
```

## Directory Structure
```
android/
├── app/                    # Main application module
│   ├── src/               # Source code
│   │   ├── main/          # Main source set
│   │   │   ├── assets/    # Web assets
│   │   │   ├── java/      # Java/Kotlin code
│   │   │   └── res/       # Android resources
│   │   └── test/          # Unit tests
│   └── build.gradle       # App-level build config
├── build.gradle           # Project-level build config
├── gradle.properties      # Gradle properties
├── *.sh                   # Build and utility scripts
└── README.md             # This file
```

## Support

For issues specific to the Android platform, check:
- Android Studio logs
- `adb logcat` output
- Build output in `app/build/reports/`

For general StackMap issues, see the main project documentation.