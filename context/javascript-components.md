# JavaScript Components Documentation

## Component Overview

### Active Components

#### StackMapApp.js
**Location**: `/app/StackMapApp.js`
**Purpose**: Main application controller

**Key Methods**:

##### Native Dropdown System (NEW - CRITICAL FEATURE)
- **`showNativeDropdown(triggerElement, options, onSelect)`** (lines 717-875)
  - Platform-aware dropdown positioning system
  - Mobile: 2px right, width-6px | Desktop: 2px right, 95%+8px width  
  - Z-index 1003 for proper layering above drawer
  - Seamless visual connections between trigger and dropdown
  - **Documentation**: See `/context/native-dropdown-system.md` for complete specs

##### Core Methods
- `initializeDrawer()` - Sets up drawer click handlers and state
- `createBackdrop()` - Creates backdrop element for drawer
- `openDrawer()` - Opens drawer, updates classes and ARIA
- `closeDrawer()` - Closes drawer, updates classes and ARIA
- `populateDrawerSelects()` - Populates user/day dropdowns

**Drawer Integration**:
```javascript
// Drawer state is managed through:
- CSS classes: .open on drawer-extension
- ARIA attributes: aria-expanded, aria-hidden
- Body class: .drawer-active
- Backdrop visibility
```

#### PreferencesManager.js
**Location**: `/app/PreferencesManager.js`
**Purpose**: Manages preferences panel and settings
**Key Methods**:
- `togglePreferences()` - Show/hide preferences panel
- `setupKidModeControls()` - Initialize color picker and display options
- `updateLogoColors()` - Updates SVG logo based on theme

#### State.js
**Location**: `/state.js`
**Purpose**: Application state management
**Key Features**:
- User profiles with activities
- Theme management
- Data persistence to localStorage
- Import/export functionality

### Legacy/Unused Components

#### DraggableDrawer.js
**Location**: `/components/DraggableDrawer.js`
**Status**: NOT CURRENTLY USED
**Note**: Alternative drawer implementation with drag support
**Issues**: Expects different DOM structure than current implementation

#### ModernUserSelector.js & ModernDaySelector.js
**Location**: `/components/`
**Status**: Loaded but not actively used
**Note**: Attempted modern implementations of selectors

## Component Interactions

### Drawer Open Flow
```
1. User clicks drawerHandle
2. StackMapApp.initializeDrawer() click handler fires
3. openDrawer() called:
   - Adds .open class to drawerExtension
   - Adds .drawer-open to appHeader
   - Adds .visible to backdrop
   - Updates ARIA attributes
   - Calls populateDrawerSelects()
4. CSS transitions handle visual changes
```

### Drawer Close Flow
```
1. User clicks handle again OR backdrop
2. closeDrawer() called:
   - Removes .open class
   - Removes .drawer-open
   - Removes .visible from backdrop
   - Updates ARIA attributes
3. CSS transitions handle visual changes
```

## State Management

### Current User State
```javascript
appState.users = {
  currentUserId: "user1",
  profiles: {
    "user1": {
      id: "user1",
      name: "John",
      icon: "👤",
      activities: [...],
      tomorrowActivities: [...],
      customTitle: "My Tasks",
      customSubtitle: "Daily Routine"
    }
  }
}
```

### UI State
```javascript
appState.ui = {
  currentDay: "today" | "tomorrow",
  editMode: false
}
```

## Event Listeners

### Drawer System
- `drawerHandle` - click, touchstart, touchmove, touchend, keydown
- `backdrop` - click
- `document` - keydown (Escape key)
- `drawerDaySelect` - change
- User selector - change or button click

### Global Listeners
- `window` - resize (responsive adjustments)
- `document` - click (close panels on outside click)

## Data Flow

### User Selection Change
```
1. Dropdown/button change event
2. handleUserSwitch() called
3. saveCurrentUserData() - saves current user's state
4. switchUser() - changes currentUserId
5. loadUserData() - loads new user's data
6. render() - updates UI
7. Update dropdowns to show new selection
```

### Day Selection Change
```
1. Dropdown change event
2. switchDay() called
3. Updates ui.currentDay
4. Updates body classes (viewing-today/viewing-tomorrow)
5. render() - shows appropriate activities
```

## CSS Class Management

### Body Classes
- `grownup-mode` - Edit mode active
- `drawer-active` - Drawer is open
- `viewing-today` - Showing today's activities
- `viewing-tomorrow` - Showing tomorrow's activities
- `hide-completion-indicators` - Hides stars/checks

### Dynamic Classes
- `.open` - Drawer extension expanded
- `.drawer-open` - Header when drawer active
- `.visible` - Backdrop shown
- `.hidden` - Elements hidden
- `.selected` - Active selections

## Performance Considerations

1. **Event Delegation**: Not currently used, could improve with many cards
2. **Throttling**: Touch/drag events not throttled
3. **Render Optimization**: Full re-render on state changes
4. **Local Storage**: Saves on every change (could batch)

## Debugging Helpers

### Console Commands
```javascript
appInstance                    // Main app instance
appInstance.appState          // Current state
appInstance.grownupMode       // Edit mode status
debugUsers()                  // User data debug
validateStory2()              // User system validation
adjustDrawerHandle()          // Drawer position helper
```

### State Inspection
```javascript
// Get current user
appInstance.appState.getCurrentUser()

// Get all users
appInstance.appState.getAllUsers()

// Check current day
appInstance.appState.getCurrentDay()

// Force render
appInstance.render()
```