# Activity Library System Documentation

## Overview
The Activity Library System allows users to save and reuse activity cards across their routines. This feature was added to enable users to build a personal collection of activities without cluttering their daily view.

## Architecture

### Data Structure

Libraries are stored within the state management system and are included in all data exports:

```javascript
// In state.js
users: {
    profiles: {
        [userId]: {
            // ... other user data
            library: []  // User-specific library cards
        }
    },
    groupLibrary: []  // Shared library for all users
}
```

### Library Types

1. **User Library** (`user`)
   - Personal to each user
   - Stored in `user.library`
   - Only visible to that specific user

2. **Group Library** (`group`)
   - Shared across all users
   - Stored at `users.groupLibrary`
   - Accessible by anyone using the app

3. **Base Library** (`base`)
   - Pre-loaded templates from `data/default-activities.js`
   - Read-only collection
   - Includes both `DEFAULT_ACTIVITIES` and `ACTIVITY_LIBRARY`

### Card Structure

Library cards store essential activity information:

```javascript
{
    id: "lib_1234567890_abc",  // Unique identifier
    title: "Morning Stretch",
    description: "Wake up your body!",
    icon: "🌞",
    cardType: "recurring",      // recurring, frequent, or single-use
    time: "",                   // Optional time field
    addedDate: "2025-06-11T10:30:00Z",
    addedBy: "user_123"        // User who added it
}
```

## Implementation Details

### Adding Cards to Library

Cards can be added to libraries via the card menu in edit mode:

1. Enter edit mode (grown-up mode)
2. Tap the three-dot menu button on any card
3. Select "Add to User Library" or "Add to Group Library"
4. Card is copied to the selected library (without user-specific data like completion status)

### Accessing the Library

The library is accessed through the edit mode menu system:

1. Tap the edit FAB (pencil icon) in edit mode
2. Select "Add from Library" from the menu
3. The library interface opens showing:
   - User Library (if has cards)
   - Group Library (if has cards)
   - Base Templates (always shown)

### Library Interface Features

- **Multi-select**: Checkboxes allow selecting multiple cards at once
- **Touch-friendly**: Large tap targets (60px min height)
- **Visual hierarchy**: Categorized sections with clear headers
- **Responsive**: Scrollable content with fixed "Add to Day" button

## State Management Methods

### Core Methods (in state.js)

```javascript
// Add a card to library
addToLibrary(card, libraryType) {
    // Creates unique ID, adds metadata
    // Checks for duplicates (by title + icon)
    // Returns true if successful
}

// Get library cards
getLibrary(libraryType) {
    // Returns array of cards for specified library type
    // Base library combines DEFAULT_ACTIVITIES and ACTIVITY_LIBRARY
}

// Remove from library
removeFromLibrary(cardId, libraryType) {
    // Removes card by ID from specified library
}
```

## UI Components

### Edit Mode Menu (HybridPanelManager.js)

```javascript
showEditModeMenu(actions) {
    // Opens right panel with edit actions
    // Includes "Add from Library" option
}
```

### Library Menu (HybridPanelManager.js)

```javascript
showLibraryMenu() {
    // Opens library interface
    // Handles card selection
    // Manages "Add to Day" functionality
}
```

## Migration & Compatibility

- Libraries are automatically initialized for existing users
- Legacy imports receive empty library arrays
- All library data is included in exports
- Compatible with multi-user system

## Future Enhancement Opportunities

1. **Search/Filter** - Add search functionality within libraries
2. **Categories** - Allow users to organize library cards into custom categories
3. **Sharing** - Export/import specific library collections
4. **Templates** - Pre-made routine templates using library cards
5. **Edit Library Cards** - Modify cards after they're in the library
6. **Bulk Operations** - Delete multiple cards, move between libraries
7. **Library Management UI** - Dedicated interface for organizing library

## Technical Notes

- Libraries use the same validation as regular activities
- Duplicate detection based on title + icon combination
- Card IDs are generated with timestamp + random string
- Base library is read-only and loaded from `window.DEFAULT_ACTIVITIES` and `window.ACTIVITY_LIBRARY`
- Library data persists through localStorage and sync mechanisms

## File Locations

- **State Management**: `/state.js` - Core library methods
- **UI Components**: `/js/HybridPanelManager.js` - Library interface
- **Card Menu**: `/components.js` - Add to library buttons
- **Styles**: `/styles/hybrid-panels.css` - Library UI styles
- **Base Cards**: `/data/default-activities.js` - Pre-loaded templates