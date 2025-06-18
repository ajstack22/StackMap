# PWA Testing Guide for StackMap

## Overview
This guide provides comprehensive testing steps to verify that StackMap meets all PWA requirements for app store compliance.

## Prerequisites
- Modern web browser (Chrome, Edge, Firefox, Safari)
- Local development server running on port 5500
- Chrome DevTools for Lighthouse testing

## Testing Steps

### 1. Service Worker Installation
1. Open the app in Chrome: `http://localhost:5500`
2. Open DevTools (F12) → Application tab
3. Navigate to Service Workers section
4. Verify:
   - Service worker is registered and active
   - Status shows "activated and is running"
   - Scope covers the entire app "/"

### 2. Offline Functionality
1. While the app is open, go to DevTools → Network tab
2. Select "Offline" checkbox to simulate offline mode
3. Navigate through the app and verify:
   - App loads without network connection
   - Core functionality remains available
   - Offline page displays for uncached resources
   - User data persists locally

### 3. App Installation
1. Visit the app in Chrome/Edge
2. Look for install prompt in address bar (⊕ icon)
3. Click install and verify:
   - App installs to desktop/homescreen
   - App opens in standalone mode (no browser UI)
   - App icon appears correctly
   - App name displays as "StackMap"

### 4. Icon Testing
1. Check installed app icon on:
   - Desktop (Windows/Mac/Linux)
   - Start menu/Applications folder
   - Taskbar when pinned
2. Verify all sizes render correctly:
   - 192x192 and 512x512 for Android
   - Various sizes for iOS (72, 96, 128, 144, 152, 384)

### 5. Manifest Validation
1. In DevTools → Application → Manifest
2. Verify all fields are properly loaded:
   - Name: "StackMap - Visual Routine Helper"
   - Short name: "StackMap"
   - Theme color: #667eea
   - Background color: #667eea
   - Display: standalone
   - Start URL: /
   - All icon sizes listed

### 6. Lighthouse PWA Audit
1. Open Chrome DevTools → Lighthouse tab
2. Select categories:
   - ✓ Performance
   - ✓ Progressive Web App
   - ✓ Best Practices
   - ✓ Accessibility
3. Select "Mobile" device mode
4. Click "Analyze page load"
5. Target scores:
   - PWA: 90+ (required)
   - Performance: 80+
   - Accessibility: 90+
   - Best Practices: 90+

### 7. Cross-Browser Testing
Test PWA features in:
- Chrome/Chromium browsers
- Edge
- Firefox
- Safari (iOS/macOS)

Verify for each:
- Service worker registration
- App installation where supported
- Offline functionality
- Icon display

### 8. Mobile Testing
1. Test on real devices when possible
2. Use browser developer tools device emulation
3. Verify:
   - Touch interactions work correctly
   - Viewport scales properly
   - Status bar integration (iOS)
   - App feels native

### 9. Update Testing
1. Make a change to the service worker version
2. Reload the app
3. Verify:
   - New service worker installs
   - Update prompt appears (if implemented)
   - Old caches are cleaned up
   - App updates seamlessly

### 10. Performance Testing
1. Test on slower network connections (3G)
2. Verify:
   - Initial load time < 3 seconds
   - Subsequent loads use cache
   - Images load progressively
   - No janky scrolling

## Common Issues and Solutions

### Service Worker Not Registering
- Ensure HTTPS or localhost
- Check console for registration errors
- Verify sw.js is in root directory

### Icons Not Displaying
- Check icon file paths in manifest
- Ensure all sizes are present
- Verify MIME types are correct

### Offline Not Working
- Clear cache and reinstall service worker
- Check fetch event handlers
- Verify offline.html exists

### Low Lighthouse Score
- Implement HTTPS
- Add meta description
- Ensure all resources are cached
- Optimize images
- Add proper viewport meta tag

## App Store Requirements Checklist

### Google Play Store
- [x] Web App Manifest with required fields
- [x] Service Worker for offline functionality
- [x] HTTPS (localhost acceptable for testing)
- [x] Responsive design
- [x] 512x512 icon
- [x] Start URL
- [x] Display: standalone/fullscreen

### Microsoft Store
- [x] All Google Play requirements
- [x] Edge/Chromium compatibility
- [x] Windows integration features
- [x] Proper theme color
- [x] File handlers (optional)

### Apple App Store (via PWA wrappers)
- [x] All icon sizes for iOS
- [x] Apple-specific meta tags
- [x] Safari compatibility
- [x] Touch icon support
- [x] Status bar styling

## Automated Testing Script

Run the automated test suite:
```bash
npm test
```

This will check:
- Service worker registration
- Manifest validity
- Offline functionality
- Basic performance metrics

## Conclusion
Following these testing steps ensures StackMap meets all PWA requirements for app store distribution. Regular testing during development helps maintain compliance and quality.