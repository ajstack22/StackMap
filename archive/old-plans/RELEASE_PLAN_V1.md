# 📋 STACKMAP v1.0 RELEASE PLAN

## 🎯 Goal
Feature-complete release across Web, Android, and iOS platforms within 1-2 days.

## 📊 Current Status
- ✅ **iOS:** 90% ready (needs sync testing)
- ✅ **Web:** Ready for deployment
- ⚠️ **Android:** Needs testing after recent changes
- ⚠️ **Sync API:** Needs production deployment

---

## 📅 PHASE 1: QUAL TESTING (Day 1 - Today)

### 1A. Deploy Web to Qual
```bash
# Build for qual
NODE_ENV=production npm run build:web

# Copy files to root
cp web/build/*.* . && cp -r web/build/fonts . && cp -r web/build/icons .

# Commit and push
git add . && git commit -m "Deploy web to qual" && git push

# Pull on server
ssh stackmap-cpanel "cd ~/public_html/qual && git pull"

# Test at: https://stackmap.app/qual/
```

### 1B. Build & Test Android
```bash
# Build debug APK for testing
cd android
./gradlew assembleDebug

# Install on phone
adb -s [phone-device-id] install app/build/outputs/apk/debug/app-debug.apk

# Install on tablet
adb -s [tablet-device-id] install app/build/outputs/apk/debug/app-debug.apk
```

### 1C. Verify iOS Build
```bash
# Build for iOS testing
cd ios
pod install
npx react-native run-ios --device

# Or build in Xcode for physical device testing
```

---

## 🔧 PHASE 2: API CONFIGURATION (Day 1)

### Current Environment Setup
The app already handles environment-based API URLs (`src/services/sync/syncService.js`):

| Build Type | Platform | API URL |
|------------|----------|---------|
| Dev (__DEV__) | iOS/Android | https://stackmap.app/qual/api/sync |
| Dev (localhost) | Web | https://stackmap.app/api/sync |
| Qual (/qual path) | Web | https://stackmap.app/qual/api/sync |
| Production | All | https://stackmap.app/api/sync |

### Production Build Commands
```bash
# Web Production
NODE_ENV=production npm run build:web

# Android Production
cd android
NODE_ENV=production ./gradlew assembleRelease

# iOS Production
cd ios
NODE_ENV=production xcodebuild -workspace App.xcworkspace \
  -scheme App -configuration Release
```

---

## ✅ PHASE 3: SYNC TESTING CHECKLIST (Day 1-2)

### Test Matrix on Qual Environment

#### Core Sync Features
- [ ] Create new sync group on web
- [ ] Generate and copy recovery phrase
- [ ] Join sync from Android phone using phrase
- [ ] Join sync from Android tablet using phrase
- [ ] Join sync from iOS device using phrase
- [ ] Verify all devices show same data

#### Data Sync Operations
- [ ] Add activity on Device A → appears on Device B
- [ ] Edit activity on Device B → updates on Device A
- [ ] Delete activity on Device A → removes from Device B
- [ ] Add new user on Device A → syncs to all devices
- [ ] Change theme on one device → persists locally only

#### Conflict Resolution
- [ ] Make offline changes on two devices
- [ ] Reconnect and verify conflict resolution
- [ ] Test "last write wins" strategy

#### Share Links
- [ ] Generate share link from web
- [ ] Open share link on Android
- [ ] Open share link on iOS
- [ ] Verify data preview before import
- [ ] Test import with existing data warning

---

## 🚀 PHASE 4: PRODUCTION DEPLOYMENT (Day 2)

### 4A. Deploy Sync API to Production
```bash
# Deploy API files
./deploy-api.sh

# Verify all endpoints
curl https://stackmap.app/api/sync/health.php
curl https://stackmap.app/api/sync/pull.php
curl https://stackmap.app/api/sync/push.php
curl https://stackmap.app/api/sync/share.php
```

### 4B. Production Builds

#### Web Deployment
```bash
# Build for production
NODE_ENV=production npm run build:web

# Deploy using simple-deploy script
./simple-deploy.sh

# Verify at https://stackmap.app
```

#### Android Release
```bash
cd android

# For Google Play Store (AAB)
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab

# For direct APK distribution
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

#### iOS Release
```bash
cd ios

# Build for App Store
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath ./build/App.xcarchive \
  archive

# Export for App Store
xcodebuild -exportArchive \
  -archivePath ./build/App.xcarchive \
  -exportPath ./build \
  -exportOptionsPlist ExportOptions.plist
```

---

## 🔍 PHASE 5: FINAL VERIFICATION (Day 2)

### Production Testing Matrix

| Platform | Device Type | Sync | Share Links | PIN | Themes | Offline |
|----------|------------|------|-------------|-----|--------|---------|
| Web | Desktop Chrome | ✓ | ✓ | ✓ | ✓ | ✓ |
| Web | Mobile Safari | ✓ | ✓ | ✓ | ✓ | ✓ |
| Android | Phone | ✓ | ✓ | ✓ | ✓ | ✓ |
| Android | Tablet | ✓ | ✓ | ✓ | ✓ | ✓ |
| iOS | iPhone | ✓ | ✓ | ✓ | ✓ | ✓ |
| iOS | iPad | ✓ | ✓ | ✓ | ✓ | ✓ |

### Critical Path Testing
1. **New User Flow**
   - Install app → Complete onboarding → Create first activity
   - Set up PIN → Test edit mode protection
   - Create sync group → Verify recovery phrase

2. **Returning User Flow**
   - Join existing sync → Import data
   - Make changes → Verify sync
   - Work offline → Reconnect and sync

3. **Family Sharing Flow**
   - Parent creates sync → Shares with family
   - Family members join → Everyone sees same data
   - Multiple users make changes → All sync properly

---

## 📌 IMMEDIATE ACTION ITEMS

### Today (Day 1)
1. **[NOW]** Deploy web to qual
   ```bash
   NODE_ENV=production npm run build:web
   cp web/build/*.* . && cp -r web/build/fonts . && cp -r web/build/icons .
   git add . && git commit -m "Deploy to qual" && git push
   ssh stackmap-cpanel "cd ~/public_html/qual && git pull"
   ```

2. **[NEXT]** Build Android APK
   ```bash
   cd android && ./gradlew assembleDebug
   ```

3. **[THEN]** Test sync on qual between:
   - Web browser
   - Android phone
   - Android tablet
   - iOS device (if available)

### Tomorrow (Day 2)
1. Deploy sync API to production
2. Build production releases for all platforms
3. Final verification testing
4. Release! 🎉

---

## ✅ RELEASE CRITERIA

Must pass ALL before release:
- [ ] All platforms successfully sync data
- [ ] Share links work cross-platform
- [ ] PIN protection functions correctly
- [ ] No critical bugs in 24-hour test period
- [ ] Offline mode works and syncs when reconnected
- [ ] New user onboarding completes without errors
- [ ] Data persistence works across app restarts

---

## 🆘 Rollback Plan

If critical issues found post-release:
1. Web: Revert to previous build with `./ROLLBACK.sh`
2. Android: Upload previous APK/AAB to Play Store
3. iOS: Submit expedited review with previous build
4. API: Restore from backup (automated daily backups in place)

---

## 📝 Post-Release Tasks

- [ ] Monitor error logs for 48 hours
- [ ] Gather initial user feedback
- [ ] Update documentation
- [ ] Plan v1.1 features based on feedback
- [ ] Celebrate! 🎊

---

## 💡 Notes

- API already configured for environment-based URLs
- Dev builds automatically use qual environment
- Production builds automatically use production API
- All platforms share same codebase for consistency
- Sync uses zero-knowledge encryption (data safe even on qual)

---

*Last Updated: January 2025*
*Target Release: Within 48 hours*