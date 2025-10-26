# Android Fastlane Authentication - Quick Start

**For developers setting up Android deployment automation**

This is a condensed version of the full guide. See [ANDROID_FASTLANE_AUTH_GUIDE.md](./ANDROID_FASTLANE_AUTH_GUIDE.md) for complete details.

---

## Two Types of Authentication Required

### 1. Google Play Console Authentication (for uploading builds)
- **What:** Service account JSON key file
- **Where:** Google Cloud Console
- **Used for:** Uploading AAB/APK to Play Console

### 2. App Signing Authentication (for building releases)
- **What:** Keystore file + passwords
- **Where:** Local machine (android/app/stackmap-release.keystore)
- **Used for:** Signing Android release builds

---

## Quick Setup (30 minutes)

### Step 1: Create Google Play Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Google Play Android Developer API"
3. Create service account:
   - Name: `fastlane-stackmap`
   - Create JSON key (downloads automatically)
4. Go to [Google Play Console](https://play.google.com/console/) > Setup > API Access
5. Link service account and grant permissions:
   - ✅ View app information
   - ✅ Manage testing track releases
   - ✅ Manage production releases

**Save the JSON file securely - you cannot download it again!**

### Step 2: Setup or Verify Keystore

**Option A: Create new keystore (first time)**
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore stackmap-release.keystore \
  -alias stackmap \
  -keyalg RSA -keysize 2048 -validity 10000

# Save the passwords in a password manager!
```

**Option B: Use existing keystore**
```bash
# Copy to android/app/
cp /path/to/existing.keystore android/app/stackmap-release.keystore

# Verify it works
keytool -list -v -keystore android/app/stackmap-release.keystore
```

### Step 3: Store Credentials in Keychain

```bash
cd android
fastlane store_credentials_in_keychain
```

**You'll be prompted for:**
1. Path to Google Play JSON key (e.g., `/Users/you/Downloads/stackmap-play-console-abc123.json`)
2. Keystore store password
3. Keystore key password

**Done!** Credentials are now securely stored in macOS Keychain.

### Step 4: Verify Setup

```bash
cd android
fastlane validate_signing
```

Expected output: `✅ Signing configuration validated!`

---

## Deployment Commands

```bash
# QUAL (local testing - no upload, no auth needed)
./scripts/deploy.sh qual --android

# STAGE (internal testing - uploads to Play Internal Testing)
./scripts/deploy.sh stage --android

# BETA (closed testing - uploads to Play Closed Testing)
./scripts/deploy.sh beta --android

# PROD (production - uploads to Play Production)
./scripts/deploy.sh prod --android
```

---

## How It Works

### Authentication Flow

```
┌─────────────────────────┐
│  Deploy Script          │
│  (deploy_stage.sh)      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Fastlane Lane          │
│  (stage_android)        │
└─────┬──────────┬────────┘
      │          │
      ▼          ▼
┌──────────┐  ┌──────────────┐
│ Gradle   │  │ Play Console │
│ Build    │  │ Upload       │
└─────┬────┘  └──────┬───────┘
      │              │
      ▼              ▼
┌──────────────┐  ┌─────────────────┐
│ Keystore     │  │ Service Account │
│ • Passwords  │  │ • JSON key      │
│ • From       │  │ • From          │
│   Keychain   │  │   Keychain      │
└──────────────┘  └─────────────────┘
```

### What Happens During Deployment

**Stage/Beta/Prod deployment:**
1. Validates signing configuration (keystore exists, passwords available)
2. Checks Google Play for latest version code, increments if needed
3. Builds signed AAB using Gradle + keystore
4. Uploads AAB to Google Play using service account
5. Creates draft release (you publish manually in Play Console)

---

## Troubleshooting

### "Google Play JSON key not found"
```bash
# Verify Keychain storage
security find-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' -w

# Re-run setup if empty
cd android && fastlane store_credentials_in_keychain
```

### "Keystore password not found"
```bash
# Verify Keychain storage
security find-generic-password -s 'stackmap-keystore-store-password' -a 'stackmap-android' -w

# Re-run setup if empty
cd android && fastlane store_credentials_in_keychain
```

### "This version code has already been used"
```bash
# Fastlane should auto-increment, but if it fails:
cd android
fastlane check_and_increment_version

# Or manually edit android/app/build.gradle:
# versionCode 123 → versionCode 124
```

### "403 Forbidden - The caller does not have permission"
1. Go to [Google Play Console](https://play.google.com/console/)
2. Setup > API Access
3. Find your service account
4. Verify permissions are checked:
   - ✅ View app information
   - ✅ Manage testing track releases
   - ✅ Manage production releases

---

## Key Files Reference

### Configuration Files
```
android/
├── fastlane/
│   ├── Appfile              # Package name, JSON key path
│   └── Fastfile             # Deployment lanes (stage_android, beta_android, etc.)
├── app/
│   ├── build.gradle         # Signing config, product flavors
│   └── stackmap-release.keystore  # Release signing key (DO NOT COMMIT!)
└── gradle.properties        # Keystore references
```

### Credentials Storage
```
macOS Keychain (secure, encrypted):
├── stackmap-play-store-json-path → /path/to/service-account.json
├── stackmap-keystore-store-password → keystore password
└── stackmap-keystore-key-password → key password
```

### Build Outputs
```
android/app/build/outputs/
├── apk/
│   ├── qual/debug/app-qual-debug.apk           # QUAL local testing
│   ├── stage/release/app-stage-release.apk     # STAGE direct install
│   ├── beta/release/app-beta-release.apk       # BETA direct install
│   └── prod/release/app-prod-release.apk       # PROD direct install
└── bundle/
    ├── stageRelease/app-stage-release.aab      # STAGE Play Console
    ├── betaRelease/app-beta-release.aab        # BETA Play Console
    └── prodRelease/app-prod-release.aab        # PROD Play Console
```

---

## Environment Matrix

| Tier | Package ID | Play Track | API Endpoint | Database | Auth Required |
|------|-----------|-----------|--------------|----------|---------------|
| **QUAL** | `com.stackmapnative.qual` | N/A (local) | qual-api | Qual | ❌ None |
| **STAGE** | `com.stackmapnative` | Internal | qual-api | Qual | ✅ Both |
| **BETA** | `com.stackmapnative` | Closed | beta-api | Prod | ✅ Both |
| **PROD** | `com.stackmapnative` | Production | api | Prod | ✅ Both |

---

## Security Checklist

### DO:
- ✅ Store keystore outside git (add to `.gitignore`)
- ✅ Backup keystore to encrypted storage
- ✅ Use macOS Keychain for credentials
- ✅ Use strong passwords (16+ characters)
- ✅ Rotate service account keys annually
- ✅ Grant minimal required permissions

### DON'T:
- ❌ Commit keystore or JSON keys to git
- ❌ Share passwords via chat/email
- ❌ Use weak or guessable passwords
- ❌ Grant service account unnecessary permissions
- ❌ Store passwords in plain text files

---

## Next Steps

1. **Complete setup:** Follow steps above
2. **Test with STAGE:** `./scripts/deploy.sh stage --android`
3. **Verify in Play Console:** Check draft release in Internal Testing
4. **Read full guide:** [ANDROID_FASTLANE_AUTH_GUIDE.md](./ANDROID_FASTLANE_AUTH_GUIDE.md)
5. **Explore Fastlane:** `cd android && fastlane --help`

---

## Additional Resources

- **Full Authentication Guide:** [ANDROID_FASTLANE_AUTH_GUIDE.md](./ANDROID_FASTLANE_AUTH_GUIDE.md)
- **Deployment Strategy:** [docs/deployment/README.md](./docs/deployment/README.md)
- **Beta Deployment:** [docs/deployment/BETA_DEPLOYMENT_GUIDE.md](./docs/deployment/BETA_DEPLOYMENT_GUIDE.md)
- **Fastlane Docs:** [https://docs.fastlane.tools/](https://docs.fastlane.tools/)
- **Google Play API:** [https://developers.google.com/android-publisher](https://developers.google.com/android-publisher)

---

**Document Version:** 1.0
**Last Updated:** January 2025
