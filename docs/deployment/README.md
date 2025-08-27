# StackMap Deployment Guide
**Last Updated:** January 2025

## 🚀 Quick Start - Deploy Everything
```bash
# Stage 1: Deploy to QUAL (staging)
./scripts/qual_deploy.sh

# Stage 2: Deploy to PRODUCTION
./scripts/prod_deploy.sh all  # Web + Android AAB + iOS prep
```

### Platform-Specific Options
```bash
./scripts/qual_deploy.sh --android --ios  # Android + iOS only to qual
./scripts/qual_deploy.sh --web           # Web to qual staging
./scripts/qual_deploy.sh --ios-device    # iOS physical device
./scripts/qual_deploy.sh --skip-tests   # Skip tests for emergency deploy

# Production options
./scripts/prod_deploy.sh web      # Deploy web only
./scripts/prod_deploy.sh android  # Build Android AAB only
./scripts/prod_deploy.sh ios      # Prepare iOS for archive
```

## 📱 Platform Deployment Details

### iOS Deployment
```bash
./scripts/deploy-ios.sh          # Simulator
./scripts/deploy-ios.sh device   # Physical device
```

**Manual Process:**
1. Open Xcode: `open ios/StackMapNative.xcworkspace`
2. Select target device
3. Product → Archive
4. Distribute via TestFlight/App Store

### Android Deployment
```bash
./scripts/deploy-android-all.sh   # Full deployment
./scripts/deploy-android-quick.sh # Quick reload for Metro
```

**Strategy:**
- Physical devices: Standalone APK with bundled JS
- Emulators: Metro development build

**Manual Builds:**
```bash
# Debug APK
cd android && ./gradlew assembleDebug

# Release APK
cd android && ./gradlew assembleRelease

# Play Store Bundle
cd android && ./gradlew bundleRelease
```

### Web Deployment

#### Stage 1: Deploy to Qual (Staging)
```bash
./scripts/qual_deploy.sh --web  # Builds and deploys to stackmap.app/qual
```

#### Stage 2: Promote Qual to Production
```bash
./scripts/prod_deploy.sh web       # Sync qual to production
./scripts/prod_deploy.sh rollback  # Rollback if needed
```

**Production URL:** https://stackmap.app/
**Staging URL:** https://stackmap.app/qual/

**Manual SSH Access:**
```bash
ssh stackmap-cpanel  # Requires SSH key setup
```

## 🔄 Version Management
- **Format:** `YYYY.MM.DD.BUILD`
- **Automatic:** All scripts increment version
- **Unified:** Single version across all platforms
- **Files Updated:** `package.json`, `app.json`, iOS `Info.plist`

## 📝 Commit Message Management
The deployment script automatically creates descriptive commit messages using `PENDING_CHANGES.md`:

### How It Works
1. **Before deployment**, update `PENDING_CHANGES.md`:
   ```markdown
   # Pending Changes
   
   ## Title: Fix critical sync bug with timestamp preservation
   
   ### Changes Made:
   - Fixed sync issue where activities reverted state
   - Added preservation of timestamp metadata fields
   - Improved conflict resolution reliability
   ```

2. **During deployment**, the script:
   - Extracts the title from `## Title:` line
   - Extracts description from `### Changes Made:` section
   - Creates commit message: `2025.08.24.1 - Fix critical sync bug with timestamp preservation`
   - Includes the full description in the commit body

3. **After successful commit**, the script clears `PENDING_CHANGES.md` for next deployment

### Benefits
- **Consistent Format:** Version number always at the beginning
- **Descriptive History:** Git log shows meaningful change summaries
- **Auto-cleanup:** File resets after each deployment
- **Fallback:** If no title provided, uses default "Deployment version bump"

## 🧪 Testing Integration
- **Automatic:** Essential tests run before every deployment
- **Skip for Emergency:** Use `--skip-tests` flag
- **What's Tested:**
  - App.js structure and imports
  - Critical services exist (sync, store)
  - Common issues (excessive console.logs)
- **No Complexity:** Simple bash checks, no frameworks

## 📋 Pre-Deployment Checklist
```bash
# 1. Check git status
git status

# 2. Ensure on main branch
git branch --show-current

# 3. Pull latest
git pull origin main

# 4. Check connected devices
adb devices  # Android
xcrun simctl list devices | grep Booted  # iOS
```

## 🔧 Common Issues & Fixes

### Bundle not found on Web
Files must be in root directory, not web/build/

### iOS Build Fails
```bash
cd ios && pod install
# Or in Xcode: Product → Clean Build Folder
```

### Android Build Fails
```bash
cd android && ./gradlew clean
./gradlew --stop  # Stop Gradle daemon
```

### Version Not Incrementing
All scripts handle this automatically via `scripts/version-increment.sh`

## 🆘 Emergency Rollback
```bash
# Web rollback
ssh stackmap-cpanel "cd ~/public_html/qual && git log --oneline -5"
ssh stackmap-cpanel "cd ~/public_html/qual && git checkout <commit-hash>"

# Mobile: Reinstall previous APK/IPA from backups
```

## 🔐 Security Notes
- Never commit API keys or secrets
- Keystore files kept secure
- All deployments use HTTPS
- Certificates managed per platform

## 📝 Environment Configuration
- **Bundle IDs:** iOS: `com.stackmapnative`, Android: `com.stackmapnative`
- **API URLs:**
  - Dev/Qual: `https://stackmap.app/qual/api/sync/`
  - Production: `https://stackmap.app/api/sync/`

---

**Remember:** Use `./scripts/qual_deploy.sh` for staging, then `./scripts/prod_deploy.sh all` for production!