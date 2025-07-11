# cPanel Deployment Instructions for StackMap

## Recent Updates Summary

The following updates have been pushed to GitHub and are ready for deployment:

1. **Secure API Key Management** (commit a067b43)
   - Removed hardcoded Google Drive API keys
   - Implemented environment-based configuration
   - Added documentation for API setup
   - Enhanced UI components

2. **Comprehensive PWA Configuration** (commit 301f61b)
   - Added service worker for offline functionality
   - Enhanced mobile compatibility for iOS and Android
   - Implemented automatic update notifications
   - Added Windows live tiles support

## Deployment Steps

### 1. Access cPanel Git Version Control

1. Log into your cPanel account
2. Navigate to "Git Version Control"
3. Find your StackMap repository

### 2. Pull Latest Changes

1. Click "Manage" on the StackMap repository
2. Click "Pull or Deploy"
3. Select "Update from Remote"
4. Click "Update from Remote" button

### 3. Verify Service Worker Path

**IMPORTANT**: The service worker registration uses root paths. Ensure your deployment:

1. If deploying to subdirectory (e.g., `/stackmap/`):
   - Update `sw.js` line 13-19 to prefix all paths with your subdirectory
   - Update `index.html` line 350 to register from correct path
   - Update `manifest.json` start_url and scope

2. If deploying to root domain: No changes needed

### 4. Set Up Environment Variables (if using Google Drive sync)

1. Create `.env` file in your deployment directory:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_API_KEY=your-api-key
   ```

2. Or update `env-loader.js` with your production credentials

### 5. Clear Browser Cache

After deployment, ensure users clear their browser cache or the service worker will handle updates automatically.

### 6. Verify Deployment

1. Visit your site URL
2. Check browser console for:
   - "[PWA] ServiceWorker registration successful"
   - No 404 errors for manifest.json or sw.js
3. Test "Add to Home Screen" functionality
4. Test offline mode by disconnecting internet

## Important Files Changed

- `/sw.js` - New service worker file
- `/manifest.json` - Updated PWA manifest
- `/browserconfig.xml` - New Windows configuration
- `/index.html` - Added PWA meta tags and SW registration
- `/app/StackMapApp.js` - Added update prompt functionality
- `/styles/animations.css` - Added update banner animations
- Various security and UI improvements

## Post-Deployment Checklist

- [ ] Service worker registers successfully
- [ ] No console errors
- [ ] "Add to Home Screen" works on mobile
- [ ] Offline page displays when disconnected
- [ ] Update notifications appear (after making changes)
- [ ] Google Drive sync works (if configured)
- [ ] All icons load correctly
- [ ] Mobile viewport is correct

## Troubleshooting

1. **Service Worker Not Registering**
   - Check browser console for errors
   - Verify HTTPS is enabled (required for service workers)
   - Check file paths match your deployment structure

2. **Icons Not Loading**
   - Verify all icon files are uploaded
   - Check paths in manifest.json

3. **Offline Not Working**
   - Clear browser cache and reinstall PWA
   - Check service worker is active in DevTools

4. **Google Drive Not Working**
   - Verify API credentials are set
   - Check authorized domains in Google Console

## Notes

- Service workers require HTTPS (except localhost)
- First visit will cache all assets for offline use
- Updates check hourly and notify users
- The app now works fully offline after first visit