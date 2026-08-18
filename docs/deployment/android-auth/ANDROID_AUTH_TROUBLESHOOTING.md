# Android Fastlane Authentication - Troubleshooting Playbook

**Quick reference for solving common authentication and deployment issues**

---

## Table of Contents

1. [Credential Issues](#credential-issues)
2. [Keystore Problems](#keystore-problems)
3. [Google Play Upload Errors](#google-play-upload-errors)
4. [Build Failures](#build-failures)
5. [Version Code Conflicts](#version-code-conflicts)
6. [Network and Timeout Issues](#network-and-timeout-issues)
7. [Service Account Problems](#service-account-problems)
8. [Debug Commands](#debug-commands)

---

## Credential Issues

### Issue: "Google Play JSON key not found"

**Symptoms:**
```
[!] Google Play JSON key not found. Run: fastlane store_credentials_in_keychain
```

**Root Cause:** Service account JSON path not stored in Keychain or environment

**Solution Steps:**

1. **Check if credential exists in Keychain:**
   ```bash
   security find-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' -w
   ```
   - If empty or error → Credential not stored

2. **Store credential in Keychain (preferred):**
   ```bash
   cd android
   fastlane store_credentials_in_keychain
   ```
   Enter full path when prompted (e.g., `/Users/yourname/Downloads/stackmap-play-console-abc123.json`)

3. **Alternative: Set environment variable (temporary):**
   ```bash
   export PLAY_STORE_JSON_KEY_PATH="/path/to/service-account.json"
   ```

4. **Verify file exists at path:**
   ```bash
   cat /path/to/service-account.json | head -5
   # Should show JSON with "type": "service_account"
   ```

**Prevention:**
- Add to shell profile for persistence: `echo 'export PLAY_STORE_JSON_KEY_PATH="/path/to/key.json"' >> ~/.zshrc`
- Backup JSON key to secure location (cannot re-download)

---

### Issue: "Keystore password not found"

**Symptoms:**
```
[!] Keystore store password not found. Run: fastlane store_credentials_in_keychain
```

**Root Cause:** Keystore passwords not stored in Keychain or environment

**Solution Steps:**

1. **Check Keychain for store password:**
   ```bash
   security find-generic-password -s 'stackmap-keystore-store-password' -a 'stackmap-android' -w
   ```

2. **Check Keychain for key password:**
   ```bash
   security find-generic-password -s 'stackmap-keystore-key-password' -a 'stackmap-android' -w
   ```

3. **If missing, store credentials:**
   ```bash
   cd android
   fastlane store_credentials_in_keychain
   ```

4. **Alternative: Set environment variables:**
   ```bash
   export STACKMAP_STORE_PASSWORD="your-keystore-password"
   export STACKMAP_KEY_PASSWORD="your-key-password"
   ```

5. **Test password works with keystore:**
   ```bash
   keytool -list -v -keystore android/app/stackmap-release.keystore
   # Enter password when prompted - should list certificate
   ```

**Prevention:**
- Store passwords in password manager (1Password, LastPass, etc.)
- Document password location in team wiki
- Test passwords periodically: `keytool -list -v -keystore android/app/stackmap-release.keystore`

---

## Keystore Problems

### Issue: "keystore was tampered with, or password was incorrect"

**Symptoms:**
```bash
keytool error: java.io.IOException: keystore was tampered with, or password was incorrect
```

**Root Cause:** Wrong password OR corrupted keystore file

**Diagnosis:**

1. **Verify keystore file integrity:**
   ```bash
   file android/app/stackmap-release.keystore
   # Should show: "Java KeyStore"
   ```

2. **Try with correct password:**
   ```bash
   keytool -list -v -keystore android/app/stackmap-release.keystore -storepass YOUR_PASSWORD
   ```

3. **Check keystore properties:**
   ```bash
   keytool -list -v -keystore android/app/stackmap-release.keystore
   # Look for: Alias name: stackmap, Entry type: PrivateKeyEntry
   ```

**Solutions:**

**If password is wrong:**
- Check password manager for correct password
- Try passwords from Keychain: `security find-generic-password -s 'stackmap-keystore-store-password' -a 'stackmap-android' -w`
- Contact team member who created keystore

**If keystore is corrupted:**
- Restore from backup (check password manager, encrypted cloud storage)
- If no backup exists and app is already in Play Store:
  1. Enable Google Play App Signing (if not already)
  2. Create new upload key
  3. Register new key with Google: [https://support.google.com/googleplay/android-developer/answer/9842756](https://support.google.com/googleplay/android-developer/answer/9842756)

**Prevention:**
- Backup keystore to multiple locations (encrypted)
- Test keystore quarterly: `keytool -list -v -keystore android/app/stackmap-release.keystore`
- Enable Google Play App Signing (separates upload key from signing key)

---

### Issue: "Keystore file not found"

**Symptoms:**
```
[!] Release keystore not found at: android/app/stackmap-release.keystore
```

**Root Cause:** Keystore file missing from expected location

**Solution Steps:**

1. **Search for keystore file:**
   ```bash
   find ~ -name "*.keystore" -not -path "*/node_modules/*" 2>/dev/null
   # Look for stackmap-release.keystore or similar
   ```

2. **If found, copy to correct location:**
   ```bash
   cp /path/to/found/keystore.jks android/app/stackmap-release.keystore
   ```

3. **If not found, check git history (NOT RECOMMENDED - should not be in git):**
   ```bash
   git log --all --full-history -- "*.keystore"
   ```

4. **If still not found, create new keystore:**
   ```bash
   cd android/app
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore stackmap-release.keystore \
     -alias stackmap \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
   **WARNING:** Creating new keystore for existing app requires re-registering with Google Play

5. **Verify keystore is in .gitignore:**
   ```bash
   grep "keystore" .gitignore
   # Should include: *.keystore (but NOT debug.keystore)
   ```

**Prevention:**
- Never rely on single copy - maintain encrypted backups
- Document keystore location in team wiki
- Use Google Play App Signing for recovery options

---

## Google Play Upload Errors

### Issue: "403 Forbidden - The caller does not have permission"

**Symptoms:**
```
Google Play API error: 403 Forbidden
The caller does not have permission
```

**Root Cause:** Service account lacks required permissions

**Solution Steps:**

1. **Verify service account email:**
   ```bash
   cat /path/to/service-account.json | grep client_email
   # Note the email address
   ```

2. **Check Play Console permissions:**
   - Go to [Google Play Console](https://play.google.com/console/)
   - Navigate to: `Setup > API Access`
   - Find your service account (by email)
   - Click `Manage Play Console Permissions`

3. **Required App-level permissions:**
   - ✅ View app information and download bulk reports
   - ✅ Manage testing track releases (for internal/closed testing)
   - ✅ Manage production releases (for production deployments)

4. **Apply changes:**
   - Click `Apply`
   - Click `Save changes`
   - Wait 5-10 minutes for propagation

5. **Retry deployment:**
   ```bash
   cd android
   fastlane stage_android
   ```

**Common Permission Mistakes:**
- ❌ Service account not linked to app (only linked to project)
- ❌ Permissions granted at account level but not app level
- ❌ Wrong app selected in permissions dialog
- ❌ Changes not saved (forgot to click "Apply")

**Verification:**
```bash
# Test API access manually
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://www.googleapis.com/androidpublisher/v3/applications/com.stackmapnative"
# Should return app details, not 403
```

---

### Issue: "This version code has already been used"

**Symptoms:**
```
Google Play API error: This version code has already been used. Try another version code.
```

**Root Cause:** versionCode in build.gradle ≤ existing Play Console version

**Solution Steps:**

1. **Check current local version:**
   ```bash
   grep "versionCode" android/app/build.gradle
   # Shows: versionCode 123
   ```

2. **Let Fastlane auto-increment (recommended):**
   ```bash
   cd android
   fastlane check_and_increment_version
   ```
   This queries Play Console for max version code and increments if needed

3. **Manual increment:**
   ```bash
   # Edit android/app/build.gradle
   # Find: versionCode 123
   # Change to: versionCode 124
   ```

4. **Verify increment:**
   ```bash
   grep "versionCode" android/app/build.gradle
   # Should show new version
   ```

5. **Retry deployment:**
   ```bash
   cd android
   fastlane stage_android
   ```

**Understanding Version Codes:**
- Version code MUST be integer
- Version code MUST increase monotonically (never reuse)
- Multiple tracks (internal, closed, production) share version code namespace
- Deleting a release does NOT free up its version code

**Prevention:**
- Fastlane's `check_and_increment_version` lane handles this automatically
- Never manually set version codes to old values
- Use semantic versioning for versionName, auto-increment for versionCode

---

### Issue: "APK/AAB not found after build"

**Symptoms:**
```
❌ AAB not found at app/build/outputs/bundle/stageRelease/app-stage-release.aab
```

**Root Cause:** Build failed silently OR output path mismatch

**Diagnosis:**

1. **Search for any AAB files:**
   ```bash
   find android/app/build/outputs -name "*.aab" -type f
   ```

2. **Check build logs:**
   ```bash
   cd android
   ./gradlew bundleStageRelease --stacktrace
   # Look for "BUILD FAILED" or error messages
   ```

3. **Verify flavor configuration:**
   ```bash
   grep -A 10 "productFlavors" android/app/build.gradle
   # Ensure 'stage' flavor exists
   ```

**Common Causes & Solutions:**

**Cause 1: Gradle task name mismatch**
```bash
# For 'stage' flavor, task MUST be: bundleStageRelease (capitalized)
cd android
./gradlew tasks --all | grep bundle
# Verify task exists
```

**Cause 2: Build cache corruption**
```bash
cd android
./gradlew clean
rm -rf app/build
./gradlew bundleStageRelease
```

**Cause 3: Metro bundler cache**
```bash
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
```

**Cause 4: Signing configuration error**
```bash
# Check build output for signing errors
./gradlew bundleStageRelease 2>&1 | grep -i "signing\|keystore\|password"
```

**Solution:**
```bash
# Full clean rebuild
cd android
./gradlew clean
cd ..
rm -rf node_modules/.cache
cd android
./gradlew bundleStageRelease --stacktrace --info
# Review full output for errors
```

---

## Build Failures

### Issue: "Execution failed for task ':app:bundleStageReleaseJsAndAssets'"

**Symptoms:**
```
Execution failed for task ':app:bundleStageReleaseJsAndAssets'.
> Process 'command 'node'' finished with non-zero exit value 1
```

**Root Cause:** JavaScript bundling error (Metro)

**Solution Steps:**

1. **Check JS syntax errors:**
   ```bash
   npm run lint
   # Fix any errors shown
   ```

2. **Clear Metro cache:**
   ```bash
   rm -rf node_modules/.cache
   rm -rf $TMPDIR/metro-*
   npm start -- --reset-cache
   # Press Ctrl+C after "Loading dependency graph, done."
   ```

3. **Test JS bundle manually:**
   ```bash
   npx react-native bundle \
     --platform android \
     --dev false \
     --entry-file index.js \
     --bundle-output /tmp/test-bundle.js \
     --assets-dest /tmp/test-assets
   # Should succeed without errors
   ```

4. **Check for missing assets:**
   ```bash
   # Verify all images/assets exist
   grep -r "require.*\.png" src/
   # Check each file exists
   ```

5. **Rebuild:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew bundleStageRelease
   ```

**Common JS Errors:**
- Missing imports: `import Foo from './Foo'` but Foo.js doesn't exist
- Circular dependencies: File A imports B, B imports A
- Asset not found: `require('./missing-image.png')`
- Syntax errors: Missing semicolons, brackets, etc.

---

### Issue: "Execution failed for task ':app:minifyStageReleaseWithR8'"

**Symptoms:**
```
Execution failed for task ':app:minifyStageReleaseWithR8'.
> A failure occurred while executing com.android.build.gradle.internal.tasks.R8Task$R8Runnable
```

**Root Cause:** ProGuard/R8 code shrinking error

**Solution Steps:**

1. **Disable minification temporarily (TESTING ONLY):**
   ```gradle
   // android/app/build.gradle
   buildTypes {
     release {
       minifyEnabled false  // Changed from true
     }
   }
   ```

2. **Check ProGuard rules:**
   ```bash
   cat android/app/proguard-rules.pro
   # Ensure common React Native rules exist
   ```

3. **Add missing keep rules:**
   ```proguard
   # android/app/proguard-rules.pro
   -keep class com.facebook.react.** { *; }
   -keep class com.stackmapnative.** { *; }
   -dontwarn com.facebook.react.**
   ```

4. **View R8 warnings:**
   ```bash
   cd android
   ./gradlew bundleStageRelease --info 2>&1 | grep -A 5 "R8"
   ```

5. **Rebuild with minification enabled:**
   ```bash
   cd android
   ./gradlew clean bundleStageRelease
   ```

**Common R8/ProGuard Issues:**
- Native modules not kept: Add `-keep` rules for each RN library
- Reflection-based code removed: Keep classes used via reflection
- Third-party library conflicts: Check library ProGuard documentation

---

## Version Code Conflicts

### Issue: Version code collision between flavors

**Symptoms:**
```
All variants (stage, beta, prod) have same version code
Google Play rejects: "This version code is already used by another APK"
```

**Root Cause:** All flavors use same versionCode from defaultConfig

**Solution:**

**Option 1: Unique version codes per flavor (recommended for different tracks)**
```gradle
// android/app/build.gradle
android {
  defaultConfig {
    versionCode 1000000  // Base version code
  }

  productFlavors {
    qual {
      versionCode defaultConfig.versionCode + 100000
      // Results in: 1100000
    }
    stage {
      versionCode defaultConfig.versionCode + 200000
      // Results in: 1200000
    }
    beta {
      versionCode defaultConfig.versionCode + 300000
      // Results in: 1300000
    }
    prod {
      // Uses base versionCode: 1000000
    }
  }
}
```

**Option 2: Shared version code (StackMap approach - same package ID)**
```gradle
// android/app/build.gradle
android {
  defaultConfig {
    versionCode 251003004  // Shared across all flavors
    // Format: YY.MM.DD.XXX (25.10.03.004)
  }
  // No versionCode overrides in flavors
}
```
**Why:** Stage, beta, and prod use same package ID (`com.stackmapnative`), so they're considered same app with different tracks

**StackMap's Strategy:**
- QUAL: Separate package ID (`com.stackmapnative.qual`) - can use different version code
- STAGE/BETA/PROD: Same package ID, different Play Store tracks, shared version code space

---

## Network and Timeout Issues

### Issue: Fastlane times out during upload

**Symptoms:**
```
Timeout after 120s
Upload failed
```

**Root Cause:** Large AAB file + slow network OR Google Play API slowness

**Solution Steps:**

1. **Increase Fastlane timeout:**
   ```ruby
   # android/fastlane/Fastfile
   upload_to_play_store(
     # ... other params ...
     timeout: 600  # 10 minutes (default is 120s)
   )
   ```

2. **Check AAB file size:**
   ```bash
   ls -lh android/app/build/outputs/bundle/stageRelease/
   # If > 100MB, consider optimization
   ```

3. **Optimize AAB size (if too large):**
   ```gradle
   // android/app/build.gradle
   android {
     splits {
       abi {
         enable true  // Split by CPU architecture
         reset()
         include 'armeabi-v7a', 'arm64-v8a'  # Only common architectures
         universalApk false
       }
     }
   }
   ```

4. **Test network speed:**
   ```bash
   curl -w "@-" -o /dev/null -s "https://www.googleapis.com/upload/androidpublisher/v3/applications/com.stackmapnative/edits" <<'EOF'
   time_total: %{time_total}\n
   EOF
   ```

5. **Retry with exponential backoff (already implemented):**
   StackMap's `upload_to_play_store_with_retry` lane includes:
   - Attempt 1: Immediate
   - Attempt 2: Wait 30s
   - Attempt 3: Wait 60s
   - Attempt 4: Wait 120s

**Android Build Timeout:**
```bash
# Android Gradle builds take 2-3 minutes
# Ensure deployment scripts use sufficient timeout
timeout 600 fastlane stage_android  # 10 minutes
```

**Prevention:**
- Use faster internet connection
- Deploy during off-peak hours (avoid Monday mornings)
- Enable ProGuard/R8 to reduce AAB size
- Consider App Bundle format (vs. Universal APK)

---

### Issue: "SSL certificate verification failed"

**Symptoms:**
```
SSL_connect returned=1 errno=0 state=error: certificate verify failed
```

**Root Cause:** System SSL certificates out of date OR corporate proxy

**Solution Steps:**

1. **Update system certificates:**
   ```bash
   # macOS
   sudo softwareupdate -i -a
   ```

2. **Check Ruby SSL configuration:**
   ```bash
   ruby -ropenssl -e 'puts OpenSSL::OPENSSL_VERSION'
   # Should show recent OpenSSL version
   ```

3. **If behind corporate proxy:**
   ```bash
   export http_proxy="http://proxy.company.com:8080"
   export https_proxy="http://proxy.company.com:8080"
   export SSL_CERT_FILE="/path/to/corporate-ca-bundle.crt"
   ```

4. **Verify connectivity to Google APIs:**
   ```bash
   curl -I https://www.googleapis.com/
   # Should return: HTTP/2 200
   ```

5. **Reinstall Fastlane (if needed):**
   ```bash
   sudo gem uninstall fastlane
   sudo gem install fastlane
   ```

---

## Service Account Problems

### Issue: "Service account key is invalid"

**Symptoms:**
```
Google Play API error: Invalid service account key
```

**Root Cause:** JSON key file corrupted OR wrong project

**Solution Steps:**

1. **Validate JSON structure:**
   ```bash
   cat /path/to/service-account.json | python3 -m json.tool
   # Should pretty-print valid JSON
   ```

2. **Check key fields:**
   ```bash
   cat /path/to/service-account.json | grep -E "type|project_id|client_email|private_key"
   # All should be present
   ```

3. **Verify project ID matches:**
   ```bash
   cat /path/to/service-account.json | grep project_id
   # Should match Google Cloud project linked to Play Console
   ```

4. **Verify service account exists:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - `IAM & Admin > Service Accounts`
   - Check if email from JSON appears in list
   - If deleted, create new service account

5. **Generate new key (if corrupted):**
   - Google Cloud Console > Service Accounts
   - Select service account
   - `Keys` tab > `Add Key > Create New Key`
   - Select JSON > Create
   - Update Keychain with new path

**Prevention:**
- Store JSON in multiple secure locations
- Periodically test: `fastlane validate_signing`
- Document project ID and service account email

---

### Issue: "Service account key has expired"

**Symptoms:**
```
Google Play API error: Service account key has expired
```

**Root Cause:** Key rotation policy OR manual key expiration

**Solution:**

1. **Check key creation date:**
   ```bash
   cat /path/to/service-account.json | grep private_key_id
   # Note the key ID
   ```

2. **View keys in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - `IAM & Admin > Service Accounts`
   - Select service account
   - `Keys` tab - check expiration dates

3. **Create new key:**
   - `Add Key > Create New Key`
   - Select JSON
   - Download and save securely

4. **Update Keychain:**
   ```bash
   cd android
   fastlane store_credentials_in_keychain
   # Enter new JSON path
   ```

5. **Delete old key:**
   - In Google Cloud Console, delete expired key

**Best Practice:**
- Rotate keys annually (set calendar reminder)
- Never use keys older than 90 days (Google recommendation)
- Create new key before deleting old one (avoid downtime)

---

## Debug Commands

### Comprehensive Diagnostic Script

```bash
#!/bin/bash
# android-auth-diagnostic.sh
# Run this script to diagnose authentication issues

echo "========================================="
echo "Android Fastlane Authentication Diagnostics"
echo "========================================="
echo ""

echo "1. Checking Keychain credentials..."
echo "-----------------------------------"
echo "Play Store JSON path:"
security find-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' -w 2>/dev/null || echo "  ❌ NOT FOUND"
echo ""
echo "Keystore store password:"
security find-generic-password -s 'stackmap-keystore-store-password' -a 'stackmap-android' -w 2>/dev/null | sed 's/./*/g' || echo "  ❌ NOT FOUND"
echo ""
echo "Keystore key password:"
security find-generic-password -s 'stackmap-keystore-key-password' -a 'stackmap-android' -w 2>/dev/null | sed 's/./*/g' || echo "  ❌ NOT FOUND"
echo ""

echo "2. Checking environment variables..."
echo "-----------------------------------"
echo "PLAY_STORE_JSON_KEY_PATH: ${PLAY_STORE_JSON_KEY_PATH:-❌ NOT SET}"
echo "STACKMAP_STORE_PASSWORD: ${STACKMAP_STORE_PASSWORD:+✅ SET (hidden)}"
echo "STACKMAP_KEY_PASSWORD: ${STACKMAP_KEY_PASSWORD:+✅ SET (hidden)}"
echo ""

echo "3. Checking keystore file..."
echo "-----------------------------------"
if [ -f "android/app/stackmap-release.keystore" ]; then
  echo "✅ Keystore exists: android/app/stackmap-release.keystore"
  ls -lh android/app/stackmap-release.keystore
  echo ""
  echo "Testing keystore (will prompt for password):"
  keytool -list -v -keystore android/app/stackmap-release.keystore | head -20
else
  echo "❌ Keystore NOT FOUND: android/app/stackmap-release.keystore"
fi
echo ""

echo "4. Checking service account JSON..."
echo "-----------------------------------"
JSON_PATH=$(security find-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' -w 2>/dev/null)
if [ -n "$JSON_PATH" ] && [ -f "$JSON_PATH" ]; then
  echo "✅ JSON file exists: $JSON_PATH"
  echo "Service account email:"
  cat "$JSON_PATH" | grep client_email | cut -d'"' -f4
  echo "Project ID:"
  cat "$JSON_PATH" | grep project_id | cut -d'"' -f4
else
  echo "❌ JSON file NOT FOUND or path invalid"
fi
echo ""

echo "5. Checking Fastlane installation..."
echo "-----------------------------------"
which fastlane > /dev/null && echo "✅ Fastlane installed: $(fastlane --version | head -1)" || echo "❌ Fastlane NOT installed"
echo ""

echo "6. Checking Android SDK..."
echo "-----------------------------------"
echo "ANDROID_HOME: ${ANDROID_HOME:-❌ NOT SET}"
echo "ANDROID_SDK_ROOT: ${ANDROID_SDK_ROOT:-❌ NOT SET}"
[ -n "$ANDROID_HOME" ] && echo "SDK exists: $(ls -d $ANDROID_HOME 2>/dev/null || echo '❌ NOT FOUND')"
echo ""

echo "7. Checking build.gradle configuration..."
echo "-----------------------------------"
echo "Current versionCode:"
grep "versionCode" android/app/build.gradle | head -1
echo "Current versionName:"
grep "versionName" android/app/build.gradle | head -1
echo "Product flavors:"
grep -A 1 "dimension \"environment\"" android/app/build.gradle | grep "^\\s*[a-z]" | sed 's/{//' | sed 's/^/  - /'
echo ""

echo "8. Testing Google API connectivity..."
echo "-----------------------------------"
curl -I https://www.googleapis.com/ 2>/dev/null | head -1 || echo "❌ Cannot reach Google APIs"
echo ""

echo "========================================="
echo "Diagnostics complete!"
echo "========================================="
```

**Usage:**
```bash
chmod +x android-auth-diagnostic.sh
./android-auth-diagnostic.sh
```

---

### Quick Validation Commands

```bash
# Test Fastlane lanes without deployment
cd android
fastlane validate_signing

# Check Play Store credentials
fastlane run validate_play_store_json_key json_key:/path/to/service-account.json

# List all Fastlane lanes
fastlane lanes

# Dry-run version increment
fastlane check_and_increment_version

# Test keystore manually
keytool -list -v -keystore android/app/stackmap-release.keystore

# View Gradle tasks
cd android && ./gradlew tasks --all | grep -i bundle

# Test JavaScript bundling
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.js

# Check Git status (beta/prod require clean)
git status --porcelain

# View deployment logs
tail -f /tmp/stackmap-logs/fastlane-*.log
```

---

### Keychain Management Commands

```bash
# List all StackMap credentials in Keychain
security find-generic-password -a 'stackmap-android' 2>/dev/null

# Delete credential (if need to re-add)
security delete-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android'
security delete-generic-password -s 'stackmap-keystore-store-password' -a 'stackmap-android'
security delete-generic-password -s 'stackmap-keystore-key-password' -a 'stackmap-android'

# Re-add credentials
cd android
fastlane store_credentials_in_keychain

# Export credential to ENV (for scripting)
export PLAY_STORE_JSON_KEY_PATH=$(security find-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' -w)
```

---

## Emergency Recovery Procedures

### Lost Keystore File

**If Google Play App Signing is enabled (RECOMMENDED):**
1. Create new upload key: `keytool -genkeypair -v -storetype PKCS12 -keystore new-upload.keystore ...`
2. Export upload certificate: `keytool -export -rfc -keystore new-upload.keystore -alias new -file upload_cert.pem`
3. Register with Google Play: [https://support.google.com/googleplay/android-developer/answer/9842756](https://support.google.com/googleplay/android-developer/answer/9842756)
4. Update Fastlane to use new keystore

**If Google Play App Signing is NOT enabled:**
- **You cannot update the app** - keystore is permanently lost
- Options:
  1. Publish new app with different package ID (lose existing users)
  2. Contact Google Play support (unlikely to help)

**Prevention:** ENABLE GOOGLE PLAY APP SIGNING NOW

---

### Lost Service Account JSON

1. **Check backups:**
   - Password manager
   - Encrypted cloud storage
   - Team shared drive

2. **Generate new key (if no backup):**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - `IAM & Admin > Service Accounts`
   - Select service account
   - `Keys` tab > `Add Key > Create New Key`
   - Download JSON

3. **Update Keychain:**
   ```bash
   cd android
   fastlane store_credentials_in_keychain
   ```

4. **Delete old key (security):**
   - In Google Cloud Console, delete compromised key

**Prevention:**
- Store in multiple secure locations
- Document in team wiki
- Set annual rotation reminder

---

### Complete Authentication Reset

**If everything is broken, start fresh:**

```bash
# 1. Clear all Keychain credentials
security delete-generic-password -s 'stackmap-play-store-json-path' -a 'stackmap-android' 2>/dev/null
security delete-generic-password -s 'stackmap-keystore-store-password' -a 'stackmap-android' 2>/dev/null
security delete-generic-password -s 'stackmap-keystore-key-password' -a 'stackmap-android' 2>/dev/null

# 2. Clear environment variables
unset PLAY_STORE_JSON_KEY_PATH
unset STACKMAP_STORE_PASSWORD
unset STACKMAP_KEY_PASSWORD

# 3. Verify keystore exists (or restore from backup)
ls -lh android/app/stackmap-release.keystore

# 4. Verify service account JSON exists (or download new)
ls -lh ~/path/to/service-account.json

# 5. Re-configure Fastlane
cd android
fastlane store_credentials_in_keychain

# 6. Test configuration
fastlane validate_signing

# 7. Test deployment to stage
cd ..
./scripts/deploy.sh stage --android
```

---

## Getting Help

### Before Asking for Help

**Collect diagnostic information:**

1. Run diagnostic script:
   ```bash
   ./android-auth-diagnostic.sh > diagnostics.txt
   ```

2. Collect recent logs:
   ```bash
   ls -lt /tmp/stackmap-logs/fastlane-*.log | head -5
   tail -100 /tmp/stackmap-logs/fastlane-*.log
   ```

3. Document steps to reproduce:
   - What command did you run?
   - What was the expected result?
   - What actually happened?
   - Full error message (not just snippet)

4. Check git status:
   ```bash
   git status
   git log --oneline -5
   ```

### Resources

- **Full Auth Guide:** [ANDROID_FASTLANE_AUTH_GUIDE.md](./ANDROID_FASTLANE_AUTH_GUIDE.md)
- **Architecture Diagrams:** [ANDROID_AUTH_ARCHITECTURE.md](./ANDROID_AUTH_ARCHITECTURE.md)
- **Quick Start:** [ANDROID_AUTH_QUICK_START.md](./ANDROID_AUTH_QUICK_START.md)
- **Fastlane Docs:** [https://docs.fastlane.tools/](https://docs.fastlane.tools/)
- **Google Play API:** [https://developers.google.com/android-publisher](https://developers.google.com/android-publisher)
- **StackMap Deployment Docs:** [docs/deployment/README.md](./docs/deployment/README.md)

---

**Document Version:** 1.0
**Last Updated:** January 2025
