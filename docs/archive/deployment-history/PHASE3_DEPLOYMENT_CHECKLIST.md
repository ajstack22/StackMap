# Phase 3 Deployment Checklist

## Files to Upload via cPanel File Manager

### 1. Core Files (Upload in this order)
- [ ] `sw.js` - Service worker v1.6.0
- [ ] `state.js` - Delta sync methods
- [ ] `app/StackMapApp.js` - processGranularSync integration
- [ ] `drive-sync.js` - Delta upload implementation
- [ ] `index.html` - Updated version references

### 2. Supporting Files
- [ ] `components.js` - Updated for compatibility
- [ ] `renderer.js` - Updated for compatibility
- [ ] `js/HybridPanelManager.js` - Updated for compatibility

### 3. Test Files (Optional - for debugging)
- [ ] `test-delta-sync.html`
- [ ] `test-compression.html`
- [ ] `test-granular-sync.html`

## Deployment Steps

1. **Backup Current Production**
   - Download current state.js, drive-sync.js as backup

2. **Upload Files**
   - Use cPanel File Manager
   - Upload sw.js first (triggers cache update)
   - Upload remaining files

3. **Clear CloudFlare Cache** (if applicable)
   - Purge cache for updated files
   - Or use "Purge Everything" for complete refresh

4. **Test Deployment**
   - Open app in incognito/private window
   - Check console for service worker update
   - Make a small change (mark activity complete)
   - Look for: `[Delta Sync] Successfully uploaded delta`

5. **Monitor**
   - Check browser console for errors
   - Verify sync queue indicator works
   - Test offline/online transitions

## Verification

### Success Indicators:
- Service worker shows v1.6.0
- Console shows delta sync messages
- Sync completes faster for small changes
- No errors in console

### Rollback if Needed:
1. Upload backup files
2. Increment sw.js version
3. Clear caches

## Post-Deployment

1. Monitor for 24 hours
2. Check Google Drive for delta files
3. Gather performance metrics
4. Plan Phase 4 based on results