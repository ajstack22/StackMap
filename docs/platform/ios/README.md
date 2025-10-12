# iOS Platform Guide - StackMap

This guide consolidates all iOS-specific development information for StackMap.

## Quick Reference

### Development Commands
```bash
# FOUR-TIER DEPLOYMENT (Recommended)
# Use the master deployment script with tier and platform flags
./scripts/deploy.sh qual --ios    # QUAL: Development testing (qual-api DB, multiple/day)
./scripts/deploy.sh stage --ios   # STAGE: Internal team validation (stage-api DB, before beta)
./scripts/deploy.sh beta --ios    # BETA: Closed beta testing (beta-api/prod-api DB, 1-2/week)
./scripts/deploy.sh prod --ios    # PROD: Public release (prod-api DB, weekly/bi-weekly)

# Manual commands (if needed)
npx react-native run-ios --simulator="iPhone 16 Pro Max"
cd ios && xcodebuild clean && cd ..
cd ios && pod deintegrate && pod install && cd ..
```

### Project Requirements
- **Xcode**: 15+
- **iOS Target**: 13.4+
- **React Native**: 0.80.1
- **CocoaPods**: Latest
- **Ruby**: For pod management

## Project Structure

```
ios/
├── StackMapNative.xcworkspace  # Always open this, not .xcodeproj
├── StackMapNative/
│   ├── Info.plist              # App permissions, settings
│   ├── Images.xcassets         # App icons, launch screens
│   ├── AppDelegate.swift       # App initialization
│   └── Fonts/                  # Custom fonts (Comic Relief)
└── Pods/                       # Dependencies
```

## Development Setup

### Initial Setup
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

### Version Management
- Automatically handled by deployment scripts
- Updates `Info.plist` CFBundleShortVersionString
- Build number (CFBundleVersion) without dots

## Configuration

### Info.plist Important Keys
- `UIViewControllerBasedStatusBarAppearance`: NO
- `UIRequiresFullScreen`: YES  
- `ITSAppUsesNonExemptEncryption`: NO
- Custom fonts listed under `UIAppFonts`

### Build Settings
- Bundle ID: `app.stackmap`
- Deployment Target: iOS 13.4
- Swift Version: 5.0
- Always use Release scheme for TestFlight

## iOS-Specific Issues & Solutions

### 1. Modal Layering (iOS 18.5+)
**Problem:** Nested modals have z-index issues on iOS.
**Solution:** Use `Alert.alert` for confirmations instead of custom modals:

```javascript
if (Platform.OS === 'ios') {
  Alert.alert(
    'Title',
    'Message',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: handleAction }
    ]
  );
} else {
  // Use ConfirmModal for Android/Web
}
```

### 2. Swipe Gestures in Modals
**Problem:** PanResponder doesn't work reliably with ScrollView on iOS.
**Solution:** Use `react-native-pager-view` for tabbed modal swipes:

```javascript
Platform.OS !== 'web' ? (
  <PagerView>
    {children}
  </PagerView>
) : (
  // PanResponder for Web
)
```

### 3. Swipe-to-Dismiss vs Scroll Conflict (FIXED Jan 2025)
**Problem:** Modal dismisses when scrolling up from middle of content.
**Solution:** Track exact scroll position, only allow dismiss when at top:

```javascript
// Never capture upward swipes
if (gestureState.dy < 0) return false;

// Only dismiss when ScrollView at top (offset = 0)
const canDismiss = isAtTopRef.current && !isScrolling;
```

### 4. DraggableFlatList Index Issues
**Problem:** DraggableFlatList doesn't reliably pass index prop on iOS.
**Solution:** Always calculate index from filtered array:

```javascript
const filteredActivities = activities.filter(a => !a.deleted);
const actualIndex = filteredActivities.findIndex(a => a.id === item.id);
```

### 5. Panel Expansion in Modals
**Problem:** Panels appear "too large" on iOS.
**Solution:** Apply specific constraints:

```javascript
Platform.OS === 'ios' && { 
  flex: 0, 
  flexGrow: 0, 
  flexShrink: 1,
  height: 32,
  maxHeight: 32
}
```

### 6. AsyncStorage Performance Issues (CRITICAL)
**Problem:** AsyncStorage causes 20+ second freeze on iOS.
**Solution:** Debounced writes implemented in useAppStore.js
- All writes are debounced by 1 second
- Prevents UI freezing during frequent updates
- See store architecture docs for details

### 7. NetInfo.fetch() Freezing (CRITICAL)
**Problem:** NetInfo.fetch() causes app freezes on iOS.
**Solution:** Disabled NetInfo.fetch() calls - app assumes online
- Network monitoring disabled on iOS
- Sync relies on request success/failure for network status

## Common Build Issues

### 1. Metro Connection Issues
**Problem:** App not connecting to Metro bundler
**Solution:** 
```bash
# Kill and restart Metro
npx react-native start --reset-cache
# Rebuild app
npx react-native run-ios
```

### 2. Font Not Loading
**Problem:** Comic Relief font not showing
**Solution:** 
1. Check font files in `ios/StackMapNative/Fonts/`
2. Verify Info.plist includes font names
3. Clean and rebuild

### 3. Build Failures
**Common Fixes:**
```bash
# Clear everything
watchman watch-del-all
rm -rf node_modules
npm install
cd ios
rm -rf Pods Podfile.lock
pod install
```

### 4. Simulator Issues
```bash
# Reset simulator
xcrun simctl erase all

# List available simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot [DEVICE_ID]
```

### 5. App Naming Fix
**Problem:** "StackMapNative" has not been registered error
**Solution:** Update these files to use "StackMap":

- `/ios/StackMapNative/Info.plist` - Set `CFBundleDisplayName` to "StackMap"
- `/ios/StackMapNative/AppDelegate.swift` - Change `withModuleName` parameter to "StackMap"

## Performance Optimization

### iOS-Specific Patterns
- Use `React.memo` for components
- Implement `getItemLayout` for FlatLists  
- Use `InteractionManager` for heavy operations
- Simplified animations (200ms fades) for better iOS performance

### Font Weight Handling
**Problem:** iOS renders fonts differently than Android.
**Solution:** Typography component handles this automatically:
- iOS/Web: Uses fontWeight with "Comic Relief" font
- Just use `fontWeight: 'bold'` and component handles platform differences

## Debugging

### Console Logs
```bash
# View logs from simulator
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "StackMap"'
```

### React Native Debugger
- Shake device/Cmd+D in simulator
- Select "Debug with Chrome"

### Common Debug Settings
- Enable: Fast Refresh
- Disable: Network Inspect (causes lag)

## Testing on Physical Device

1. Connect iPhone via USB
2. Open Xcode, select device
3. Trust computer on device
4. Build and run from Xcode

## Testing Checklist

Before committing iOS changes:
- [ ] Test on iPhone 16 Pro Max simulator
- [ ] Test on iPad for 2-column layout
- [ ] Verify swipe gestures in modals
- [ ] Check modal confirmations appear correctly
- [ ] Verify activity card numbering (1, 2, 3...)
- [ ] Test landscape/portrait orientations
- [ ] Verify font loading
- [ ] Test with/without network

## Key Files Reference

- `App.js` - Main activity rendering with iOS-specific fixes
- `src/components/TabbedModal/TabbedModal.js` - Swipe gesture handling
- `src/components/Modals/DataModal/DataModal.js` - Alert.alert usage examples
- `src/stores/useAppStore.js` - AsyncStorage debouncing implementation

## Update Instructions

When updating iOS-specific code:
1. Test on both iPhone and iPad
2. Check all iOS versions 13.4+
3. Verify font loading
4. Test with/without network
5. Document any new CocoaPods dependencies
6. Include simulator/device tested on