# StackMap Deployment Notes - June 13, 2025

## Version: 1.3.3

### Changes Made:

#### 1. Fixed Save Issues
- Fixed description field not saving when creating/editing cards
- Fixed emoji/icon always reverting to star
- Issue was in duplicate saveActivity() methods missing description field collection

#### 2. Visibility Migration
- Added automatic migration for hidden cards
- All cards with visible:false are now set to visible:true on import
- Removed visibility filtering from activity counts
- Deprecated hidden card functionality

#### 3. UI Improvements
- Removed quick select icon grids from activity and user forms
- Implemented always-visible emoji picker with preview
- Fixed emoji picker layout for narrow 320px side panels
- Reduced grid columns from 6 to 4 for better fit

#### 4. Navigation Fix
- Edit Card now returns to correct location after save
- If opened from main screen: closes panel
- If opened from settings: returns to settings
- Added returnTo parameter tracking

#### 5. Removed Card Types
- Removed Card Type UI section from forms
- All cards now default to 'recurring' (pinned)
- Removed backend cardType functionality
- Simplified activity creation process

### Modified Files:
- `app/StackMapApp.js` - Removed visibility filtering
- `js/HybridPanelManager.js` - Multiple fixes and improvements
- `js/MenuConfigurations.js` - Removed quick icons and card type UI
- `state.js` - Added visibility migration logic
- `styles/hybrid-panels.css` - Layout improvements for pickers
- `sw.js` - Updated to v1.3.3

### Testing Checklist:
- [ ] Create new card - verify description saves
- [ ] Edit existing card - verify description saves
- [ ] Verify emoji selection persists
- [ ] Check emoji picker displays properly
- [ ] Test navigation from main screen edit
- [ ] Test navigation from settings edit (if available)
- [ ] Verify all cards show as visible
- [ ] Confirm no card type options appear

### Deployment Steps:
1. Commit all changes to git
2. Push to repository
3. Upload to qual via cPanel
4. Clear browser cache
5. Test all functionality
6. Monitor for any errors

### Rollback Plan:
If issues arise, previous version can be restored from git commit 8150505