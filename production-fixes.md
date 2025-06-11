# Google Drive Sync Production Fixes

## Problem Summary
Google Drive sync works in tests but fails to initialize in production due to:
1. Google API scripts loading asynchronously after app initialization
2. Possible domain authorization issues
3. Content Security Policy blocking
4. Network/firewall blocking Google scripts

## Quick Fixes

### 1. Remove async/defer from Google scripts (Recommended)
In your production `index.html`, change:
```html
<script src="https://apis.google.com/js/api.js" async defer></script>
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

To:
```html
<script src="https://apis.google.com/js/api.js"></script>
<script src="https://accounts.google.com/gsi/client"></script>
```

This ensures scripts load before app initialization.

### 2. Use the Debug Tool
Upload `drive-sync-debug.html` to your production server and access it:
```
https://yourdomain.com/stackmap/drive-sync-debug.html
```

This will diagnose:
- Script loading issues
- Credential configuration
- Domain authorization
- Network blocking

### 3. Manual Initialization
If automatic initialization fails, open browser console and run:
```javascript
initDriveSync()
```

This will attempt to initialize sync manually with detailed error messages.

### 4. Check Domain Authorization
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. APIs & Services → Credentials
4. Edit your OAuth 2.0 Client ID
5. Add to **Authorized JavaScript origins**:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com` (if using www)
6. Add to **Authorized redirect URIs**:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

### 5. Alternative: Load Scripts Earlier
Move the Google script tags to just after `<head>` tag:
```html
<head>
    <meta charset="UTF-8">
    <script src="https://apis.google.com/js/api.js"></script>
    <script src="https://accounts.google.com/gsi/client"></script>
    <!-- rest of head -->
</head>
```

### 6. Check for Blockers
Common blockers in production:
- **Ad blockers**: May block Google scripts
- **Corporate firewalls**: May block googleapis.com
- **Strict CSP**: Check server headers for Content-Security-Policy
- **HTTPS required**: Ensure site uses HTTPS

### 7. Enable Sync Without URL Parameter
If you want sync always enabled in production, edit `env-loader.js`:
```javascript
// Force enable sync in production
window.STACKMAP_FORCE_SYNC = true;
```

Then update `StackMapApp.js` line 15:
```javascript
const syncEnabled = window.STACKMAP_FORCE_SYNC || 
                   urlParams.get('enableSync') === 'true' || 
                   (window.CONFIG?.GOOGLE_CLIENT_ID && window.CONFIG?.GOOGLE_API_KEY);
```

## Testing in Production

1. **Check Console**: Look for these messages:
   - `[StackMapApp] Waiting for Google APIs to load...`
   - `[StackMapApp] Google APIs loaded, initializing Drive sync...`
   - `[GoogleDriveSync] Initializing...`

2. **Common Error Messages**:
   - "Google APIs did not load after 10 seconds" - Scripts blocked
   - "API credentials not configured" - Missing credentials
   - "Failed to load Google services" - Network/domain issue

3. **Success Indicators**:
   - No console errors
   - "Google Drive Sync" button appears in grown-up mode
   - Can authenticate with Google

## Emergency Fallback

If nothing works, disable sync temporarily:
1. Remove `?enableSync=true` from URL
2. Clear credentials in `env-loader.js`
3. Users can still use import/export manually

## Deployed Code Improvements

The deployed code now includes:
- Extended timeout (10 seconds) for Google API loading
- Better error messages for debugging
- Retry mechanism for slow networks
- Manual initialization function
- Detailed console warnings for common issues