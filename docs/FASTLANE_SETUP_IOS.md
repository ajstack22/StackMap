# Fastlane Setup Guide - StackMap iOS

**Last Updated:** 2025-10-09
**Fastlane Version:** 2.228.0
**Project:** StackMap iOS (app.stackmap)

---

## Table of Contents

1. [Overview](#overview)
2. [Initial Setup](#initial-setup)
3. [Credential Security (Keychain)](#credential-security-keychain)
4. [Available Lanes](#available-lanes)
5. [Usage Examples](#usage-examples)
6. [Critical Safeguards](#critical-safeguards)
7. [Troubleshooting](#troubleshooting)
8. [Integration with Existing Workflow](#integration-with-existing-workflow)

---

## Overview

This fastlane setup extends the existing screenshot-only configuration to include:

- **Certificate Management:** Automatic provisioning profile sync
- **Build Automation:** Debug and release builds with React Native cache clearing
- **TestFlight Deployment:** Automated uploads with retry logic
- **Version Management:** Safe build number incrementation with TestFlight checks
- **Security:** Credentials stored in macOS Keychain (NOT plaintext)

**Key Features:**
- 4 Critical Safeguards (Keychain, Build Number Safety, Cache Clearing, Retry Logic)
- 8 New Lanes + 2 Existing Screenshot Lanes
- Backward compatible with existing deployment scripts

---

## Initial Setup

### Prerequisites

Already installed on your system:
- Fastlane 2.228.0 (via Homebrew)
- Xcode 15.x
- CocoaPods
- Ruby (system or rbenv)

### Step 1: Create Environment File

```bash
cd /Users/adamstack/StackMap/StackMap/ios/fastlane
cp .env.default .env
```

### Step 2: Configure Apple Account Credentials

**DO NOT** edit .env with plaintext passwords. Instead, use the secure Keychain setup:

```bash
cd /Users/adamstack/StackMap/StackMap/ios
fastlane store_credentials_in_keychain
```

This interactive lane will:
1. Prompt for your Apple ID email
2. Prompt for your App-Specific Password
3. Store both securely in macOS Keychain
4. Never write passwords to files

**To generate an App-Specific Password:**
1. Go to: https://appleid.apple.com/account/manage
2. Section: "Sign-In and Security"
3. Click: "App-Specific Passwords"
4. Generate new password named: "Fastlane TestFlight"
5. Copy the password (format: xxxx-xxxx-xxxx-xxxx)
6. Use it in the `store_credentials_in_keychain` lane

### Step 3: Verify Credentials Stored

```bash
# Check Apple ID
security find-generic-password -a 'fastlane-stackmap' -s 'FASTLANE_APPLE_ID' -w

# Check password (will prompt for system password)
security find-generic-password -a 'fastlane-stackmap' -s 'FASTLANE_APP_SPECIFIC_PASSWORD' -w
```

### Step 4: Update .env File

Edit `/Users/adamstack/StackMap/StackMap/ios/fastlane/.env`:

```bash
# Set your Apple ID (same as in Keychain)
FASTLANE_APPLE_ID="your-apple-id@email.com"

# All other values are already correct
FASTLANE_TEAM_ID="84W9WSYQQB"
FASTLANE_ITC_TEAM_ID="84W9WSYQQB"
FASTLANE_APP_IDENTIFIER="app.stackmap"
FASTLANE_XCODE_SCHEME="StackMapNative"
FASTLANE_WORKSPACE="StackMapNative.xcworkspace"
```

**Note:** Do NOT add password to .env - it's retrieved from Keychain automatically.

### Step 5: Validate Environment

```bash
cd /Users/adamstack/StackMap/StackMap/ios
fastlane validate_environment
```

Expected output:
```
✅ Xcode version valid
✅ Workspace found
✅ CocoaPods version: 1.x.x
✅ Validating scheme: StackMapNative
🎉 Environment validation complete!
```

### Step 6: Setup Code Signing

```bash
fastlane setup_certificates
```

This will:
- Check for valid signing certificates
- Download provisioning profile for app.stackmap
- Verify everything is ready for builds

---

## Credential Security (Keychain)

### Why Keychain Instead of .env Files?

**Security Benefits:**
1. Passwords NEVER written to disk in plaintext
2. Encrypted by macOS using your login password
3. Not accidentally committed to git
4. Can't be read without system password prompt

### Manual Keychain Setup (Alternative)

If you prefer to manually configure Keychain:

```bash
# Store Apple ID
security add-generic-password \
  -a 'fastlane-stackmap' \
  -s 'FASTLANE_APPLE_ID' \
  -w 'your-email@example.com' \
  -U

# Store App-Specific Password
security add-generic-password \
  -a 'fastlane-stackmap' \
  -s 'FASTLANE_APP_SPECIFIC_PASSWORD' \
  -w 'xxxx-xxxx-xxxx-xxxx' \
  -U
```

**Flags explained:**
- `-a`: Account name (we use 'fastlane-stackmap')
- `-s`: Service name (environment variable name)
- `-w`: Password/secret value
- `-U`: Update if already exists

### How Fastlane Retrieves from Keychain

The Fastfile includes a helper function that:
1. Tries to read from Keychain first
2. Falls back to .env if Keychain fails
3. Provides clear error messages if both fail

```ruby
# From Fastfile (you don't need to do this manually)
private_lane :get_password_from_keychain do
  begin
    password = sh("security find-generic-password -a 'fastlane-stackmap' -s 'FASTLANE_APP_SPECIFIC_PASSWORD' -w").strip
    password
  rescue
    ENV["FASTLANE_APP_SPECIFIC_PASSWORD"]
  end
end
```

### Removing Credentials from Keychain

If you need to update or remove credentials:

```bash
# Remove Apple ID
security delete-generic-password -a 'fastlane-stackmap' -s 'FASTLANE_APPLE_ID'

# Remove password
security delete-generic-password -a 'fastlane-stackmap' -s 'FASTLANE_APP_SPECIFIC_PASSWORD'

# Then re-run store_credentials_in_keychain
fastlane store_credentials_in_keychain
```

---

## Available Lanes

### Infrastructure Lanes

#### `validate_environment`
**Purpose:** Verify all build prerequisites are met
**Usage:** `fastlane validate_environment`
**Checks:**
- Xcode version (minimum 14.0)
- Workspace exists
- CocoaPods installed
- Scheme is valid

**When to use:** Before first build, or when troubleshooting build issues

---

#### `setup_certificates`
**Purpose:** Install and verify code signing certificates
**Usage:** `fastlane setup_certificates`
**Actions:**
- Lists available signing identities
- Downloads provisioning profile for app.stackmap
- Verifies profile is valid

**When to use:**
- After fresh git clone
- After certificate expiration
- Before first TestFlight upload

---

#### `store_credentials_in_keychain`
**Purpose:** Securely store Apple ID credentials in macOS Keychain
**Usage:** `fastlane store_credentials_in_keychain`
**Interactive:** Prompts for Apple ID and App-Specific Password
**Security:** Passwords stored in Keychain, NOT plaintext files

**When to use:**
- Initial setup
- Updating credentials
- Moving to new machine

---

### Build Lanes

#### `build_debug`
**Purpose:** Build debug IPA for local testing
**Usage:** `fastlane build_debug`
**Output:** `./build/debug/StackMap-Debug.ipa`
**Configuration:** Debug, Development export method
**Safeguards:** Metro cache clearing

**Build time:** 3-5 minutes (first build), 1-2 minutes (incremental)

---

#### `build_release`
**Purpose:** Build production-ready IPA for TestFlight/App Store
**Usage:** `fastlane build_release`
**Output:** `./build/release/StackMap-Release.ipa`
**Configuration:** Release, App Store export method
**Safeguards:**
- Certificate verification
- Metro cache clearing
- ExportOptions.plist auto-update

**Build time:** 5-8 minutes (clean build)

---

### Deployment Lanes

#### `increment_build_number`
**Purpose:** Safely increment build number
**Usage:** `fastlane increment_build_number`
**Safeguard #2:** Checks TestFlight for latest build number
**Logic:**
- Queries App Store Connect for latest TestFlight build
- If local build <= remote build, sets to remote + 1
- Otherwise, increments local build by 1
- **Prevents build number conflicts**

**Example:**
```
Latest TestFlight build: 251003005
Current local build: 251003003
Action: Set to 251003006 (remote + 1)
```

---

#### `upload_testflight`
**Purpose:** Upload existing IPA to TestFlight
**Usage:**
```bash
# Upload default IPA
fastlane upload_testflight

# Custom IPA path
fastlane upload_testflight ipa_path:"./custom/path/app.ipa"

# With changelog
fastlane upload_testflight changelog:"New sync improvements"
```

**Safeguards:**
- **#1:** Retrieves password from Keychain
- **#4:** Retry logic (3 attempts, exponential backoff: 30s, 60s, 120s)

**Upload time:** 2-5 minutes (depending on connection)

---

#### `beta_ios`
**Purpose:** Complete beta deployment pipeline
**Usage:**
```bash
# Full pipeline (validate, build, increment, upload)
fastlane beta_ios

# Skip build increment (if already incremented)
fastlane beta_ios skip_increment:true

# With custom changelog
fastlane beta_ios changelog:"Major sync refactor"
```

**Pipeline:**
1. Validate environment
2. Setup certificates
3. Increment build number (unless skip_increment:true)
4. Build release IPA
5. Upload to TestFlight (with retry logic)

**Total time:** 8-12 minutes (build + upload)

---

### Screenshot Lanes (Preserved from Original Setup)

#### `screenshots`
**Purpose:** Generate App Store screenshots
**Usage:** `fastlane screenshots`
**Devices:** iPhone 16 Pro Max, iPhone 16 Pro, iPad Pro 13"

---

#### `frame_screenshots`
**Purpose:** Add device frames to screenshots
**Usage:** `fastlane frame_screenshots`

---

## Usage Examples

### Example 1: First-Time Setup

```bash
cd /Users/adamstack/StackMap/StackMap/ios

# 1. Store credentials securely
fastlane store_credentials_in_keychain

# 2. Validate environment
fastlane validate_environment

# 3. Setup certificates
fastlane setup_certificates

# 4. Test build
fastlane build_debug
```

---

### Example 2: Deploy to TestFlight

```bash
cd /Users/adamstack/StackMap/StackMap/ios

# Complete pipeline (recommended)
fastlane beta_ios
```

**What happens:**
1. Validates Xcode, workspace, CocoaPods
2. Downloads latest provisioning profile
3. Checks TestFlight for latest build number
4. Increments build number safely
5. Clears Metro bundler cache
6. Builds release IPA
7. Uploads to TestFlight with retry logic

---

### Example 3: Build Only (No Upload)

```bash
cd /Users/adamstack/StackMap/StackMap/ios

# Build release IPA
fastlane build_release

# IPA location: ./build/release/StackMap-Release.ipa
```

---

### Example 4: Upload Pre-Built IPA

```bash
cd /Users/adamstack/StackMap/StackMap/ios

# Upload existing IPA
fastlane upload_testflight ipa_path:"./build/release/StackMap-Release.ipa"
```

---

### Example 5: Integration with qual_deploy.sh

```bash
# Run existing deployment script
cd /Users/adamstack/StackMap/StackMap
./scripts/qual_deploy.sh --ios

# Then upload to TestFlight
cd ios
fastlane beta_ios skip_increment:true
```

**Note:** Use `skip_increment:true` because qual_deploy.sh already increments version.

---

## Critical Safeguards

### Safeguard #1: Credential Security (Keychain)

**Problem:** Passwords in plaintext .env files can be accidentally committed to git.

**Solution:**
- Credentials stored in macOS Keychain
- Encrypted with your login password
- Retrieved automatically by fastlane
- Helper lane: `store_credentials_in_keychain`

**Implementation:**
```ruby
# From Fastfile
private_lane :get_password_from_keychain do
  begin
    password = sh("security find-generic-password -a 'fastlane-stackmap' -s 'FASTLANE_APP_SPECIFIC_PASSWORD' -w").strip
    password
  rescue
    ENV["FASTLANE_APP_SPECIFIC_PASSWORD"]
  end
end
```

**Verification:**
```bash
# Check credential stored
security find-generic-password -a 'fastlane-stackmap' -s 'FASTLANE_APPLE_ID' -w
```

---

### Safeguard #2: Build Number Safety

**Problem:** Uploading a build with a number that already exists in TestFlight causes rejection.

**Solution:**
- Query TestFlight for latest build number before incrementing
- Set local build to `max(local, remote) + 1`
- Prevents conflicts automatically

**Implementation:**
```ruby
# From increment_build_number lane
latest_build = latest_testflight_build_number(
  app_identifier: "app.stackmap",
  team_id: "84W9WSYQQB"
)

if current_build <= latest_build
  new_build = latest_build + 1
else
  new_build = current_build + 1
end
```

**Example:**
```
Scenario: TestFlight has build 100, local has build 98
Action: Set local to 101 (not 99)
Result: No conflict
```

---

### Safeguard #3: Metro Cache Invalidation

**Problem:** Stale Metro bundler cache can cause incorrect JavaScript bundles in iOS builds.

**Solution:**
- Clear Metro cache before release builds
- Remove temporary cache directories
- Ensures fresh JavaScript bundle

**Implementation:**
```ruby
# From build_release lane
UI.message("🧹 Clearing Metro bundler cache for release build...")
sh("rm -rf $TMPDIR/metro-* || true")
sh("rm -rf $TMPDIR/haste-* || true")
```

**When it runs:**
- Before every `build_release` call
- Before every `beta_ios` call (which calls build_release)

---

### Safeguard #4: Basic Retry Logic

**Problem:** Network issues can cause TestFlight uploads to fail transiently.

**Solution:**
- Retry failed uploads up to 3 times
- Exponential backoff: 30s, 60s, 120s
- Log all retry attempts

**Implementation:**
```ruby
# From upload_testflight lane
retry_count = 0
max_retries = 3
backoff_delays = [30, 60, 120]  # seconds

begin
  retry_count += 1
  # ... upload logic ...
rescue => ex
  if retry_count < max_retries
    delay = backoff_delays[retry_count - 1]
    UI.important("⏳ Waiting #{delay} seconds before retry...")
    sleep(delay)
    retry
  else
    raise ex
  end
end
```

**Example:**
```
Attempt 1: Upload fails (network timeout)
Wait 30 seconds...
Attempt 2: Upload fails (rate limit)
Wait 60 seconds...
Attempt 3: Upload succeeds ✅
```

---

## Troubleshooting

### Issue: "Could not find scheme 'StackMapNative'"

**Cause:** Scheme is not shared in Xcode.

**Solution:**
1. Open `StackMapNative.xcworkspace` in Xcode
2. Menu: Product → Scheme → Manage Schemes
3. Check "Shared" for StackMapNative
4. Commit the file: `ios/StackMapNative.xcworkspace/xcshareddata/xcschemes/StackMapNative.xcscheme`

---

### Issue: "Provisioning profile expired"

**Cause:** Provisioning profile needs renewal.

**Solution:**
```bash
# Force refresh provisioning profile
fastlane setup_certificates

# Or manually:
# 1. Go to: https://developer.apple.com/account/resources/profiles/list
# 2. Find "StackMap Distribution" profile
# 3. Click "Edit" → "Generate" → Download
# 4. Double-click to install
```

---

### Issue: "A build with version X already exists"

**Cause:** Build number conflict with TestFlight.

**Solution:**
This should NOT happen if you use `increment_build_number` lane, which checks TestFlight.

If it does happen:
```bash
# Manually set build number higher
cd /Users/adamstack/StackMap/StackMap/ios
agvtool new-version -all 251003999
```

---

### Issue: "Two-factor authentication required"

**Cause:** Using regular Apple ID password instead of App-Specific Password.

**Solution:**
1. Generate App-Specific Password at: https://appleid.apple.com/account/manage
2. Update Keychain:
```bash
fastlane store_credentials_in_keychain
```

---

### Issue: "Upload to TestFlight failed after 3 retries"

**Cause:** Network issues, API outage, or credential problems.

**Solutions:**
1. **Check internet connection**
2. **Verify credentials:**
   ```bash
   security find-generic-password -a 'fastlane-stackmap' -s 'FASTLANE_APP_SPECIFIC_PASSWORD' -w
   ```
3. **Check Apple System Status:** https://www.apple.com/support/systemstatus/
4. **Manual upload via Xcode:**
   - Open Xcode → Window → Organizer
   - Select latest archive
   - Click "Distribute App" → TestFlight

---

### Issue: "Build fails in fastlane but works in Xcode"

**Cause:** Build cache issues or environment differences.

**Solution:**
```bash
# Clean everything
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf /Users/adamstack/StackMap/StackMap/ios/build

# Reinstall pods
cd /Users/adamstack/StackMap/StackMap/ios
pod deintegrate
pod install

# Try build again
fastlane build_release
```

---

### Issue: "Keychain unlock required during upload"

**Cause:** Keychain is locked or needs permission.

**Solution:**
```bash
# Unlock keychain explicitly
security unlock-keychain login.keychain

# Or allow fastlane to access Keychain:
# System Preferences → Security & Privacy → Privacy → Full Disk Access
# Add Terminal or your IDE
```

---

### Issue: "Metro bundler cache not cleared"

**Symptom:** Old JavaScript code in iOS build.

**Solution:**
The `build_release` lane already clears Metro cache. If issues persist:

```bash
# Manual Metro cache clear
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*

# Clear React Native cache
cd /Users/adamstack/StackMap/StackMap
npx react-native start --reset-cache
# Press Ctrl+C after 5 seconds

# Then build
cd ios
fastlane build_release
```

---

## Integration with Existing Workflow

### Current Deployment Process (qual_deploy.sh)

**Steps:**
1. Run tests (Smoke → Critical → Important → UI)
2. Increment version (YY.MM.DD.BBB format)
3. Build for iOS Simulator
4. Install on simulator
5. Commit to git

**No TestFlight upload currently**

---

### Enhanced Workflow with Fastlane

**Option 1: Manual Invocation (Recommended for now)**

```bash
# Step 1: Run existing qual_deploy.sh
cd /Users/adamstack/StackMap/StackMap
./scripts/qual_deploy.sh --ios

# Step 2: Upload to TestFlight
cd ios
fastlane beta_ios skip_increment:true
```

**Why `skip_increment:true`?**
qual_deploy.sh already increments the version, so we don't want fastlane to increment again.

---

**Option 2: Integrated Script (Future Enhancement)**

Add to `qual_deploy.sh` after line 578 (end of iOS deployment):

```bash
# Optional TestFlight upload
if [ "$UPLOAD_TESTFLIGHT" = true ]; then
    echo "📤 Uploading to TestFlight..."
    cd ios
    fastlane upload_testflight \
        changelog:"$RELEASE_NOTES" \
        skip_increment:true
    cd ..
    echo "✅ TestFlight upload initiated"
fi
```

**Usage:**
```bash
# Normal deployment (simulator only)
./scripts/qual_deploy.sh --ios

# Deploy + TestFlight upload
UPLOAD_TESTFLIGHT=true ./scripts/qual_deploy.sh --ios
```

---

## Advanced: App Store Connect API Key (Alternative to Apple ID)

**Why use API Key?**
- More secure than Apple ID + password
- No 2FA prompts
- Better for CI/CD
- Keys can be rotated without changing Apple ID password

**Setup:**

1. **Generate API Key:**
   - Go to: https://appstoreconnect.apple.com/access/api
   - Click: "Keys" tab → "+" button
   - Name: "Fastlane Automation"
   - Access: "App Manager" role
   - Click: "Generate"
   - Download: `AuthKey_ABC123DEF4.p8` (ONLY SHOWN ONCE!)
   - Note: Key ID (e.g., ABC123DEF4) and Issuer ID (UUID)

2. **Move API Key to fastlane directory:**
   ```bash
   mv ~/Downloads/AuthKey_*.p8 /Users/adamstack/StackMap/StackMap/ios/fastlane/
   chmod 600 /Users/adamstack/StackMap/StackMap/ios/fastlane/AuthKey_*.p8
   ```

3. **Update .env file:**
   ```bash
   # Add these lines (replace with your values)
   APP_STORE_CONNECT_API_KEY_KEY_ID="ABC123DEF4"
   APP_STORE_CONNECT_API_KEY_ISSUER_ID="12345678-1234-1234-1234-123456789012"
   APP_STORE_CONNECT_API_KEY_KEY="./AuthKey_ABC123DEF4.p8"
   ```

4. **Verify:**
   ```bash
   cd /Users/adamstack/StackMap/StackMap/ios
   fastlane upload_testflight
   # Should authenticate with API key, no password prompt
   ```

**Recommendation:** Use API Key for production, Apple ID for initial testing.

---

## Summary

**Files Created:**
- `/Users/adamstack/StackMap/StackMap/ios/fastlane/Appfile`
- `/Users/adamstack/StackMap/StackMap/ios/fastlane/.env.default`
- `/Users/adamstack/StackMap/StackMap/docs/FASTLANE_SETUP_IOS.md` (this file)

**Files Modified:**
- `/Users/adamstack/StackMap/StackMap/ios/fastlane/Fastfile` (extended with 8 new lanes)
- `/Users/adamstack/StackMap/StackMap/ios/ExportOptions.plist` (Team ID updated)
- `/Users/adamstack/StackMap/StackMap/.gitignore` (secrets excluded)

**New Lanes:**
1. `store_credentials_in_keychain` - Secure credential storage
2. `validate_environment` - Pre-flight checks
3. `setup_certificates` - Certificate management
4. `build_debug` - Debug builds
5. `build_release` - Release builds
6. `increment_build_number` - Safe version management
7. `upload_testflight` - TestFlight upload with retry
8. `beta_ios` - Complete deployment pipeline

**Critical Safeguards:**
1. Credential Security (macOS Keychain)
2. Build Number Safety (TestFlight check)
3. Metro Cache Invalidation
4. Retry Logic (3 attempts, exponential backoff)

**Next Steps:**
1. Run: `fastlane store_credentials_in_keychain`
2. Run: `fastlane validate_environment`
3. Run: `fastlane setup_certificates`
4. Test: `fastlane build_debug`
5. Deploy: `fastlane beta_ios`

---

**Support:**
- Fastlane Docs: https://docs.fastlane.tools
- Troubleshooting: See section above
- Project Context: `/Users/adamstack/atlas/wave-evidence/03-ios-implementation-plan.md`

**Version:** 1.0.0
**Author:** Atlas Agent - iOS Implementation
**Date:** 2025-10-09
