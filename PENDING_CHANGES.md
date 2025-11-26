## Cleanup: Remove dead ActivityLibrary code (44 files)

### Changes Made:

- Deleted entire `src/components/ActivityLibrary/` folder (44 files) - dead code replaced by ActivityManagementModal
- Moved `EMPTY_CATEGORIES` constant to `src/constants/index.js`
- Removed `ActivityLibrary` component usage from App.js (~95 lines of unused JSX)
- Removed `showActivityLibrary` state that was never set to true
- Updated component exports in `src/components/index.js`
- Cleaned up documentation references

### Technical Details:

- **Evidence of dead code**: `setShowActivityLibrary(true)` was never called anywhere in the codebase
- **Replacement**: The library UI now uses `ActivityManagementModal/LibraryTabContent.js`
- **Preserved**: `EMPTY_CATEGORIES` constant moved to constants file for continued use
- **Files deleted**: 44 files including components, tests, snapshots, and documentation

### Files Changed:

- `/src/constants/index.js` - Added EMPTY_CATEGORIES constant
- `/App.js` - Removed ActivityLibrary import, state, and component usage
- `/src/components/index.js` - Removed ActivityLibrary export
- `/docs/architecture/MODAL_DATA_FLOWS.md` - Updated ActivityLibrary reference
- `/docs/TEST_TIERS.md` - Removed ActivityLibrary test references
- `/docs/TESTING_STRATEGY.md` - Removed ActivityLibrary references
- `/docs/development/PRE_PRODUCTION_CLEANUP_PLAN.md` - Marked as removed
- `/docs/development/WAVE1_EXECUTION_CHECKLIST.md` - Marked as removed
- `/CLAUDE.md` - Updated EMPTY_CATEGORIES location reference
- Deleted `/docs/bugs/ACTIVITY_CARD_LAYOUT_BUG.md` (obsolete)
- Deleted `/docs/platform/component-naming-conventions.md` (obsolete)
- Deleted `/src/components/ActivityLibrary/` (44 files)

### Testing:

- ✅ `npm run typecheck` passes
- ✅ `npm test` passes (58 suites, 1639 tests)
- ✅ `npm run build:web` compiles successfully
- Activity Library modal still works via ActivityManagementModal

### User Impact:

- **No functional changes** - dead code removal only
- **Reduced bundle size** - 44 unused files removed
- **Breaking Changes**: None
- **Migration Required**: None

### Deployment Notes:

- Technical debt cleanup - no user-facing changes
- Activity Library functionality preserved via ActivityManagementModal
- Safe for all platforms (iOS, Android, Web)

---

## Feat: Library activity reordering with sync support

### Changes Made:

- Added up/down arrow buttons to reorder activities within library groups
- Activities can now be moved up or down within their category using arrow buttons
- Order is preserved across sync to other devices via `sortIndex` and `sortIndexModifiedAt` fields
- Reordering is only available in "My Library" tab (not StackMap Library which is read-only)

### Technical Details:

- **Data Model**: Added `sortIndex` (position) and `sortIndexModifiedAt` (timestamp) to library activities
- **UI**: Up/down arrow buttons appear on left side of each activity card in My Library
- **Sync**: Conflict resolution uses Last-Write-Wins on `sortIndexModifiedAt` timestamp
- **Migration**: Existing activities without sortIndex get their array position assigned via normalizer

### Files Changed:

- `/src/components/ActivityLibrary/CategoryActions.js` - Added `handleReorderActivity`, `handleMoveActivityUp`, `handleMoveActivityDown`
- `/src/components/ActivityLibrary/LibraryActivityGrid.js` - Added `onMoveUp`, `onMoveDown`, `isReorderable` props
- `/src/components/ActivityLibrary/LibraryActivityCard.js` - Added reorder buttons UI
- `/src/components/ActivityLibrary/CategorySectionComponent.js` - Wired up reorder handlers
- `/src/components/ActivityLibrary/ActivityLibrary.js` - Connected handlers from CategoryActions to CategorySection
- `/src/services/sync/conflictResolver.js` - Added `mergeLibraryActivitiesWithPosition` for position-aware merge
- `/src/utils/dataNormalizer.js` - Added `normalizeActivitySortIndexes` for migration

### Testing:

- Open Activity Library > My Library tab
- Verify up/down arrows appear on each activity in your groups
- Move activities up/down and verify order persists after app restart
- Sync to another device and verify order is preserved
- Test conflict resolution: reorder on both devices, verify newer timestamp wins

### User Impact:

- **New Feature**: Users can reorder activities within library groups
- **Use Case**: Create "template days" where order matters for "Add All" functionality
- **Breaking Changes**: None
- **Migration Required**: None - handled automatically

### Deployment Notes:

- New feature - no backend changes required
- Fully backward compatible (old data gets sortIndex via normalizer)
- Mixed sync compatible (old devices ignore sortIndex, new device always wins on position)
- Safe for all platforms (iOS, Android, Web)

---

## Feat: Custom activity library groups - choose category when saving to library

### Changes Made:

- Added CategoryPickerModal that appears when clicking "Add to Library" in edit mode
- Users can now choose which library group to save activities to (not just "My Templates")
- Added ability to create new library groups inline when saving an activity
- Modal shows all existing groups with activity counts, sorted alphabetically with My Templates first

### Technical Details:

- New component: `src/components/Modals/CategoryPickerModal/` (CategoryPickerModal.js, styles.js, index.js)
- Modified `App.js`:
  - Added `showCategoryPickerModal` and `pendingLibraryActivity` state
  - Added `handleShowCategoryPicker()` to trigger the modal
  - Modified `addActivityToLibrary()` to accept categoryId, categoryName, and isNewCategory params
  - Added `handleCategorySelected()` to handle selection from modal
  - Fixed race condition: new categories are created in same state update as adding activity
- Changed EditModeList `onLibrary` prop to use `handleShowCategoryPicker` instead of direct add

### Files Changed:

- `/src/components/Modals/CategoryPickerModal/CategoryPickerModal.js` - New modal component
- `/src/components/Modals/CategoryPickerModal/styles.js` - Modal styling
- `/src/components/Modals/CategoryPickerModal/index.js` - Export
- `/App.js` - State management and library functions

### Testing:

- Enter edit mode and click the bookmark icon on any activity
- Verify modal shows with existing categories and "Create New Group" option
- Select an existing category and verify activity is saved there
- Create a new group and verify both group creation and activity save work
- Check toast message shows correct category name
- Test on iOS, Android, and Web

### User Impact:

- **New Feature**: Users can organize saved activities into custom groups
- **Improved**: No longer limited to just "My Templates" folder
- **Improved**: Can create new groups on the fly while saving
- **Breaking Changes**: None
- **Migration Required**: None

### Deployment Notes:

- New feature - no backend changes required
- Fully backward compatible
- Safe for all platforms (iOS, Android, Web)

---

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
