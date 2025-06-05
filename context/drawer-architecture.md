# Drawer System Architecture

## Critical Relationship: Handle Inside Drawer Extension

**KEY INSIGHT**: The drawer handle is a CHILD of the drawer extension, not a sibling. This creates an unexpected coupling where:

1. When `drawer-extension` has `overflow: hidden`, the handle can disappear
2. The handle's position is relative to the drawer, so it moves WITH the drawer
3. Z-index stacking is affected by parent-child relationship

**SOLUTION IMPLEMENTED**: The handle is now purely decorative. The entire bottom 40px of the header is a clickable area that triggers the drawer. This provides:
- Larger touch target (full width)
- No dependency on handle visibility
- Better accessibility
- Handle can be styled purely for visual feedback

## DOM Structure (Updated)
```html
<header class="app-header">
    <div class="header-content">
        <!-- Logo, title, subtitle -->
    </div>
    
    <!-- Handle is now a SIBLING of drawer, positioned at bottom of header -->
    <div class="drawer-handle" id="drawerHandle">
        <span class="drawer-handle-bar"></span>
    </div>
    
    <!-- Drawer Extension starts at bottom of header -->
    <div class="drawer-extension" id="drawerExtension">
        <div class="drawer-dropdowns">
            <!-- Content -->
        </div>
    </div>
</header>
```

## CSS Positioning Strategy

### Closed State
- `drawer-extension`: `max-height: 0`, `overflow: hidden`, positioned at `top: 100%` of header
- `drawer-handle`: `bottom: 0` of header (colored gradient area), full width click area
- Handle is visible at bottom edge of header gradient
- No overflow conflicts since handle is sibling, not child

### Open State
- `drawer-extension`: `max-height: 235px`, extends below header
- `drawer-handle`: `transform: translateY(235px)` - moves down to bottom of drawer
- Both elements animate independently
- Clean curved bottom edge on drawer

## Z-Index Stack (highest to lowest)

1. **1010**: Floating buttons (preferences, edit mode)
2. **1005**: Drawer handle (forced high to stay visible)
3. **1004**: Preferences panel
4. **1003**: Floating buttons (alternate)
5. **1002**: Drawer extension content
6. **1001**: Header wrapper
7. **999**: Drawer backdrop
8. **1**: Cards and main content

## Component Relationships

### Header System
```
header-wrapper (fixed, z-index: 1001)
  └── app-header (relative within wrapper)
      └── drawer-extension (absolute, positioned at bottom)
          ├── drawer-handle (absolute within extension)
          └── drawer-dropdowns (normal flow)
```

### JavaScript Components Involved

1. **StackMapApp.js**
   - `initializeDrawer()`: Sets up click handlers and state management
   - `openDrawer()`: Adds `.open` class, updates aria attributes
   - `closeDrawer()`: Removes `.open` class, updates aria attributes

2. **DraggableDrawer.js** (legacy, not currently used but exists)
   - Alternative implementation with drag support
   - Different DOM structure expectations

## CSS Modules Involved

1. **draggable-drawer.css**: Main drawer styles and positioning
2. **layout.css**: Header wrapper and general layout
3. **responsive.css**: Mobile adjustments

## Known Issues & Solutions

### Issue: Handle Visibility with Overflow
- **Problem**: Parent's `overflow: hidden` hides absolutely positioned handle
- **Current Solution**: Complex CSS to manage overflow states
- **Better Solution**: Move handle outside drawer in DOM (sibling, not child)

### Issue: Position Coupling
- **Problem**: Handle position tied to drawer state
- **Current Solution**: Different positioning rules for open/closed states
- **Better Solution**: Independent positioning with transform animations

## Recommended Refactor

```html
<!-- Better structure -->
<div class="drawer-container">
    <div class="drawer-handle" id="drawerHandle">
        <span class="drawer-handle-bar"></span>
    </div>
    <div class="drawer-extension" id="drawerExtension">
        <div class="drawer-dropdowns">
            <!-- Content -->
        </div>
    </div>
</div>
```

This would allow:
- Independent positioning of handle and drawer
- No overflow conflicts
- Cleaner animation logic
- Better separation of concerns