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

**Files Modified:**
- `ios/StackMapNative/AppDelegate.swift`
  - Added manual font registration in `didFinishLaunchingWithOptions`
  - Imports CoreText framework
  - Explicitly registers all vector icon fonts at app startup
  - This ensures fonts are loaded before React Native tries to use them

- `src/components/ActivityLibrary/ActivityLibrary.js`
  - Changed from `add-circle-outline` to `add` (simpler icon names)
  - Added new `addIconButton` style with circular background
  - Icons now have white color on colored background for better visibility

**Why This Fix Works:**
React Native 0.60+ auto-linking sometimes fails to properly load vector icon fonts on iOS, especially after app name changes or with multiple build targets. Manual registration ensures the fonts are available when the Icon components try to render.

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