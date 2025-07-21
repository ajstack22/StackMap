# Cross-Platform Development Guidelines

## Overview
StackMap is built with React Native and supports iOS, Android, and Web platforms. When making changes to shared components, it's crucial to test on all platforms to ensure consistent behavior.

## Important: Test All Platforms After Updates

**When updating any shared component (components that are used across platforms), you MUST:**

1. **Build and test on all platforms:**
   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web` (development) or `npm run build:web` (production)

2. **Clear cached data when testing:**
   - Web: Clear browser cache and localStorage
   - Mobile: Uninstall and reinstall the app, or clear app data

## Platform-Specific Considerations

### Web
- Web build outputs to `web/build/`
- Development server runs on port 3001 by default
- Use `Platform.OS === 'web'` for web-specific code
- Consider:
  - Fixed positioning may behave differently
  - Touch events vs mouse events
  - Keyboard handling differences
  - Screen size responsiveness

### Android
- Test on both phones and tablets
- Pay attention to:
  - Keyboard types (e.g., `visible-password` vs `default`)
  - FlatList performance (use `removeClippedSubviews`, `windowSize`)
  - Text input alignment issues
  - Overflow and scrolling behavior

### iOS
- Test on various iPhone and iPad sizes
- Consider:
  - Safe area insets
  - Keyboard avoidance behavior
  - Font weight handling

## Common Patterns

### Platform-Specific Styling
```javascript
const styles = StyleSheet.create({
  container: {
    padding: Platform.select({
      ios: 20,
      android: 16,
      web: 24,
    }),
    // Or using ternary for simple cases
    fontSize: Platform.OS === 'web' ? 16 : 14,
  }
});
```

### Platform-Specific Components
```javascript
// For complex platform differences
if (Platform.OS === 'web') {
  return <WebSpecificComponent />;
}
return <MobileComponent />;
```

## Testing Checklist

Before committing changes to shared components:

- [ ] Test on iOS simulator/device
- [ ] Test on Android emulator/device
- [ ] Test on Web browser (multiple browsers if possible)
- [ ] Test in both portrait and landscape orientations
- [ ] Test with different screen sizes (phone, tablet, desktop)
- [ ] Verify keyboard behavior on all platforms
- [ ] Check accessibility features work correctly
- [ ] Test with cleared cache/fresh install

## Build Commands

```bash
# Development
npm run ios          # iOS development
npm run android      # Android development  
npm run web          # Web development (port 3001)

# Production builds
npm run build:ios    # iOS release build
npm run build:android # Android release build
npm run build:web    # Web production build (outputs to web/build/)

# Testing
npm test             # Run unit tests
npm run lint         # Check code quality
```

## Debugging Platform-Specific Issues

1. **Check Platform.OS usage**: Ensure you're handling all platforms
2. **Review stylesheet differences**: Some styles work differently across platforms
3. **Test gesture handlers**: Touch behavior varies between platforms
4. **Verify asset loading**: Image and font loading can differ
5. **Check API availability**: Some APIs are platform-specific

## File Organization

- Shared components: `/src/components/`
- Platform-specific code: Use `.ios.js`, `.android.js`, `.web.js` extensions
- Web-specific polyfills: `/src/utils/*.web.js`

Remember: A change that works perfectly on one platform may break on another. Always test thoroughly!