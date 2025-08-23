# StackMap Distribution Guide

## 🍎 iOS Distribution via TestFlight

### Prerequisites
- Apple Developer Account ($99/year)
- Xcode installed
- App registered in App Store Connect

### Steps

1. **Build for Release**
   ```bash
   cd ios
   xcodebuild -workspace StackMapNative.xcworkspace -scheme StackMapNative -configuration Release
   ```

2. **Archive in Xcode**
   - Open `ios/StackMapNative.xcworkspace`
   - Select "Any iOS Device" as target
   - Product → Archive
   - Wait for archive completion

3. **Upload to TestFlight**
   - In Organizer, click "Distribute App"
   - Select "App Store Connect"
   - Upload and wait for processing

4. **Configure TestFlight**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Navigate to StackMap → TestFlight
   - Add test information
   - Add testers by email

### Testing Coordination
- Internal Testing: Up to 100 testers, immediate availability
- External Testing: Up to 10,000 testers, requires Apple review
- Testers receive email invitation with TestFlight link

## 🤖 Android Distribution Options

### Option 1: Direct APK Distribution (Easiest)

1. **Build Release APK**
   ```bash
   ./scripts/react-native/build-android-release.sh
   ```

2. **Share APK** (location: `android/app/build/outputs/apk/release/app-release.apk`)
   - Upload to Google Drive and share link
   - Email directly (if under 25MB)
   - Use file sharing services (Dropbox, WeTransfer)

3. **Installation Instructions for Testers**
   - Enable "Install from Unknown Sources" in Android settings
   - Download and tap APK to install

### Option 2: Google Play Console (Internal Testing)

1. **Prerequisites**
   - Google Play Developer Account ($25 one-time)
   - Signed APK (see signing instructions below)

2. **Upload to Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create app if not exists
   - Internal testing → Create new release
   - Upload APK

3. **Add Testers**
   - Create email list of testers
   - Share opt-in link

### Option 3: Firebase App Distribution

1. **Setup Firebase**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

2. **Upload APK**
   ```bash
   firebase appdistribution:distribute android/app/build/outputs/apk/release/app-release.apk \
     --app YOUR_FIREBASE_APP_ID \
     --groups "testers"
   ```

3. **Benefits**
   - No app store approval needed
   - Instant distribution
   - Analytics on installs

## 📝 Version Management

### Current Version
- Format: YYYY.MM.DD.BUILD (e.g., 2025.08.23.1)
- Unified across all platforms

### Incrementing Versions

**iOS** (in Xcode or Info.plist):
- Version: YYYY.MM.DD.BUILD format
- Build: Auto-incremented by deployment scripts

**Android** (in android/app/build.gradle):
```gradle
versionCode // Auto-calculated from date
versionName "YYYY.MM.DD.BUILD"  // Matches package.json
```

## 🔐 Signing Android APK (For Production)

1. **Generate Keystore**
   ```bash
   cd android/app
   keytool -genkey -v -keystore stackmap-release.keystore \
     -alias stackmap -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Signing** in `android/app/build.gradle`:
   ```gradle
   signingConfigs {
       release {
           storeFile file('stackmap-release.keystore')
           storePassword 'YOUR_STORE_PASSWORD'
           keyAlias 'stackmap'
           keyPassword 'YOUR_KEY_PASSWORD'
       }
   }
   ```

3. **Build Signed APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## 🧪 Testing Coordination Plan

### For Small Team (< 20 testers)
1. **iOS**: Use TestFlight internal testing
2. **Android**: Share APK via Google Drive

### For Larger Beta (20+ testers)
1. **iOS**: TestFlight external testing
2. **Android**: Firebase App Distribution or Play Console

### Testing Checklist
- [ ] Test on multiple device sizes
- [ ] Test on older OS versions (iOS 13+, Android 5+)
- [ ] Test offline functionality
- [ ] Test with different user counts
- [ ] Test accessibility features
- [ ] Test in different languages/locales

## 📊 Feedback Collection

### Options
1. **Built-in Feedback**
   - Add feedback button in Settings
   - Use email or form submission

2. **TestFlight Feedback**
   - iOS users can submit directly in TestFlight

3. **Google Form**
   - Create standardized feedback form
   - Share link with APK

4. **Firebase Crashlytics**
   - Automatic crash reporting
   - Performance monitoring

## 🚀 Quick Start Commands

```bash
# iOS Build & Upload
cd ios && xcodebuild -workspace StackMapNative.xcworkspace -scheme StackMapNative -configuration Release

# Android Build
./scripts/react-native/build-android-release.sh

# Check APK location
ls -la android/app/build/outputs/apk/release/
```

## 📱 Distribution Timeline

1. **Today**: Build and upload to TestFlight/generate APK
2. **24-48 hours**: TestFlight review (if external)
3. **Immediate**: Android APK distribution
4. **1 week**: Collect initial feedback
5. **2 weeks**: First update based on feedback