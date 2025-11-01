## Fix: Critical edit mode overlay bug causing transparency issues

### Changes Made:
- Removed problematic crossfade animation implementation that caused edit mode cards to not fully disappear
- Changed from absolute positioning with overlapping views to conditional rendering
- Simplified animation approach - now shows either edit mode OR user mode, never both simultaneously
- Removed unused showEditModeList state variable
- Preserved all recent improvements: sync fixes, QR scanner, logging system, code cleanup

### Technical Details:
- Issue was introduced in commit f820f488 (Aug 13, 2025) with crossfade animation
- Both views were rendered simultaneously during transitions causing overlay issues
- Fixed by returning to cleaner conditional rendering: {isEditMode ? <EditModeList /> : <RegularContent />}
- Animations still work smoothly but without the transparency bug

### Testing:
- Test transitions between edit and user modes
- Verify no transparency/overlay issues
- Confirm animations are smooth on all platforms
- Ensure sync, logging, and other recent features still work

### User Impact:
- **Positive**: Clean transitions between edit and user modes
- **Positive**: No more distracting transparency/overlay bugs
- **Breaking Changes**: None
- **Migration Required**: None

### Deployment Notes:
- Changes are backward compatible
- No database changes required
- Fix is targeted and minimal to avoid disrupting other features