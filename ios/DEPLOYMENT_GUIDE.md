# StackMap iOS - Deployment Guide

**Status:** Production Ready ✅
**Last Updated:** October 10, 2025
**Version:** 1.0

---

## Quick Start

```bash
cd /Users/adamstack/StackMap/StackMap/ios

# Full deployment to TestFlight
fastlane beta_ios

# That's it! 🚀
```

---

## Table of Contents

1. [Overview](#overview)
2. [Available Commands](#available-commands)
3. [Deployment Workflow](#deployment-workflow)
4. [Build Artifacts](#build-artifacts)
5. [Version Management](#version-management)
6. [Troubleshooting](#troubleshooting)
7. [Team Setup](#team-setup)
8. [Security Notes](#security-notes)

---

## Overview

StackMap iOS uses fastlane for automated deployment to Apple TestFlight. This system:

- ✅ Builds release IPA automatically
- ✅ Manages build numbers (never conflicts with App Store Connect)
- ✅ Uploads to TestFlight internal testing
- ✅ Includes 4 critical safeguards for reliability
- ✅ Matches the Android Play Store deployment workflow

**Architecture:**
- **Bundle ID:** `app.stackmap`
- **Build System:** Xcode 16.4
- **Automation:** fastlane 2.228.0
- **Authentication:** App Store Connect API Key
- **Signing:** Apple Distribution Certificate + Keychain

---

## Available Commands

### 🚀 Deployment Commands

#### Full Deployment Pipeline
```bash
fastlane beta_ios
```
**What it does:**
1. Validates build environment (Xcode, CocoaPods, etc.)
2. Checks code signing certificates
3. Increments build number
4. Clears Metro cache
5. Builds release IPA
6. Uploads to TestFlight
7. Sets changelog

**Duration:** ~2-3 minutes

**Options:**
```bash
# Skip build number increment (if you already bumped it)
fastlane beta_ios skip_increment:true

# Custom changelog
fastlane beta_ios changelog:"New features and bug fixes"
```

---

### 🔨 Build Commands

#### Build Debug IPA
```bash
fastlane build_debug
```
- Builds debug IPA for local testing
- Clears Metro cache
- Output: `./build/debug/StackMap-Debug.ipa`
- Duration: ~1 minute

#### Build Release IPA
```bash
fastlane build_release
```
- Builds release IPA (App Store signed)
- Clears Metro cache
- Updates ExportOptions.plist with Team ID
- Output: `./build/release/StackMap-Release.ipa` (~12MB)
- Duration: ~1-2 minutes

---

### 📊 Version Management

#### Increment Build Number
```bash
fastlane bump_build_number
```
**Smart build number management:**
- Gets current build number from Xcode project
- Increments by 1
- Updates project using agvtool
- Returns new build number

**Example output:**
```
Current build: 250831047
New build: 250831048
✅ Build number incremented: 250831047 → 250831048
```

---

### 🔧 Utility Commands

#### Validate Environment
```bash
fastlane validate_environment
```
Checks:
- ✅ Xcode version (14.0+)
- ✅ CocoaPods installed
- ✅ Workspace exists
- ✅ Scheme valid (StackMapNative)

#### Setup Certificates
```bash
fastlane setup_certificates
```
Verifies:
- ✅ Signing certificates installed
- ✅ Apple Distribution certificate present

#### Store Credentials (One-time Setup)
```bash
fastlane store_credentials_in_keychain
```
**Interactive setup:**
- Prompts for Apple ID
- Prompts for app-specific password
- Stores in macOS Keychain (encrypted)
- **Note:** This is for alternative authentication method. Current setup uses API Key.

#### Upload Only (Assumes IPA Built)
```bash
fastlane upload_testflight ipa_path:"/path/to/StackMap-Release.ipa"
```
Uploads existing IPA to TestFlight without building.

---

### 📸 Screenshot Commands

#### Generate Screenshots
```bash
fastlane screenshots
```
- Captures App Store screenshots
- Devices: iPhone 16 Pro Max, iPhone 16 Pro, iPad Pro (13-inch)
- Languages: en-US
- Output: `./fastlane/screenshots/`

#### Frame Screenshots
```bash
fastlane frame_screenshots
```
- Adds device frames to screenshots
- Uses frameit tool
- Ready for App Store submission

---

## Deployment Workflow

### Standard Deployment (Recommended)

```bash
# 1. Navigate to ios directory
cd /Users/adamstack/StackMap/StackMap/ios

# 2. (Optional) Verify environment
fastlane validate_environment

# 3. Deploy!
fastlane beta_ios

# 4. Monitor output
# ✅ Environment validated
# ✅ Certificates checked
# ✅ Build number incremented (250831047 → 250831048)
# ✅ Building release IPA...
# ✅ Uploading to TestFlight...
# ✅ Upload complete!

# 5. Wait for App Store Connect processing (5-15 minutes)
# Then install via TestFlight app
```

**Total time:** 2-3 minutes from command to upload complete

---

### First-Time Deployment

If this is your **first** upload to TestFlight:

```bash
# 1. Ensure certificates and profiles installed
# - Apple Distribution certificate in Keychain
# - StackMap Distribution provisioning profile installed

# 2. Run full deployment
fastlane beta_ios

# 3. Wait for processing
# - Check email for any processing issues
# - Build appears in App Store Connect after 5-15 minutes

# 4. Add internal testers
# - Go to TestFlight section in App Store Connect
# - Add internal testers
# - They'll receive invitation email
```

---

### Emergency Hotfix Workflow

```bash
# 1. Make your code changes
# ... edit files ...

# 2. Deploy with custom changelog
fastlane beta_ios changelog:"Critical bug fix for production issue"

# 3. Monitor App Store Connect
# https://appstoreconnect.apple.com/apps

# 4. Test via TestFlight immediately
# Install on device and verify fix
```

---

## Build Artifacts

### Debug Build
```
./build/debug/StackMap-Debug.ipa
Purpose: Local testing, development
Signing: Debug certificate
```

### Release IPA
```
./build/release/StackMap-Release.ipa
Size: ~12MB
Purpose: TestFlight, App Store submission
Signing: Apple Distribution certificate
Format: Optimized for App Store
```

**What's included:**
- React Native JavaScript bundle
- Native iOS binary
- Assets and resources
- Code signature
- Provisioning profile

---

## Version Management

### Build Number Format

**Current:** `250831047`

**Format:** `YYMMDDBBB`
- `25` = Year (2025)
- `08` = Month (August)
- `31` = Day (31st)
- `047` = Build number for that day

**Example progression:**
```
250831047 → 250831048 → 250831049 → 250831050
```

### How Build Numbers Work

#### Automatic Increment (Safeguard #2)

The `beta_ios` lane automatically:

1. **Gets current build number** from Xcode project
2. **Increments by 1** using agvtool
3. **Updates Xcode project** automatically
4. **Never decrements** - prevents conflicts

**Example scenarios:**

```bash
# Scenario 1: Normal increment
Current: 250831047
Action: ✅ Increment to 250831048

# Scenario 2: Skip increment option
Current: 250831047
Command: fastlane beta_ios skip_increment:true
Action: ✅ Keep 250831047 (no change)

# Scenario 3: Manual increment first
fastlane bump_build_number  # 250831047 → 250831048
fastlane beta_ios skip_increment:true  # Use 250831048
```

---

## Troubleshooting

### Build Failures

#### "Provisioning profile not found"
```bash
# Check installed profiles
ls -la ~/Library/MobileDevice/Provisioning\ Profiles/

# Look for "StackMap Distribution" profile
# UUID: 7f677a0a-ea28-45cf-b537-ef77c5cf8553

# If missing, download from:
# https://developer.apple.com/account/resources/profiles/list
```

**Fix:** Download and double-click .mobileprovision file to install

---

#### "Code signing is required"
```bash
# Check signing certificates
security find-identity -v -p codesigning

# Should show "Apple Distribution: ..."
```

**Fix:**
1. Download certificate from Apple Developer Portal
2. Double-click to install in Keychain
3. Or import .p12 file with password

---

#### "Metro bundler cache error"
```bash
# Manually clear caches
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf ../../node_modules/.cache

# Try build again
fastlane build_release
```

---

#### "OpenSSL EC key error"
```bash
# Error: OpenSSL::PKey::ECError: invalid curve name
```

**Fix:** Already implemented in Fastfile
- Uses `key_content` instead of `key_filepath`
- Reads .p8 file content directly
- Compatible with Ruby 3.3.9

---

### Upload Failures

#### "API Key authentication failed"
```bash
# Verify API Key exists
ls -la ~/.fastlane/AuthKey_BJAC3957M4.p8

# Should show file with permissions 600
```

**Fix:**
```bash
# Check file permissions
chmod 600 ~/.fastlane/AuthKey_BJAC3957M4.p8

# Verify .env configuration
cat fastlane/.env | grep APP_STORE_CONNECT

# Should show:
# APP_STORE_CONNECT_API_KEY_KEY_ID="BJAC3957M4"
# APP_STORE_CONNECT_API_KEY_ISSUER_ID="a608e0f8-9834-49e6-8f6e-623d726ba970"
# APP_STORE_CONNECT_API_KEY_KEY="/Users/adamstack/.fastlane/AuthKey_BJAC3957M4.p8"
```

---

#### "Build already exists"
This means the build number is already on App Store Connect.

**Fix:**
```bash
# Increment build number manually
fastlane bump_build_number

# Try upload again (skip auto-increment)
fastlane beta_ios skip_increment:true
```

---

#### "IPA not found"
**Fix:**
```bash
# Build first
fastlane build_release

# Verify IPA exists
ls -lh ./build/release/StackMap-Release.ipa

# Then upload
fastlane upload_testflight ipa_path:"./build/release/StackMap-Release.ipa"
```

---

### Upload Retry Logic (Safeguard #4)

Uploads automatically retry **3 times** with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: Wait 30 seconds
- Attempt 3: Wait 60 seconds
- Attempt 4: Wait 120 seconds

If all fail, check your internet connection and App Store Connect status.

---

## Team Setup

### New Team Member Setup

**Prerequisites:**
- macOS with Xcode 14.0+
- Homebrew installed
- Git access to repository
- Apple Developer account access

**Steps:**

1. **Install dependencies**
```bash
# Install Ruby (if needed)
brew install rbenv
rbenv install 3.3.9
rbenv global 3.3.9

# Install fastlane
gem install fastlane

# Install CocoaPods
gem install cocoapods

# Verify
fastlane --version
pod --version
```

2. **Clone repository**
```bash
git clone <repo-url>
cd StackMap/StackMap/ios
```

3. **Install CocoaPods dependencies**
```bash
pod install
```

4. **Get API Key from team lead**

Ask for:
- AuthKey_BJAC3957M4.p8 file
- Key ID: BJAC3957M4
- Issuer ID: a608e0f8-9834-49e6-8f6e-623d726ba970

Place API Key:
```bash
mkdir -p ~/.fastlane
# Copy AuthKey_BJAC3957M4.p8 to ~/.fastlane/
chmod 600 ~/.fastlane/AuthKey_BJAC3957M4.p8
```

5. **Download certificates**

From Apple Developer Portal:
- Download Apple Distribution certificate
- Install in Keychain Access (double-click)
- Download "StackMap Distribution" provisioning profile
- Install (double-click .mobileprovision file)

6. **Verify .env file**
```bash
# Should already be configured
cat fastlane/.env

# Verify API Key path matches your username
# May need to update path if different user
```

7. **Verify setup**
```bash
fastlane validate_environment
# Should print: ✅ Environment validation complete!
```

8. **Test build**
```bash
# Try a local build first
fastlane build_debug

# If successful, you're ready for deployments
```

---

## Security Notes

### Credential Storage ✅

**API Key (.p8 file):**
- Stored in: `~/.fastlane/AuthKey_BJAC3957M4.p8`
- Permissions: `600` (owner read/write only)
- Never committed to git
- Outside project directory

**API Key Configuration:**
- Stored in: `ios/fastlane/.env`
- Contains: Key ID, Issuer ID, file path
- In `.gitignore` (not committed)
- Template: `.env.default` is tracked

**Distribution Certificate:**
- Stored in: macOS Keychain
- Type: Apple Distribution
- Team: 84W9WSYQQB
- Password-protected

**Provisioning Profile:**
- Stored in: `~/Library/MobileDevice/Provisioning Profiles/`
- Name: StackMap Distribution
- Team: 84W9WSYQQB
- Installed per-user

### Files to NEVER Commit

`.gitignore` includes:
```
*.p8
*.mobileprovision
.env
*.cer
*.p12
fastlane/report.xml
fastlane/Preview.html
fastlane/screenshots
fastlane/test_output
```

### API Key Security

The API Key is read directly in Fastfile:
- Uses `key_content:` parameter (not `key_filepath:`)
- Reads file content with `File.read()`
- Compatible with Ruby 3.3.9
- Prevents OpenSSL curve name errors

---

## Critical Safeguards

### Safeguard #1: Credential Security ✅
- API Key stored securely outside project
- File permissions: 600
- Never in git or project files
- Environment variables in .env (not committed)

### Safeguard #2: Build Number Safety ✅
- Automatic increment before each upload
- Uses agvtool for reliable version management
- Never decrements build numbers
- Manual override available

### Safeguard #3: Cache Invalidation ✅
- Clears Metro bundler cache before builds
- Prevents stale JavaScript bundles
- Ensures fresh builds every time
- Kills background Metro processes

### Safeguard #4: Retry Logic ✅
- 3 upload attempts with exponential backoff
- 30s, 60s, 120s delays between retries
- Comprehensive error messages
- Handles transient network issues

---

## Comparison with Android

| Feature | iOS | Android |
|---------|-----|---------|
| **Pipeline Command** | `fastlane beta_ios` | `fastlane beta_android` |
| **Build Output** | IPA (~12MB) | AAB (~26MB) + APK (~54MB) |
| **Authentication** | API Key (.p8) | Service Account JSON |
| **Credential Storage** | File system | Keychain |
| **Testing Track** | TestFlight | Internal Testing |
| **Version Field** | Build Number | Version Code |
| **Upload Duration** | ~2-3 min | ~2-3 min |
| **Safeguards** | 4 implemented | 4 implemented |
| **Status** | ✅ Production | ✅ Production |

**Both platforms share the same automation philosophy and reliability.**

---

## Support

### Internal Resources
- **Android Reference:** `/Users/adamstack/StackMap/StackMap/android/fastlane/Fastfile`
- **Team Handoff:** `TEAM_HANDOFF.md`
- **Setup Report:** `PHASE_1_COMPLETE_FINAL.md`
- **Testing Report:** `PHASE_2_COMPLETE.md`

### External Resources
- **fastlane iOS Guide:** https://docs.fastlane.tools/getting-started/ios/setup/
- **App Store Connect:** https://appstoreconnect.apple.com/
- **Apple Developer:** https://developer.apple.com/
- **TestFlight:** https://developer.apple.com/testflight/

### Common Links
- **API Key Management:** https://appstoreconnect.apple.com/access/api
- **Certificates:** https://developer.apple.com/account/resources/certificates/list
- **Profiles:** https://developer.apple.com/account/resources/profiles/list

---

## Quick Reference Card

**Print this for your desk:**

```
╔══════════════════════════════════════════════════════════╗
║          StackMap iOS Deployment Cheat Sheet             ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  🚀 Deploy to TestFlight                                ║
║     cd /Users/adamstack/StackMap/StackMap/ios           ║
║     fastlane beta_ios                                   ║
║                                                          ║
║  🔨 Build locally                                        ║
║     fastlane build_release                              ║
║                                                          ║
║  📊 Increment build number                               ║
║     fastlane bump_build_number                          ║
║                                                          ║
║  ✅ Validate setup                                       ║
║     fastlane validate_environment                       ║
║                                                          ║
║  📦 Output                                               ║
║     IPA: ./build/release/StackMap-Release.ipa           ║
║                                                          ║
║  🆘 Help                                                 ║
║     See: DEPLOYMENT_GUIDE.md                            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## Advanced Topics

### Parallel iOS/Android Deployment

Deploy both platforms simultaneously:

```bash
#!/bin/bash
# deploy_both.sh

# Deploy iOS in background
(cd ios && fastlane beta_ios) &
IOS_PID=$!

# Deploy Android in background
(cd android && fastlane beta_android) &
ANDROID_PID=$!

# Wait for both
wait $IOS_PID
IOS_RESULT=$?

wait $ANDROID_PID
ANDROID_RESULT=$?

# Report results
if [ $IOS_RESULT -eq 0 ] && [ $ANDROID_RESULT -eq 0 ]; then
    echo "✅ Both platforms deployed successfully!"
else
    echo "❌ One or more platforms failed"
    exit 1
fi
```

---

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy to TestFlight

on:
  push:
    branches: [main]

jobs:
  deploy-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install dependencies
        run: |
          gem install fastlane
          cd ios && pod install

      - name: Setup API Key
        env:
          API_KEY_P8: ${{ secrets.APP_STORE_CONNECT_API_KEY }}
        run: |
          echo "$API_KEY_P8" > ~/.fastlane/AuthKey_BJAC3957M4.p8
          chmod 600 ~/.fastlane/AuthKey_BJAC3957M4.p8

      - name: Deploy to TestFlight
        run: cd ios && fastlane beta_ios
```

---

### Custom Lanes (Future)

Create custom lanes for specific workflows:

```ruby
# In Fastfile

desc "Deploy to App Store (not TestFlight)"
lane :prod_ios do
  validate_environment
  setup_certificates
  bump_build_number
  build_release

  upload_to_app_store(
    api_key: api_key,
    ipa: Actions.lane_context[SharedValues::IPA_OUTPUT_PATH],
    submit_for_review: true,
    automatic_release: false
  )
end

desc "Build for local distribution"
lane :adhoc do
  build_app(
    workspace: "StackMapNative.xcworkspace",
    scheme: "StackMapNative",
    configuration: "Release",
    export_method: "ad-hoc"
  )
end
```

---

**Last Updated:** October 10, 2025
**Maintained by:** StackMap Development Team
**Version:** 1.0
**Status:** ✅ Production Ready
