# StackMap Troubleshooting Guide

## Common Issues and Solutions

### App Issues

#### App Won't Start
**Symptoms**: App crashes on launch or shows white screen

**Solutions**:
1. Clear app data/cache
2. Reinstall the app
3. Check for app updates
4. For web: Clear browser cache and cookies

#### Data Not Saving
**Symptoms**: Activities disappear after closing app

**Solutions**:
1. Check storage permissions
2. Ensure sufficient device storage
3. Try export/import to backup data
4. Check AsyncStorage is working:
   ```javascript
   // In console
   AsyncStorage.getAllKeys().then(console.log)
   ```

#### Theme Not Changing
**Symptoms**: Theme selection doesn't apply

**Solutions**:
1. Force close and restart app
2. Clear app cache
3. Check if theme is saved in settings
4. Known issue: Theme reactivity bug after store refactor

### Sync Issues

#### "Sync not enabled" Error
**Symptoms**: Can't enable sync feature

**Solutions**:
1. Check internet connection
2. Verify recovery phrase format (32 hex characters)
3. Try disabling and re-enabling sync
4. Clear sync credentials and re-initialize

#### Sync Data Not Appearing
**Symptoms**: Data doesn't sync between devices

**Solutions**:
1. Ensure same recovery phrase on all devices
2. Check internet connection on both devices
3. Force sync: Pull to refresh
4. Verify sync status in settings
5. Check server status at `/api/sync/health.php`

#### "Invalid recovery phrase" Error
**Symptoms**: Can't join existing sync

**Solutions**:
1. Verify phrase is exactly 32 characters
2. Check for spaces or special characters
3. Ensure lowercase hexadecimal only
4. Try copy/paste instead of typing

#### Sync Conflicts
**Symptoms**: Different data on different devices

**Solutions**:
1. Pull latest data before making changes
2. Choose "Keep Local" or "Keep Remote" when prompted
3. Export data as backup before resolving
4. Disable sync, clear data, re-enable with same phrase

### Platform-Specific Issues

#### iOS Issues

**Xcode Build Fails**
```bash
cd ios
pod deintegrate
pod cache clean --all
pod install
```

**App Freezes for 20+ Seconds**
- Known issue with AsyncStorage
- Fix: Already debounced in code
- Workaround: Wait for freeze to resolve

**Simulator Issues**
```bash
# Reset simulator
xcrun simctl erase all

# Clean build
rm -rf ~/Library/Developer/Xcode/DerivedData
```

#### Android Issues

**Build Failed - SDK Not Found**
```bash
# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Gradle Build Fails**
```bash
cd android
./gradlew clean
./gradlew --stop
rm -rf ~/.gradle/caches/
```

**APK Not Installing**
```bash
# Uninstall existing version
adb uninstall com.stackmap

# Install fresh
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

#### Web Issues

**Blank White Screen**
1. Check browser console for errors
2. Clear browser cache
3. Disable browser extensions
4. Try incognito/private mode

**Icons Not Showing**
- Ensure Material Icons font is loaded
- Check network tab for font files
- Clear browser cache

**Local Storage Issues**
```javascript
// Clear all local storage
localStorage.clear()
sessionStorage.clear()
```

### Development Issues

#### Metro Bundler Errors

**"Module not found"**
```bash
npx react-native start --reset-cache
watchman watch-del-all
```

**"Port 8081 already in use"**
```bash
# Find and kill process
lsof -i :8081
kill -9 <PID>

# Or use different port
npx react-native start --port 8082
```

#### TypeScript Errors

**"Cannot find module"**
```bash
# Regenerate types
npm run typecheck

# Clear TypeScript cache
rm -rf node_modules/.cache/typescript
```

**Type errors in .js files**
- Add `// @ts-nocheck` at file top
- Or fix the type errors
- Components remain in JS (gradual migration)

#### Node Modules Issues

**"Module version mismatch"**
```bash
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install
```

**iOS Pods Issues**
```bash
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install
```

### Import/Export Issues

#### Import Fails
**Symptoms**: Can't import backup file

**Solutions**:
1. Verify file is valid JSON
2. Check file isn't corrupted
3. Ensure version compatibility
4. Try creating new export and comparing format

#### Export Not Working
**Symptoms**: Can't create backup

**Solutions**:
1. Check storage permissions
2. Ensure sufficient storage space
3. For iOS: Check iCloud Drive is enabled
4. For Android: Check Downloads folder access

#### "User shows as 'User'" After Import
- Export missing `currentUser` field
- Fix: Re-export with updated app version
- Workaround: Edit user name after import

### Performance Issues

#### App Running Slowly
1. Clear app cache
2. Reduce number of activities
3. Disable animations in device settings
4. Close other apps
5. Restart device

#### High Battery Usage
1. Disable background sync
2. Reduce sync frequency
3. Turn off sound effects
4. Use static theme (not dynamic)

### Data Issues

#### Duplicate Users Appearing
```javascript
// Run in console
window.cleanupGhostUsers()
```

#### Activities Not Completing
1. Check if tap is registering
2. Try long-press instead
3. Verify completion timestamp is saved
4. Check if activity is pinned (can't complete)

#### Lost Activities
1. Check if viewing correct day
2. Check if correct user is selected
3. Try switching days and back
4. Check if activities were deleted

## Debug Commands

### Check App State
```javascript
// In browser console or React Native Debugger
useAppStore.getState()
```

### Check Sync Status
```javascript
// Check if sync is enabled
syncService.isEnabled()

// Get sync status
syncService.getStatus()
```

### Force Sync
```javascript
// Trigger manual sync
syncService.sync()
```

### Clear All Data
```javascript
// WARNING: This deletes everything
AsyncStorage.clear()
```

### Export Debug Info
```javascript
// Get all stored keys
AsyncStorage.getAllKeys().then(keys => {
  console.log('Stored keys:', keys)
})

// Get storage size
AsyncStorage.getAllKeys().then(keys => {
  Promise.all(keys.map(key => 
    AsyncStorage.getItem(key)
  )).then(values => {
    const size = values.join('').length
    console.log(`Storage size: ${size} bytes`)
  })
})
```

## Getting Help

If these solutions don't resolve your issue:

1. **Check GitHub Issues**: Look for similar problems
2. **Create New Issue**: Include:
   - Device and OS version
   - App version
   - Steps to reproduce
   - Error messages
   - Screenshots if applicable

3. **Provide Debug Info**:
   - Export your data first (backup)
   - Include console logs
   - Share sync status if relevant

4. **Emergency Recovery**:
   - Export data if possible
   - Screenshot important information
   - Reinstall app
   - Import backup or rejoin sync