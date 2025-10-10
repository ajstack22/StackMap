# StackMap Android - Fastlane Setup Guide

**Last Updated:** October 9, 2025
**Fastlane Version:** 2.228.0
**Application ID:** com.stackmapnative
**Project:** StackMap Android (React Native 0.80.1)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Google Play Console Setup](#google-play-console-setup)
4. [Credential Security Setup (Keychain)](#credential-security-setup-keychain)
5. [Environment Configuration](#environment-configuration)
6. [Available Lanes](#available-lanes)
7. [Running Your First Deployment](#running-your-first-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Safeguards Implemented](#safeguards-implemented)

---

## Overview

This guide will help you set up fastlane for automated deployment of StackMap Android to Google Play Store. The implementation includes 4 critical safeguards for production-ready deployment:

1. **Credential Security** - Stores service account JSON path in macOS Keychain (not plaintext)
2. **Build Number Safety** - Checks Google Play Console version codes to avoid conflicts
3. **Metro Cache Invalidation** - Clears caches before release builds
4. **Basic Retry Logic** - Retries uploads with exponential backoff (3 attempts)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Google Play Developer account (25 one-time fee)
- [ ] StackMap app created in Google Play Console (or ready to create)
- [ ] Admin access to Google Play Developer account
- [ ] Android release keystore and passwords
- [ ] Fastlane installed (run: `brew install fastlane` or `gem install fastlane`)
- [ ] Ruby 2.6+ (Ruby 3.3+ recommended)

---

## Google Play Console Setup

### Step 1: Create Google Cloud Service Account

1. **Go to Google Cloud Console**
   - URL: https://console.cloud.google.com/
   - Create or select a project for StackMap

2. **Enable Google Play Android Developer API**
   - Navigate to: APIs & Services > Library
   - Search for "Google Play Android Developer API"
   - Click "Enable"

3. **Create Service Account**
   - Navigate to: IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Name: `stackmap-fastlane-automation`
   - Description: "Fastlane automation for StackMap Android deployments"
   - Click "Create and Continue"
   - Skip granting roles (permissions set in Play Console)
   - Click "Done"

4. **Create JSON Key**
   - Click on the newly created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Select "JSON"
   - Click "Create"
   - **SAVE THIS FILE SECURELY** - it will be downloaded

5. **Store Key Securely**
   ```bash
   # Create secure directory
   mkdir -p ~/.android
   chmod 700 ~/.android

   # Move key file (replace [id] with actual filename)
   mv ~/Downloads/stackmap-fastlane-automation-*.json ~/.android/stackmap-play-store-key.json
   chmod 600 ~/.android/stackmap-play-store-key.json
   ```

### Step 2: Link Service Account to Play Console

1. **Go to Google Play Console**
   - URL: https://play.google.com/console/
   - Select StackMap app

2. **Grant Access to Service Account**
   - Navigate to: Users and permissions
   - Click "Invite new users"
   - Enter the service account email:
     Format: `stackmap-fastlane-automation@[project-id].iam.gserviceaccount.com`
     (Find this in Google Cloud Console > Service Accounts)

3. **Set Permissions**
   - Under "App permissions", select StackMap app
   - Grant these permissions:
     - ✅ View app information (read only)
     - ✅ **Manage production releases** (required for deployment)
     - ✅ **Manage testing track releases** (required for internal/beta)
   - Click "Invite user"

4. **Wait for Propagation**
   - Service account access is immediate (no acceptance needed)
   - Wait 5-10 minutes for permissions to propagate

### Step 3: Prepare App for Internal Testing

1. **Complete Store Listing** (if not already done)
   - Navigate to: Store presence > Main store listing
   - Fill in required fields:
     - App name
     - Short description
     - Full description
     - App icon (512x512 PNG)
     - Feature graphic (1024x500)
     - Screenshots (at least 2)

2. **Complete Content Rating**
   - Navigate to: Policy > App content > Content rating
   - Complete questionnaire

3. **Set Up Internal Testing Track**
   - Navigate to: Testing > Internal testing
   - Add testers (use your email for testing)
   - You may need to manually upload first AAB (see First Upload section)

---

## Credential Security Setup (Keychain)

**SAFEGUARD #1: Credential Security**

Instead of storing credentials in plaintext `.env` files, we use macOS Keychain for maximum security.

### Store Credentials in Keychain

```bash
cd /Users/adamstack/StackMap/StackMap/android
fastlane store_credentials_in_keychain
```

This will prompt you for:
- Full path to your Google Play service account JSON key

Example path:
```
/Users/adamstack/.android/stackmap-play-store-key.json
```

The credentials are now stored in macOS Keychain with:
- **Service:** `stackmap-play-store-json-path`
- **Account:** `stackmap-android`

### Verify Keychain Storage

```bash
# Check if credential is stored
security find-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' -w
```

You should see the file path printed.

### Alternative: Environment Variable (Less Secure)

If you prefer not to use Keychain, set environment variable:

```bash
# Add to ~/.zshrc or ~/.bashrc
export PLAY_STORE_JSON_KEY_PATH="/Users/adamstack/.android/stackmap-play-store-key.json"
```

---

## Environment Configuration

### Set Keystore Passwords

These credentials are already used by your existing build process. Set them if not already set:

```bash
# Add to ~/.zshrc or ~/.bashrc
export STACKMAP_STORE_PASSWORD="your-keystore-password"
export STACKMAP_KEY_PASSWORD="your-key-password"

# Reload shell configuration
source ~/.zshrc  # or source ~/.bashrc
```

### Verify Configuration

```bash
cd /Users/adamstack/StackMap/StackMap/android
fastlane validate_signing
```

Expected output:
```
✅ Signing configuration validated!
📋 Keystore: /path/to/app/stackmap-release.keystore
```

---

## Available Lanes

### Credential Management

#### `store_credentials_in_keychain`
Store Google Play JSON key path in macOS Keychain (SAFEGUARD #1)

```bash
fastlane store_credentials_in_keychain
```

### Build Lanes

#### `build_debug`
Build debug APK for testing

```bash
fastlane build_debug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

#### `build_release`
Build signed release APK and AAB (includes SAFEGUARD #3 - cache clearing)

```bash
fastlane build_release
```

Outputs:
- `app/build/outputs/bundle/release/app-release.aab` (for Play Store)
- `app/build/outputs/apk/release/app-release.apk` (for direct distribution)

### Testing Lanes

#### `test`
Run unit tests

```bash
fastlane test
```

#### `test_critical`
Run critical test suite (integrates with existing qual_deploy.sh)

```bash
fastlane test_critical
```

### Version Management

#### `check_and_increment_version`
Check Google Play version codes and increment if needed (SAFEGUARD #2)

```bash
fastlane check_and_increment_version
```

This lane:
- Reads current versionCode from `build.gradle`
- Queries Google Play Console for highest remote version
- Only increments if local version <= remote version
- Prevents version conflicts

#### `increment_version_code`
Manually increment versionCode

```bash
fastlane increment_version_code
```

### Deployment Lanes

#### `beta_android` (PRIMARY DEPLOYMENT LANE)
Build and deploy to Google Play Internal Testing

```bash
fastlane beta_android
```

This lane:
1. Validates signing configuration
2. Checks and increments version if needed (SAFEGUARD #2)
3. Runs critical tests (optional)
4. Builds release AAB (SAFEGUARD #3 - cache clearing)
5. Uploads to Google Play Internal Testing (SAFEGUARD #4 - retry logic)

**SAFEGUARDS INCLUDED:**
- ✅ Credential Security (Keychain)
- ✅ Build Number Safety (version check)
- ✅ Metro Cache Invalidation
- ✅ Basic Retry Logic (3 attempts, exponential backoff: 30s, 60s, 120s)

Output:
- Draft release in Google Play Console (requires manual publish)

#### `promote_to_production`
Promote internal track release to production

```bash
fastlane promote_to_production
```

### Utility Lanes

#### `validate_signing`
Validate keystore and signing configuration

```bash
fastlane validate_signing
```

### Screenshot Lanes (Existing - Preserved)

#### `screenshots`
Generate screenshots

```bash
fastlane screenshots
```

#### `frame_screenshots`
Frame screenshots with device frames

```bash
fastlane frame_screenshots
```

---

## Running Your First Deployment

### Prerequisites Checklist

Before running `beta_android` for the first time:

- [ ] Google Cloud service account created
- [ ] Google Play Android Developer API enabled
- [ ] Service account JSON key downloaded and stored securely
- [ ] Service account granted permissions in Play Console
- [ ] Credentials stored in Keychain (or environment variable set)
- [ ] Keystore passwords set in environment
- [ ] App store listing completed (if required by Google)
- [ ] Content rating completed (if required by Google)

### First Manual Upload (Required)

Google Play requires the first APK/AAB to be uploaded manually. Build locally and upload:

```bash
cd /Users/adamstack/StackMap/StackMap/android

# Build release AAB
fastlane build_release

# Manually upload to Play Console:
# 1. Go to: https://play.google.com/console/
# 2. Navigate to: Testing > Internal testing
# 3. Create new release
# 4. Upload: app/build/outputs/bundle/release/app-release.aab
# 5. Complete release notes
# 6. Save as draft
```

After this first manual upload, fastlane can manage all subsequent releases.

### Deploy to Internal Testing

```bash
cd /Users/adamstack/StackMap/StackMap/android
fastlane beta_android
```

Expected workflow:
1. Validates signing configuration
2. Checks remote version codes (SAFEGUARD #2)
3. Increments versionCode if needed
4. Clears Metro and Gradle caches (SAFEGUARD #3)
5. Builds release AAB
6. Uploads to Google Play Internal Testing (SAFEGUARD #4 - retry)
7. Creates draft release in Play Console

### Publish Draft Release

After `beta_android` completes:

1. Go to: https://play.google.com/console/
2. Navigate to: Testing > Internal testing
3. Find the draft release
4. Review details
5. Click "Publish" to make available to testers

### Test the Release

1. Add your email to internal testing testers
2. Open the internal testing link on your Android device
3. Install the app from Play Store
4. Verify app launches and works correctly

---

## Troubleshooting

### Issue: "Google Play JSON key not found"

**Symptoms:**
```
Google Play JSON key not found. Run: fastlane store_credentials_in_keychain
```

**Solution:**
```bash
fastlane store_credentials_in_keychain
# Or set environment variable:
export PLAY_STORE_JSON_KEY_PATH="/path/to/key.json"
```

### Issue: "403 Forbidden" or "Insufficient permissions"

**Symptoms:**
- Upload fails with permission error
- "The caller does not have permission"

**Solution:**
1. Verify service account email in Play Console > Users and permissions
2. Ensure permissions granted:
   - View app information
   - Manage testing track releases
   - Manage production releases
3. Wait 10-15 minutes for permissions to propagate
4. Re-invite service account if needed

### Issue: "Version code has already been used"

**Symptoms:**
```
Version code 251003002 has already been used
```

**Solution:**
The `check_and_increment_version` lane should prevent this, but if it occurs:

```bash
# Manually increment version
fastlane increment_version_code

# Or edit app/build.gradle directly
# Change: versionCode 251003002
# To:     versionCode 251003003
```

### Issue: "STACKMAP_STORE_PASSWORD environment variable not set"

**Symptoms:**
```
STACKMAP_STORE_PASSWORD environment variable not set
```

**Solution:**
```bash
# Add to ~/.zshrc or ~/.bashrc
export STACKMAP_STORE_PASSWORD="your-keystore-password"
export STACKMAP_KEY_PASSWORD="your-key-password"

# Reload
source ~/.zshrc
```

### Issue: Release build crashes (ProGuard/R8 issue)

**Symptoms:**
- Release APK/AAB installs but crashes immediately
- Debug build works fine

**Solution:**
Test release build locally before uploading:

```bash
# Build release
fastlane build_release

# Install on device
adb install -r app/build/outputs/apk/release/app-release.apk

# Check logs
adb logcat | grep -i stackmap
```

Review ProGuard rules in `android/app/proguard-rules.pro` if needed.

### Issue: Upload fails repeatedly

**Symptoms:**
- Upload fails after 3 retry attempts (SAFEGUARD #4)
- Network timeout errors

**Solution:**
1. Check internet connection
2. Verify service account permissions
3. Check Google Play Console status: https://status.cloud.google.com/
4. Try manual upload to isolate issue
5. Check AAB file size (should be < 150 MB)

### Issue: "Hermes bytecode compilation failed"

**Symptoms:**
- Build fails during Hermes compilation
- JavaScript syntax error

**Solution:**
1. Review recent JavaScript changes
2. Temporarily disable Hermes in `android/gradle.properties`:
   ```properties
   hermesEnabled=false
   ```
3. Report issue if Hermes should support the syntax

### Issue: Gradle out of memory

**Symptoms:**
- Build fails with OutOfMemoryError
- System memory exhausted

**Solution:**
Already configured in `gradle.properties`, but can increase:

```properties
# android/gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

Stop Gradle daemon between builds:
```bash
cd android && ./gradlew --stop
```

### Getting Help

If you encounter issues not covered here:

1. Check fastlane logs: `android/fastlane/report.xml`
2. Check Gradle build logs
3. Verify all prerequisites completed
4. Review Google Play Console error messages
5. Consult fastlane docs: https://docs.fastlane.tools/

---

## Safeguards Implemented

### SAFEGUARD #1: Credential Security (30 min)

**Implementation:**
- Service account JSON path stored in macOS Keychain (not plaintext .env)
- Uses `security` command to read from Keychain
- Helper lane: `store_credentials_in_keychain` for initial setup
- Falls back to environment variable if Keychain not configured

**Code Location:**
- `Fastfile` lines 18-25: `read_from_keychain` helper function
- `Fastfile` lines 44-63: `store_credentials_in_keychain` lane
- `Fastfile` lines 66-83: `get_play_store_json_path` private lane

**Usage:**
```bash
# Store credentials
fastlane store_credentials_in_keychain

# Verify
security find-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' -w
```

### SAFEGUARD #2: Build Number Safety (20 min)

**Implementation:**
- Checks Google Play Console version codes before build
- Uses `google_play_track_version_codes` to query remote versions
- Only increments if local versionCode <= remote versionCode
- Prevents "version already used" errors

**Code Location:**
- `Fastfile` lines 211-258: `check_and_increment_version` lane
- Called automatically in `beta_android` lane (line 290)

**Usage:**
```bash
# Manual check
fastlane check_and_increment_version

# Automatic (part of beta_android)
fastlane beta_android
```

### SAFEGUARD #3: Metro Cache Invalidation (10 min)

**Implementation:**
- Clears `node_modules/.cache` before builds
- Runs Gradle `clean` task
- Removes `app/build` directory
- Uses `--no-daemon` flag to prevent Gradle daemon memory issues

**Code Location:**
- `Fastfile` lines 93-94: Metro cache clear in `build_debug`
- `Fastfile` lines 122-133: Full cache clear in `build_release`

**Benefits:**
- Prevents stale JavaScript bundle issues
- Ensures clean builds
- Reduces build inconsistencies

### SAFEGUARD #4: Basic Retry Logic (30 min)

**Implementation:**
- Wraps `upload_to_play_store` in retry block (3 attempts)
- Exponential backoff: 30s, 60s, 120s
- Logs all retry attempts
- Applied to both `beta_android` and `promote_to_production` lanes

**Code Location:**
- `Fastfile` lines 306-338: Retry logic in `beta_android`
- `Fastfile` lines 350-379: Retry logic in `promote_to_production`

**Usage:**
Automatic - no configuration needed. Upload will retry on failure:
```
Upload failed (attempt 1/3): [error]
Retrying in 30 seconds...
```

---

## Next Steps

1. **Test Local Builds**
   ```bash
   fastlane build_debug
   fastlane build_release
   ```

2. **Validate Signing**
   ```bash
   fastlane validate_signing
   ```

3. **First Manual Upload**
   - Build AAB locally
   - Upload to Play Console manually
   - Set up internal testing testers

4. **First Fastlane Deployment**
   ```bash
   fastlane beta_android
   ```

5. **Monitor and Iterate**
   - Review Play Console for draft release
   - Publish and test on device
   - Iterate on process as needed

6. **Integration with qual_deploy.sh (Optional)**
   - Modify deployment script to use fastlane
   - Preserve existing quality gates
   - Document new workflow

---

## Additional Resources

- **Fastlane Documentation:** https://docs.fastlane.tools/
- **Google Play Console:** https://play.google.com/console/
- **Service Account Setup:** https://developers.google.com/android-publisher/getting_started
- **Google Play Android Developer API:** https://developers.google.com/android-publisher
- **StackMap Implementation Plan:** `/Users/adamstack/atlas/wave-evidence/04-android-implementation-plan.md`

---

**Document Version:** 1.0
**Last Updated:** October 9, 2025
**Maintained by:** StackMap Development Team
