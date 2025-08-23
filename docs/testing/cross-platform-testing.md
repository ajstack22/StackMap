# Cross-Platform Testing Guide for StackMap

## Overview
This guide outlines platform-specific testing requirements and gotchas for StackMap across iOS, Android, and Web platforms.

## Platform Testing Matrix

### iOS (iPhone & iPad)
- **Devices**: iPhone 16 Pro Max, iPad Air 11" M3
- **OS Versions**: iOS 17+
- **Simulators**: Xcode iOS Simulator
- **Key Features**: Haptic feedback, swipe gestures, Safe Area, iPad multitasking

### Android (Phone & Tablet)
- **Devices**: Pixel 9, Pixel Tablet
- **OS Versions**: Android 12+ (API 31+)
- **Emulators**: Android Studio emulators
- **Key Features**: Back button, Material Design, predictive back

### Web (Desktop & Mobile)
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Viewports**: 1920x1080 (desktop), 393x852 (mobile)
- **Key Features**: PWA, offline mode, keyboard navigation

## Platform-Specific Test Cases

### iOS Testing

#### Critical iOS Features
```javascript
// Test haptic feedback
// Should feel Light impact on activity completion
// Should feel Selection on edit mode entry

// Test swipe gestures
// Swipe down from top should dismiss modals
// Swipe left/right should navigate tabs in modals

// Test Safe Area
// Content should not overlap notch/home indicator
// Modal headers should respect status bar
```

#### iOS-Specific Gotchas
- **AsyncStorage Freezes**: Check for 20+ second hangs on data save
- **NetInfo Disabled**: App assumes online status
- **Alert.alert**: Used instead of ConfirmModal component
- **Font Loading**: Verify Comic Relief loads correctly

#### iOS Test Checklist
- [ ] Safe Area insets respected on all screens
- [ ] Haptic feedback on activity complete/edit mode
- [ ] Swipe gestures work in modals
- [ ] No 20+ second freezes on data operations
- [ ] Alert.alert appears for confirmations
- [ ] iPad layouts use proper column counts
- [ ] Landscape orientation works correctly

### Android Testing

#### Critical Android Features
```javascript
// Test back button behavior
// Back button should close modals
// Back button should exit edit mode
// Back button should go to previous screen

// Test Material Design
// Elevation shadows on cards
// Ripple effects on buttons
// Status bar theming

// Test font handling
// Comic Relief variants (Bold/Regular)
// No fontWeight property usage
```

#### Android-Specific Gotchas
- **FlexWrap Cards**: Must use percentage widths (48%) + alignContent: 'flex-start'
- **Font Weights**: Use font variants (ComicRelief-Bold) without fontWeight property
- **No calculateCardWidth()**: For multi-column layouts
- **Swipe Thresholds**: Lower sensitivity for modal dismissal

#### Android Test Checklist
- [ ] Back button closes modals/panels
- [ ] Status bar color matches theme
- [ ] Material Design shadows visible
- [ ] Font rendering correct (no missing weights)
- [ ] FlexWrap cards use percentage widths
- [ ] Lower swipe thresholds work
- [ ] Predictive back gesture (Android 14+)

### Web Testing

#### Critical Web Features
```javascript
// Test PWA functionality
// Should be installable
// Should work offline
// Should cache resources

// Test keyboard navigation
// Tab key should navigate controls
// Escape should close modals
// Arrow keys should work in lists

// Test responsive behavior
// Desktop: 3-column grid
// Mobile: 1-column grid
// Tablet: 2-column grid
```

#### Web-Specific Gotchas
- **VectorIcons**: Must use `<span>` component for web, not `<Text>` (see VectorIcons.web.js)
- **Bundle Location**: Files must be in root for qual, not web/build/
- **Alert.alert**: Not supported - use ConfirmModal component
- **AsyncStorage**: Uses localStorage wrapper

#### Web Test Checklist
- [ ] PWA installs correctly
- [ ] Offline mode works
- [ ] Service worker caches assets
- [ ] Keyboard navigation (Tab, Esc, arrows)
- [ ] Responsive grid layouts
- [ ] VectorIcons render correctly
- [ ] No React Error 130 (DOM elements in RN components)

## Cross-Platform Consistency Tests

### Visual Consistency
- [ ] Same Comic Relief font on all platforms
- [ ] Identical theme colors across platforms
- [ ] Consistent card layouts and sizing
- [ ] Same icon rendering (emojis/symbols)
- [ ] Identical modal designs

### Functional Consistency
- [ ] Same button behaviors
- [ ] Identical navigation patterns
- [ ] Consistent data persistence
- [ ] Same sync functionality
- [ ] Identical error handling

### Performance Consistency
- [ ] Similar app launch times
- [ ] Consistent animation frame rates
- [ ] Same responsiveness to user input
- [ ] Identical scroll performance

## Platform-Specific Performance Benchmarks

### iOS Benchmarks
| Metric | Target | Notes |
|--------|--------|-------|
| App Launch | <2s | From cold start |
| Modal Open | <200ms | Smooth animation |
| Haptic Response | <50ms | Immediate feedback |
| Scroll FPS | 60fps | Consistent frame rate |

### Android Benchmarks
| Metric | Target | Notes |
|--------|--------|-------|
| App Launch | <3s | Including JVM startup |
| Back Button | <100ms | Immediate response |
| Elevation Render | <300ms | Shadow calculations |
| Ripple Effect | <200ms | Touch feedback |

### Web Benchmarks
| Metric | Target | Notes |
|--------|--------|-------|
| First Paint | <1s | Initial page load |
| PWA Install | <2s | Manifest processing |
| Offline Ready | <5s | Service worker cache |
| Keyboard Nav | <50ms | Focus changes |

## Testing Automation

### Platform-Specific Scripts

#### iOS Testing
```bash
# Launch iOS simulator
xcrun simctl boot "iPhone 16 Pro Max"
npx react-native run-ios --simulator="iPhone 16 Pro Max"

# iPad testing
xcrun simctl boot "iPad Air (5th generation)"
npx react-native run-ios --simulator="iPad Air (5th generation)"
```

#### Android Testing
```bash
# Launch Android emulator
emulator -avd Pixel_9_API_34
npx react-native run-android

# Tablet testing
emulator -avd Pixel_Tablet_API_34
npx react-native run-android
```

#### Web Testing
```bash
# Desktop testing
npm run web
open http://localhost:5503

# Mobile viewport testing
npm run web
# Use browser dev tools responsive mode
```

## Debugging Platform Issues

### iOS Debugging
```bash
# Check iOS logs
npx react-native log-ios

# Debug device logs
xcrun simctl spawn booted log stream --predicate 'subsystem contains "StackMap"'
```

### Android Debugging
```bash
# Check Android logs
npx react-native log-android
adb logcat | grep StackMap

# Check for crashes
adb logcat *:E
```

### Web Debugging
```javascript
// Check console for errors
console.error = (error) => {
  // Log to testing framework
  testResults.push({ type: 'error', message: error });
};

// Monitor performance
performance.mark('app-start');
// ... app logic
performance.measure('app-startup', 'app-start');
```

## Platform-Specific Issue Patterns

### iOS Common Issues
- Safe Area inset problems
- AsyncStorage hanging (20+ seconds)
- Font loading failures
- Haptic feedback not working
- Modal gesture conflicts

### Android Common Issues
- Back button not handled
- Font weight rendering
- FlexWrap layout issues
- Status bar theming
- Elevation shadow problems

### Web Common Issues
- Service worker not updating
- PWA install prompts
- Keyboard navigation broken
- React Native/DOM mixing
- Bundle caching issues

## Resolution Strategies

### iOS Fixes
```javascript
// Safe Area handling
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// AsyncStorage debouncing
const debouncedSave = useCallback(
  debounce((data) => AsyncStorage.setItem(key, data), 1000),
  []
);

// Font fallbacks
fontFamily: Platform.select({
  ios: 'Comic Relief',
  default: 'System'
})
```

### Android Fixes
```javascript
// Back button handling
useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    if (modalVisible) {
      setModalVisible(false);
      return true; // Prevent default
    }
    return false; // Allow default
  });
  return () => backHandler.remove();
}, [modalVisible]);

// Font handling
fontFamily: Platform.OS === 'android' 
  ? (bold ? 'ComicRelief-Bold' : 'ComicRelief-Regular')
  : 'Comic Relief'
```

### Web Fixes
```javascript
// Service Worker updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      registration.addEventListener('updatefound', () => {
        // Handle updates
      });
    });
}

// Keyboard navigation
useEffect(() => {
  const handleKeyboard = (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') handleTabNavigation(e);
  };
  
  document.addEventListener('keydown', handleKeyboard);
  return () => document.removeEventListener('keydown', handleKeyboard);
}, []);
```

## Related Documentation
- [Simple Testing Guide](./simple-testing-guide.md)
- [Testing Checklist](./testing-checklist.md)
- [Platform Guides](../platform/README.md)