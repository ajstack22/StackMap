# Web Platform Guide - StackMap

This guide consolidates all web-specific development information for StackMap, including Progressive Web App (PWA) features.

## Quick Reference

### Development Commands
```bash
# Development
npm run web          # Run with hot reload (localhost:3000)

# Production builds
NODE_ENV=production npm run build:web  # Build optimized bundle

# FOUR-TIER DEPLOYMENT (Recommended)
# Use the master deployment script with tier and platform flags
# NOTE: STAGE tier is mobile-only (no web deployment)
./scripts/deploy.sh qual --web    # QUAL: Development testing (qual-api DB, multiple/day)
./scripts/deploy.sh beta --web    # BETA: Closed beta testing (beta-api/prod-api DB, 1-2/week)
./scripts/deploy.sh prod --web    # PROD: Public release (prod-api DB, weekly/bi-weekly)
```

### Project Requirements
- **React Native Web**: Latest
- **Webpack**: 5+
- **Workbox**: For PWA features
- **Node.js**: 16+

## Project Structure

```
web/
├── build/              # Build output directory
├── public/
│   ├── index.html      # Main HTML template
│   ├── manifest.json   # PWA manifest
│   └── icons/          # App icons (152px, 192px, 512px)
├── webpack.config.js   # Build configuration
└── service-worker.js   # PWA service worker (generated)
```

## Web-Specific Patterns & Solutions

### 1. Alert Handling (CRITICAL)
**Problem:** React Native's Alert.alert doesn't work on web.
**Solution:** Use ConfirmModal component consistently:

```javascript
// ❌ NEVER use window.confirm() or Alert.alert on web
// ✅ ALWAYS use ConfirmModal
<ConfirmModal
  visible={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleAction}
  theme={theme}
  title="Title"
  message="Message"
/>
```

### 2. Material Icons Font Issue (CRITICAL)
**Problem:** Material Icons not rendering, showing as empty spaces or text.
**Root Cause:** Typography component forces Comic Relief font, overriding Material Icons.
**Solution:** VectorIcons.web.js must use plain HTML elements:

```javascript
// ❌ BAD: Text component forces Comic Relief font
import { Text } from '../components/Typography';
return <Text style={iconStyle}>{iconContent}</Text>

// ✅ GOOD: Plain span preserves Material Icons font
return <span style={iconStyle}>{iconContent}</span>
```

**Key Points:**
- Always use `span` with `display: flex` for icon containers
- Never import Typography components in icon implementations
- Material Icons CDN link must be in index.html

### 3. Responsive Grid Layout
**Problem:** Web needs CSS flexbox approach for grids.
**Solution:** Web-specific styling:

```javascript
Platform.OS === 'web' ? {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: CARD_LAYOUT.gap,
  maxWidth: CARD_LAYOUT.containerMaxWidth
} : {
  // Native approach
}
```

### 4. Gesture Handling Differences
**Problem:** Native gesture handlers don't work on web.
**Solution:** Platform-specific implementations:

```javascript
// No DraggableFlatList on web - use regular FlatList with reorder buttons
// ScrollView works differently - test thoroughly
// No haptic feedback - visual feedback only
// Mouse events instead of touch events
```

## PWA Features

### Core Components

#### 1. App Manifest (`manifest.json`)
```json
{
  "name": "StackMap",
  "short_name": "StackMap",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#4A90E2",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### 2. Service Worker with Workbox
**Key Strategies:**
```javascript
// Cache First - for static assets
workbox.routing.registerRoute(
  /\.(?:js|css|png|jpg|jpeg|svg)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'static-cache',
  })
);

// Network First - for API calls
workbox.routing.registerRoute(
  /api\/sync/,
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
  })
);
```

#### 3. Install Prompt
```javascript
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show install button
});

// Trigger install
deferredPrompt.prompt();
```

### PWA Features Implementation

#### Offline Support
- All critical resources cached
- LocalStorage for data persistence
- Sync when connection restored

#### App-like Experience
- No browser chrome in standalone mode
- Splash screen on launch
- Native-like navigation
- Pull-to-refresh disabled

#### Cache Strategy
- **Network First**: All API calls and data fetches
  - 5-second timeout before falling back to cache
  - 1-week cache expiration
  
- **Cache First**: Static assets (JS, CSS, fonts)
  - 30-day cache expiration
  - Instant loading for repeat visits

- **Cache First**: Images
  - 30-day cache expiration
  - Reduces bandwidth usage

## Build Configuration

### Webpack Configuration
Key optimizations in `webpack.config.js`:
- Code splitting
- Tree shaking
- Asset optimization
- Workbox plugin integration

### Polyfills and Aliases
```javascript
alias: {
  'react-native-fs': path.resolve(__dirname, 'src/utils/platformHelpers.web.js'),
  'react-native-gesture-handler': path.resolve(__dirname, 'src/utils/GestureHandler.web.js'),
  '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/utils/AsyncStorage.web.js'),
  'react-native-keychain': path.resolve(__dirname, 'src/utils/Keychain.web.js'),
}
```

## Platform-Specific Differences

### UI/UX Adaptations
- **Header padding**: Web uses 80px horizontal padding vs 20px on native
- **FAB size**: 60px on web vs 72-96px on native
- **Icon sizes**: Generally smaller on web (26px vs 31-38px)
- **Font sizes**: Reduced on web (e.g., title: 25px vs 28px on mobile)
- **Container width**: Web has max-width constraints for better desktop viewing
- **Fixed positioning**: Navigation bar uses `position: fixed` on web

### Animation Differences
- **Native Driver**: Disabled on web (`useNativeDriver: false`)
- **Performance**: Web animations run on JavaScript thread
- **Affected animations**: Card press, modal transitions, FAB, celebrations

### Storage Differences
- **Secure storage**: Uses localStorage instead of Keychain/Keystore
- **AsyncStorage**: Polyfilled with localStorage
- **Data persistence**: Same key structure but different underlying storage

### Feature Limitations
- **File operations**: Browser download/upload APIs only
- **Share API**: Limited to browsers that support Web Share API
- **Haptic feedback**: No vibration support
- **Background processing**: Limited compared to native

## Browser Support

### Full PWA Support
- **Chrome/Edge**: Complete PWA implementation
- **Android Chrome**: WebAPK integration
- **Desktop**: Install from address bar

### Partial Support
- **Safari**: PWA features but no install prompt
- **iOS Safari**: "Add to Home Screen" manual process
- **Firefox**: Good PWA support on Android

### Platform-Specific Considerations

#### iOS Safari
- No background sync
- Limited service worker cache (50MB)
- Install via "Add to Home Screen"
- No push notifications (yet)

#### Android Chrome
- Full PWA support
- Background sync works
- Push notifications supported
- WebAPK for better integration

#### Desktop
- Install from address bar
- Window controls overlay
- File handling (future)

## Performance Optimization

### Bundle Size
- **Target**: < 200KB initial JS
- **Techniques**: Dynamic imports, lazy loading, image optimization (WebP)

### Loading Performance
- Inline critical CSS
- Preload key resources
- Resource hints (dns-prefetch, preconnect)

### Runtime Performance
- Virtual scrolling for long lists
- Web Workers for heavy computation
- RequestIdleCallback for non-critical work

## Testing & Quality Assurance

### Lighthouse Audit
```bash
# Run in Chrome DevTools
# Lighthouse tab → Generate report
# Target scores: 90+ for PWA
```

### Key Metrics
- [ ] Performance: 90+
- [ ] Accessibility: 100
- [ ] Best Practices: 100
- [ ] SEO: 100
- [ ] PWA: Passes all checks

### Manual Testing Flow

#### 1. Install Flow
- Clear site data
- Visit site
- Wait for install prompt
- Install and verify icon

#### 2. Offline Mode
- Install app
- Go offline (DevTools → Network → Offline)
- Verify app still works
- Make changes
- Go online and verify sync

#### 3. Update Flow
- Deploy new version
- Visit app
- Verify update prompt
- Reload for new version

### Browser Testing Checklist
- [ ] Chrome (primary)
- [ ] Safari (iOS PWA support)
- [ ] Firefox
- [ ] Edge
- [ ] Test offline functionality
- [ ] Test install flow
- [ ] Test responsive breakpoints

## Common Issues & Solutions

### Service Worker Not Updating
```javascript
// Force update
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update();
});
```

### Cache Too Large
- Implement cache expiration
- Limit cache sizes
- Use IndexedDB for large data

### iOS Install Issues
- Ensure apple-touch-icon present
- Check viewport meta tag
- Verify standalone mode works

### Bundle Not Found on Web
**Problem:** Files not served correctly
**Solution:** Files must be copied to root directory, not served from web/build/

## Development vs Production

### Development
```bash
npm run web  # Runs on localhost:3000
# Service worker disabled in dev
# Hot reload enabled
```

### Production Build
```bash
NODE_ENV=production npm run build:web
# Files output to web/build/
# Copy to root for deployment (see deployment.md)
```

## Key Files Reference

- `webpack.config.js` - Build configuration and optimizations
- `src/utils/VectorIcons.web.js` - Material Icons implementation
- `src/utils/*.web.js` - Web polyfills and platform adaptations
- `web/public/manifest.json` - PWA configuration
- `service-worker.js` - Generated by Workbox

## Update Instructions

When making web-specific changes:
1. Test in multiple browsers
2. Check responsive breakpoints  
3. Verify offline functionality still works
4. Test PWA installation flow
5. Run Lighthouse audit
6. Test Material Icons rendering
7. Verify ConfirmModal usage (no Alert.alert)

## Deployment Notes

- Web updates instantly on deployment
- No app store review process
- Cache invalidation considerations
- Files copied to root for hosting
- Version increment handled by deployment scripts