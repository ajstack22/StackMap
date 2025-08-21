# Pending Updates - 2025-08-21

## Bug Fixes

### Activity Library Icons on iOS
**Issue:** Plus/add icons appearing as dots on iOS in the Activity Library
**Files Modified:**
- `src/components/ActivityLibrary/ActivityLibrary.js`
  - Changed complex icon names to simpler ones that render properly on iOS
  - Changed from `add-circle-outline` to `add` with custom circular button styling
  - Added new `addIconButton` style with circular background
  - Icons now have white color on colored background for better visibility

- `src/components/Modals/ActivityManagementModal/LibraryTabContent.js`
  - Uses simple `add` icon which should render correctly

**Root Cause:** MaterialIcons font rendering issues with complex outline icons on iOS

### Excessive Bottom Padding in Activity Library
**Issue:** Too much scrollable space at the bottom of the Activity Library modal
**Files Modified:**
- `src/components/ActivityLibrary/ActivityLibrary.js`
  - Removed `paddingBottom: SPACING.lg` from `contentContainerStyle`
  - Changed `contentWrapper` padding to only horizontal and top (removed bottom padding)
  - Reduced Android bottom safe area from `Math.max(insets.bottom, 20)` to `insets.bottom || 0`

## Build Steps Completed
- Cleared Metro bundler cache
- Cleared iOS build directories
- Reinstalled CocoaPods dependencies
- RNVectorIcons confirmed installed in pod dependencies

## Testing Required
After running `./scripts/deploy-all.sh`:
1. Open Activity Library on iOS device/simulator
2. Verify plus icons display correctly (not as dots)
3. Verify no excessive scroll space at bottom of library
4. Test on both iPhone and iPad if possible

## Notes
- MaterialIcons.ttf is properly linked via CocoaPods
- Simple icon names (`add`, `check`) work better than complex ones (`add-circle-outline`) on iOS
- Custom circular button styling provides the "plus in circle" appearance