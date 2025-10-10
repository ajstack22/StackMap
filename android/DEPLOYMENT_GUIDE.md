# StackMap Android - Deployment Guide

**Status:** Production Ready ✅
**Last Updated:** October 10, 2025
**Version:** 1.0

---

## Quick Start

```bash
cd /Users/adamstack/StackMap/StackMap/android

# Full deployment to Play Store
fastlane beta_android

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

StackMap Android uses fastlane for automated deployment to Google Play Store. This system:

- ✅ Builds release APK and AAB automatically
- ✅ Manages version codes (never conflicts with Play Console)
- ✅ Uploads to Play Store internal testing track
- ✅ Includes 4 critical safeguards for reliability
- ✅ Matches the iOS TestFlight deployment workflow

**Architecture:**
- **Package:** `com.stackmapnative`
- **Build System:** Gradle 8.11.1
- **Automation:** fastlane 2.228.0
- **Authentication:** Google Cloud Service Account + macOS Keychain
- **Signing:** Release keystore with environment variable credentials

---

## Available Commands

### 🚀 Deployment Commands

#### Full Deployment Pipeline
```bash
fastlane beta_android
```
**What it does:**
1. Validates signing configuration
2. Checks Play Console version, increments if needed
3. Clears Metro/Gradle caches
4. Builds release AAB (Play Store) and APK
5. Uploads AAB to internal testing track
6. Creates draft release (requires manual publish)

**Duration:** ~2-3 minutes

**Options:**
```bash
# Skip version increment (if you already bumped it)
fastlane beta_android skip_increment:true

# Custom changelog
fastlane beta_android changelog:"New features and bug fixes"
```

---

### 🔨 Build Commands

#### Build Debug APK
```bash
fastlane build_debug
```
- Builds debug APK for local testing
- Clears Metro cache
- Output: `app/build/outputs/apk/debug/app-debug.apk` (~115MB)
- Duration: ~30 seconds

#### Build Release APK + AAB
```bash
fastlane build_release
```
- Builds **both** release AAB and APK
- AAB used for Play Store uploads
- APK can be distributed directly
- Clears Metro and Gradle caches
- Output:
  - AAB: `app/build/outputs/bundle/release/app-release.aab` (~26MB)
  - APK: `app/build/outputs/apk/release/app-release.apk` (~54MB)
- Duration: ~1-2 minutes

---

### 📊 Version Management

#### Check and Increment Version
```bash
fastlane check_and_increment_version
```
**Smart version management:**
- Connects to Play Console
- Retrieves highest remote version code
- Only increments if local ≤ remote (Safeguard #2)
- Updates `app/build.gradle` automatically

**Example output:**
```
Current local versionCode: 251003003
Highest remote versionCode: 1
✅ Local > remote. No increment needed.
```

#### Manual Version Increment
```bash
fastlane increment_version_code
```
- Increments version code by 1
- Use when you need manual control
- Updates `app/build.gradle`

**Current version:** `251003003`

---

### 🔧 Utility Commands

#### Validate Environment
```bash
fastlane validate_signing
```
Checks:
- ✅ Release keystore exists
- ✅ Environment variables set (STACKMAP_STORE_PASSWORD, STACKMAP_KEY_PASSWORD)
- ✅ Signing configuration valid

#### Run Tests
```bash
fastlane test               # Unit tests
fastlane test_critical      # Critical test suite
```

#### Generate Screenshots
```bash
fastlane screenshots        # Capture Play Store screenshots
fastlane frame_screenshots  # Add device frames
```

---

## Deployment Workflow

### Standard Deployment (Recommended)

```bash
# 1. Navigate to android directory
cd /Users/adamstack/StackMap/StackMap/android

# 2. (Optional) Verify environment
fastlane validate_signing

# 3. Deploy!
fastlane beta_android

# 4. Monitor output
# ✅ Signing validated
# ✅ Version checked (251003003 > 1, no increment needed)
# ✅ Building release AAB...
# ✅ Uploading to Play Store...
# ✅ Draft release created!

# 5. Go to Play Console and publish the draft
# https://play.google.com/console/
```

**Total time:** 2-3 minutes from command to draft release

---

### First-Time Deployment

If this is your **first** upload to Play Store:

```bash
# 1. Build release locally first (to verify)
fastlane build_release

# 2. Manually upload AAB to Play Console once
# - Go to https://play.google.com/console/
# - Create internal testing release
# - Upload: app/build/outputs/bundle/release/app-release.aab
# - Set version code: 251003003
# - Publish to internal testing

# 3. After first manual upload, use automation
fastlane beta_android
```

**Why?** The first upload establishes your app in Play Console. After that, fastlane can manage everything.

---

### Emergency Hotfix Workflow

```bash
# 1. Make your code changes
# ... edit files ...

# 2. Skip version increment if already ahead
fastlane beta_android skip_increment:true

# 3. Add urgent changelog
fastlane beta_android changelog:"Critical bug fix for production issue"

# 4. Publish immediately from Play Console
```

---

## Build Artifacts

### Debug Build
```
app/build/outputs/apk/debug/app-debug.apk
Size: ~115MB
Purpose: Local testing, not for distribution
Signing: Debug keystore (android/androiddebugkey)
```

### Release AAB (App Bundle)
```
app/build/outputs/bundle/release/app-release.aab
Size: ~26MB
Purpose: Play Store uploads (REQUIRED)
Signing: Release keystore (stackmap)
Format: Android App Bundle (optimized for Play Store)
```

### Release APK
```
app/build/outputs/apk/release/app-release.apk
Size: ~54MB
Purpose: Direct distribution (sideloading, testing)
Signing: Release keystore (stackmap)
Format: Universal APK (all architectures)
```

**Architecture support:**
- armeabi-v7a (32-bit ARM)
- arm64-v8a (64-bit ARM) - Most devices
- x86 (32-bit Intel)
- x86_64 (64-bit Intel)

---

## Version Management

### Version Code Format

**Current:** `251003003`

**Format:** `YYMMDDNNN`
- `25` = Year (2025)
- `10` = Month (October)
- `03` = Day (3rd)
- `003` = Build number for that day

**Example progression:**
```
251003001 → 251003002 → 251003003 → 251003004
```

### How Version Management Works

#### Safeguard #2: Version Code Safety

The system prevents version conflicts:

1. **Before upload:** Checks Play Console for highest version
2. **Compare:** Local version vs. remote version
3. **Smart increment:**
   - If local ≤ remote: Increment to remote + 1
   - If local > remote: Keep local version
4. **Never decrement:** Prevents version conflicts

**Example scenarios:**

```bash
# Scenario 1: Local ahead
Local: 251003003, Remote: 1
Action: ✅ Keep 251003003 (no change)

# Scenario 2: Remote ahead (you forgot to pull)
Local: 251003002, Remote: 251003005
Action: ⚠️ Increment to 251003006

# Scenario 3: Equal
Local: 251003003, Remote: 251003003
Action: ⚠️ Increment to 251003004
```

---

## Troubleshooting

### Build Failures

#### "Keystore not found"
```bash
# Verify keystore exists
ls -la /Users/adamstack/StackMap/StackMap/android/app/stackmap-release.keystore

# Should show file with permissions
```

**Fix:** Ensure keystore file exists and hasn't been moved.

---

#### "Environment variable not set"
```bash
# Check environment variables
echo $STACKMAP_STORE_PASSWORD
echo $STACKMAP_KEY_PASSWORD

# Should print passwords (not empty)
```

**Fix:**
```bash
# Add to ~/.zshrc or ~/.bashrc
export STACKMAP_STORE_PASSWORD="your-password-here"
export STACKMAP_KEY_PASSWORD="your-password-here"

# Reload shell
source ~/.zshrc
```

---

#### "Metro bundler cache error"
```bash
# Manually clear caches
rm -rf ../../node_modules/.cache
rm -rf ./app/build
rm -rf .gradle/caches

# Try build again
fastlane build_release
```

---

### Upload Failures

#### "Authentication failed"
```bash
# Verify JSON key in Keychain
security find-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' -w

# Should print: /Users/adamstack/.android/stackmap-play-store-key.json
```

**Fix:** Re-run credential setup:
```bash
security add-generic-password -a 'stackmap-android' -s 'stackmap-play-store-json-path' -w '/Users/adamstack/.android/stackmap-play-store-key.json' -U
```

---

#### "Version already exists"
This means the version code is already on Play Console.

**Fix:**
```bash
# Increment version manually
fastlane increment_version_code

# Try upload again
fastlane beta_android skip_increment:true
```

---

#### "Google Play API not enabled"
**Fix:** Enable the API:
1. Go to: https://console.developers.google.com/apis/api/androidpublisher.googleapis.com/overview
2. Click "Enable"
3. Wait 30 seconds
4. Retry deployment

---

### Upload Retry Logic (Safeguard #4)

Uploads automatically retry **3 times** with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: Wait 30 seconds
- Attempt 3: Wait 60 seconds
- Attempt 4: Wait 120 seconds

If all fail, check your internet connection and Play Console status.

---

## Team Setup

### New Team Member Setup

**Prerequisites:**
- macOS with Xcode Command Line Tools
- Homebrew installed
- Git access to repository

**Steps:**

1. **Install dependencies**
```bash
# Install Ruby (if needed)
brew install rbenv
rbenv install 3.3.9
rbenv global 3.3.9

# Install fastlane
gem install fastlane

# Install Android SDK (if not already)
# Option 1: Install Android Studio
# Option 2: brew install android-sdk
```

2. **Clone repository**
```bash
git clone <repo-url>
cd StackMap/StackMap/android
```

3. **Get keystore credentials**
Ask team lead for:
- Keystore password
- Key password

Add to `~/.zshrc`:
```bash
export STACKMAP_STORE_PASSWORD="password-from-team-lead"
export STACKMAP_KEY_PASSWORD="password-from-team-lead"
```

Reload: `source ~/.zshrc`

4. **Get service account JSON key**
Ask team lead for the JSON key file or create your own:
- Get the file: `stackmap-play-store-key.json`
- Place in: `~/.android/`
- Set permissions: `chmod 600 ~/.android/stackmap-play-store-key.json`

Store in Keychain:
```bash
security add-generic-password -a 'stackmap-android' -s 'stackmap-play-store-json-path' -w "$HOME/.android/stackmap-play-store-key.json" -U
```

5. **Verify setup**
```bash
cd /Users/adamstack/StackMap/StackMap/android
fastlane validate_signing
```

Should print: ✅ Signing configuration validated!

6. **Test deployment**
```bash
# Try a build first (doesn't upload)
fastlane build_release

# When ready, do full deployment
fastlane beta_android
```

---

## Security Notes

### Credential Storage ✅

**Keystore passwords:**
- Stored in: Environment variables (`~/.zshrc`)
- Never committed to git
- Never in project files

**Service account JSON:**
- Stored in: `~/.android/` (outside project)
- Permissions: `600` (owner read/write only)
- Path stored in: macOS Keychain (encrypted)
- Never committed to git

**Release keystore:**
- Location: `android/app/stackmap-release.keystore`
- In `.gitignore` (not committed)
- Team members need their own copy

### Files to NEVER Commit

`.gitignore` includes:
```
*.keystore
*.jks
.env
*.json (service account keys)
keystore-credentials.txt
```

### Keychain Access

The JSON key path is stored in macOS Keychain:
- Service: `stackmap-play-store-json-path`
- Account: `stackmap-android`
- Value: `/Users/adamstack/.android/stackmap-play-store-key.json`

Fastlane reads from Keychain automatically (Safeguard #1).

---

## Critical Safeguards

### Safeguard #1: Credential Security ✅
- Service account JSON in macOS Keychain
- Never stored in plaintext in project
- Automatic retrieval during deployment

### Safeguard #2: Version Code Safety ✅
- Checks Play Console before increment
- Never decrements version codes
- Prevents upload conflicts

### Safeguard #3: Cache Invalidation ✅
- Clears Metro bundler cache before builds
- Clears Gradle caches when needed
- Prevents stale bundle issues

### Safeguard #4: Retry Logic ✅
- 3 upload attempts with exponential backoff
- 30s, 60s, 120s delays between retries
- Comprehensive error messages

---

## Comparison with iOS

| Feature | iOS | Android |
|---------|-----|---------|
| **Pipeline Command** | `fastlane beta_ios` | `fastlane beta_android` |
| **Build Output** | IPA (~12MB) | AAB (~26MB) + APK (~54MB) |
| **Authentication** | API Key (.p8) | Service Account JSON |
| **Credential Storage** | Keychain | Keychain |
| **Testing Track** | TestFlight | Internal Testing |
| **Version Field** | Build Number | Version Code |
| **Upload Duration** | ~2-3 min | ~2-3 min |
| **Safeguards** | 4 implemented | 4 implemented |
| **Status** | ✅ Production | ✅ Production |

**Both platforms share the same automation philosophy and reliability.**

---

## Support

### Internal Resources
- **iOS Reference:** `/Users/adamstack/StackMap/StackMap/ios/fastlane/Fastfile`
- **Phase 1 Documentation:** `ANDROID_PHASE_1_COMPLETE.md`
- **Status Report:** `PHASE_1_COMPLETE_FINAL.md`

### External Resources
- **fastlane Android Guide:** https://docs.fastlane.tools/getting-started/android/setup/
- **Google Play Console:** https://play.google.com/console/
- **Play Developer API:** https://developers.google.com/android-publisher
- **Service Account Setup:** https://cloud.google.com/iam/docs/service-accounts-create

### Common Links
- **Enable Play API:** https://console.developers.google.com/apis/api/androidpublisher.googleapis.com/overview
- **Google Cloud Console:** https://console.cloud.google.com/
- **Play Console Users:** https://play.google.com/console/users-and-permissions

---

## Quick Reference Card

**Print this for your desk:**

```
╔══════════════════════════════════════════════════════════╗
║         StackMap Android Deployment Cheat Sheet          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  🚀 Deploy to Play Store                                ║
║     cd /Users/adamstack/StackMap/StackMap/android       ║
║     fastlane beta_android                               ║
║                                                          ║
║  🔨 Build locally                                        ║
║     fastlane build_release                              ║
║                                                          ║
║  📊 Check version                                        ║
║     fastlane check_and_increment_version                ║
║                                                          ║
║  ✅ Validate setup                                       ║
║     fastlane validate_signing                           ║
║                                                          ║
║  📦 Outputs                                              ║
║     AAB: app/build/outputs/bundle/release/*.aab         ║
║     APK: app/build/outputs/apk/release/*.apk            ║
║                                                          ║
║  🆘 Help                                                 ║
║     See: DEPLOYMENT_GUIDE.md                            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

**Last Updated:** October 10, 2025
**Maintained by:** StackMap Development Team
**Version:** 1.0
**Status:** ✅ Production Ready
