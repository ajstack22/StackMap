# Pending Updates - 2025-08-21

## Bug Fixes

### Activity Library Icons on iOS - CRITICAL FIX
**Issue:** Plus/add icons appearing as dots on iOS in the Activity Library
**Root Cause:** MaterialIcons font not loading at runtime despite being bundled

**Investigation Findings:**
- ✅ MaterialIcons.ttf exists in node_modules
- ✅ Font is included in Pods resource copy list  
- ✅ Font is in the built app bundle
- ✅ Font is registered in Info.plist UIAppFonts
- ✅ The "add" icon exists in the glyphmap (code 57669)
- ❌ Font wasn't loading at runtime on iOS

**Final Solution:**
Since MaterialIcons are working elsewhere in the app but not in LibraryTabContent, and we need an immediate fix for release, replaced Icon components with styled Text components:

**Files Modified:**
- `src/components/Modals/ActivityManagementModal/LibraryTabContent.js`
  - Replaced `<Icon name="add">` with styled Text component showing "+"
  - Replaced `<Icon name="delete">` with styled Text component showing "×"
  - Both use circular colored backgrounds (theme.primary and red)
  - 24x24px circles with white text, maintaining aesthetic consistency
  - Added platform-specific vertical centering adjustments for symbols
    - iOS: marginTop -2px for "+", -3px for "×" (symbols were too high)
    - Android: marginTop 1px for both (symbols were slightly low)
    - Web: No adjustment needed
  - Changed all folder icons to bookmark icons for consistency with edit mode
  - This avoids the iOS-specific MaterialIcons rendering issue entirely
  
- `src/components/Modals/ActivityManagementModal/ActivityManagementModal.js`
  - Changed Library tab icon from 'folder' to 'bookmark' for consistency
  - Add tab keeps 'add-circle' icon (plus sign)

- `src/components/EditModeToolbar/EditModeToolbar.js`
  - Changed Activities menu button icon from 'add-circle' to 'add-photo-alternate'

- `src/components/Modals/SettingsModal/SettingsModal.js`
  - Changed Activities toolbar button icon from 'add-circle' to 'add-photo-alternate'

- `src/utils/VectorIcons.web.js`
  - Added 'add-photo-alternate' to iconAliases for web compatibility

- `ios/StackMapNative/AppDelegate.swift` (attempted fix - didn't resolve issue)
  - Added manual font registration but issue persisted
  - Kept for potential future font loading improvements

**Why Text Solution Works:**
- Guaranteed to render correctly on all platforms
- Maintains the visual aesthetic (colored circle with symbol)
- Avoids debugging complex font loading issues at release time
- Other MaterialIcons in the app work fine, issue is isolated to this component

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

## UI Improvements

### Check-In Modal Bottom Buttons Removed
**Change:** Removed the bottom action buttons from the check-in modal
**Reason:** Buttons were redundant since users can close with the X button
**Files Modified:**
- `src/components/Modals/ContextModal/ContextModal.js`
  - Removed "Maybe Later" and "All Set! ✅" buttons from the bottom
  - Modified `handleClose()` to automatically save check-in data when closing via X button
  - Removed action button styles from stylesheet
  - Users now simply close the modal with X button which saves their selections
**Impact:** Cleaner, simpler interface with less clutter