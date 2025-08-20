# StackMap Deployment Guide
**Last Updated:** January 2025

## 🚀 Quick Start - Deploy Everything
```bash
./scripts/deploy-all.sh
```
This single command deploys to ALL platforms with automatic version increment and runs essential tests.

### Platform-Specific Options
```bash
./scripts/deploy-all.sh --android --ios  # Android + iOS only
./scripts/deploy-all.sh --web --prod     # Web production only
./scripts/deploy-all.sh --ios-device     # iOS physical device
./scripts/deploy-all.sh --skip-tests    # Skip tests for emergency deploy
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
```bash
./scripts/deploy-web.sh qual  # Staging (stackmap.app/qual)
./scripts/deploy-web.sh prod  # Production (stackmap.app)
```

**Branch System:**
- `main`: Source code only (no build files)
- `deploy-qual`: Qual build artifacts
- `deploy-prod`: Production build artifacts

**Manual Process:**
```bash
# Build
NODE_ENV=production npm run build:web

# Files go in ROOT (not web/build/)
cp web/build/*.* .
cp -r web/build/fonts .
cp -r web/build/icons .

# Deploy via branch
git checkout deploy-qual
git add . && git commit -m "Deploy to qual"
git push

# Server pull
ssh stackmap-cpanel "cd ~/public_html/qual && git pull"
```

## 🔄 Version Management
- **Format:** `YYYY.MM.DD.BUILD`
- **Automatic:** All scripts increment version
- **Unified:** Single version across all platforms
- **Files Updated:** `package.json`, `app.json`, iOS `Info.plist`

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
- **Bundle IDs:** iOS: `app.stackmap`, Android: `com.stackmap`
- **API URLs:**
  - Dev/Qual: `https://stackmap.app/qual/api/sync/`
  - Production: `https://stackmap.app/api/sync/`

---

**Remember:** When in doubt, use `./scripts/deploy-all.sh` - it handles everything!