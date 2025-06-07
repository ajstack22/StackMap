# StackMap Cache Busting Guide

## Quick Solutions for Development

### Browser Console Commands
Open browser DevTools (F12) and run these in the console:

```javascript
// Clear everything and reload
StackMapDev.clearAll().then(() => location.reload())

// Quick shortcuts
StackMapDev.cc()  // Clear all caches
StackMapDev.hr()  // Hard reload
StackMapDev.cb()  // Cache bust current page
```

### Keyboard Shortcuts (Development Only)
- **Ctrl+Shift+R** - Hard reload (bypasses cache)
- **Ctrl+Shift+C** - Clear all caches
- **Ctrl+Shift+D** - Toggle debug mode

### URL Parameters
Add these to your URL for instant cache control:

- `?nocache=1` - Disable all caching
- `?debug=1` - Show debug information  
- `?clearcache=1` - Clear localStorage on page load
- `?dev=1` - Force development mode
- `?devtools=1` - Auto-show cache status

**Example:** `https://yoursite.com/qual/?nocache=1&debug=1`

## Development Environment Setup

### Automatic Cache Busting
The app automatically detects development environments:
- `localhost` or `127.0.0.1`
- URLs containing `qual`
- URLs with `?dev=1` parameter

In development mode:
- CSS and JS files get automatic version parameters
- Service Worker bypasses cache for CSS/JS
- Development tools are loaded automatically

### Manual Cache Management

#### Clear Everything
```javascript
// Complete reset - clears all caches, storage, unregisters SW
await StackMapDev.clearAll()
```

#### Check Cache Status
```javascript
// See what's cached and storage usage
StackMapDev.showCacheStatus()
```

#### Force Cache Bypass
```javascript
// Add nocache parameters to current URL
StackMapDev.cacheBust()
```

## Server-Side Configuration

### Apache .htaccess
The included `.htaccess` file provides:
- No cache for HTML files in development
- Short cache (1 hour) for CSS/JS in development  
- No cache for service workers and manifests
- Automatic no-cache when `?nocache=1` is present
- Special handling for `qual` environment

### cPanel Deployment
Development files are automatically excluded from production:
- `cache-bust.js` - Removed from production
- `dev-tools.js` - Removed from production
- All test files - Removed from production

## Common Cache Issues & Solutions

### Problem: Changes not showing
**Solution:** Add `?nocache=1` to URL or use `Ctrl+Shift+C`

### Problem: Service Worker stuck
**Solution:** 
```javascript
StackMapDev.clearAll()  // Unregisters SW and clears caches
```

### Problem: Old localStorage data
**Solution:** Add `?clearcache=1` to URL or clear manually:
```javascript
localStorage.clear()
sessionStorage.clear()
```

### Problem: CSS/JS not updating in qual
**Solution:** Qual environment automatically gets no-cache headers

## Production vs Development

### Development Mode Features
- Automatic cache busting with timestamps
- Development tools loaded
- Console commands available
- Keyboard shortcuts active
- Service Worker bypasses cache for assets

### Production Mode Features  
- Normal caching for performance
- Development tools excluded
- No cache busting overhead
- Optimized for end users

## Best Practices

1. **Always test with `?nocache=1`** when developing
2. **Use keyboard shortcuts** for quick cache clearing
3. **Check console** for cache busting confirmation
4. **Use qual environment** for realistic testing
5. **Clear everything** before important testing sessions

## Troubleshooting

If cache issues persist:

1. **Hard refresh:** `Ctrl+Shift+R` (Chrome/Firefox)
2. **Developer tools:** F12 → Network tab → "Disable cache" checkbox
3. **Incognito/Private mode:** Starts with clean cache
4. **Complete reset:** `StackMapDev.clearAll()` in console
5. **Server cache:** Check if server has additional caching layers

## Environment Detection

The system automatically detects development environments by checking:
- Hostname contains `localhost`, `127.0.0.1`, or `qual`
- URL parameters include `dev=1`
- Console logging will confirm development mode activation