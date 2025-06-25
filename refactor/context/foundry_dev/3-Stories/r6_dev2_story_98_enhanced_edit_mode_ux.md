# Round 6 Dev 2 - Story #98: Enhanced Edit Mode UX

## Story Overview
**Priority**: High - Core UX restoration completion  
**Developer**: Dev 2  
**Estimated Effort**: 3-4 days  
**Dependencies**: Round 5 complete (card numbering/types established)  

## Problem Statement
While Round 5 restored card identification systems, the edit mode still lacks the direct manipulation capabilities that made the original StackMap intuitive for ADHD users. The current menu-driven approach creates friction in common editing workflows. We need to restore visual edit states and direct card-level interactions while maintaining the safety and organization of the current system.

## Acceptance Criteria

### ✅ **Visual Edit Mode Transformation**
- [ ] Cards visually transform when edit mode is activated
- [ ] Clear edit state indicators (borders, shadows, background changes)
- [ ] Smooth transitions between normal and edit states
- [ ] Edit controls appear/disappear based on edit mode state
- [ ] Visual hierarchy clearly distinguishes editable elements

### ✅ **Individual Card Edit Controls**
- [ ] Edit buttons appear on each card in edit mode
- [ ] Actions: Quick Edit, Duplicate, Move Day, Delete
- [ ] Mobile-optimized placement (thumb-accessible zones)
- [ ] Touch targets meet accessibility requirements (44px minimum)
- [ ] Clear visual feedback for button interactions

### ✅ **Inline Quick Edit**
- [ ] Title editing with in-place text fields
- [ ] Time estimate quick adjustment (+15m, +30m, +1h buttons)
- [ ] Day/timeframe quick toggle (Today ↔ Tomorrow)
- [ ] Priority quick change (Low/Medium/High)
- [ ] Auto-save with visual confirmation

### ✅ **Enhanced Drag & Drop**
- [ ] Visual drag handles on cards in edit mode
- [ ] Drag preview with semi-transparent card content
- [ ] Drop zone indicators between cards
- [ ] Real-time reordering with smooth animations
- [ ] Keyboard reordering alternative (Ctrl+Up/Down)

### ✅ **Context Menu System**
- [ ] Right-click (desktop) / long-press (mobile) context menus
- [ ] Context-aware actions based on card state and type
- [ ] Menu positioning that avoids screen edges
- [ ] Keyboard navigation within menus (arrow keys, Enter, Escape)
- [ ] Quick dismiss on outside click/tap or Escape

### ✅ **Edit Mode Integration**
- [ ] Works seamlessly with existing edit mode system
- [ ] Maintains menu-driven actions as backup
- [ ] No conflicts with card numbering (Story #95)
- [ ] Compatible with type indicators (Story #97)
- [ ] Preserves pin functionality (Story #90)

## Technical Implementation

### **File Changes Required**
- `js/inline-card-edit.js` (NEW) - Core inline editing functionality
- `js/enhanced-drag-drop.js` (NEW) - Improved drag and drop system
- `js/context-menu.js` (NEW) - Context menu system
- `css/inline-edit.css` (NEW) - Inline editing styles
- `css/drag-drop.css` (NEW) - Drag and drop styling
- `css/context-menu.css` (NEW) - Context menu styling
- `js/edit-mode.js` (ENHANCED) - Integration with new edit controls
- `js/activity-cards.js` (ENHANCED) - Card edit control rendering

### **Data Model Updates**
```javascript
// Enhanced edit state management
{
  editMode: {
    active: boolean,
    cardStates: {
      [cardId]: {
        isEditing: boolean,
        editType: 'inline' | 'context' | 'drag',
        hasUnsavedChanges: boolean,
        originalValues: object
      }
    }
  }
}
```

### **Key Functions to Implement**
```javascript
// Inline editing
InlineCardEdit.startEdit(cardId, field)
InlineCardEdit.saveEdit(cardId, field, value)
InlineCardEdit.cancelEdit(cardId)

// Context menus
ContextMenu.show(event, cardId, actions)
ContextMenu.hide()
ContextMenu.executeAction(action, cardId)

// Enhanced drag and drop
EnhancedDragDrop.initializeDragHandles()
EnhancedDragDrop.startDrag(cardElement)
EnhancedDragDrop.handleDrop(targetIndex)
```

## User Experience Requirements

### **Visual Design**
- Edit state indicators use subtle but clear visual cues
- Consistent button styling that matches StackMap design language
- Smooth animations (unless reduced motion preference)
- Clear visual hierarchy between actions and content

### **Interaction Patterns**
- Progressive disclosure: simple actions visible, advanced in context menus
- Immediate visual feedback for all interactions
- Undo support for destructive actions
- Consistent gesture patterns across mobile and desktop

### **Mobile-First Design**
- Touch-friendly button sizes (44px minimum)
- Gesture conflict prevention
- Thumb-accessible button placement
- Appropriate haptic feedback where supported

### **Accessibility**
- Full keyboard navigation support
- Screen reader compatibility with announcements
- High contrast mode support
- Focus management during edit operations

## Success Metrics

### **Functional Verification**
- [ ] All edit controls function correctly across devices
- [ ] Inline editing saves changes reliably
- [ ] Drag and drop works smoothly with 20+ cards
- [ ] Context menus appear and position correctly
- [ ] No conflicts with existing features

### **User Experience Verification**
- [ ] Edit mode transformation is immediately obvious
- [ ] Common edit tasks can be completed in 2 clicks or less
- [ ] Smooth performance during edit operations
- [ ] Intuitive interaction patterns for new users

### **Performance Verification**
- [ ] Edit mode activation under 200ms
- [ ] Drag operations maintain 60fps
- [ ] No memory leaks during extended editing sessions
- [ ] Responsive on target mobile devices

## Testing Requirements

### **Unit Tests**
- Inline edit state management
- Context menu positioning logic
- Drag and drop reordering
- Edit control rendering
- Keyboard navigation handlers

### **Integration Tests**
- Works with card numbering system
- Compatible with type indicators
- Maintains pin functionality
- No conflicts with activity display

### **Manual Testing**
- [ ] Test inline editing on various field types
- [ ] Test context menus on mobile and desktop
- [ ] Test drag and drop with different list sizes
- [ ] Test keyboard navigation throughout
- [ ] Test accessibility with screen readers
- [ ] Test on target mobile devices

## Dependencies & Coordination

### **Technical Dependencies**
- Round 5 card numbering system (Story #95)
- Activity types system (Story #97)
- Existing edit mode infrastructure
- ActivityDisplay rendering system

### **Round 6 Coordination**
- **Story #101 (Dev 1)**: Performance optimizations may affect edit operations
- **Story #99 (Dev 3)**: Card library may use similar edit patterns
- Shared CSS classes for edit states and transitions

## Implementation Phases

### **Phase 1: Visual Edit States**
- Implement card visual transformation
- Add edit control containers
- Basic edit mode integration

### **Phase 2: Inline Editing**
- Title and time estimate quick edit
- Auto-save functionality
- Visual feedback system

### **Phase 3: Context Menus**
- Right-click/long-press detection
- Menu rendering and positioning
- Action execution

### **Phase 4: Enhanced Drag & Drop**
- Visual drag handles
- Drag preview and drop zones
- Keyboard reordering

## Risk Assessment

### **Technical Risks**
- Complexity of multiple edit interaction modes
- Performance impact of DOM manipulation
- Mobile gesture conflicts
- State management complexity

### **Mitigation Strategies**
- Progressive enhancement approach
- Efficient DOM updates with DocumentFragment
- Gesture detection with appropriate delays
- Centralized edit state management
- Comprehensive testing on target devices

## Definition of Done

### **Code Quality**
- [ ] Mobile-first implementation with responsive design
- [ ] Accessibility requirements fully met
- [ ] Performance benchmarks achieved
- [ ] Comprehensive error handling

### **Integration**
- [ ] Seamless integration with existing systems
- [ ] No breaking changes to current functionality
- [ ] Backward compatibility maintained
- [ ] Clean integration points for future features

### **User Experience**
- [ ] Intuitive direct manipulation restored
- [ ] Smooth, responsive interactions
- [ ] Clear visual feedback for all operations
- [ ] Enhanced productivity for common edit tasks

---

**Story #98 restores the direct manipulation interface that made StackMap distinctive while maintaining the safety and organization improvements of the refactor.**