# Pending Changes

## Title: Fix Sync API and UI State Management Issues

### Changes Made:
1. **Fixed `.htaccess` rewrite rules** to exclude `/qual/api/` from SPA routing
   - Added `RewriteCond %{REQUEST_URI} !^/qual/api/` to prevent API calls from being redirected to index.html
   - Applied fix both on server and in source code

2. **Updated webpack config** to exclude API calls from service worker caching
   - Added check for `/api/` in urlPattern to prevent caching API responses
   - This prevents stale 404 responses from being served from cache

3. **Fixed sync state management in DataModal**
   - Changed to trust local sync enabled state instead of verifying server existence
   - Server verification now happens in background without affecting UI
   - Fixes issue where newly created syncs showed as disabled

4. **Improved verifySyncExists() logic**
   - Better handling of sync group creation flow
   - Checks for encrypted_blob presence to determine if sync exists
   - Added absolute URL handling for consistency

### Results:
- API endpoints now working correctly (confirmed via testing)
- Sync UI will properly show enabled state when sync is active locally
- Handles the initial sync creation flow where data hasn't been pushed yet

