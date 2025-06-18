# StackMap Android TWA Wrapper

This directory contains the Android Trusted Web Activity (TWA) wrapper for StackMap, enabling distribution through the Google Play Store.

## Overview

This TWA wrapper provides a native Android app experience for the StackMap PWA, with features including:
- Full-screen display without browser UI
- Native app icon and splash screen
- Deep linking support
- Offline functionality
- Play Store distribution

## Prerequisites

- Android Studio (recommended) or Android SDK
- Java 17 or higher
- Node.js and npm (for the PWA)
- A signing key for release builds

## Project Structure

```
android-twa/
├── app/                    # Main application module
│   ├── src/main/          # Source files
│   │   ├── AndroidManifest.xml
│   │   └── res/           # Resources (icons, strings, etc.)
│   └── build.gradle       # App-level build configuration
├── build.gradle           # Project-level build configuration
├── settings.gradle        # Project settings
├── gradle.properties      # Gradle properties
└── build scripts          # Helper scripts for building
```

## Quick Start

### 1. Development Build

```bash
# Build debug APK
./build-debug.sh

# Or using gradle directly
./gradlew assembleDebug
```

The debug APK will be generated at: `app/build/outputs/apk/debug/app-debug.apk`

### 2. Install on Device

```bash
# Install on connected device/emulator
./gradlew installDebug

# Or use adb directly
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Release Build

### 1. Generate Signing Key (First Time Only)

```bash
./generate-signing-key.sh
```

This will:
- Create a keystore file
- Generate the SHA256 fingerprint for Digital Asset Links
- Provide instructions for signing your app

**Important**: Keep your keystore file safe and never commit it to version control!

### 2. Configure Digital Asset Links

1. Get the SHA256 fingerprint from your signing key
2. Update `.well-known/assetlinks.json` with your fingerprint
3. Deploy the file to your web server at: `https://stackmap.app/.well-known/assetlinks.json`

### 3. Build Release Bundle

```bash
# Build AAB (Android App Bundle)
./build-release.sh

# Sign the bundle
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore your-release-key.keystore \
  app/build/outputs/bundle/release/app-release.aab \
  your-key-alias
```

## Configuration

### Update Web App URL

Edit the URL in `app/build.gradle`:
```gradle
resValue "string", "web_app_url", "https://stackmap.app"
```

### Customize App Theme

Edit colors in `app/src/main/res/values/colors.xml`:
```xml
<color name="primary_color">#667eea</color>
```

### Update App Version

In `app/build.gradle`:
```gradle
versionCode 2        // Increment for each release
versionName "1.0.1"  // User-visible version
```

## Testing Checklist

Before releasing, ensure:

- [ ] App launches without browser UI
- [ ] Status bar matches app theme
- [ ] Splash screen displays correctly
- [ ] Deep links work properly
- [ ] Offline functionality works
- [ ] Back button behavior is correct
- [ ] App orientation is locked (if desired)
- [ ] All PWA features are accessible

## Troubleshooting

### Digital Asset Links Not Verified

1. Check the SHA256 fingerprint matches exactly
2. Ensure assetlinks.json is accessible at the correct URL
3. Test with: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://stackmap.app&relation=delegate_permission/common.handle_all_urls`

### App Shows Browser UI

1. Verify Digital Asset Links are properly configured
2. Check that Chrome/Custom Tabs is up to date
3. Ensure the device has internet connection on first launch

### Icons Not Displaying

1. Regenerate icons using: `./generate-icons.sh`
2. Ensure all mipmap directories have icons
3. Clean and rebuild the project

## Play Store Submission

1. **Prepare Store Listing**:
   - App name: StackMap
   - Category: Education / Productivity
   - Content rating: Everyone
   - Target audience: Families with special needs children

2. **Upload Release Bundle**:
   - Use the signed AAB file
   - Complete the app content questionnaire
   - Set up pricing (Free)

3. **Required Information**:
   - Privacy policy URL
   - App description
   - Screenshots (phone and tablet)
   - Feature graphic

4. **Testing**:
   - Internal testing track first
   - Closed testing with beta users
   - Production release

## Maintenance

### Updating the TWA

1. Increment version in `app/build.gradle`
2. Build new release bundle
3. Sign with the same keystore
4. Upload to Play Console

### Updating Dependencies

```bash
# Check for updates
./gradlew dependencyUpdates

# Update in build.gradle
implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
```

## Resources

- [TWA Documentation](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundles](https://developer.android.com/guide/app-bundle)

## Support

For issues specific to the Android wrapper:
1. Check the troubleshooting section
2. Review Android Studio logs
3. Test with the debug build
4. Create an issue on GitHub