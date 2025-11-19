## Docs: Update license documentation for all production dependencies

### Changes Made:

- Updated `docs/security/licenses.csv` with current license information for all production dependencies
- Ran `npm run license:report` to regenerate license documentation
- Verified no forbidden licenses (GPL, AGPL, LGPL, SSPL) in production dependencies

### Technical Details:

- All production dependencies use permissive licenses (MIT, BSD, Apache-2.0, ISC, etc.)
- License verification confirms compliance with project licensing requirements
- Documentation now reflects latest dependency versions from package.json

### Files Changed:

- `/docs/security/licenses.csv` - Updated with current production dependency licenses

### Testing:

- Ran `npm run license:verify` - all checks passed
- Confirmed no forbidden licenses detected
- Verified CSV format and content accuracy

### User Impact:

- **No functional changes** - documentation update only
- **Improved**: License documentation now accurate and up-to-date
- **Breaking Changes**: None
- **Migration Required**: None

### Deployment Notes:

- Documentation update only - no code changes
- Safe to deploy to all tiers
- No backend changes required

---

## Fix: Web QR scanner comprehensive fix with refs and error boundary

### Changes Made:

- Complete rewrite of WebQRScanner component with proper refs and promise tracking
- Added QRScannerErrorBoundary component to catch errors and prevent white screens
- Replaced React state with refs to avoid stale closures in async operations
- Added promise tracking to wait for start() completion before stop()
- Added hasUnmountedRef to prevent state updates after unmount
- Added "Initializing camera..." loading state
- Wrapped WebQRScanner in error boundary in SyncQRScanner component

### Technical Details:

- **Root cause analysis**:

  1. No error boundary → uncaught errors caused white screen
  2. Race condition: stop() called before/during start() promise resolution
  3. Stale closure: cleanup function captured wrong scanner reference
  4. State sync issues with async library operations

- **Comprehensive solution**:
  - `scannerRef`: Stores scanner instance (avoids stale closures)
  - `isRunningRef`: Tracks actual running state (not React state)
  - `startPromiseRef`: Tracks pending start() operations
  - `hasUnmountedRef`: Prevents operations after unmount
  - Error boundary catches any uncaught errors
  - Proper async/await sequencing in cleanup

### Files Changed:

- `/src/components/Modals/DataModal/WebQRScanner.js` - Complete rewrite with refs
- `/src/components/Modals/DataModal/QRScannerErrorBoundary.js` - New error boundary
- `/src/components/Modals/DataModal/SyncQRScanner.js` - Added error boundary wrapper

### Testing:

- Test scanning a valid QR code from web onboarding
- Verify no "Cannot stop" errors in console
- Test rapid open/close of scanner
- Test retry flow after errors
- Verify error boundary shows friendly error UI instead of white screen
- Test camera permission denial handling

### User Impact:

- **Fixed**: No more white screen crashes when scanning QR codes
- **Fixed**: Proper cleanup prevents camera from staying active
- **Improved**: Loading state while camera initializes
- **Improved**: Friendly error UI with retry option
- **Breaking Changes**: None
- **Migration Required**: None

### Deployment Notes:

- Critical fix for web platform QR scanning stability
- No backend changes required
- Fully backward compatible

---

## Fix: iPad Pro 12.9" landscape centering (STORY-002 update)

### Changes Made:

- Fixed iPad Pro 12.9" getting 3 columns instead of 2 in landscape mode
- Updated `calculateColumns()` to force ALL iPads to use 2 columns (was limiting to < 1100px)
- Now iPad Pro 12.9" landscape (1366px) correctly gets 2 centered columns
- Ensures centering works for all iPad models in landscape orientation

### Technical Details:

- Previous: iPad Pro 12.9" landscape (1366px) triggered 3-column layout (width >= 900px rule)
- Fixed: All iOS tablets (width >= 768px) now get 2 columns consistently
- Centering logic requires both `isTabletLandscape() === true` AND `numColumns === 2`
- Android tablets unchanged - still get 2 columns as intended

---

## Feat: Conservative tablet landscape centering (STORY-002)

### Changes Made:

- Added `isTabletLandscape()` function to `/src/constants/layout.js` for real-time orientation detection
- Updated card layout centering logic in `App.js` to center 2-column cards in tablet landscape mode
- **Preserved critical 48% width constraint** for Android tablets (DO NOT CHANGE)
- No changes to card widths or flexWrap behavior - centering only

### Technical Details:

- `isTabletLandscape()`: Returns `true` when width >= 1000px AND width > height
- Uses `Dimensions.get('window')` for real-time dimension checking (not static comparison)
- Updated `justifyContent` logic in multi-column ScrollView:
  - Web: `'center'` (existing behavior preserved)
  - Tablet landscape (iOS/Android) 2-column: `'center'` (NEW!)
  - Tablet portrait 2-column: `'space-evenly'` (existing behavior preserved)
  - Phone portrait 1-column: `'flex-start'` (existing behavior preserved)
- Android's critical 48% width for flexWrap remains untouched (lines 4729-4751 in App.js)

### Testing:

- ✅ Logic tests pass for all device dimensions (iPad Pro 12.9", 11", Mini, Android tablets, iPhones)
- ✅ Centering logic verified for all platform/orientation combinations
- ✅ TypeScript type checking passes
- ✅ iOS build successful on iPad Pro 12.9" simulator
- ✅ Critical 48% width constraint verified intact
- Test landscape centering by rotating iPad simulator or Android tablet
- Verify portrait mode still uses space-evenly (existing behavior)
- Confirm no regression in edit mode functionality

### User Impact:

- **Improved**: Tablet landscape mode now centers 2-column card layout for better aesthetics
- **Preserved**: All existing behavior for portrait, web, and phone layouts
- **Breaking Changes**: None
- **Migration Required**: None

### Deployment Notes:

- Conservative implementation - minimal changes focused on centering only
- No changes to card widths, flexWrap, or Android-specific constraints
- Addresses peer review feedback for STORY-002
- Safe for all platforms (iOS, Android, Web)
- Related Story: STORY-002 (Tablet Landscape Cards Layout)

---

## Cleanup: Remove unused HTML status reporting from deployment scripts

### Changes Made:

- Removed 700+ lines of unused HTML status page generation code from deployment system
- Deleted HTML template file, test script, and dashboard documentation (24KB total)
- Removed 6 HTML status functions: generate_status_page, update_status_page, finalize_status_page, open_status_page, get_status_icon, update_scan_results
- Cleaned up over 100 function calls across all deployment scripts (qual, stage, beta, prod)
- Preserved all console reporting and quality status functionality

### Technical Details:

- HTML status pages were supplementary reporting that duplicated console output
- Feature was not being used at any deployment tier
- Console reporting provides all necessary deployment feedback
- Quality status system (update_quality_status_from_results) verified independent and preserved
- All deployment functionality remains intact

### Testing:

- All deployment scripts pass bash syntax validation
- Comprehensive grep verification confirms no HTML function references remain
- Test deployment with: ./scripts/deploy.sh qual --web
- Verify console output shows deployment progress
- Confirm no HTML files generated in deployments/ directory

### User Impact:

- **No functional changes** - deployments work exactly as before
- **Cleaner scripts** - 700+ lines of complexity removed
- **Faster deployments** - no HTML generation or browser opening overhead
- **Breaking Changes**: None
- **Migration Required**: None

### Deployment Notes:

- Technical debt cleanup - no user-facing changes
- All deployment tiers (qual, stage, beta, prod) updated
- Archive branch created: archive/html-status-reporting
- Rollback available if needed via git checkout

---

## Fix: Revert edit/user mode transition changes to fix Android rendering issues

### Changes Made:

- Reverted ALL edit/user mode transition animations to fix Android-specific rendering bug
- Removed Animated.View wrappers around content sections
- Removed contentFadeAnim and editListFadeAnim animation states
- Removed isTransitioning state and FAB button blocking logic
- Returned to simple conditional rendering: {isEditMode ? <EditModeList /> : <RegularContent />}
- **Preserved** all other recent improvements: sync fixes, QR scanner, logging system, code cleanup

### Technical Details:

- Android issue: User mode cards were invisible after exiting edit mode (but still responded to taps)
- Root cause: Animated.View wrappers with opacity animations broke Android's rendering
- Solution: Complete revert to original simple conditional rendering without animations
- Kept toolbar animations (editModeIconRotation, editModeToolbarTranslate) which work fine

### Testing:

- Test transitions between edit and user modes on Android
- Verify user mode cards render properly after exiting edit mode
- Confirm cards respond to taps correctly
- Test on iOS and web to ensure no regression
- Ensure sync, logging, and other recent features still work

### User Impact:

- **Fixed**: Android users can now properly see cards after exiting edit mode
- **Fixed**: FAB button responds immediately without delays
- **Breaking Changes**: None
- **Migration Required**: None

### Deployment Notes:

- Critical fix for Android platform
- Changes are backward compatible
- No database changes required
- Minimal changes focused only on edit/user mode transitions
