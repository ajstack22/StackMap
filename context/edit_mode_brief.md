# StackMap FAB Edit Mode Redesign - Implementation Brief

## Table of Contents
1. [Current Edit Mode Analysis](#current-edit-mode-analysis)
2. [Component Architecture Patterns](#stackmap-component-patterns)
3. [CSS & Styling Architecture](#css-architecture-for-fab-implementation)
4. [Proposed FAB Specifications](#fab-design-specifications)
5. [Implementation Strategy](#implementation-approach)
6. [Migration Strategy](#migration-from-management-cards)

---

## Current Edit Mode Analysis

### Activation Process:
- Edit mode is activated through a validation process to prevent children from accidentally entering it
- Validation modal appears with simple questions (e.g., "What's the first letter of the alphabet?")
- Validation is handled in the HybridPanelManager's right panel (Lines 1086-1110)
- Empty answer is accepted as a shortcut for developers

### State Changes:
```javascript
// state.js lines 14-22
this.ui = {
    editMode: false,
    editingCardIndex: -1,
    showingNewCardForm: false,
    selectedEmoji: CONFIG.DEFAULT_EMOJI,
    draggedElement: null,
    cardFilter: '', // Story 2: Filter state
    currentDay: 'today' // Story 4: Current day context
};
```

### Current Actions Available:
1. **Add Card** - Opens new activity form (top or bottom placement)
2. **Complete Day** - Moves activities to tomorrow
3. **Filter Activities** - Search/filter by title or description
4. **Edit Activity Cards** - Modify existing activities
5. **Delete Activities** - Remove activity cards
6. **Reorder Activities** - Drag and drop functionality

### Current UI Changes:
- **Body class**: `grownup-mode` class added to `<body>` (Line 1616 in StackMapApp.js)
- **Drawer behavior**: Forced open and locked in edit mode (Line 1624)
- **Management cards**: Appear at top and bottom of activity list (Lines 52-83 in renderer.js)
- **Management panel**: Shows admin buttons instead of validation (Lines 596-621 in HybridPanelManager.js)
- **Activity cards**: Become editable with drag handles and edit buttons

---

## StackMap Component Patterns

### Component Class Structure:
```javascript
// Standard component pattern
class ComponentName {
    constructor(/* dependencies */) {
        // Initialize state
        // Store references
        // Set up initial configuration
    }
    
    init() {
        // Additional initialization after construction
    }
    
    render() {
        // Create and return DOM elements
    }
    
    setupEventListeners() {
        // Attach event handlers
    }
    
    updateDisplay() {
        // Update component when state changes
    }
    
    destroy() {
        // Cleanup when component is removed
    }
}

// Global registration
window.ComponentName = ComponentName;
```

### Button Creation Patterns:
```javascript
// Pattern 1: Inline HTML with onclick
`<button class="btn btn--primary" 
         onclick="appInstance.methodName()"
         title="Tooltip text">
    <span class="material-icons">icon_name</span>
    <span>Button Text</span>
</button>`

// Pattern 2: Round icon buttons
`<button class="btn btn--round btn--delete" 
         onclick="event.stopPropagation(); appInstance.deleteActivity(${this.index})" 
         aria-label="Delete card" 
         title="Delete card">
    <span class="material-icons">delete</span>
</button>`
```

### Event Handling Patterns:
```javascript
// Direct onclick attributes
button.innerHTML = `<button onclick="appInstance.methodName()">Click</button>`;

// addEventListener after DOM insertion
setTimeout(() => {
    const element = document.querySelector('.selector');
    element.addEventListener('click', (e) => {
        // Handle event
    });
}, 0);

// Keyboard handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        this.close();
    }
});
```

### Window Global Patterns:
```javascript
// Components exposed globally
window.ComponentBuilder = ComponentBuilder;
window.ActivityCard = ActivityCard;
window.appInstance = this; // Set in StackMapApp constructor
```

---

## CSS Architecture for FAB Implementation

### Button Styling Patterns:
```css
/* BEM naming convention */
.btn { /* Base button */ }
.btn--primary { /* Primary modifier */ }
.btn--floating { /* Floating button modifier */ }
.btn--round { /* Round button modifier */ }

/* Existing floating button pattern (buttons.css lines 173-399) */
.btn.btn--floating {
    position: fixed !important;
    width: 56px !important;
    height: 56px !important;
    border-radius: 50% !important;
    background: white !important;
    color: var(--primary-color) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    z-index: 1000 !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
```

### Floating Element Patterns:
```css
/* Fixed positioning (layout.css lines 833-898) */
.btn--floating {
    position: fixed;
    z-index: 1003;
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(10px);
}

/* Z-index hierarchy */
1010 - Floating buttons (highest)
1005 - Drawer handle
1004 - Preferences panel
1002 - Drawer extension
1001 - Header wrapper
999 - Drawer backdrop
1 - Main content
```

### Touch Target Requirements:
```css
/* Minimum 44px × 44px enforced throughout */
/* Mobile floating buttons: 48px × 48px */

/* Invisible touch area extension */
.btn--round::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
}
```

### Animation Patterns:
```css
/* Material Design easing */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Hover state */
.btn--floating:hover {
    transform: translateY(-2px) scale(1.05) !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
}

/* Active state */
.btn--floating:active {
    transform: translateY(0) scale(0.98) !important;
}
```

### Mobile Responsive Patterns:
```css
/* Standard breakpoints */
@media (max-width: 768px) {
    .btn--floating {
        width: 48px !important;
        height: 48px !important;
    }
}

/* Small mobile */
@media (max-width: 480px) {
    .btn--floating {
        width: 44px !important;
        height: 44px !important;
    }
}
```

---

## FAB Design Specifications

### Visual Design:
- **Position**: Fixed bottom-right (24px from edges on desktop, 16px on mobile)
- **Size**: 56x56px desktop, 48x48px mobile (exceeds 44px touch target requirement)
- **Icon**: ✏️ (pencil emoji for edit indication)
- **Colors**: 
  - Background: `rgba(255, 255, 255, 0.9)` with `backdrop-filter: blur(10px)`
  - Icon: `var(--primary-color)` (#667eea)
  - Shadow: `0 2px 8px rgba(0, 0, 0, 0.15)`
- **Z-index**: 1010 (same as other floating buttons)

### Expansion Behavior:
- **Direction**: Expand upward and leftward
- **Animation**: Material Design cubic-bezier(0.4, 0, 0.2, 1) timing
- **Actions** (4 primary actions):
  1. ➕ Add Activity (opens new card form)
  2. 👤 Add User (opens user creation)
  3. ✅ Complete Day (moves to tomorrow)
  4. 👁️ Return to View Mode (exits edit mode)

### Sub-FAB Specifications:
- **Size**: 40x40px (maintains 44px touch target with invisible extension)
- **Spacing**: 16px between sub-FABs
- **Labels**: Text labels appear on hover/focus (desktop) or always visible (mobile)
- **Animation**: Staggered appearance (50ms delay between each)

### Accessibility Requirements:
- **ARIA labels**: All buttons have descriptive aria-label attributes
- **Keyboard navigation**: 
  - Tab through FAB and sub-FABs
  - Enter/Space to activate
  - Escape to close expanded FAB
- **Touch targets**: Invisible 44px minimum touch area on all buttons
- **Screen reader**: Announce state changes ("Edit menu opened", "Edit menu closed")
- **Focus indicators**: Visible focus ring on keyboard navigation

### State Management:
```javascript
// New state properties needed
this.ui.fabExpanded = false;
this.ui.fabAnimating = false;
```

---

## Implementation Approach

### Files to Modify:

1. **components.js**
   - Add new `EditModeFAB` class
   - Remove `createManagementCard` method
   - Add FAB to window globals

2. **StackMapApp.js**
   - Initialize FAB in constructor
   - Update `enterGrownupMode()` to show FAB instead of management cards
   - Update `exitGrownupMode()` to hide FAB
   - Add FAB action handlers

3. **styles/buttons.css**
   - Add `.btn--fab` base class
   - Add `.btn--fab-sub` for sub-buttons
   - Add `.btn--fab-label` for text labels
   - Add expansion state classes

4. **styles/layout.css**
   - Add FAB positioning rules
   - Add z-index assignments
   - Add mobile adjustments

5. **renderer.js**
   - Remove management card rendering logic
   - Ensure FAB doesn't interfere with card rendering

6. **state.js**
   - Add `fabExpanded` and `fabAnimating` to UI state

### New Component Requirements:

```javascript
class EditModeFAB {
    constructor(appInstance) {
        this.app = appInstance;
        this.isExpanded = false;
        this.isAnimating = false;
        this.fab = null;
        this.subFabs = [];
        this.backdrop = null;
    }
    
    init() {
        this.render();
        this.setupEventListeners();
        this.hide(); // Hidden by default
    }
    
    render() {
        // Create main FAB
        // Create sub-FABs (hidden initially)
        // Create backdrop for mobile
        // Append to body
    }
    
    setupEventListeners() {
        // Main FAB click
        // Sub-FAB clicks
        // Keyboard navigation
        // Backdrop click (mobile)
        // Window resize
    }
    
    show() {
        // Show FAB when entering edit mode
    }
    
    hide() {
        // Hide FAB when exiting edit mode
    }
    
    expand() {
        // Expand to show sub-FABs
        // Stagger animations
        // Update ARIA states
    }
    
    collapse() {
        // Collapse sub-FABs
        // Reverse animations
        // Update ARIA states
    }
    
    handleAction(action) {
        // Route to appropriate app method
        // Collapse after action
    }
    
    destroy() {
        // Cleanup
    }
}
```

### CSS Changes Required:

```css
/* New classes in buttons.css */
.btn--fab {
    /* Extend .btn--floating */
    bottom: 24px !important;
    right: 24px !important;
}

.btn--fab-sub {
    position: fixed !important;
    width: 40px !important;
    height: 40px !important;
    opacity: 0;
    transform: scale(0) translateY(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn--fab-sub.visible {
    opacity: 1;
    transform: scale(1) translateY(0);
}

.btn--fab-label {
    position: absolute;
    right: 100%;
    margin-right: 12px;
    white-space: nowrap;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
}

/* Mobile adjustments */
@media (max-width: 768px) {
    .btn--fab {
        bottom: 16px !important;
        right: 16px !important;
        width: 48px !important;
        height: 48px !important;
    }
    
    .btn--fab-label {
        opacity: 1; /* Always visible on mobile */
    }
}
```

### State Management Changes:

```javascript
// In state.js
this.ui = {
    editMode: false,
    fabExpanded: false,      // NEW
    fabAnimating: false,     // NEW
    editingCardIndex: -1,
    showingNewCardForm: false,
    selectedEmoji: CONFIG.DEFAULT_EMOJI,
    draggedElement: null,
    cardFilter: '',
    currentDay: 'today'
};
```

### Testing Requirements:

1. **Accessibility Testing**:
   - Verify all touch targets are 44px minimum
   - Test keyboard navigation flow
   - Verify screen reader announcements
   - Test with high contrast mode

2. **Functionality Testing**:
   - All edit mode actions work from FAB
   - FAB appears/disappears correctly with edit mode
   - Expansion/collapse animations smooth
   - Mobile backdrop works correctly

3. **Visual Testing**:
   - FAB doesn't overlap important content
   - Sub-FABs positioned correctly
   - Labels readable on all backgrounds
   - Proper z-index layering

4. **Performance Testing**:
   - Animations don't cause jank
   - FAB doesn't interfere with scrolling
   - Quick response to user interactions

---

## Migration from Management Cards

### Components to Remove:

1. **ComponentBuilder.createManagementCard()** method (lines 130-211 in components.js)
2. **Management card rendering** in renderer.js (lines 52-83)
3. **Filter input event handlers** in management cards

### CSS to Remove:

```css
/* From cards.css */
.management-card
.management-card--top
.management-card--bottom
.management-card__header
.management-card__icon
.management-card__title
.management-card__actions
.management-card__filter

/* From buttons.css */
.btn--management
.btn--add-card
.btn--complete-day
```

### State Properties to Modify:

- Move `cardFilter` functionality to a dedicated filter button in FAB menu
- Ensure filter state persists when toggling edit mode

### Functionality to Preserve:

1. **Add Activity** - Opens new card form (preserve top/bottom logic)
2. **Complete Day** - Shows confirmation then moves to tomorrow
3. **Filter Activities** - Move to dedicated filter interface
4. **Return to View Mode** - Exit edit mode and clear filters

### Migration Steps:

1. **Phase 1**: Implement FAB alongside management cards
2. **Phase 2**: Test FAB functionality thoroughly
3. **Phase 3**: Hide management cards, use FAB only
4. **Phase 4**: Remove management card code after validation
5. **Phase 5**: Clean up unused CSS

### Backwards Compatibility:

- Maintain same action method names in StackMapApp
- Preserve validation flow for entering edit mode
- Keep same keyboard shortcuts if any exist
- Ensure state management remains compatible

---

## Summary

This implementation brief provides a complete blueprint for migrating from management cards to a FAB-based edit mode interface. The FAB approach offers:

1. **Better mobile experience** - More screen space for content
2. **Modern UI pattern** - Familiar to users from other apps
3. **Improved accessibility** - Clear focus states and keyboard navigation
4. **Cleaner codebase** - Removes complex management card logic

The implementation follows all existing StackMap patterns and maintains the special needs focus with large touch targets, clear visual feedback, and simple interactions.