# Quick Pre-Push Testing Checklist

## 🌐 Web Testing (5 minutes)
```bash
npm start
# Open http://localhost:8080
```

### Essential Tests:
- [ ] **Onboarding Flow**
  - [ ] Clear localStorage (F12 → Application → Clear Storage)
  - [ ] Refresh page - onboarding should appear
  - [ ] Carousel works (click dots or next)
  - [ ] "Continue to StackMap" works
  - [ ] "Import from backup" works
  - [ ] No overlapping buttons or text

- [ ] **PWA Install**
  - [ ] Install prompt appears (or install icon in address bar)
  - [ ] App installs successfully
  - [ ] Opens as standalone app

- [ ] **Data Persistence**
  - [ ] Add some activities
  - [ ] Refresh page
  - [ ] Data still there ✓

## 📱 iOS Testing (10 minutes)
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

### Essential Tests:
- [ ] **Onboarding** 
  - [ ] Delete app and reinstall
  - [ ] Onboarding shows with proper spacing
  - [ ] Safe area respected (no notch overlap)
  - [ ] Buttons work

- [ ] **Critical Bug Fix**
  - [ ] Add activities
  - [ ] Close app completely
  - [ ] Reopen - data should persist (not show onboarding)

- [ ] **Import/Export**
  - [ ] Export backup works
  - [ ] Import backup works

## 🤖 Android Testing (10 minutes)
```bash
npx react-native run-android
```

### Essential Tests:
- [ ] **Onboarding**
  - [ ] Clear app data or reinstall
  - [ ] Onboarding shows properly
  - [ ] No status bar overlap
  - [ ] All buttons work

- [ ] **Version & Permissions**
  - [ ] App installs (version code 6)
  - [ ] No storage permission popup

- [ ] **Basic Functions**
  - [ ] Add/edit activities
  - [ ] Export/Import works
  - [ ] Data persists after restart

## 🔒 Security Test (All Platforms)
- [ ] Go to Edit Mode Settings
- [ ] Enable PIN
- [ ] Exit and try to re-enter edit mode
- [ ] Try wrong PIN 6 times rapidly
- [ ] Should see "Too many attempts" message

## ✅ Ready to Push?
If all tests pass:
```bash
git add -A
git commit -m "feat: Add PWA support and fix onboarding flow

- Implemented PWA with offline support and install capability
- Fixed onboarding carousel positioning and button overlaps
- Added secure PIN handling with rate limiting
- Fixed iOS data persistence issue
- Removed unnecessary Android storage permission
- Updated to version 1.0.3"

git push
```

## 🚨 If Any Test Fails
1. Note which test failed
2. On which platform
3. What the expected vs actual behavior was
4. Do NOT push until fixed