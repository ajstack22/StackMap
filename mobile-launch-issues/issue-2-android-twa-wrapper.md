# Android TWA Wrapper - Create Android app using Trusted Web Activity

## Overview
Create an Android application wrapper for StackMap using Trusted Web Activity (TWA) technology to enable distribution through Google Play Store.

## Background
- App name: **StackMap**
- Target: Google Play Store
- Technology: Trusted Web Activity (TWA)
- Timeline: Complete within 2 weeks
- Approach: Simple wrapper initially, native features can be added later

## Acceptance Criteria
- [ ] Android Studio project created with TWA configuration
- [ ] App successfully loads StackMap PWA in fullscreen mode
- [ ] Digital Asset Links verified between app and website
- [ ] App icon and splash screen properly displayed
- [ ] App builds and runs on Android 6.0+ (API 23+)
- [ ] Signed APK/AAB ready for Play Store upload
- [ ] Play Store listing requirements met
- [ ] App passes pre-launch report in Play Console
- [ ] Offline functionality works as expected
- [ ] Deep links handled correctly

## Technical Requirements

### 1. Project Setup
```gradle
// build.gradle dependencies
implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
```

### 2. AndroidManifest.xml Configuration
```xml
<activity android:name="com.google.androidbrowserhelper.trusted.LauncherActivity">
    <meta-data android:name="android.support.customtabs.trusted.DEFAULT_URL"
               android:value="https://stackmap.app" />
    
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    
    <!-- Deep linking -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="https"
              android:host="stackmap.app"/>
    </intent-filter>
</activity>
```

### 3. Digital Asset Links
Create `.well-known/assetlinks.json` on the web server:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.stackmap.app",
    "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_HERE"]
  }
}]
```

### 4. Build Configuration
- Package name: `com.stackmap.app`
- Minimum SDK: API 23 (Android 6.0)
- Target SDK: Latest stable (API 34)
- Version code: 1
- Version name: "1.0.0"

### 5. App Resources
- Launcher icon: Adaptive icon following Material Design
- Splash screen: Matches PWA splash screen
- App theme: Light theme matching PWA colors

### 6. Play Store Requirements
- App Bundle (AAB) format required
- 64-bit architecture support
- Target API level requirements met
- Privacy policy URL configured
- Data safety form completed

## Implementation Steps

1. **Initialize Android Project**
   ```bash
   # Using Android Studio or command line
   # Create new project with "No Activity"
   # Add androidbrowserhelper dependency
   ```

2. **Configure TWA**
   - Set up LauncherActivity
   - Configure manifest
   - Add required permissions

3. **Asset Links Verification**
   - Generate app signing key
   - Get SHA256 fingerprint
   - Deploy assetlinks.json to web server
   - Test verification

4. **Build and Test**
   - Test on multiple Android versions
   - Verify PWA features work
   - Check offline functionality
   - Test deep links

5. **Prepare for Release**
   - Generate signed AAB
   - Optimize with R8/ProGuard
   - Run pre-launch tests

## Testing Checklist
- [ ] App launches without browser UI
- [ ] Status bar color matches theme
- [ ] Navigation works correctly
- [ ] Back button behavior is correct
- [ ] App works offline
- [ ] Updates are handled properly
- [ ] Deep links open in app
- [ ] App doesn't crash on various devices
- [ ] Memory usage is reasonable

## Resources
- [TWA Quick Start Guide](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start/)
- [Google Play Console](https://play.google.com/console)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)

## Dependencies
- Depends on: PWA Store Readiness issue
- Blocks: Store submission

## Notes for LLM Developers
- Use Android Studio for easier development
- TWA is preferred over WebView for better performance
- Ensure all PWA features are accessible
- Keep the initial version simple, add native features later
- Test thoroughly on different Android versions

## Labels
- enhancement
- mobile
- android
- twa