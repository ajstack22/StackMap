# Android Fastlane Authentication - Complete Guide

**Target Audience:** Developers setting up Android deployment automation with Fastlane
**Last Updated:** January 2025
**Project:** StackMap (Multi-tier deployment system)

---

## Table of Contents
1. [Authentication Overview](#authentication-overview)
2. [Prerequisites](#prerequisites)
3. [Google Play Console Setup](#google-play-console-setup)
4. [App Signing Configuration](#app-signing-configuration)
5. [Credential Management](#credential-management)
6. [Fastlane Configuration](#fastlane-configuration)
7. [Deployment Flow](#deployment-flow)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

---

## Authentication Overview

Android deployment with Fastlane requires **two types of authentication**:

### 1. Google Play Console Authentication
- **Purpose:** Upload builds to Google Play Store
- **Method:** Service account JSON key file
- **Scope:** API access to Google Play Console
- **Used by:** `upload_to_play_store` Fastlane action

### 2. App Signing Authentication
- **Purpose:** Sign APK/AAB files for distribution
- **Method:** Keystore file + passwords
- **Scope:** Code signing for Android apps
- **Used by:** Gradle build process

**Both are required** for automated deployments. Without Google Play auth, you can build but not upload. Without signing auth, you cannot create release builds.

---

## Prerequisites

### Required Tools
```bash
# Fastlane (Ruby-based automation tool)
sudo gem install fastlane

# Bundler (for managing Ruby dependencies)
sudo gem install bundler

# Android SDK (via Android Studio or command line tools)
# https://developer.android.com/studio

# Java Development Kit (JDK 17 recommended for React Native)
# https://www.oracle.com/java/technologies/downloads/
```

### Required Access
- **Google Play Console:** Developer account with app owner or admin role
- **Google Cloud Console:** Access to create service accounts
- **Keystore file:** Release keystore for app signing (create if doesn't exist)

---

## Google Play Console Setup

### Step 1: Create a Service Account

A service account allows Fastlane to authenticate with Google Play Console programmatically.

1. **Navigate to Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project (or create one if needed)

2. **Enable Google Play Android Developer API:**
   ```
   APIs & Services > Library > Search "Google Play Android Developer API" > Enable
   ```

3. **Create Service Account:**
   - Go to `IAM & Admin > Service Accounts`
   - Click `Create Service Account`
   - **Name:** `fastlane-stackmap` (or any descriptive name)
   - **Description:** `Service account for Fastlane deployment automation`
   - Click `Create and Continue`

4. **Grant Permissions:**
   - **Role:** `Service Account User` (allows the service account to act on behalf of your app)
   - Click `Continue` > `Done`

5. **Create JSON Key:**
   - Click on the newly created service account
   - Go to `Keys` tab
   - Click `Add Key > Create New Key`
   - **Type:** JSON
   - Click `Create` - a JSON file will download
   - **IMPORTANT:** Save this file securely - you cannot download it again

### Step 2: Link Service Account to Google Play Console

1. **Navigate to Google Play Console:**
   - Go to [Google Play Console](https://play.google.com/console/)
   - Select your app (or create if new)

2. **Add Service Account:**
   - Go to `Setup > API Access`
   - Scroll to `Service Accounts`
   - Click `Link` or `Create new service account`
   - If linking, select your service account and click `Grant Access`

3. **Configure Permissions:**
   - **App permissions:** Select your app (e.g., `com.stackmapnative`)
   - **Account permissions:**
     - ✅ `View app information and download bulk reports`
     - ✅ `Manage production releases`
     - ✅ `Manage testing track releases` (for internal/beta testing)
   - Click `Apply` > `Invite User`

### Step 3: Verify Setup

```bash
# Test authentication with a simple Fastlane command
cd android
fastlane run validate_play_store_json_key json_key:/path/to/your-service-account.json
```

**Expected output:** Success message confirming authentication

---

## App Signing Configuration

### Understanding Android Keystores

A **keystore** is a binary file containing your app's signing certificate. Android requires all apps to be digitally signed before installation.

**Key Concepts:**
- **Keystore file:** Binary file containing one or more private keys
- **Keystore password:** Password to access the keystore file (store password)
- **Key alias:** Identifier for a specific key within the keystore
- **Key password:** Password for the specific key (key password)

### Option 1: Create a New Keystore (First Time)

```bash
# Navigate to android/app directory
cd android/app

# Generate release keystore
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore stackmap-release.keystore \
  -alias stackmap \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You will be prompted for:
# 1. Keystore password (store password) - SAVE THIS!
# 2. Key password (can be same as keystore password) - SAVE THIS!
# 3. Your name, organization, etc. (certificate details)
```

**CRITICAL:** Save these passwords immediately in a password manager. You cannot recover them if lost.

### Option 2: Use Existing Keystore

If you already have a keystore (e.g., from manual releases):

```bash
# Copy existing keystore to android/app/
cp /path/to/existing.keystore android/app/stackmap-release.keystore

# Verify keystore is valid
keytool -list -v -keystore android/app/stackmap-release.keystore
# Enter keystore password when prompted
```

### Configure Gradle for Signing

Edit `android/app/build.gradle`:

```gradle
android {
    // ... other config ...

    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file('stackmap-release.keystore')
            // Passwords read from environment variables or Gradle properties
            storePassword System.getenv("STACKMAP_STORE_PASSWORD") ?: project.findProperty("MYAPP_RELEASE_STORE_PASSWORD")
            keyAlias 'stackmap'
            keyPassword System.getenv("STACKMAP_KEY_PASSWORD") ?: project.findProperty("MYAPP_RELEASE_KEY_PASSWORD")
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

**Explanation:**
- `storeFile`: Path to keystore (relative to `android/app/`)
- `storePassword`: Keystore file password (from environment or Gradle properties)
- `keyAlias`: Identifier for the key (must match what you created)
- `keyPassword`: Key-specific password

---

## Credential Management

### The StackMap Approach: macOS Keychain

StackMap uses **macOS Keychain** for secure credential storage. This is superior to environment variables or plain text files.

**Advantages:**
- 🔒 **Secure:** Encrypted storage, OS-managed access control
- 🚀 **Convenient:** No need to export environment variables
- 🔄 **Persistent:** Survives terminal sessions and reboots
- 👥 **Isolated:** Per-user credentials, no accidental sharing

### Step 1: Store Credentials in Keychain

Fastlane includes a helper lane to store credentials:

```bash
cd android
fastlane store_credentials_in_keychain
```

**You will be prompted for:**
1. **Google Play JSON key path:** Full path to your service account JSON file
   - Example: `/Users/yourname/Downloads/stackmap-play-console-abc123.json`
2. **Keystore store password:** Password for the keystore file
3. **Keystore key password:** Password for the key alias

**What this does (under the hood):**
```bash
# Stores JSON key path
security add-generic-password \
  -a 'stackmap-android' \
  -s 'stackmap-play-store-json-path' \
  -w '/path/to/service-account.json' \
  -U

# Stores keystore store password
security add-generic-password \
  -a 'stackmap-android' \
  -s 'stackmap-keystore-store-password' \
  -w 'your-store-password' \
  -U

# Stores keystore key password
security add-generic-password \
  -a 'stackmap-android' \
  -s 'stackmap-keystore-key-password' \
  -w 'your-key-password' \
  -U
```

**Parameters explained:**
- `-a`: Account name (grouping identifier)
- `-s`: Service name (unique identifier for this credential)
- `-w`: Password/secret value
- `-U`: Update if exists, create if not

### Step 2: Verify Keychain Storage

```bash
# Check if credentials are stored
security find-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' -w

# You should see the path to your JSON file
# If you get an error, the credential wasn't stored correctly
```

### Step 3: How Fastlane Reads from Keychain

The Fastfile includes helper functions to read credentials:

```ruby
# Read credentials from macOS Keychain
def read_from_keychain(service_name, account_name)
  begin
    result = sh("security find-generic-password -s '#{service_name}' -a '#{account_name}' -w 2>/dev/null || true").strip
    return result.empty? ? nil : result
  rescue
    return nil
  end
end

# Example: Get Play Store JSON path
private_lane :get_play_store_json_path do
  # Try Keychain first
  keychain_path = read_from_keychain("stackmap-play-store-json-path", "stackmap-android")

  if keychain_path && !keychain_path.empty?
    UI.message("Using JSON key from Keychain")
    keychain_path
  elsif ENV["PLAY_STORE_JSON_KEY_PATH"]
    UI.message("Using JSON key from ENV")
    ENV["PLAY_STORE_JSON_KEY_PATH"]
  else
    UI.user_error!("Google Play JSON key not found. Run: fastlane store_credentials_in_keychain")
  end
end
```

**Fallback hierarchy:**
1. **Keychain** (preferred)
2. **Environment variables** (legacy support)
3. **Error** (if neither found)

### Alternative: Environment Variables (Not Recommended)

If you prefer environment variables over Keychain:

```bash
# Add to ~/.zshrc or ~/.bash_profile
export PLAY_STORE_JSON_KEY_PATH="/Users/yourname/stackmap-play-console.json"
export STACKMAP_STORE_PASSWORD="your-keystore-store-password"
export STACKMAP_KEY_PASSWORD="your-keystore-key-password"

# Reload shell config
source ~/.zshrc
```

**Downsides:**
- ⚠️ Less secure (visible in process lists, shell history)
- ⚠️ Easy to accidentally commit to version control
- ⚠️ Requires manual setup on every new machine

---

## Fastlane Configuration

### File Structure

```
android/
├── fastlane/
│   ├── Appfile          # App configuration (package name, JSON key)
│   ├── Fastfile         # Deployment lanes and logic
│   └── README.md        # Auto-generated lane documentation
├── app/
│   ├── build.gradle     # Build configuration (signing, flavors)
│   ├── stackmap-release.keystore  # Release signing key
│   └── debug.keystore   # Debug signing key (auto-generated)
└── gradle.properties    # Gradle properties (keystore config)
```

### Appfile Configuration

Location: `android/fastlane/Appfile`

```ruby
# Package name (application ID)
package_name("com.stackmapnative")

# Google Play Console service account JSON key
# Reads from Keychain via get_play_store_json_path lane
# Fallback to ENV if Keychain not configured
json_key_file(ENV["PLAY_STORE_JSON_KEY_PATH"] || "~/.android/stackmap-play-store-key.json")
```

**Explanation:**
- `package_name`: Your app's unique identifier (must match Google Play Console)
- `json_key_file`: Path to service account JSON (Fastlane will use Keychain if available)

### Fastfile - Key Deployment Lanes

Location: `android/fastlane/Fastfile`

#### Lane: `stage_android` (Internal Testing)

```ruby
desc "Build and deploy to Google Play Internal Testing (stage environment)"
lane :stage_android do
  UI.message("🚀 Starting stage deployment pipeline (Internal track)...")

  # Step 1: Validate signing configuration
  validate_signing

  # Step 2: Check and increment version if needed
  check_and_increment_version

  # Step 3: Build release AAB using STAGE flavor
  UI.message("Building stage release AAB...")
  build_release_flavor(flavor: "stage")

  # Step 4: Upload to Play Store Internal Testing
  upload_to_play_store_with_retry(
    track: 'internal',
    build_type: 'stage'
  )

  # Step 5: Generate deployment summary
  generate_deployment_summary(
    platform: "Android",
    env: "stage",
    version: version_name,
    build: version_code,
    success: true
  )
end
```

**What happens:**
1. **Validate signing:** Ensures keystore file exists and passwords are available
2. **Version management:** Checks Google Play for latest version, increments if needed
3. **Build AAB:** Creates signed Android App Bundle for Play Store
4. **Upload:** Uploads to Internal Testing track (retry logic included)
5. **Report:** Generates deployment summary

#### Lane: `beta_android` (Closed Testing)

```ruby
desc "Build and deploy to Google Play Closed Testing (beta environment)"
lane :beta_android do
  UI.message("🚀 Starting beta deployment pipeline (Closed Testing)...")

  # Step 1: Validate environment
  validate_signing

  # Step 2: Check and increment version
  check_and_increment_version

  # Step 3: Build release AAB using BETA flavor
  UI.message("Building beta release AAB...")
  build_release_flavor(flavor: "beta")

  # Step 4: Upload to Play Store Closed Testing
  upload_to_play_store_with_retry(
    track: 'closed',  # Closed Testing for wider beta groups
    build_type: 'beta'
  )

  # Step 5: Generate deployment summary
  generate_deployment_summary(
    platform: "Android",
    env: "beta",
    version: version_name,
    build: version_code,
    success: true
  )
end
```

**Difference from stage:**
- Uses `closed` track instead of `internal` (supports larger tester groups)
- Uses `beta` flavor (connects to beta API endpoint)

#### Helper Lane: `build_release_flavor`

```ruby
private_lane :build_release_flavor do |options|
  flavor = options[:flavor] || "prod"

  # Get keystore passwords from Keychain
  store_password = get_keystore_store_password
  key_password = get_keystore_key_password

  # Clear caches for clean build
  UI.message("Clearing Metro bundler cache...")
  sh("rm -rf ../../node_modules/.cache 2>/dev/null || true")

  UI.message("Clearing Gradle build cache...")
  gradle(task: "clean", project_dir: "./", flags: "--no-daemon")
  sh("rm -rf ./app/build 2>/dev/null || true")

  # Build AAB (required for Play Store)
  UI.message("Building #{flavor} release AAB...")
  gradle(
    task: "bundle#{flavor.capitalize}Release",
    project_dir: "./",
    print_command: false,  # Don't print passwords
    flags: "--no-daemon",
    properties: {
      "MYAPP_RELEASE_STORE_FILE" => "stackmap-release.keystore",
      "MYAPP_RELEASE_KEY_ALIAS" => "stackmap",
      "MYAPP_RELEASE_STORE_PASSWORD" => store_password,
      "MYAPP_RELEASE_KEY_PASSWORD" => key_password,
      "reactNativeArchitectures" => "armeabi-v7a,arm64-v8a,x86,x86_64"
    }
  )

  # Also build APK for direct distribution
  UI.message("Building #{flavor} release APK...")
  gradle(
    task: "assemble#{flavor.capitalize}Release",
    project_dir: "./",
    print_command: false,
    flags: "--no-daemon",
    properties: {
      "MYAPP_RELEASE_STORE_FILE" => "stackmap-release.keystore",
      "MYAPP_RELEASE_KEY_ALIAS" => "stackmap",
      "MYAPP_RELEASE_STORE_PASSWORD" => store_password,
      "MYAPP_RELEASE_KEY_PASSWORD" => key_password
    }
  )

  UI.success("#{flavor} release builds completed successfully!")
end
```

**Key points:**
1. **Password retrieval:** Gets passwords from Keychain securely
2. **Cache clearing:** Ensures clean build (prevents stale JS bundle issues)
3. **Gradle properties:** Passes signing credentials to Gradle
4. **Multiple architectures:** Builds for all Android CPU architectures
5. **Dual output:** Creates both AAB (Play Store) and APK (direct install)

#### Helper Lane: `upload_to_play_store_with_retry`

```ruby
private_lane :upload_to_play_store_with_retry do |options|
  track = options[:track] || 'internal'
  aab_path = options[:aab_path] || Actions.lane_context[SharedValues::GRADLE_AAB_OUTPUT_PATH]
  build_type = options[:build_type] || 'stage'
  release_notes = options[:release_notes]  # Optional

  unless File.exist?(aab_path)
    UI.user_error!("❌ AAB not found at #{aab_path}")
  end

  UI.message("Uploading to Google Play #{track} track (#{build_type} environment)...")

  json_key = get_play_store_json_path  # From Keychain

  retry_count = 0
  max_retries = 3
  backoff_delays = [30, 60, 120]  # Exponential backoff

  begin
    upload_to_play_store(
      track: track,
      aab: aab_path,
      skip_upload_apk: true,
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true,
      release_status: 'draft',  # Safe default - requires manual publish
      json_key: json_key
    )

    UI.success("🎉 #{build_type.capitalize} deployment completed!")
  rescue => ex
    retry_count += 1

    if retry_count <= max_retries
      delay = backoff_delays[retry_count - 1]
      UI.error("Upload failed (attempt #{retry_count}/#{max_retries}): #{ex}")
      UI.important("Retrying in #{delay} seconds...")
      sleep(delay)
      retry
    else
      UI.user_error!("Upload failed after #{max_retries} attempts: #{ex}")
    end
  end
end
```

**Retry logic:**
- **Attempt 1:** Immediate
- **Attempt 2:** Wait 30s
- **Attempt 3:** Wait 60s
- **Attempt 4:** Wait 120s
- **After 3 retries:** Fail with error

**Why retry?** Google Play API can have transient issues (network, rate limiting, etc.)

---

## Deployment Flow

### Four-Tier Deployment Strategy

StackMap uses a four-tier approach for controlled releases:

```
QUAL → STAGE → BETA → PROD
```

| Tier | Purpose | Track | Database | Frequency |
|------|---------|-------|----------|-----------|
| **QUAL** | Local testing | N/A | Qual DB | Multiple/day |
| **STAGE** | Internal validation | Internal Testing | Qual DB | Before beta |
| **BETA** | Closed beta testing | Closed Testing | Prod DB | 1-2/week |
| **PROD** | Public release | Production | Prod DB | Weekly/bi-weekly |

### QUAL Deployment (Local Testing)

**Command:**
```bash
./scripts/deploy.sh qual --android
# OR directly from android/ directory
cd android && fastlane qual_android
```

**What happens:**
1. Clears Metro cache (prevents stale JS bundle)
2. Builds debug APK with QUAL flavor
3. Installs to connected device/emulator via ADB
4. App uses `qual-api.stackmap.app` endpoint

**Use case:**
- Rapid development iteration
- Local feature testing
- Debugging on physical devices/emulators

**Auth required:** None (debug build)

### STAGE Deployment (Internal Testing)

**Command:**
```bash
./scripts/deploy.sh stage --android
```

**What happens:**
1. Validates signing configuration (keystore + passwords)
2. Checks Google Play for latest version, increments if needed
3. Builds signed AAB with STAGE flavor
4. Uploads to Google Play Internal Testing track
5. Creates draft release (requires manual publish)

**Use case:**
- Internal team validation
- Final check before opening to beta testers
- Testing with qual database in production-like environment

**Auth required:**
- ✅ Keystore + passwords (signing)
- ✅ Google Play service account (upload)

**Track details:**
- **Google Play track:** Internal Testing
- **Max testers:** 100 (internal testers only)
- **Distribution:** Manual publish from Play Console

### BETA Deployment (Closed Testing)

**Command:**
```bash
./scripts/deploy.sh beta --android
```

**What happens:**
1. Validates git state (requires clean working directory)
2. Validates signing configuration
3. Checks Google Play for latest version, increments if needed
4. Runs critical test suite (must pass)
5. Builds signed AAB with BETA flavor
6. Uploads to Google Play Closed Testing track
7. Creates draft release (requires manual publish)

**Use case:**
- External beta tester feedback
- Production database testing
- Pre-release validation

**Auth required:**
- ✅ Keystore + passwords (signing)
- ✅ Google Play service account (upload)

**Track details:**
- **Google Play track:** Closed Testing
- **Max testers:** Unlimited (organized into groups)
- **Distribution:** Manual publish from Play Console
- **Database:** Production (beta API endpoint)

### PROD Deployment (Production)

**Command:**
```bash
./scripts/deploy.sh prod --android
```

**What happens:**
1. Validates git state (requires clean working directory)
2. Validates signing configuration
3. Checks Google Play for latest version, increments if needed
4. Runs full test suite (all tiers must pass)
5. Builds signed AAB with PROD flavor
6. Loads release notes from `PENDING_CHANGES.md`
7. Uploads to Google Play Production track
8. Creates draft release (requires manual publish)

**Use case:**
- Public release to Google Play Store
- Production deployment

**Auth required:**
- ✅ Keystore + passwords (signing)
- ✅ Google Play service account (upload)

**Track details:**
- **Google Play track:** Production
- **Distribution:** Manual publish from Play Console (staged rollout recommended)
- **Database:** Production

### Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Script                        │
│                  (deploy_stage.sh, etc.)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Fastlane Lane                             │
│              (stage_android, beta_android)                  │
└──────┬──────────────────────────────┬───────────────────────┘
       │                              │
       ▼                              ▼
┌──────────────────┐          ┌──────────────────────┐
│  Gradle Build    │          │  Google Play Upload  │
│  (AAB/APK)       │          │  (Internal/Closed)   │
└──────┬───────────┘          └──────┬───────────────┘
       │                              │
       ▼                              ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  Keystore Auth           │  │  Service Account Auth    │
│  • Store password        │  │  • JSON key file         │
│  • Key password          │  │  • API permissions       │
│  • Read from Keychain    │  │  • Read path from        │
│    or ENV                │  │    Keychain or ENV       │
└──────────────────────────┘  └──────────────────────────┘
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Google Play JSON key not found"

**Error message:**
```
[!] Google Play JSON key not found. Run: fastlane store_credentials_in_keychain
```

**Cause:** Service account JSON path not stored in Keychain or environment

**Solution:**
```bash
# Option 1: Store in Keychain (recommended)
cd android
fastlane store_credentials_in_keychain

# Option 2: Set environment variable
export PLAY_STORE_JSON_KEY_PATH="/path/to/service-account.json"

# Option 3: Verify Keychain storage
security find-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' -w
```

#### Issue 2: "Keystore password not found"

**Error message:**
```
[!] Keystore store password not found. Run: fastlane store_credentials_in_keychain
```

**Cause:** Keystore passwords not stored in Keychain or environment

**Solution:**
```bash
# Option 1: Store in Keychain (recommended)
cd android
fastlane store_credentials_in_keychain

# Option 2: Set environment variables
export STACKMAP_STORE_PASSWORD="your-keystore-password"
export STACKMAP_KEY_PASSWORD="your-key-password"
```

#### Issue 3: "keystore was tampered with, or password was incorrect"

**Error message:**
```
keytool error: java.io.IOException: keystore was tampered with, or password was incorrect
```

**Cause:** Wrong keystore password or corrupted keystore file

**Solution:**
```bash
# Verify keystore with correct password
keytool -list -v -keystore android/app/stackmap-release.keystore

# If password is correct but still fails, keystore may be corrupted
# You'll need to create a new keystore and update Play Console signing key
# (NOTE: This requires Google Play App Signing to be enabled)
```

#### Issue 4: "Google Play API error: 403 Forbidden"

**Error message:**
```
Google Play API error: 403 Forbidden - The caller does not have permission
```

**Cause:** Service account lacks required permissions in Play Console

**Solution:**
1. Go to [Google Play Console](https://play.google.com/console/)
2. Navigate to `Setup > API Access`
3. Find your service account
4. Click `Manage Play Console Permissions`
5. Ensure these permissions are checked:
   - ✅ View app information and download bulk reports
   - ✅ Manage production releases
   - ✅ Manage testing track releases
6. Click `Apply` > `Save changes`

#### Issue 5: "This version code has already been used"

**Error message:**
```
Google Play API error: This version code has already been used. Try another version code.
```

**Cause:** Version code in `build.gradle` is not greater than existing Play Console versions

**Solution:**
```bash
# Fastlane should auto-increment, but if it fails:

# Option 1: Let Fastlane handle it (recommended)
cd android
fastlane check_and_increment_version

# Option 2: Manually increment in build.gradle
# Edit android/app/build.gradle
# Find: versionCode 123
# Change to: versionCode 124
```

#### Issue 6: "AAB not found" after build

**Error message:**
```
❌ AAB not found at app/build/outputs/bundle/stageRelease/app-stage-release.aab
```

**Cause:** Build failed silently or output path changed

**Solution:**
```bash
# Check build output directory
find android/app/build/outputs -name "*.aab"

# Verify Gradle task name matches flavor
# For 'stage' flavor, task should be: bundleStageRelease
# For 'beta' flavor, task should be: bundleBetaRelease

# Try manual build to see errors
cd android
./gradlew bundleStageRelease --stacktrace
```

#### Issue 7: Fastlane timeout during Android build

**Error message:**
```
Timeout after 120s
```

**Cause:** Android Gradle builds take 2-3 minutes, default Fastlane timeout is 120s

**Solution:**
```bash
# Increase timeout in deployment script
# Edit scripts/deploy/deploy_stage.sh
# Find: fastlane stage_android
# Change to: fastlane stage_android timeout:600  # 10 minutes

# Or manually run with longer timeout
cd android
timeout 600 fastlane stage_android
```

#### Issue 8: "Metro bundler cache" issues

**Symptoms:** App launches with old code, changes not reflected

**Cause:** React Native Metro bundler cache not cleared before build

**Solution:**
```bash
# Clear Metro cache manually
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*

# Clear Android build cache
cd android
./gradlew clean
rm -rf app/build

# Fastlane does this automatically, but manual clear helps if issues persist
```

#### Issue 9: Multiple architectures not included in AAB

**Symptoms:** App only works on some devices, missing ARM64 or x86_64

**Cause:** `reactNativeArchitectures` not set in Gradle properties

**Solution:**
```gradle
// In Fastfile, verify build properties include:
properties: {
  "reactNativeArchitectures" => "armeabi-v7a,arm64-v8a,x86,x86_64"
}

// Or set globally in android/gradle.properties:
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
```

### Debugging Tips

#### Enable Fastlane Verbose Logging

```bash
# Set verbose flag
fastlane stage_android --verbose

# Or set environment variable
export FASTLANE_VERBOSE=1
fastlane stage_android
```

#### Check Gradle Build Logs

```bash
# Build with stacktrace
cd android
./gradlew bundleStageRelease --stacktrace

# Build with full info logging
./gradlew bundleStageRelease --info
```

#### Verify Service Account Permissions

```bash
# List service accounts in Google Cloud Console
gcloud iam service-accounts list

# Describe specific service account
gcloud iam service-accounts describe SERVICE_ACCOUNT_EMAIL

# Check Play Console API access
# Go to: https://play.google.com/console/ > Setup > API Access
```

#### Test Keystore Signing Manually

```bash
# Sign APK manually to verify keystore works
jarsigner -verbose \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore android/app/stackmap-release.keystore \
  app-unsigned.apk \
  stackmap
# Enter keystore password when prompted
```

---

## Security Best Practices

### 1. Keystore Security

**DO:**
- ✅ Store keystore file outside version control (add to `.gitignore`)
- ✅ Backup keystore to secure location (encrypted cloud storage, password manager)
- ✅ Use strong passwords (16+ characters, random)
- ✅ Use macOS Keychain or CI secret storage for passwords
- ✅ Limit access to keystore file (file permissions: `chmod 600`)

**DON'T:**
- ❌ Commit keystore to git (even private repos)
- ❌ Email keystore file or share via unencrypted channels
- ❌ Use weak or guessable passwords
- ❌ Store passwords in plain text files
- ❌ Share keystore passwords via chat/text

**Example `.gitignore`:**
```
# Android keystores
*.keystore
!debug.keystore  # Debug keystore is OK to commit

# Service account keys
*.json
!google-services.json  # Firebase config is OK

# Environment files
.env
.env.local
```

### 2. Service Account Security

**DO:**
- ✅ Create dedicated service accounts per app
- ✅ Use principle of least privilege (minimal required permissions)
- ✅ Rotate service account keys annually
- ✅ Store JSON keys outside version control
- ✅ Use macOS Keychain or CI secret storage for paths
- ✅ Monitor service account usage in Google Cloud Console

**DON'T:**
- ❌ Use personal Google account for automation
- ❌ Grant service account more permissions than needed
- ❌ Commit service account JSON to git
- ❌ Share service account keys between projects
- ❌ Use root/owner IAM roles

**Permission checklist (Play Console):**
```
App-level permissions (for specific app):
✅ View app information
✅ Manage testing track releases

Account-level permissions:
❌ Manage orders and subscriptions (not needed for deployment)
❌ Manage store presence (not needed for deployment)
❌ View financial data (not needed for deployment)
```

### 3. Environment Variables vs. Keychain

**Comparison:**

| Aspect | Environment Variables | macOS Keychain |
|--------|----------------------|----------------|
| **Security** | ⚠️ Visible in process lists | ✅ Encrypted by OS |
| **Persistence** | ⚠️ Per-shell session | ✅ Permanent |
| **Isolation** | ⚠️ Global per user | ✅ Per-item access control |
| **CI/CD** | ✅ Easy to set | ⚠️ macOS-specific |
| **Accidental commit** | ⚠️ Risk via shell history | ✅ Not file-based |

**Recommendation:**
- **Local development:** macOS Keychain
- **CI/CD (GitHub Actions, etc.):** Secret storage (encrypted environment variables)

### 4. CI/CD Considerations

If using GitHub Actions, CircleCI, etc.:

```yaml
# .github/workflows/android-deploy.yml
name: Android Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      # Decode base64-encoded secrets
      - name: Setup keystore
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/stackmap-release.keystore

      - name: Setup service account
        run: |
          echo "${{ secrets.PLAY_STORE_JSON_BASE64 }}" | base64 -d > /tmp/play-store-key.json

      # Set environment variables for Fastlane
      - name: Deploy to stage
        env:
          STACKMAP_STORE_PASSWORD: ${{ secrets.KEYSTORE_STORE_PASSWORD }}
          STACKMAP_KEY_PASSWORD: ${{ secrets.KEYSTORE_KEY_PASSWORD }}
          PLAY_STORE_JSON_KEY_PATH: /tmp/play-store-key.json
        run: |
          cd android
          fastlane stage_android
```

**GitHub Secrets setup:**
1. Go to repo `Settings > Secrets and variables > Actions`
2. Add secrets:
   - `ANDROID_KEYSTORE_BASE64`: `base64 < android/app/stackmap-release.keystore | pbcopy`
   - `PLAY_STORE_JSON_BASE64`: `base64 < service-account.json | pbcopy`
   - `KEYSTORE_STORE_PASSWORD`: Keystore password (plain text)
   - `KEYSTORE_KEY_PASSWORD`: Key password (plain text)

### 5. Audit and Monitoring

**Regular security checks:**

```bash
# Check who has access to Play Console
# Go to: https://play.google.com/console/ > Setup > Users and permissions

# Review service account activity
# Go to: https://console.cloud.google.com/ > IAM & Admin > Service Accounts
# Click service account > View activity

# Check for leaked secrets in git history
git log -p | grep -i "password\|secret\|key" | head -50

# Verify keystore file permissions
ls -la android/app/*.keystore
# Should show: -rw------- (600) for release keystore
```

**Incident response:**
- **If keystore compromised:** Immediately rotate signing key (requires Google Play App Signing)
- **If service account compromised:** Delete service account, create new one, update Keychain/CI
- **If passwords leaked in git:** Rotate passwords, rewrite git history (use BFG Repo-Cleaner)

---

## Summary Checklist

### Initial Setup (One-Time)

- [ ] Install Fastlane: `sudo gem install fastlane`
- [ ] Create Google Cloud project
- [ ] Enable Google Play Android Developer API
- [ ] Create service account
- [ ] Download service account JSON key
- [ ] Link service account to Play Console
- [ ] Grant service account permissions (testing + production releases)
- [ ] Create or obtain release keystore
- [ ] Store credentials in macOS Keychain: `fastlane store_credentials_in_keychain`
- [ ] Verify setup: `fastlane validate_signing`

### Before Each Deployment

- [ ] Update `PENDING_CHANGES.md` with release notes
- [ ] Commit all changes (for beta/prod deployments)
- [ ] Run tests: `npm run test:critical`
- [ ] Increment version in `package.json` if needed
- [ ] Verify credentials: `security find-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' -w`

### Deployment Commands

```bash
# QUAL (local testing - no auth required)
./scripts/deploy.sh qual --android

# STAGE (internal testing - Keychain auth required)
./scripts/deploy.sh stage --android

# BETA (closed testing - Keychain auth required)
./scripts/deploy.sh beta --android

# PROD (production - Keychain auth required)
./scripts/deploy.sh prod --android
```

### Post-Deployment

- [ ] Check Google Play Console for draft release
- [ ] Review AAB details (version, size, supported devices)
- [ ] Publish draft release to testers
- [ ] Monitor crash reports and feedback
- [ ] Update deployment status page

---

## Additional Resources

### Official Documentation
- [Fastlane Android Setup](https://docs.fastlane.tools/getting-started/android/setup/)
- [Google Play Console API](https://developers.google.com/android-publisher)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Service Account Authentication](https://cloud.google.com/iam/docs/service-accounts)

### StackMap-Specific Docs
- [Deployment Guide](/docs/deployment/README.md)
- [Beta Deployment Guide](/docs/deployment/BETA_DEPLOYMENT_GUIDE.md)
- [Four-Tier Strategy](/docs/deployment/FOUR_TIER_BUILD_GUIDE.md)
- [Fastlane Roadmap](/docs/deployment/fastlane-roadmap/)

### Tools and Utilities
- [Fastlane Match](https://docs.fastlane.tools/actions/match/) - Code signing management
- [Fastlane Supply](https://docs.fastlane.tools/actions/supply/) - Google Play deployment
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) - Remove secrets from git history

---

## Appendix: Product Flavors and Build Types

StackMap uses Android **Product Flavors** for multi-environment support:

### Flavor Configuration (build.gradle)

```gradle
android {
    flavorDimensions "environment"
    productFlavors {
        qual {
            dimension "environment"
            applicationIdSuffix ".qual"
            versionNameSuffix "-qual"
            buildConfigField "String", "BUILD_TYPE_ENV", '"qual"'
            resValue "string", "app_name", "StackMap QUAL"
        }
        stage {
            dimension "environment"
            // No applicationIdSuffix - uses base package name
            versionNameSuffix "-stage"
            buildConfigField "String", "BUILD_TYPE_ENV", '"stage"'
            resValue "string", "app_name", "StackMap STAGE"
        }
        beta {
            dimension "environment"
            versionNameSuffix "-beta"
            buildConfigField "String", "BUILD_TYPE_ENV", '"beta"'
            resValue "string", "app_name", "StackMap"
        }
        prod {
            dimension "environment"
            // No suffix for production
            buildConfigField "String", "BUILD_TYPE_ENV", '"prod"'
            resValue "string", "app_name", "StackMap"
        }
    }
}
```

### Flavor Matrix

| Flavor | Package ID | App Name | API Endpoint | Database |
|--------|-----------|----------|--------------|----------|
| **qual** | `com.stackmapnative.qual` | StackMap QUAL | qual-api.stackmap.app | Qual DB |
| **stage** | `com.stackmapnative` | StackMap STAGE | qual-api.stackmap.app | Qual DB |
| **beta** | `com.stackmapnative` | StackMap | beta-api.stackmap.app | Prod DB |
| **prod** | `com.stackmapnative` | StackMap | api.stackmap.app | Prod DB |

### Build Variants

Android combines **flavors** × **build types** = **variants**:

| Variant | Command | Output | Use Case |
|---------|---------|--------|----------|
| qualDebug | `assembleQualDebug` | APK | Local testing, debugging |
| qualRelease | `assembleQualRelease` | APK | Not used (debug sufficient) |
| stageRelease | `bundleStageRelease` | AAB | Internal Testing track |
| betaRelease | `bundleBetaRelease` | AAB | Closed Testing track |
| prodRelease | `bundleProdRelease` | AAB | Production track |

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Maintained by:** StackMap Development Team
