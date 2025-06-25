# Round 5 Dev 2 - Story #96: Direct Card Edit Controls

## Story Overview
**Priority**: High - UX restoration  
**Developer**: Dev 2  
**Estimated Effort**: 3-4 days  
**Dependencies**: Round 4 complete, Story #95 badges positioned  

## Problem Statement
The refactor has moved to a centralized menu-driven edit system, losing the original StackMap's direct card manipulation capabilities. Users can no longer interact directly with individual cards for editing, creating workflow friction and reducing the intuitive nature of the interface that was particularly effective for ADHD users.

## Acceptance Criteria

### ✅ **Individual Card Edit Controls**
- [ ] Edit buttons appear on each card when edit mode is active
- [ ] Common actions available per card: Edit, Delete, Duplicate, Move
- [ ] Buttons positioned for easy thumb access (mobile-first)
- [ ] Visual edit state indicators on cards
- [ ] Touch targets meet accessibility requirements (44px minimum)

### ✅ **Visual Edit Mode Transformation**
- [ ] Cards gain visual edit indicators when edit mode is active
- [ ] Subtle borders, shadows, or styling changes to show editability
- [ ] Drag handles appear for reordering
- [ ] Smooth transition between normal and edit states
- [ ] Clear visual hierarchy between view and edit modes

### ✅ **Drag & Drop Reordering**
- [ ] Visual drag handles on each card in edit mode
- [ ] Drag preview with card content
- [ ] Drop zone indicators between cards
- [ ] Real-time reordering with visual feedback
- [ ] Touch and mouse support
- [ ] Keyboard reordering alternative (up/down arrows)

### ✅ **Context Menu System**
- [ ] Right-click (desktop) / long-press (mobile) context menus
- [ ] Context-appropriate actions based on card state
- [ ] Menu positioning that doesn't go off-screen
- [ ] Keyboard navigation within context menus
- [ ] Quick dismiss on outside click/tap

### ✅ **Inline Card Editing**
- [ ] Quick edit capabilities directly on cards
- [ ] Title editing with in-place text fields
- [ ] Description preview/edit toggle
- [ ] Time estimate quick adjustment
- [ ] Save/cancel buttons with clear actions

## Technical Implementation

### **File Changes Required**
- `js/activity-cards.js` - Add card-level edit controls and interactions
- `js/edit-mode.js` - Enhance edit mode to support direct card controls
- `js/drag-drop.js` - Implement drag and drop reordering system
- `css/edit-mode.css` - Visual edit state styling
- `css/cards.css` - Edit control positioning and styling
- `js/context-menu.js` - Context menu system for cards

### **Data Model Updates**
```javascript
// Card edit state
{
  editMode: boolean,           // Global edit mode state
  cardEditState: {
    [cardId]: {
      isEditing: boolean,      // Individual card edit state
      hasUnsavedChanges: boolean,
      editFields: ['title', 'description', 'time']
    }
  }
}
```

### **Key Functions to Implement**
```javascript
// Core card edit functions
ActivityCard.enterEditMode(cardId)
ActivityCard.exitEditMode(cardId, save = true)
ActivityCard.showEditControls()
ActivityCard.hideEditControls()
ActivityCard.enableDragDrop()
ActivityCard.showContextMenu(event, cardId)
ActivityCard.handleInlineEdit(field, value)
```

## User Experience Requirements

### **Edit Control Layout**
- Edit buttons positioned in bottom-right corner of cards
- Drag handle positioned on left side for easy thumb access
- Context menu triggered by long-press or right-click
- Visual spacing that doesn't overcrowd cards

### **Interaction Patterns**
- Single tap on card for normal interaction
- Long press for context menu
- Tap edit button for inline editing
- Drag handle for reordering
- Clear visual feedback for all interactions

### **Mobile-First Design**
- Touch-friendly button sizes (44px minimum)
- Appropriate spacing for fat fingers
- Gesture conflicts avoided (no accidental activations)
- Thumb-friendly positioning for one-handed use

### **Accessibility**
- Screen reader support for edit controls
- Keyboard navigation for all edit functions
- High contrast mode compatibility
- Focus management during edit operations

## Success Metrics

### **Functional Verification**
- [ ] All edit controls function correctly
- [ ] Drag and drop reordering works smoothly
- [ ] Context menus appear and dismiss properly
- [ ] Inline editing saves changes correctly
- [ ] No conflicts with existing features

### **User Experience Verification**
- [ ] Edit controls are discoverable and intuitive
- [ ] Cards clearly indicate they're in edit mode
- [ ] Smooth transitions between states
- [ ] No accidental activations during normal use
- [ ] Responsive performance with 20+ cards

## Testing Requirements

### **Unit Tests**
- Card edit state management
- Drag and drop functionality
- Context menu positioning
- Inline editing validation
- Edit control event handling

### **Integration Tests**
- Works with existing edit mode system
- Compatible with pin system (Story #90)
- Maintains card numbering (Story #95)
- No conflicts with unified header

### **Manual Testing**
- [ ] Test edit controls on various card types
- [ ] Test drag and drop with different list sizes
- [ ] Test context menus on mobile and desktop
- [ ] Test inline editing with various content
- [ ] Test accessibility with screen readers
- [ ] Test keyboard navigation

## Dependencies & Coordination

### **Technical Dependencies**
- Story #95 (Card Numbering) - coordinate badge positioning
- Round 4 pin system - ensure edit controls don't conflict
- Existing edit mode system - enhance rather than replace

### **Round 5 Coordination**
- **Story #95 (Dev 1)**: Coordinate badge positioning with edit controls
- **Story #97 (Dev 3)**: Plan for card type indicators in layout
- Shared CSS classes for card edit states

## Risk Assessment

### **Technical Risks**
- Performance impact with complex drag/drop
- Touch gesture conflicts on mobile
- Z-index and positioning complexity
- State management complexity

### **Mitigation Strategies**
- Use CSS transforms for smooth drag animations
- Implement gesture detection with appropriate delays
- Centralize card edit state management
- Progressive enhancement for advanced features

## Implementation Phases

### **Phase 1: Basic Edit Controls**
- Add edit buttons to cards in edit mode
- Implement basic inline editing
- Visual edit state indicators

### **Phase 2: Context Menus**
- Right-click/long-press context menus
- Menu positioning and navigation
- Context-appropriate actions

### **Phase 3: Drag & Drop**
- Drag handles and visual feedback
- Drop zone indicators
- Reordering persistence

## Definition of Done

### **Code Quality**
- [ ] Mobile-first implementation
- [ ] Accessibility requirements met
- [ ] Performance benchmarks maintained
- [ ] Error handling for edge cases

### **Integration**
- [ ] Seamless integration with existing systems
- [ ] No breaking changes to current functionality
- [ ] Works with all current card types
- [ ] Maintains responsive design

### **User Experience**
- [ ] Intuitive direct card manipulation
- [ ] Clear visual feedback for all interactions
- [ ] Smooth performance on target devices
- [ ] Consistent with StackMap design principles

---

**Story #96 restores the direct manipulation interface that made StackMap intuitive and effective for users who prefer visual, hands-on interaction patterns.**