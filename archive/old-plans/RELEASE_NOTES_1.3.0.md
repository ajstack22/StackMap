# StackMap v1.3.0 Release Notes

## 🎉 Major Features

### Library Editor
- **New Library Management Interface**: Centrally modify library items without creating cards in the UI first
- **Three Library Types**: Manage User Library (personal), Group Library (shared), and view Base Library
- **Inline Editing**: Edit library cards directly within the library view
- **Bulk Operations**: Delete multiple cards at once or move them between libraries
- **Direct Creation**: Add new cards directly from the library editor with "Add Card" buttons

### UI/UX Improvements
- **Mobile FAB Optimization**: Reduced floating action button size from 61x61 to 50x50 pixels on mobile
- **Enhanced Card Display**: Optimized spacing to show 12+ characters of card titles (previously only 8)
- **Cleaner Library View**: Removed icons from library card list for a cleaner, text-focused display
- **Better Button Grouping**: Improved bulk action button layout to prevent awkward wrapping
- **Emoji Picker Refinement**: Adjusted to show 3.5 rows with better spacing and no overlapping

### User Experience Enhancements
- **Clearer Labeling**: Changed "Edit" menu to "Edit Mode" for clarity
- **Smart Button Text**: "Add Card" button changes to "Save" when editing existing cards
- **Emoji in Subtitle**: Added user emoji to subtitle format: `<emoji> <name> • <day>`
- **Responsive Design**: Library picker now properly adapts to mobile screen sizes

## 🐛 Bug Fixes
- Fixed `menuSystem.render()` error by using correct panel rendering method
- Resolved library card edits not saving due to duplicate `saveActivity` methods
- Fixed emoji picker defaulting to target icon instead of card's actual icon
- Corrected mobile-specific CSS to avoid affecting desktop FAB size
- Fixed DataManagementPanel undefined error

## 🔧 Technical Improvements
- Enhanced state management for library operations
- Added proper navigation history to prevent UI loops
- Improved error handling with toast notifications for user feedback
- Updated default-activities.js with comprehensive activity library
- Maintained JSON storage architecture for simplicity and reliability

## 📝 Notes
- The JSON file storage approach remains optimal for current data sizes (typically under 200KB)
- Future considerations for IndexedDB or compression if data grows significantly
- Drag & drop reordering for library items planned for future release

## 🚀 Deployment
This release is ready for deployment via cPanel. All changes have been committed and pushed to GitHub.