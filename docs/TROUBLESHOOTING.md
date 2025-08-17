# StackMap Troubleshooting Guide

> **Last Updated**: 2024-12-28  
> **Purpose**: Quick solutions to common issues

---

## 🚨 Most Common Issues

### 1. 403 Forbidden Error After Deployment

**Symptoms:**
- Site shows "403 Forbidden" after git pull
- "Access to this resource on the server is denied!"

**Cause:**
Build files are in .gitignore, so they don't exist on the server after git pull.

**Solution:**
```bash
# 1. Check .gitignore - these should be COMMENTED OUT:
# /index.html
# /bundle.*.js
# /manifest.json
# /service-worker.js
# /workbox-*.js
# /fonts/
# /icons/

# 2. Ensure build files are in git:
git add -f index.html bundle.*.js manifest.json service-worker.js workbox-*.js fonts icons *.png
git commit -m "Add build files"
git push

# 3. Pull again on server
```

**Prevention:**
- Always use `npm run deploy:qual` script
- Read [DO_NOT_IGNORE_BUILD_FILES.md](./DO_NOT_IGNORE_BUILD_FILES.md)

---

### 2. Old Bundle Loading (Cache Issues)

**Symptoms:**
- Browser loads old JavaScript bundle
- "Cannot read properties of undefined" errors
- App doesn't reflect recent changes

**Cause:**
Service worker or browser caching old files.

**Solution:**
```bash
# 1. Clear browser cache completely
# 2. Open in incognito/private window
# 3. Visit /force-refresh.html if available
# 4. Unregister service worker in DevTools > Application > Service Workers
```

---

### 3. MIME Type Errors

**Symptoms:**
- "Refused to execute script... MIME type ('text/html') is not executable"
- JavaScript files returning 404

**Cause:**
Server can't find the JavaScript file, returns HTML 404 page instead.

**Solution:**
```bash
# 1. Verify file exists on server
# 2. Check file permissions (should be 644)
# 3. Ensure .htaccess has correct MIME types:
AddType application/javascript .js
```

---

### 4. Icons/Fonts Not Loading

**Symptoms:**
- Missing icons or wrong fonts
- 404 errors for font files

**Cause:**
Font/icon directories not copied to root or wrong paths.

**Solution:**
```bash
# Copy directories to root:
cp -r web/build/fonts .
cp -r web/build/icons .
git add fonts icons
git commit -m "Add font and icon directories"
git push
```

---

### 5. iOS Modal Panels Expanding Too Large 🚨 CRITICAL FIX 🚨

**Symptoms:**
- Modal panels expand beyond their content on iOS
- Sections appear "too big" or "too large"
- Content doesn't fit properly within modal boundaries

**Cause:**
iOS handles flex properties differently in ScrollView. Without proper constraints, panels will expand to fill all available space.

**Solution - MUST FOLLOW EXACTLY:**
```javascript
// 1. ScrollView MUST have flex: 1
modalScrollView: {
  flex: 1,  // REQUIRED for iOS
},

// 2. scrollContent MUST NOT have flexGrow on iOS
scrollContent: {
  ...(Platform.OS === 'ios' ? {} : { flexGrow: 1 }),
},

// 3. sectionInner MUST have iOS constraints
sectionInner: {
  ...(Platform.OS === 'ios' && {
    flex: 0,      // CRITICAL: Prevents expansion
    flexGrow: 0,  // CRITICAL: No growing
    flexShrink: 1,// CRITICAL: Can shrink if needed
  }),
},

// 4. Activity cards MUST have explicit height on iOS
activityCard: {
  ...(Platform.OS === 'ios' && {
    height: 32,    // CRITICAL: Fixed height
    maxHeight: 32, // CRITICAL: Prevent expansion
  }),
}
```

**⚠️ NEVER DO THIS:**
- Don't use inline styles like `{ minHeight: 0, height: 'auto' }` on iOS
- Don't remove the iOS-specific flex constraints
- Don't use flexGrow on iOS ScrollView content
- Don't forget the wrapper View with flex: 1

**This fix has caused hours of debugging. DO NOT CHANGE without understanding why each constraint exists!**

---

### 6. Platform-Specific Issues

### iOS Issues
- **White screen**: Check Xcode console for errors
- **Font not loading**: Ensure ComicRelief is in Copy Bundle Resources
- **Build fails**: Clean build folder (Cmd+Shift+K)

### Android Issues
- **APK won't install**: Check keystore signing
- **Gradle errors**: Run `cd android && ./gradlew clean`
- **Metro bundler**: Kill all node processes and restart

### Web Issues
- **Scroll not working**: Check overflow CSS properties
- **Touch events**: Ensure proper event handlers for web
- **PWA not installing**: Check manifest.json paths
- **Alert.alert not working**: React Native's Alert doesn't work on web, use `window.confirm()` instead (see Common Issues in CLAUDE.md)
- **React State Batching**: Multiple rapid setState calls may only apply the last update. Use batch updates instead (see issue #6 below)

---

## 🔧 Debugging Commands

### Check Current State
```bash
# See what files are ignored
git status --ignored

# Check what's in the bundle
grep -c "COLORS.gray\[100\]" bundle.*.js

# Verify deployment
curl -I https://stackmap.app/qual/index.html
```

### Force Rebuilds
```bash
# Clean everything
rm -rf node_modules web/build
npm install

# Full rebuild
NODE_ENV=production npm run build:web
```

### Service Worker Issues
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
```

---

## 📱 Platform Build Issues

### iOS Build Failures
```bash
cd ios
pod deintegrate
pod install
cd ..
npx react-native run-ios
```

### Android Build Failures
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Web Build Issues
```bash
# Check webpack config
npm run build:web -- --verbose

# Test locally
npm run web
```

---

## 🚀 Deployment Issues

### Git Push Rejected
```bash
# Force push (CAREFUL!)
git push --force-with-lease

# Or pull and merge
git pull --rebase
git push
```

### Namecheap Specific
- .cpanel.yml does NOT work - ignore it
- Must copy build files to root for qual
- Use simple-deploy.sh for production only

---

## 🆘 When All Else Fails

1. **Check the docs index**: [MD_FILES_INDEX.md](./MD_FILES_INDEX.md)
2. **Read deployment truth**: [CLAUDE.md](./CLAUDE.md)
3. **Check recent changes**: `git log --oneline -10`
4. **Test locally first**: `npm run web`
5. **Use incognito mode**: Eliminates cache issues
6. **Check server logs**: Look for PHP/Apache errors

---

### 6. React State Batching Issues

**Symptoms:**
- "Add All" button only adds one item instead of all
- Multiple items processed but only last one appears
- forEach loops with setState only applying last change

**Cause:**
React batches multiple setState calls for performance. When calling setState in a loop, only the last update may be applied because each setState uses the current state, not the updated state from previous iterations.

**Solution:**
```javascript
// ❌ BAD: Multiple setState calls in a loop
items.forEach(item => {
  setActivities([...activities, createNewItem(item)]);
});

// ✅ GOOD: Batch all updates into one setState
const newItems = items.map(item => createNewItem(item));
setActivities([...activities, ...newItems]);

// ✅ ALSO GOOD: Use functional setState for sequential updates
setActivities(prevActivities => {
  const newItems = items.map(item => createNewItem(item));
  return [...prevActivities, ...newItems];
});
```

**Best Practice:**
- Always batch multiple state updates into a single setState call
- Use functional setState when the new state depends on the previous state
- Create separate handlers for single vs multiple item operations

---

### 8. Card Numbering Gaps (Cards Starting at 5 Instead of 1)

**Symptoms:**
- Card numbers don't start at 1
- Missing card numbers (e.g., no cards 1-4, first card shows as 5)
- Gaps in card numbering sequence
- Issue often occurs after using "Add All" from Activity Library

**Cause:**
Card numbers are based on the array index position. If the activities array has null/undefined values or gaps, the numbering will be incorrect.

**Solution:**
The app now includes a `cleanupActivities()` helper function that:
```javascript
// Filters out any null, undefined, or deleted items
const validActivities = activitiesArray.filter(a => a && !a.deleted);
```

This is automatically applied when:
- Loading activities on app start
- Switching between today/tomorrow
- Adding multiple activities via "Add All"

**Prevention:**
- Always use the batch handler `onSelectMultipleActivities` for adding multiple items
- The app automatically cleans up the activities array to prevent gaps
- Card numbers are calculated based on visible (non-deleted) activities only

---

### 7. "no PRNG" Error in Sync Initialization

**Symptoms:**
- Error: "no PRNG" when trying to enable sync
- Sync initialization fails on mobile devices
- Error appears in console: `Sync initialization failed: Error: no PRNG`

**Cause:**
React Native doesn't have the Web Crypto API available by default. The TweetNaCl encryption library requires a proper random number generator for cryptographic operations.

**Solution:**
This has been fixed by installing `react-native-get-random-values` and importing it before any crypto-dependent libraries:

```javascript
// In index.js - Import this BEFORE any other imports
import 'react-native-get-random-values';

// Also in encryptionService.js
if (Platform.OS !== 'web') {
  require('react-native-get-random-values');
}
```

**If the error persists:**
1. Run `cd ios && pod install` for iOS
2. Rebuild the app: `npx react-native run-ios` or `npx react-native run-android`
3. Clear Metro cache: `npx react-native start --reset-cache`

---

### 8. Sync Fails After Computer Wakes from Sleep

**Symptoms:**
- `net::ERR_NETWORK_IO_SUSPENDED` errors in browser console
- `net::ERR_SOCKS_CONNECTION_FAILED` errors
- "Failed to fetch" errors after computer wakes from sleep
- Sync doesn't resume automatically when network returns
- Changes made while offline don't sync when back online

**Cause:**
When a computer wakes from sleep, the browser's network stack may not be immediately ready. Network requests fail because the connection is still suspended or the proxy/VPN hasn't reconnected yet.

**Solution (Automatic - v2025.08.17):**
The sync service now includes:
1. **Automatic retry with exponential backoff** - Retries failed requests up to 3 times with delays of 1s, 2s, 4s
2. **Wake detection** - Detects when tab becomes visible and waits for network to stabilize
3. **Network state reset** - Clears stale network state when tab regains focus
4. **Online/offline event handling** - Responds to network connection changes

**Manual Recovery (if automatic fails):**
1. Wait 10-15 seconds after wake for network to reconnect
2. Make a small change (toggle an activity) to trigger sync
3. If still failing, refresh the page (Ctrl+R or Cmd+R)

**Prevention:**
- Keep the StackMap tab active (not minimized) during sleep
- The app will automatically recover within 1-8 seconds of wake
- Watch for "sync: Network error, retrying..." messages in console

---

## 📞 Getting Help

When reporting issues, include:
1. Exact error message
2. Browser/platform
3. Steps to reproduce
4. What you've already tried
5. Output of `git status` and `git log -1`

---

## 🔄 Quick Fixes

### "Just Make It Work"
```bash
# Nuclear option - full rebuild and deploy
rm -rf node_modules web/build
npm install
npm run deploy:qual
git add -A
git commit -m "Full rebuild"
git push
ssh stackmap-cpanel "cd ~/public_html/qual && git pull"
```

Remember: Most issues are caused by caching or missing files. When in doubt, clear caches and verify files exist!