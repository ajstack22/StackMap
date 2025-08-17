# StackMap Cache Prevention Strategy

## Overview
This document outlines the comprehensive cache-busting strategy to ensure users always get the latest version of StackMap without manual cache clearing.

## 1. Service Worker Version Management

### A. Version Bumping
**File:** `/sw.js`
```javascript
// BEFORE DEPLOYMENT - Update these:
const SW_VERSION = '2.0.0'; // Bump major version for migration update
const CACHE_NAME = 'stackmap-v2.0.0-2025-01-27';
```

### B. Force Update on Activation
The service worker already implements:
- `skipWaiting()` to activate immediately
- Old cache deletion on activation
- Runtime cache clearing to force fresh resources

## 2. Asset Versioning

### A. CSS and JavaScript Files
Add version query parameters to all asset references:

**In index.html:**
```html
<!-- CSS with version -->
<link rel="stylesheet" href="src/stackmap.css?v=2.0.0">

<!-- JavaScript with version -->
<script src="src/stackmap.js?v=2.0.0"></script>
<script src="src/CelebrationManager.js?v=2.0.0"></script>
```

### B. Automated Version Updates
Create a deployment script that automatically updates versions:
```bash
#!/bin/bash
# update-versions.sh
VERSION="2.0.0"
DATE=$(date +%Y%m%d)

# Update service worker
sed -i "s/const SW_VERSION = .*/const SW_VERSION = '$VERSION';/" sw.js
sed -i "s/const CACHE_NAME = .*/const CACHE_NAME = 'stackmap-v$VERSION-$DATE';/" sw.js

# Update HTML asset references
find . -name "*.html" -exec sed -i "s/\.css?v=[^\"']*/\.css?v=$VERSION/g" {} \;
find . -name "*.html" -exec sed -i "s/\.js?v=[^\"']*/\.js?v=$VERSION/g" {} \;
```

## 3. HTTP Headers Configuration

### A. .htaccess (Apache)
```apache
# Force no-cache for HTML files
<FilesMatch "\.(html)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</FilesMatch>

# Cache static assets with revalidation
<FilesMatch "\.(js|css|json)$">
    Header set Cache-Control "public, must-revalidate, max-age=3600"
</FilesMatch>

# Long cache for versioned assets
<FilesMatch "\.(js|css)\?v=">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
```

### B. nginx.conf (Nginx)
```nginx
# HTML files - no cache
location ~* \.(html)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    expires 0;
}

# Service worker - no cache
location = /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    expires 0;
}

# Static assets - short cache
location ~* \.(js|css|json)$ {
    add_header Cache-Control "public, must-revalidate, max-age=3600";
}
```

## 4. Service Worker Registration

### A. Add Version Check to HTML
```javascript
// Add to index.html before closing </body>
<script>
// Service Worker Registration with version check
if ('serviceWorker' in navigator) {
    const EXPECTED_VERSION = '2.0.0';
    
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            // Check for updates on page load
            registration.update();
            
            // Check for updates every 5 minutes
            setInterval(() => {
                registration.update();
            }, 5 * 60 * 1000);
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        // Show update notification
                        if (confirm('New version available! Reload to update?')) {
                            window.location.reload();
                        }
                    }
                });
            });
        });
}
</script>
```

## 5. Meta Tags for Cache Control

### A. Add to index.html <head>
```html
<!-- Cache Control Meta Tags -->
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">

<!-- Force IE to use latest rendering engine -->
<meta http-equiv="X-UA-Compatible" content="IE=edge">
```

## 6. Manifest.json Updates

### A. Version the manifest
```json
{
  "name": "StackMap",
  "short_name": "StackMap",
  "version": "2.0.0",
  "version_name": "2.0.0 - Migration Update",
  ...
}
```

## 7. Clear CDN Cache (if applicable)

### A. Cloudflare
```bash
# Clear cache via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
     -H "Authorization: Bearer {api_token}" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
```

## 8. Emergency Cache Clear

### A. Add Cache Buster Function
```javascript
// Add to stackmap.js
function emergencyCacheClear() {
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
            });
        });
    }
    
    // Clear all localStorage except user data
    const preserveKeys = ['stackmap_data_v4', 'stackmap_backup', 'stackmap_state'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
        if (!preserveKeys.includes(key)) {
            localStorage.removeItem(key);
        }
    });
    
    // Force reload
    window.location.reload(true);
}

// Make available in console for support
window.emergencyCacheClear = emergencyCacheClear;
```

## 9. Deployment Checklist

### Pre-Deployment:
- [ ] Bump SW_VERSION in sw.js
- [ ] Update CACHE_NAME with new version and date
- [ ] Add version query parameters to all assets in HTML
- [ ] Update manifest.json version
- [ ] Test migration on staging with old cached data

### During Deployment:
- [ ] Deploy files to server
- [ ] Clear CDN cache (if applicable)
- [ ] Verify .htaccess/nginx cache headers are active
- [ ] Test that service worker updates properly

### Post-Deployment:
- [ ] Monitor for cache-related issues
- [ ] Be ready to guide users through manual cache clear if needed
- [ ] Document any issues for next deployment

## 10. User Communication

### A. Update Notice
If users experience cache issues, provide clear instructions:

1. **Automatic Update** (wait a few minutes and refresh)
2. **Force Update** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Manual Clear** (Settings → Clear browsing data → Cached images and files)
4. **Emergency Clear** (Open console and run `emergencyCacheClear()`)

### B. In-App Update Prompt
The service worker registration code above will automatically prompt users when updates are available.

## Summary

This multi-layered approach ensures:
1. Service worker version forces cache refresh
2. Asset versioning prevents stale file usage
3. HTTP headers control caching behavior
4. Automatic update detection and prompting
5. Emergency procedures for stubborn caches

By implementing all these strategies, users will seamlessly receive the migration update without manual intervention in 99% of cases.