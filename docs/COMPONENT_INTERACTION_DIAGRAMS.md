# StackMap Component Interaction Diagrams

## Overview

This document provides detailed visual representations and explanations of how StackMap's components interact with each other. Understanding these interactions is crucial for maintaining and extending the application.

## 1. Application Initialization Flow

```
Browser Load
     │
     ├─► Load HTML (index.html)
     │       │
     │       ├─► Load CSS (styles/index.css)
     │       │
     │       ├─► Load Config (config/constants.js)
     │       │
     │       └─► Load Core Scripts
     │               │
     │               ├─► state.js (AppState class)
     │               ├─► renderer.js (AppRenderer class)
     │               ├─► components.js (UI components)
     │               └─► app/StackMapApp.js
     │
     └─► DOMContentLoaded Event
             │
             └─► new StackMapApp()
                     │
                     ├─► Initialize AppState
                     │       └─► Load from LocalStorage
                     │
                     ├─► Initialize AppRenderer
                     │       └─► Set up DOM references
                     │
                     ├─► Initialize Managers
                     │       ├─► HybridPanelManager
                     │       ├─► CelebrationManager
                     │       └─► DynamicMenuSystem
                     │
                     ├─► Setup Event Listeners
                     │
                     ├─► Initialize Google Drive Sync
                     │       └─► (Async, non-blocking)
                     │
                     └─► Render Initial UI
```

## 2. User Activity Card Interaction

```
User Clicks "Add Activity" Button
            │
            ├─► HybridPanelManager.openActivityForm()
            │       │
            │       ├─► Clear previous form state
            │       ├─► Initialize emoji picker
            │       └─► Show form panel
            │
            └─► User Fills Form
                    │
                    ├─► Real-time Validation
                    │       ├─► Title length check
                    │       ├─► Description length check
                    │       └─► Time format validation
                    │
                    └─► User Clicks "Save"
                            │
                            ├─► StackMapApp.addActivity()
                            │       │
                            │       ├─► Generate unique ID
                            │       ├─► Create activity object
                            │       └─► Add to AppState
                            │
                            ├─► AppState.addActivity()
                            │       │
                            │       ├─► Add to user's activities
                            │       ├─► Track operation
                            │       └─► Trigger save
                            │
                            ├─► LocalStorage Save
                            │       └─► Serialize and store
                            │
                            ├─► Sync Queue Update
                            │       └─► Queue for Drive sync
                            │
                            └─► UI Update
                                    │
                                    ├─► AppRenderer.render()
                                    ├─► Close form panel
                                    └─► Show success feedback
```

## 3. Card Completion Flow

```
User Taps Activity Card
         │
         ├─► Card Click Handler
         │       │
         │       ├─► Check if in edit mode
         │       │       └─► (If yes, handle edit)
         │       │
         │       └─► Toggle Completion
         │               │
         │               ├─► Update activity.completed
         │               ├─► Add completion animation
         │               └─► Check routine completion
         │
         ├─► AppState Update
         │       │
         │       ├─► Update activity
         │       ├─► Track operation
         │       └─► Calculate progress
         │
         ├─► Celebration Check
         │       │
         │       ├─► Single card → Confetti
         │       └─► All cards → Fireworks
         │
         └─► Persistence
                 │
                 ├─► Save to LocalStorage
                 └─► Queue sync operation
```

## 4. User Switching Flow

```
User Selects Different User
            │
            ├─► Dropdown Change Event
            │       │
            │       └─► StackMapApp.switchUser(userId)
            │               │
            │               ├─► Save current user data
            │               │       ├─► Activities
            │               │       ├─► Settings
            │               │       └─► UI state
            │               │
            │               ├─► Load new user data
            │               │       ├─► Activities
            │               │       ├─► Theme
            │               │       └─► Preferences
            │               │
            │               └─► Update UI
            │                       ├─► Apply theme
            │                       ├─► Update title/subtitle
            │                       ├─► Render activities
            │                       └─► Update selectors
            │
            └─► Sync Considerations
                    │
                    ├─► Queue user switch operation
                    └─► Debounce auto-sync
```

## 5. Google Drive Sync Flow

```
Sync Trigger (Auto or Manual)
            │
            ├─► Check Authentication
            │       │
            │       ├─► Not signed in → Show sign-in
            │       └─► Signed in → Continue
            │
            ├─► Process Sync Queue
            │       │
            │       ├─► Get pending operations
            │       ├─► Apply transformations
            │       └─► Execute in order
            │
            ├─► Download Remote Data
            │       │
            │       ├─► Find app folder
            │       ├─► Download data file
            │       └─► Parse JSON
            │
            ├─► Conflict Resolution
            │       │
            │       ├─► Compare versions
            │       ├─► Apply merge strategy
            │       └─► Handle conflicts
            │
            └─► Upload Merged Data
                    │
                    ├─► Serialize state
                    ├─► Upload to Drive
                    └─► Update sync metadata
```

## 6. Drag and Drop Reordering

```
User Long-presses Card (Mobile) or Drags (Desktop)
                    │
                    ├─► Enter Drag Mode
                    │       │
                    │       ├─► Add dragging class
                    │       ├─► Create ghost image
                    │       └─► Track pointer position
                    │
                    ├─► Drag Movement
                    │       │
                    │       ├─► Update ghost position
                    │       ├─► Calculate drop zones
                    │       └─► Show drop indicators
                    │
                    └─► Drop Card
                            │
                            ├─► Calculate new position
                            │
                            ├─► Update Array Order
                            │       │
                            │       ├─► Remove from old position
                            │       ├─► Insert at new position
                            │       └─► Update card numbers
                            │
                            ├─► AppState Update
                            │       │
                            │       ├─► Track move operation
                            │       └─► Trigger save
                            │
                            └─► Re-render Cards
                                    │
                                    └─► Smooth transition animation
```

## 7. Panel System Interaction

```
User Clicks FAB Button
         │
         ├─► HybridPanelManager.togglePanel()
         │       │
         │       ├─► Check current state
         │       ├─► Update panel visibility
         │       └─► Manage backdrop
         │
         ├─► Panel Opens
         │       │
         │       ├─► Slide animation
         │       ├─► Focus management
         │       └─► Load content
         │
         └─► Dynamic Menu Rendering
                 │
                 ├─► DynamicMenuSystem.renderMenu()
                 │       │
                 │       ├─► Get menu configuration
                 │       ├─► Generate menu items
                 │       └─► Attach handlers
                 │
                 └─► Navigation
                         │
                         ├─► Track history
                         ├─► Update breadcrumbs
                         └─► Handle back button
```

## 8. Service Worker Update Flow

```
New Version Deployed
         │
         ├─► Browser Checks for Updates
         │       │
         │       └─► Service Worker Compare
         │               │
         │               ├─► Different → Download
         │               └─► Same → Skip
         │
         ├─► New SW Installs
         │       │
         │       ├─► Cache new assets
         │       └─► Enter waiting state
         │
         └─► Update Activation
                 │
                 ├─► Show update prompt
                 │       └─► "New version available"
                 │
                 ├─► User Accepts
                 │       │
                 │       ├─► skipWaiting()
                 │       └─► Claim clients
                 │
                 └─► Page Reload
                         │
                         └─► New version active
```

## 9. Celebration Animation Flow

```
Trigger Event (Completion/Achievement)
                │
                ├─► CelebrationManager.playCelebration()
                │       │
                │       ├─► Determine type
                │       │       ├─► Single → Confetti
                │       │       └─► All → Fireworks
                │       │
                │       ├─► Create particles
                │       │       ├─► Calculate positions
                │       │       ├─► Set velocities
                │       │       └─► Apply theme colors
                │       │
                │       └─► Animate
                │               │
                │               ├─► requestAnimationFrame loop
                │               ├─► Update positions
                │               ├─► Apply physics
                │               └─► Clean up when done
                │
                └─► Audio (Optional)
                        │
                        └─► Play celebration sound
```

## 10. Data Import/Export Flow

```
User Initiates Export
         │
         ├─► Gather All Data
         │       │
         │       ├─► User profiles
         │       ├─► Activities
         │       ├─► Settings
         │       └─► Card library
         │
         ├─► Create Export Object
         │       │
         │       ├─► Add metadata
         │       ├─► Version info
         │       └─► Timestamp
         │
         └─► Download Options
                 │
                 ├─► Download as JSON
                 │       └─► Blob → Download
                 │
                 └─► Copy to Clipboard
                         └─► Format → Copy

User Initiates Import
         │
         ├─► File Selection
         │       │
         │       └─► <input type="file">
         │
         ├─► Parse and Validate
         │       │
         │       ├─► Check version
         │       ├─► Validate structure
         │       └─► Sanitize data
         │
         └─► Import Options
                 │
                 ├─► Replace All
                 │       └─► Clear → Import
                 │
                 └─► Merge
                         ├─► Combine users
                         ├─► Merge activities
                         └─► Preserve settings
```

## 11. Mobile-Specific Interactions

```
PWA Installation Flow
         │
         ├─► beforeinstallprompt Event
         │       │
         │       ├─► Prevent default
         │       ├─► Store event
         │       └─► Show custom UI
         │
         ├─► User Taps Install
         │       │
         │       └─► prompt.prompt()
         │               │
         │               ├─► System dialog
         │               └─► User choice
         │
         └─► Post-Installation
                 │
                 ├─► Hide install UI
                 ├─► Track installation
                 └─► Show PWA features

Touch Gesture Handling
         │
         ├─► Swipe Down on Panel
         │       │
         │       ├─► Track touch start
         │       ├─► Calculate delta
         │       └─► Close if threshold
         │
         └─► Long Press on Card
                 │
                 ├─► Start timer
                 ├─► Haptic feedback
                 └─► Enter edit mode
```

## 12. Error Recovery Flow

```
Error Occurs
     │
     ├─► Error Boundary Catches
     │       │
     │       ├─► Log error details
     │       ├─► Capture context
     │       └─► Prevent cascade
     │
     ├─► Determine Severity
     │       │
     │       ├─► Critical → Recovery mode
     │       ├─► Major → Fallback UI
     │       └─► Minor → Log and continue
     │
     └─► Recovery Actions
             │
             ├─► Local Data Recovery
             │       ├─► Check backups
             │       ├─► Validate data
             │       └─► Restore state
             │
             ├─► Sync Recovery
             │       ├─► Clear queue
             │       ├─► Reset sync
             │       └─► Retry auth
             │
             └─► UI Recovery
                     ├─► Clear corrupted DOM
                     ├─► Reset to safe state
                     └─► Show recovery UI
```

## Component Communication Patterns

### 1. Event Delegation Pattern
```javascript
// Central event handling for dynamic content
container.addEventListener('click', (e) => {
    if (e.target.matches('.activity-card')) {
        handleCardClick(e.target);
    } else if (e.target.matches('.btn-complete')) {
        handleComplete(e.target.closest('.activity-card'));
    }
});
```

### 2. State Change Broadcasting
```javascript
// AppState notifies all interested parties
class AppState {
    triggerSave() {
        this.onStateChange?.();  // StackMapApp
        this.notifyObservers();  // Other components
    }
}
```

### 3. Component Lifecycle
```javascript
// Consistent lifecycle for all components
const component = {
    init() { /* Setup */ },
    render() { /* Draw */ },
    update() { /* Refresh */ },
    destroy() { /* Cleanup */ }
};
```

### 4. Data Flow Direction
```
Always flows in one direction:
User Input → Controller → State → Storage
                ↓
            Renderer → DOM → User sees update
```

## Performance Considerations

### 1. Render Optimization
- Batch DOM updates using DocumentFragment
- Use requestAnimationFrame for animations
- Debounce expensive operations

### 2. Memory Management
- Remove event listeners when destroying components
- Clear references to large objects
- Limit operation log size

### 3. Network Optimization
- Queue sync operations when offline
- Batch API calls where possible
- Implement exponential backoff for retries

## Debugging Component Interactions

### 1. Trace Event Flow
```javascript
// Add logging to trace interactions
const originalMethod = component.method;
component.method = function(...args) {
    console.log(`[${component.name}] method called:`, args);
    return originalMethod.apply(this, args);
};
```

### 2. State Inspection
```javascript
// Expose state for debugging
window.debugState = () => ({
    appState: app.appState,
    syncQueue: app.driveSync?.syncQueue,
    panels: app.hybridPanelManager?.state
});
```

### 3. Performance Profiling
```javascript
// Measure component performance
performance.mark('component-start');
component.render();
performance.mark('component-end');
performance.measure('component-render', 'component-start', 'component-end');
```

## Summary

Understanding these component interactions is crucial for maintaining StackMap. The application follows clear patterns:

1. **Unidirectional data flow** prevents complexity
2. **Event delegation** handles dynamic content efficiently
3. **State management** centralizes all data operations
4. **Component lifecycle** ensures proper cleanup
5. **Error boundaries** prevent cascade failures

When adding new features or debugging issues, always consider how your changes will affect these interaction patterns.