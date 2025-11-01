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