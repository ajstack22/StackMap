## Title: Fix Android crash when opening Activities Library modal

### Change Description:
Fixed app freeze/crash on Android devices when opening the Activities→Library modal. The issue was caused by synchronously loading a 1.3MB emoji.json file which blocked the JavaScript thread.

### Changes Made:
**src/components/EmojiPicker/EmojiPickerMain.js**:
- Removed synchronous import of emoji-datasource-apple/emoji.json (line 11)
- Implemented async lazy loading of emoji data using dynamic import
- Added loading state with ActivityIndicator while emoji data loads
- Cached emoji data, search index, and categories to avoid reloading
- Modified `createEmojiSearchIndex()` and `buildEmojiCategories()` to accept emoji data as parameter
- Added loading UI with spinner and "Loading emojis..." text

**src/components/EmojiPicker/styles.js**:
- Added `loadingContainer` style for centered loading state
- Added `loadingText` style for loading message

### Technical Details:
- **Root Cause**: 1.3MB emoji.json file was loaded synchronously at module initialization
- **Solution**: Lazy load emoji data asynchronously when EmojiPicker first becomes visible
- **Performance**: Emoji data only loads once and is cached for subsequent uses
- **UX**: Loading indicator provides feedback during initial load (~1-2 seconds)

### Testing:
- ✅ Tested on Pixel XL emulator (Android)
- ✅ App no longer freezes when opening Activities→Library modal
- ✅ Emoji picker displays loading state then renders emojis
- ✅ Subsequent opens use cached data (instant)

### Impact:
- ✅ Fixes critical crash on Android devices
- ✅ Improves app responsiveness
- ✅ Better user experience with loading feedback
- ✅ No impact on iOS or web (async loading works on all platforms)

### Deployment Date: [To be filled by deployment script]
