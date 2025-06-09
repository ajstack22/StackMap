# PWA Configuration for StackMap

## Summary of PWA Enhancements

This document outlines the Progressive Web App (PWA) configuration implemented for StackMap to maximize Android and iOS compatibility with frequent cache updates.

## Changes Made

### 1. Service Worker Implementation (`sw.js`)
- **Caching Strategy**: Stale-while-revalidate for maximum performance
- **Cache Versioning**: `stackmap-v1.0.0` with automatic cleanup of old versions
- **Cache Categories**:
  - Core assets (always cached on install)
  - Static assets (cached in background after activation)
  - Runtime cache for dynamic content
  - Google Fonts cache with long-term storage
- **Update Frequency**: Checks for updates every hour
- **Offline Support**: Falls back to offline.html when network fails

### 2. Manifest Updates (`manifest.json`)
- Fixed development paths (`/dev/` → `/`)
- Added PWA enhancements:
  - `scope` property for PWA boundaries
  - `display_override` for fallback display modes
  - `launch_handler` for existing window focus
  - `file_handlers` for JSON backup files
  - `share_target` for receiving shared content
  - `edge_side_panel` configuration
  - Screenshot labels for better store presentation

### 3. HTML Meta Tags (`index.html`)
- Added comprehensive PWA meta tags:
  - `apple-mobile-web-app-title` for iOS home screen
  - `mobile-web-app-capable` for Android
  - `application-name` for Windows
  - `msapplication-*` tags for Windows tiles
  - iOS splash screen placeholders
- Service worker registration with update handling
- Automatic update checks every hour

### 4. Windows Configuration (`browserconfig.xml`)
- Windows tile configuration
- Multiple tile sizes (70x70, 150x150, 310x310)
- Brand color integration

### 5. App Updates (`StackMapApp.js`)
- `showUpdatePrompt()` method for user-friendly update notifications
- `initializeIOSPWAFeatures()` for iOS-specific enhancements:
  - Rubber band scrolling prevention
  - Safe area handling for notched devices
- Update banner with auto-dismiss after 10 seconds

### 6. Animation Support (`animations.css`)
- Added slideDown/slideUp animations for update banner
- Smooth transitions for better UX

## Platform-Specific Features

### Android
- Maskable icons for adaptive icon system
- Web app manifest fully supported
- Background sync capability
- Offline functionality
- Add to Home Screen with custom icon

### iOS
- Apple touch icons configured
- Status bar styling
- Viewport locking to portrait
- Safe area support for newer devices
- Splash screen placeholders (images need to be created)

### Windows
- Live tiles support
- Multiple tile sizes
- Brand color integration
- Edge side panel support

## Cache Update Strategy

1. **Stale-While-Revalidate**: Serves cached content immediately while fetching updates in background
2. **Hourly Update Checks**: Service worker checks for updates every hour
3. **User Notification**: Shows update banner when new version available
4. **One-Click Update**: Users can update with single button click
5. **Auto-Cleanup**: Old cache versions automatically removed

## Performance Optimizations

- Pre-caches all critical assets on install
- Separate cache for Google Fonts (long-term storage)
- Background asset caching to avoid blocking
- Skip waiting for immediate activation
- Client claim for instant control

## Testing Recommendations

1. **Install Testing**:
   - Clear browser cache and data
   - Visit site and check "Add to Home Screen" prompt
   - Verify icon appears correctly on home screen

2. **Offline Testing**:
   - Install PWA
   - Enable airplane mode
   - Verify app loads and shows offline page for uncached routes

3. **Update Testing**:
   - Change service worker version
   - Reload app and verify update prompt appears
   - Click update and verify new version loads

4. **Platform Testing**:
   - Test on Android Chrome
   - Test on iOS Safari
   - Test on Windows Edge
   - Verify platform-specific features work

## Future Enhancements

1. Create actual splash screen images for iOS
2. Implement push notifications for reminders
3. Add background sync for data persistence
4. Create app store screenshots
5. Implement share target functionality
6. Add file handler for backup imports

## Maintenance Notes

- Update `CACHE_NAME` version in sw.js when deploying updates
- Keep manifest.json icons in sync with actual files
- Test service worker updates in staging before production
- Monitor cache size to prevent storage issues
- Regular testing on multiple platforms