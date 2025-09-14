# Platform Expert Roles - StackMap Development Framework

## Overview
Platform Experts ensure features work correctly on their specialized platform, understanding unique constraints, optimizations, and workarounds. Each platform has specific gotchas that require deep expertise.

---

# iOS Platform Expert

## Specialization Areas
- AsyncStorage performance issues
- Modal constraints and behaviors
- NetInfo freezing problems
- Simulator vs device differences
- App Store requirements

## Critical Knowledge

### AsyncStorage Freeze Issue
```javascript
// Current workaround - 5 second debounce
const debouncedSave = debounce(async (state) => {
  await AsyncStorage.setItem('appState', JSON.stringify(state));
}, 5000);

// Why: iOS AsyncStorage blocks main thread
// Impact: 20+ second UI freezes
// Solution paths: MMKV, chunked storage, background processing
```

### NetInfo Disabled
```javascript
// NetInfo.fetch() causes freezes
// Current: Assume always online
// Risk: Sync failures without network
```

### Modal Constraints
```javascript
// Specific flex rules required
modalContent: {
  flex: 1,
  maxHeight: '90%', // Prevent keyboard issues
  alignSelf: 'stretch'
}
```

## Testing Requirements
- [ ] Test on real device (not just simulator)
- [ ] Check performance with Instruments
- [ ] Verify no UI freezes > 100ms
- [ ] Test with iOS 14+ (minimum supported)
- [ ] Check memory usage patterns

## Common Issues
1. **Keyboard avoidance** - Different than Android
2. **Safe area insets** - Notch and home indicator
3. **Font rendering** - San Francisco specifics
4. **Gesture conflicts** - Swipe back vs in-app

---

# Android Platform Expert

## Specialization Areas
- FlexWrap percentage requirements
- Font variant system (no fontWeight)
- Gradle build optimizations
- Device fragmentation
- Play Store requirements

## Critical Knowledge

### FlexWrap Cards
```javascript
// MUST use percentage widths
// BAD:
width: calculateCardWidth()

// GOOD:
width: '48%',
alignContent: 'flex-start'
```

### Font System
```javascript
// Android can't use fontWeight with custom fonts
// BAD:
fontFamily: 'Comic Relief',
fontWeight: 'bold'

// GOOD:
fontFamily: bold ? 'ComicRelief-Bold' : 'ComicRelief'
// Typography component handles this automatically
```

### Build Issues
```bash
# Common fixes
cd android && ./gradlew clean
rm -rf android/.gradle
rm -rf android/app/build
```

## Testing Requirements
- [ ] Test on multiple Android versions (7+)
- [ ] Check different screen densities
- [ ] Verify on low-end devices
- [ ] Test with ProGuard enabled
- [ ] Check APK and AAB sizes

## Common Issues
1. **Multidex** - Method count limits
2. **Vector icons** - Rendering differences
3. **Status bar** - Translucent handling
4. **Back button** - Hardware back behavior

---

# Web Platform Expert

## Specialization Areas
- Browser compatibility
- Bundle optimization
- PWA capabilities
- Polyfill requirements
- SEO considerations

## Critical Knowledge

### VectorIcons Web Implementation
```javascript
// Must use <span> not <Text>
// See VectorIcons.web.js for implementation
return <span className={`icon-${name}`} />;
```

### Alert.alert Polyfill
```javascript
// Not supported on web
// Use ConfirmModal component instead
if (Platform.OS === 'web') {
  setConfirmModal({ 
    title, 
    message, 
    onConfirm 
  });
} else {
  Alert.alert(title, message, buttons);
}
```

### Build Output
```bash
# Build files go in ROOT for qual, not web/build/
# qual_deploy.sh handles this
cp -r web/build/* ./
```

## Testing Requirements
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (Chromium)
- [ ] Mobile browsers
- [ ] Different viewport sizes
- [ ] Lighthouse audit > 90

## Common Issues
1. **localStorage limits** - 5-10MB max
2. **CORS issues** - API calls
3. **Service workers** - Caching strategy
4. **Touch events** - vs mouse events

---

# Cross-Platform Coordination

## Shared Concerns

### No Platform-Specific Files
```bash
# FORBIDDEN - Never create:
Component.ios.js
Component.android.js
Component.web.js
Component.native.js

# CORRECT - Use Platform.select:
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { paddingTop: 20 },
      android: { paddingTop: 0 },
      web: { paddingTop: 10 }
    })
  }
});
```

### Data Structure Consistency
```javascript
// All platforms must use same field names
activity.text  // NOT name or title
activity.icon  // NOT emoji
user.icon     // NOT emoji
user.name     // String only
```

### Performance Targets
```
All Platforms:
- Bundle size < 50MB (web < 5MB)
- Initial load < 3 seconds
- 60 FPS scrolling
- No UI blocks > 100ms
- Memory usage < 200MB
```

## Platform Testing Matrix

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Sync | Real device | Emulator + Device | All browsers |
| Storage | Check freezes | Check size | Check limits |
| Modals | Keyboard avoid | Back button | Escape key |
| Lists | Performance | FlexWrap | Virtualization |
| Fonts | System fonts | Variants | Web fonts |

## Platform Feature Flags
```javascript
const FEATURES = {
  push_notifications: Platform.OS !== 'web',
  biometric_auth: Platform.OS !== 'web',
  share_sheet: Platform.OS !== 'web',
  deep_linking: true, // All platforms
  offline_mode: true, // All platforms
};
```

## Debugging Tools

### iOS
- Xcode Instruments
- Safari Web Inspector
- React Native Debugger
- Flipper

### Android
- Android Studio Profiler
- Chrome DevTools
- ADB commands
- Flipper

### Web
- Chrome DevTools
- React DevTools
- Lighthouse
- Bundle analyzers

## Platform-Specific Dependencies
```json
// iOS only
"react-native-keychain": "iOS Keychain access",

// Android only
"react-native-android-specific": "Example",

// Web only
"react-dom": "Web rendering",

// Shared with platform detection
"react-native-vector-icons": "All platforms with different implementations"
```

## Communication Between Experts

### Weekly Platform Sync
- Share platform-specific issues
- Coordinate cross-platform features
- Align on workarounds
- Update documentation

### Issue Escalation
```
Platform bug found → Platform Expert investigates →
If affects others → Coordinate solution →
If platform-specific → Document workaround →
Update CLAUDE.md with gotcha
```

## Success Metrics

### Platform Health
- Platform-specific bug rate
- Performance parity
- Feature parity
- User satisfaction by platform

### Expert Effectiveness
- Platform issues caught early
- Workarounds documented
- Build time optimizations
- Platform-specific optimizations

---
*Platform Expert Roles v1.0 - StackMap Development Framework*
*Last Updated: 2025-01-13*