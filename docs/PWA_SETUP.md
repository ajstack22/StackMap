# StackMap PWA Configuration

StackMap is now configured as a Progressive Web App (PWA) with the following features:

## Features Implemented

1. **Service Worker with Network-First Strategy**
   - Tries network first for fresh data
   - Falls back to cache when offline
   - Automatically caches successful responses
   - Separate caches for data, assets, and images

2. **App Manifest**
   - Installable on home screen
   - Standalone display mode (no browser UI)
   - Theme color: #667eea (StackMap purple)
   - App icons from existing iOS assets

3. **Offline Support**
   - All assets cached after first visit
   - App works fully offline
   - Data syncs when connection restored

4. **Auto-Update**
   - Checks for updates every hour
   - New version notification in console
   - Silent updates without user disruption

## Building for Production

To build the PWA version:

```bash
NODE_ENV=production npm run build:web
```

This will generate:
- `service-worker.js` - The main service worker
- `workbox-*.js` - Workbox runtime
- Cached manifest for all assets

## Testing PWA Features

1. **Install Prompt**: Visit the site in Chrome/Edge, look for install icon in address bar
2. **Offline Mode**: Disable network in DevTools, app should still work
3. **Home Screen**: Install the app and launch from home screen
4. **Updates**: Make changes, rebuild, and reload to see update flow

## Cache Strategy

- **Network First**: All API calls and data fetches
  - 5-second timeout before falling back to cache
  - 1-week cache expiration
  
- **Cache First**: Static assets (JS, CSS, fonts)
  - 30-day cache expiration
  - Instant loading for repeat visits

- **Cache First**: Images
  - 30-day cache expiration
  - Reduces bandwidth usage

## Files Added/Modified

- `/web/public/manifest.json` - PWA manifest
- `/web/public/icons/` - App icons (192px, 512px, 152px)
- `/webpack.config.js` - Added Workbox plugin
- `/index.web.js` - Added service worker registration
- `/web/public/index.html` - Added PWA meta tags

## Browser Support

- Chrome/Edge: Full PWA support
- Safari: Partial support (no install prompt)
- Firefox: Full PWA support on Android

The app is now ready to be deployed as a PWA!