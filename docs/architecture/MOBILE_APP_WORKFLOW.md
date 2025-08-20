# StackMap Mobile App Development Workflow

## Overview

This document outlines the complete workflow for developing, testing, and deploying the StackMap mobile applications for iOS and Android platforms.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Development Workflow](#development-workflow)
3. [Build Process](#build-process)
4. [Testing Workflow](#testing-workflow)
5. [Deployment Pipeline](#deployment-pipeline)
6. [Store Submission](#store-submission)
7. [Post-Launch Monitoring](#post-launch-monitoring)
8. [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

#### Common Requirements
- Node.js 18+ and npm 9+
- Git with configured user
- VS Code with recommended extensions
- GitHub CLI (`gh`) installed
- Capacitor CLI (`npm install -g @capacitor/cli`)

#### iOS Development
- macOS 12+ (Monterey or later)
- Xcode 14+ with iOS SDK
- Apple Developer Account ($99/year)
- CocoaPods (`sudo gem install cocoapods`)
- Valid provisioning profiles and certificates

#### Android Development
- Android Studio Arctic Fox or later
- Android SDK (API 29-34)
- Java 11+ (OpenJDK recommended)
- Google Play Developer Account ($25 one-time)
- Valid signing keystore

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/stackmap.git
cd stackmap

# Install dependencies
npm install

# Setup mobile platforms
npx cap add ios
npx cap add android

# Sync web assets to native projects
npx cap sync

# Setup Git hooks
./scripts/setup-git-hooks.sh

# Configure VS Code
code .
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/mobile-enhancement

# Make changes to web code
# Files are in the root directory

# Test in browser first
npm run dev

# Sync changes to native projects
npx cap sync

# Open in native IDEs
npx cap open ios    # Opens Xcode
npx cap open android # Opens Android Studio
```

### 2. Live Reload Development

```bash
# For iOS development
npx cap run ios --livereload --external

# For Android development
npx cap run android --livereload --external
```

### 3. Using VS Code Tasks

Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) and run:

- **Tasks: Run Build Task** - Build Android Debug (default)
- **Tasks: Run Task** - See all available tasks:
  - Build Android Debug/Release
  - Build iOS Debug/Release
  - Sync Capacitor
  - Run Mobile Tests
  - Deploy to TestFlight
  - Deploy to Play Console

### 4. Git Workflow with Hooks

Our Git hooks automate quality checks:

```bash
# Pre-commit hook runs automatically
git add .
git commit -m "feat: enhance mobile UI"
# Runs: ESLint, tests, COPPA compliance check

# Pre-push hook validates deployment readiness
git push origin feature/mobile-enhancement
# Runs: Full test suite, build validation
```

## Build Process

### Automated Builds

Use the unified build script:

```bash
# Build Android Debug
./scripts/mobile-build-automation.sh android debug

# Build Android Release
./scripts/mobile-build-automation.sh android release

# Build iOS Debug (macOS only)
./scripts/mobile-build-automation.sh ios debug

# Build iOS Release (macOS only)
./scripts/mobile-build-automation.sh ios release

# Build all platforms
./scripts/mobile-build-automation.sh all release
```

### Manual Build Process

#### Android Build

```bash
cd android

# Debug build
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Release build
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk

# Bundle for Play Store
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

#### iOS Build

```bash
cd ios/App

# Open in Xcode
open App.xcworkspace

# Build from command line
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath ../build/App.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath ../build/App.xcarchive \
  -exportPath ../build \
  -exportOptionsPlist exportOptions.plist
```

## Testing Workflow

### 1. Automated Testing

```bash
# Run all tests
npm test

# Run mobile-specific tests
./scripts/run-mobile-tests.sh

# Run COPPA compliance check
./scripts/verify-coppa-compliance.sh
```

### 2. Manual Testing

Follow the checklist in `mobile-testing-checklist.md`:

1. **Device Testing**
   - Test on physical devices when possible
   - Use simulators/emulators for broad coverage
   - Test different OS versions

2. **Feature Testing**
   - Core functionality
   - Offline mode
   - Performance metrics
   - Accessibility features

3. **Store Compliance**
   - Privacy policy accessible
   - No crashes or ANRs
   - Appropriate content rating

### 3. Beta Testing

#### iOS TestFlight

```bash
# Deploy to TestFlight
./scripts/deploy-testflight.sh

# Or manually:
# 1. Archive in Xcode
# 2. Upload to App Store Connect
# 3. Submit for beta review
# 4. Invite testers
```

#### Android Internal Testing

```bash
# Deploy to Play Console
./scripts/deploy-play-console.sh

# Or manually:
# 1. Upload AAB to Play Console
# 2. Create internal test release
# 3. Share testing link
```

## Deployment Pipeline

### Pre-Deployment Checklist

1. **Version Management**
   ```bash
   # Update version numbers
   ./scripts/update-version.sh 1.2.0
   ```

2. **Generate Release Notes**
   ```bash
   ./scripts/generate-release-notes.sh
   ```

3. **Final Testing**
   - Run full test suite
   - Verify on multiple devices
   - Check crash reporting

### iOS Deployment

```bash
# Automated deployment
export APPLE_API_KEY_ID="your-key-id"
export APPLE_API_ISSUER_ID="your-issuer-id"
./scripts/deploy-testflight.sh

# The script will:
# 1. Build release version
# 2. Create archive
# 3. Export IPA
# 4. Upload to TestFlight
# 5. Create deployment report
```

### Android Deployment

```bash
# Automated preparation
./scripts/deploy-play-console.sh

# The script will:
# 1. Build release AAB
# 2. Validate bundle
# 3. Prepare for upload
# 4. Generate release notes
# 5. Create deployment report

# Manual upload required to Play Console
```

## Store Submission

### App Store Submission

1. **In App Store Connect:**
   - Create new app version
   - Upload build from TestFlight
   - Fill in version information
   - Add screenshots (use `./scripts/generate-store-assets.sh`)
   - Submit for review

2. **Review Process:**
   - Usually 24-48 hours
   - Monitor for reviewer feedback
   - Be ready to respond quickly

### Google Play Submission

1. **In Play Console:**
   - Create new release
   - Upload AAB file
   - Add release notes
   - Complete store listing
   - Submit for review

2. **Review Process:**
   - Usually 2-3 hours
   - Check for policy warnings
   - Address any issues promptly

## Post-Launch Monitoring

### Privacy-Compliant Monitoring

Since we're COPPA compliant, we use privacy-preserving monitoring:

```javascript
// In js/platform-detector.js
window.crashReporting = {
    logError: function(error) {
        // Only log error type, no user data
        const sanitizedError = {
            type: error.name,
            message: error.message.replace(/[0-9]/g, 'X'),
            timestamp: new Date().toISOString()
        };
        // Send to privacy-compliant service
    }
};
```

### Monitoring Checklist

1. **Crash Reporting**
   - Monitor crash-free users percentage
   - Track top crashes
   - No PII in crash logs

2. **Performance Metrics**
   - App launch time
   - Memory usage
   - Battery impact

3. **User Feedback**
   - App store reviews
   - Beta tester feedback
   - Support emails

### Response Plan

```bash
# For critical issues:
# 1. Create hotfix branch
git checkout -b hotfix/critical-issue

# 2. Fix and test
# ... make fixes ...
npm test

# 3. Fast-track deployment
./scripts/mobile-build-automation.sh all release
./scripts/deploy-testflight.sh
./scripts/deploy-play-console.sh
```

## Troubleshooting

### Common Issues

#### iOS Build Failures
```bash
# Clean and rebuild
cd ios/App
rm -rf ~/Library/Developer/Xcode/DerivedData
pod install --repo-update
```

#### Android Build Failures
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew --stop
rm -rf .gradle
./gradlew assembleDebug
```

#### Capacitor Sync Issues
```bash
# Full resync
rm -rf ios/App/public
rm -rf android/app/src/main/assets/public
npx cap sync
```

### Debug Commands

```bash
# View Android logs
adb logcat | grep -i stackmap

# View iOS logs (in Xcode)
# Window > Devices and Simulators > View Device Logs

# Check Capacitor config
npx cap doctor
```

## Best Practices

1. **Always test on real devices before release**
2. **Keep build numbers sequential**
3. **Document all store submission changes**
4. **Maintain backward compatibility**
5. **Monitor crash rates closely after release**
6. **Respond to user reviews professionally**
7. **Keep certificates and keys secure**
8. **Regular dependency updates**

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/console/policy)
- [COPPA Compliance Guide](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)

---

Last Updated: December 2024
Version: 1.0.0