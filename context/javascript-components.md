# JavaScript Components Documentation

## Component Overview

### Core Application Files

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

### Modern Manager Classes

#### HybridPanelManager.js
**Location**: `/js/HybridPanelManager.js`
**Purpose**: Unified panel system for settings and management
**Key Features**:
- Side panels that slide in from left/right
- Settings: colors, display options, celebrations
- Management: users, activities, import/export
- Platform-aware behavior (mobile/desktop)
- Replaces old PreferencesManager and DataManagementPanel

#### CelebrationManager.js
**Location**: `/js/CelebrationManager.js`
**Purpose**: Handles all celebration animations
**Key Methods**:
- `playCelebration(type, options)` - Trigger animations
- `playConfetti()` - Task completion animation
- `playFireworks()` - Routine completion animation

#### DynamicMenuSystem.js
**Location**: `/js/DynamicMenuSystem.js`
**Purpose**: Context menu handler for edit mode
**Features**:
- Card edit menus
- User management menus
- Dynamic positioning

#### MenuConfigurations.js
**Location**: `/js/MenuConfigurations.js`
**Purpose**: Menu definitions and options

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

### User Selection Change (via ModernUserSelector)
```
1. User clicks on user button/avatar
2. HybridPanelManager renders user list
3. User selection triggers switchUser()
4. State updates and saves
5. UI re-renders with new user data
```

### Settings Change (via HybridPanelManager)
```
1. User opens settings panel
2. Changes color/display/celebration options  
3. HybridPanelManager updates state
4. Live preview shown immediately
5. Changes persist to localStorage
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