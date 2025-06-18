# PWA Store Readiness - Make StackMap PWA ready for app store requirements

## Overview
Prepare the StackMap Progressive Web App to meet app store requirements and best practices for both Google Play Store and Apple App Store submissions.

## Background
- App name: **StackMap** (confirmed available on both stores)
- Business model: Free app initially, subscription features planned for future
- Timeline: 2 weeks for both platforms
- Strategy: Simple PWA wrappers first, native features can be added later

## Acceptance Criteria
- [ ] PWA manifest.json is complete with all required fields
- [ ] App icons provided in all required sizes (512x512, 192x192, and platform-specific sizes)
- [ ] Splash screens configured for all device sizes
- [ ] Service worker implements offline functionality
- [ ] App passes Lighthouse PWA audit with 90+ score
- [ ] HTTPS enabled on all resources
- [ ] App works offline with meaningful content
- [ ] Install prompts are properly configured
- [ ] Deep linking support implemented
- [ ] Performance optimized (First Contentful Paint < 2s)

## Technical Requirements

### 1. Update manifest.json
```json
{
  "name": "StackMap",
  "short_name": "StackMap",
  "description": "Your personal knowledge management tool",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "categories": ["productivity", "education"],
  "prefer_related_applications": false
}
```

### 2. Icon Requirements
- 512x512px - Main app icon
- 192x192px - Home screen icon
- 180x180px - iOS specific
- Various sizes for splash screens

### 3. Service Worker Enhancements
- Implement cache-first strategy for static assets
- Network-first for API calls with offline fallback
- Background sync for offline data persistence
- Push notification support (prepare for future)

### 4. Performance Optimizations
- Lazy load non-critical resources
- Implement code splitting
- Optimize images with WebP format
- Minify CSS/JS bundles
- Enable gzip compression

### 5. iOS Specific Requirements
- Add apple-touch-icon meta tags
- Configure apple-mobile-web-app-capable
- Set apple-mobile-web-app-status-bar-style
- Handle iOS safe areas

### 6. Android Specific Requirements
- Configure maskable icons
- Set up shortcuts in manifest
- Implement share target API
- Configure display cutout handling

## Testing Checklist
- [ ] Test installation flow on Android Chrome
- [ ] Test installation flow on iOS Safari
- [ ] Verify offline functionality
- [ ] Test on various screen sizes
- [ ] Validate deep links work correctly
- [ ] Check performance metrics
- [ ] Test update flow for new versions

## Resources
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [App Store PWA Requirements](https://developer.apple.com/documentation/webkit/webkit_app_extensions)
- [Google Play PWA Requirements](https://developer.chrome.com/docs/android/trusted-web-activity/)

## Dependencies
This issue blocks:
- Android TWA Wrapper implementation
- iOS PWA Wrapper implementation
- Store metadata preparation

## Labels
- enhancement
- mobile
- pwa