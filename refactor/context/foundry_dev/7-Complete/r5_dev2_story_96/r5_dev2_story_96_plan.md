# Story #96 - Direct Card Edit Controls Implementation Plan
**Developer**: Dev 2  
**Round**: 5  
**Priority**: High - UX restoration  
**Estimated Effort**: 3-4 days  

## Overview
Restore direct card manipulation capabilities lost in the refactor. Implement individual card edit controls, drag-and-drop reordering, and inline editing to bring back the intuitive interaction patterns that made StackMap effective for ADHD users.

## Phase 1: Card Edit Controls Foundation (Day 1)

### 1.1 Enhanced Edit Mode System
**File**: `js/edit-mode.js`
- Add card-level edit state management
- Implement visual transformation system for cards entering edit mode
- Create edit control visibility system
- Add event coordination between global edit mode and individual cards

### 1.2 Card Edit Controls Structure
**File**: `js/activity-cards.js`
- Add `createCardEditControls()` method to generate edit buttons
- Implement edit control positioning logic (mobile-first, thumb-accessible)
- Create touch target sizing (44px minimum, 60px in safe mode)
- Add accessibility attributes for edit controls

### 1.3 Visual Edit Mode Styling
**File**: `css/edit-mode.css`
- Card transformation styles (borders, shadows, backgrounds)
- Edit control button positioning and styling
- Smooth transitions between normal and edit states
- Mobile-first responsive design

## Phase 2: Direct Card Actions (Day 2)

### 2.1 Individual Card Action Handlers
**File**: `js/activity-cards.js`
- Edit button: Trigger inline editing or edit modal
- Delete button: Confirmation dialog and removal
- Duplicate button: Clone activity with new ID
- Move button: Quick day selector (today/tomorrow)

### 2.2 Inline Editing System
**File**: `js/inline-card-edit.js` (new)
- In-place title editing with auto-save
- Description preview/edit toggle functionality
- Time estimate quick adjustment controls
- Keyboard navigation and escape handling

### 2.3 Card Action Styling
**File**: `css/cards.css`
- Edit button positioning and theming
- Inline edit field styling
- Loading states for card actions
- Error state indicators

## Phase 3: Drag & Drop Reordering (Day 3)

### 3.1 Drag System Implementation
**File**: `js/drag-drop-reorder.js`
- Touch and mouse drag detection
- Visual drag handles on cards
- Drag preview/ghost element creation
- Real-time drag position tracking

### 3.2 Drop Zone System
**File**: `js/drag-drop-reorder.js`
- Drop zone indicators between cards
- Visual feedback during drag operations
- Drop validation and animation
- Reorder persistence to database

### 3.3 Drag & Drop Styling
**File**: `css/drag-drop.css`
- Drag handle appearance and positioning
- Drop zone visual indicators
- Dragging state styles (opacity, transforms)
- Drop animation effects

## Phase 4: Context Menu System (Day 4)

### 4.1 Context Menu Core
**File**: `js/context-menu.js` (new)
- Right-click (desktop) and long-press (mobile) detection
- Dynamic menu content based on card state
- Menu positioning logic (viewport awareness)
- Keyboard navigation support

### 4.2 Context-Aware Actions
**File**: `js/context-menu.js`
- Different menu options based on card type
- Pin/unpin toggle for daily routine activities
- Quick status changes (pending/in-progress/completed)
- Time-based actions (add timer, mark urgent)

### 4.3 Context Menu Styling
**File**: `css/context-menu.css`
- Menu appearance and animations
- Mobile-friendly sizing and spacing
- Accessibility indicators
- Dark/light theme support

## Integration Points

### Coordinate with Story #95 (Dev 1)
- Ensure edit controls don't conflict with card numbering badges
- Plan badge positioning to accommodate edit buttons
- Share CSS classes for consistent positioning

### Coordinate with Story #97 (Dev 3)
- Reserve space for card type indicators
- Plan layout that accommodates both edit controls and type badges
- Ensure edit actions work properly with different card types

## Technical Specifications

### Touch Targets
- Minimum 44px for normal mode
- 60px for safe mode
- Proper spacing between controls
- Thumb-reachable positioning on mobile

### Accessibility
- Proper ARIA labels for all edit controls
- Keyboard navigation for all interactions
- Screen reader announcements for state changes
- High contrast support

### Performance
- Lazy loading of edit controls
- Efficient drag operations
- Minimal DOM manipulation during reordering
- Debounced auto-save for inline editing

### Mobile-First Design
- Touch-optimized interactions
- Gesture support (swipe, long-press)
- Responsive control positioning
- Safe area considerations for iOS

## Success Criteria

### User Experience
- ✅ Cards feel directly manipulable again
- ✅ Edit actions are discoverable and intuitive
- ✅ Drag and drop feels natural and responsive
- ✅ Context menus enhance workflow efficiency

### Technical Requirements
- ✅ All edit controls meet accessibility standards
- ✅ Smooth 60fps animations during interactions
- ✅ Works consistently across mobile and desktop
- ✅ Integrates seamlessly with existing edit mode

### ADHD/Autism Accommodations
- ✅ Visual feedback is immediate and clear
- ✅ Actions are reversible with undo support
- ✅ Controls are positioned for easy access
- ✅ Cognitive load is reduced through direct manipulation

## Risk Mitigation

### Potential Issues
1. **Performance**: Drag operations on low-end devices
   - Solution: Optimize with requestAnimationFrame and debouncing

2. **Accessibility**: Complex interactions may be hard to navigate
   - Solution: Provide keyboard alternatives for all touch gestures

3. **Integration**: Conflicts with existing systems
   - Solution: Careful coordination with other devs and thorough testing

### Fallback Plans
- If drag-drop proves too complex, implement move up/down buttons
- If inline editing is problematic, fall back to modal edit
- Context menus can be simplified to essential actions only

## Files to Create/Modify

### New Files
- `js/inline-card-edit.js` - Inline editing functionality
- `js/context-menu.js` - Context menu system
- `css/context-menu.css` - Context menu styling
- `css/drag-drop.css` - Drag and drop specific styles

### Modified Files
- `js/activity-cards.js` - Add edit controls and interactions
- `js/edit-mode.js` - Enhance edit mode for card-level controls
- `css/edit-mode.css` - Visual edit state styling
- `css/cards.css` - Edit control positioning

### Integration Files
- `index.html` - Include new CSS and JS files
- `js/left-menu.js` - Coordinate with menu-based edit actions
- `js/edit-mode-menu.js` - Ensure menu and direct actions work together

This plan restores the direct manipulation capabilities that made StackMap intuitive while maintaining the new architecture's benefits and ensuring full accessibility compliance.