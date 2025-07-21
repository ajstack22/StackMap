# Web Platform Differences - StackMap

This document provides a comprehensive overview of all platform-specific differences between the web version and native mobile apps in StackMap.

## 1. UI/UX Differences

### Layout and Spacing
- **Header padding**: Web uses 80px horizontal padding vs 20px on native
- **FAB size**: 60px on web vs 72-96px on native
- **Icon sizes**: Generally smaller on web (26px vs 31-38px)
- **Font sizes**: Reduced on web (e.g., title: 25px vs 28px on mobile)
- **Padding adjustments**: Tighter padding on web for more compact display
- **Container width**: Web has max-width constraints for better desktop viewing
- **Fixed positioning**: Navigation bar uses `position: fixed` on web

### Visual Styling
- **Font weights**: Web uses '700' vs 'bold' on iOS
- **Cursor**: Web adds `cursor: pointer` for interactive elements
- **Shadows**: Web-specific shadow implementations
- **Overflow handling**: Web uses `overflow: visible` for scrolling content
- **Height constraints**: Web uses explicit height values (100vh, 100%)

### Responsive Design
- **Web reduction factor**: 0.7x scale applied to various dimensions
- **Single column max width**: Limited to improve readability on wide screens
- **Grid layout**: Different margin/padding calculations for card layouts

## 2. Animation Differences

### Native Driver
- **Disabled on web**: All animations use `useNativeDriver: false` on web
- **Performance impact**: Web animations run on the JavaScript thread
- **Affected animations**:
  - Card press animations
  - Modal transitions
  - FAB animations
  - Activity completion celebrations

### Gesture Handling
- **PanGestureHandler**: Not available on web, uses polyfill
- **GestureHandlerRootView**: Simple View wrapper on web
- **Drag and drop**: Custom web implementation using DraggableList.web
- **Swipe gestures**: Disabled in modals on web

## 3. Feature Differences

### File System Operations
- **Import/Export**:
  - Web uses browser download/upload APIs
  - No direct file system access
  - Files downloaded through blob URLs
  - File picker implemented via HTML input element

### Storage
- **Secure storage**: Uses localStorage instead of Keychain/Keystore
- **AsyncStorage**: Polyfilled with localStorage
- **Data persistence**: Same key structure but different underlying storage

### Native Features Not Available on Web
- **Haptic feedback**: No vibration support
- **Share API**: Limited to browsers that support Web Share API
- **Document picker**: Custom implementation using HTML file input
- **Native gesture handlers**: Simplified or disabled
- **Background audio**: Limited support

## 4. Component-Specific Differences

### Activity Library
```javascript
if (Platform.OS === 'web') {
  const DraggableListWeb = require('./DraggableList.web');
  DraggableFlatList = DraggableListWeb.DraggableList;
  ScaleDecorator = DraggableListWeb.ScaleDecorator;
}
```

### Onboarding
- **Item sizes**: 45px on web vs 55-70px on native
- **Scroll behavior**: Animated prop disabled on web
- **Navigation**: Fixed positioning with different padding

### Modals
- **PanGestureHandler**: Conditionally rendered (not on web)
- **PIN input**: Different UI for web vs native keypad

### Edit Mode
- **Reorder buttons**: Shown for Android and Web (not iOS)
- **Drag handles**: Different implementation for web

## 5. Performance Optimizations

### Web-Specific
- **Disabled animations**: Smoother scrolling without native driver overhead
- **Reduced asset sizes**: Smaller dimensions for faster loading
- **Simplified gestures**: Less complex interaction handling

### Bundle Size
- **Conditional imports**: Platform-specific modules not included
- **Polyfills**: Minimal implementations for missing native features

## 6. Security Differences

### Storage Security
- **Web**: Uses localStorage (less secure than native)
- **Native**: Uses Keychain (iOS) / Keystore (Android)
- **PIN storage**: Encrypted differently on each platform

### Data Protection
- **Web**: Relies on HTTPS and browser security
- **Native**: Additional OS-level protection

## 7. Development Considerations

### Webpack Configuration
```javascript
alias: {
  'react-native-fs': path.resolve(__dirname, 'src/utils/platformHelpers.web.js'),
  'react-native-gesture-handler': path.resolve(__dirname, 'src/utils/GestureHandler.web.js'),
  '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/utils/AsyncStorage.web.js'),
  'react-native-keychain': path.resolve(__dirname, 'src/utils/Keychain.web.js'),
}
```

### Platform Checks
```javascript
if (Platform.OS === 'web') {
  // Web-specific code
}

// Animation example
useNativeDriver: Platform.OS !== 'web'
```

## 8. Testing Differences

### Web-Specific Tests
- Browser compatibility testing required
- Different gesture simulation methods
- localStorage mocking needed

### E2E Testing
- Web uses Selenium/Puppeteer instead of Detox/Appium
- Different element selectors and interaction methods

## 9. Deployment Differences

### Build Process
- Web uses webpack bundling
- Different optimization strategies
- Static file hosting vs app store distribution

### Updates
- Web updates instantly on deployment
- No app store review process
- Cache invalidation considerations

## 10. User Experience Impacts

### Advantages on Web
- Instant access without installation
- Keyboard navigation support
- Larger screen real estate
- Easy sharing via URL

### Limitations on Web
- No offline support (requires internet)
- Limited native integrations
- No push notifications
- Reduced gesture capabilities
- No haptic feedback

## Summary

The web version of StackMap maintains feature parity with native apps while adapting to web platform constraints. Key differences include:

1. **Visual**: Smaller dimensions, different positioning strategies
2. **Interaction**: Simplified gestures, no haptic feedback
3. **Storage**: localStorage instead of secure native storage
4. **Performance**: JavaScript animations instead of native driver
5. **Features**: Limited file system access, custom implementations for native features

These adaptations ensure a consistent user experience across all platforms while respecting each platform's capabilities and limitations.