# Cross-Platform Development Guide - StackMap

This guide provides comprehensive guidance for developing across iOS, Android, and Web platforms in StackMap.

## Overview

StackMap is built with React Native and supports three platforms with shared codebase and platform-specific optimizations. When making changes to shared components, you MUST test on all platforms to ensure consistent behavior.

## Platform Architecture Summary

### iOS
- **Target**: iOS 13.4+
- **Engine**: React Native 0.74.3
- **Build**: Xcode with CocoaPods
- **Key Challenges**: Modal layering, AsyncStorage performance, NetInfo freezing

### Android  
- **Target**: Android 6.0+ (API 23)
- **Engine**: React Native 0.74.3
- **Build**: Gradle with Java 17
- **Key Challenges**: FlexWrap layouts, font variants, Java version compatibility

### Web
- **Target**: Modern browsers (PWA)
- **Engine**: React Native Web + Webpack
- **Build**: Webpack with Workbox
- **Key Challenges**: Alert handling, Material Icons, gesture polyfills

## Critical Cross-Platform Patterns

### 1. Font Handling (CRITICAL - DO NOT CHANGE)

**Typography Component Approach:**
```javascript
// ✅ CORRECT: Use Typography component for automatic platform handling
import { Text } from '../components/Typography';
<Text style={{ fontWeight: 'bold' }}>Content</Text>

// ❌ WRONG: Direct fontFamily usage
style={{ fontFamily: 'Comic Relief', fontWeight: 'bold' }}
```

**Platform-Specific Implementation:**
- **iOS/Web**: Uses `fontWeight` with "Comic Relief" font
- **Android**: Uses font variants (ComicRelief-Bold) without `fontWeight` property
- **Typography component**: Handles this automatically - just use `fontWeight: 'bold'`

### 2. Layout Patterns

#### FlexWrap Cards (Android-Specific)
```javascript
// ✅ Android: MUST use percentage widths + alignContent
Platform.OS === 'android' ? {
  flexWrap: 'wrap',
  alignContent: 'flex-start',
  // Cards use 48% width for 2-column
} : {
  // iOS: Can use calculateCardWidth()
}
```

#### Responsive Grids
```javascript
const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  return Math.min(width, height) >= 600 && aspectRatio > 1.2;
};

const numColumns = isTablet() && width >= 768 ? 2 : 1;
```

### 3. Modal & Alert Handling

```javascript
// Platform-specific alert approach
if (Platform.OS === 'ios') {
  Alert.alert('Title', 'Message', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', onPress: handleAction }
  ]);
} else {
  // Android/Web: Use ConfirmModal component
  setShowConfirm(true);
}
```

### 4. Animation Strategy

```javascript
// Cross-platform animation configuration
const animationConfig = {
  toValue: 1,
  duration: 200,
  useNativeDriver: Platform.OS !== 'web', // Disabled on web
  easing: Easing.out(Easing.quad)
};
```

## Platform-Specific Gotchas

### iOS-Specific
- **AsyncStorage**: Causes 20+ second freezes - debounced in useAppStore.js
- **NetInfo.fetch()**: DISABLED - causes freezes, assumes online
- **Modal constraints**: Must use specific flex rules
- **Swipe in modals**: Use `react-native-pager-view` NOT PanResponder

### Android-Specific  
- **Font Weights**: MUST use font variants (ComicRelief-Bold) without fontWeight
- **FlexWrap Cards**: MUST use percentage widths (48%) + alignContent: 'flex-start'
- **No calculateCardWidth()** for multi-column layouts
- **Java 17**: REQUIRED - Java 24 causes build failures

### Web-Specific
- **VectorIcons.web.js**: MUST use `<span>` not `<Text>` component  
- **Alert.alert**: Not supported - use ConfirmModal component
- **Build files**: Go in ROOT for qual, not web/build/
- **No native gestures**: Use mouse/touch events

## Design Rules (Cross-Platform)

1. **NO GRAY TEXT** - All text must be black (#000) for accessibility
2. **High contrast** required - test with all theme colors  
3. **Typography**: Comic Relief font forced everywhere via custom component
4. **Single font system**: Typography component handles all platform differences

## Field Naming Standards (CRITICAL)

**Consistent across all platforms:**
- **Activities**: Use `text` (not name/title), `icon` (not emoji)
- **Users**: Use `icon` (not emoji), `name` as string only
- **Always include fallbacks**: `activity.text || activity.name || activity.title`
- **Normalizer**: `/src/utils/dataNormalizer.js` handles variations

## Development Workflow

### Essential Testing Pattern
**When updating any shared component, you MUST:**

1. **Build and test on all platforms:**
   ```bash
   # iOS
   npx react-native run-ios --simulator="iPhone 16 Pro Max"
   
   # Android  
   ./scripts/react-native/run-android.sh
   
   # Web
   npm run web  # Development
   NODE_ENV=production npm run build:web  # Production
   ```

2. **Clear cached data when testing:**
   - Web: Clear browser cache and localStorage
   - Mobile: Uninstall and reinstall app, or clear app data

3. **Test key scenarios:**
   - Portrait & landscape orientations
   - Phone & tablet form factors
   - All theme colors
   - Accessibility features

### Platform-Specific Testing Checklist

#### iOS Testing
- [ ] iPhone 16 Pro Max simulator
- [ ] iPad for 2-column layout
- [ ] Swipe gestures in modals
- [ ] Modal confirmations (Alert.alert)
- [ ] Activity card numbering
- [ ] Font loading (Comic Relief)

#### Android Testing  
- [ ] Pixel 8 Pro emulator (phone)
- [ ] Pixel Tablet emulator (tablet)
- [ ] Portrait and landscape orientations
- [ ] 2-column layout on tablets
- [ ] FlexWrap card alignment
- [ ] Font rendering (variants)
- [ ] TextInput color/keyboard behavior

#### Web Testing
- [ ] Chrome (primary browser)
- [ ] Safari (iOS PWA support)
- [ ] Firefox and Edge
- [ ] Material Icons rendering
- [ ] ConfirmModal (no Alert.alert)
- [ ] Responsive breakpoints
- [ ] PWA install flow
- [ ] Offline functionality

## Common Platform-Specific Code Patterns

### Styling Differences
```javascript
const styles = StyleSheet.create({
  container: {
    padding: Platform.select({
      ios: 20,
      android: 16,
      web: 24,
    }),
    fontSize: Platform.OS === 'web' ? 16 : 14,
  }
});
```

### Component Variations
```javascript
// For complex platform differences
if (Platform.OS === 'web') {
  return <WebSpecificComponent />;
}
return <MobileComponent />;
```

### Gesture Handling
```javascript
// iOS: react-native-pager-view for modals
// Android: Regular PanResponder  
// Web: Custom mouse/touch event handlers
```

## Storage & Performance

### Storage Strategy
- **iOS**: Keychain (with AsyncStorage debouncing)
- **Android**: Keystore  
- **Web**: localStorage (less secure)
- **All platforms**: Same key structure, different underlying storage

### Performance Patterns
- **iOS**: Simplified animations (200ms fades), debounced AsyncStorage
- **Android**: Optimized FlatList props, careful image handling
- **Web**: JavaScript animations, reduced bundle size

## Build & Deployment

### Development Commands
```bash
# Individual platforms
npm run ios          # iOS development
./scripts/react-native/run-android.sh  # Android (with Java 17)
npm run web          # Web development

# Master deployment (all platforms)
./scripts/deploy-all.sh
```

### Version Management
- Automatically handled by deployment scripts
- Consistent versioning across all platforms
- Platform-specific build numbers

## File Organization

### Platform-Specific Files
- Use `.ios.js`, `.android.js`, `.web.js` extensions
- Web polyfills: `/src/utils/*.web.js`
- Platform docs: `/docs/platform/[ios|android|web]/`

### Shared Components
- `/src/components/` - Cross-platform components
- Platform checks within shared files when needed
- Typography component for unified font handling

## Troubleshooting Cross-Platform Issues

### Common Problems
1. **Fonts not rendering correctly**: Check Typography component usage
2. **Layout differences**: Verify FlexWrap vs standard approach
3. **Gestures not working**: Check platform-specific implementations
4. **Build failures**: Verify Java 17 (Android), Xcode setup (iOS), webpack (Web)
5. **Performance issues**: Check AsyncStorage usage (iOS), image optimization (Android), bundle size (Web)

### Debug Strategy
1. **Isolate the platform**: Test on one platform first
2. **Check Platform.OS usage**: Ensure all platforms handled
3. **Review recent changes**: Platform-specific code may have side effects
4. **Test with clean state**: Clear caches, fresh installs
5. **Verify dependencies**: Platform-specific libraries may conflict

## Update Instructions

When making cross-platform changes:
1. **Document platform differences** in this guide
2. **Update CLAUDE.md** if it's a recurring issue
3. **Test thoroughly** on all platforms
4. **Include testing notes** in commit messages
5. **Update platform-specific docs** if needed

## Key Files Reference

### Cross-Platform Components
- `src/components/Typography/index.js` - Unified font handling
- `src/utils/dataNormalizer.js` - Field normalization logic
- `App.js` - Main responsive logic

### Platform-Specific Utilities
- `src/utils/*.web.js` - Web polyfills
- `src/stores/useAppStore.js` - iOS AsyncStorage debouncing
- Platform-specific build scripts in `/scripts/`

## Success Criteria

A successful cross-platform implementation:
- ✅ Works identically on all three platforms
- ✅ Respects platform-specific design patterns
- ✅ Handles platform limitations gracefully
- ✅ Maintains consistent user experience
- ✅ Passes all platform-specific testing checklists
- ✅ Follows established patterns in this guide

Remember: **A change that works perfectly on one platform may break on another. Always test thoroughly across all platforms!**