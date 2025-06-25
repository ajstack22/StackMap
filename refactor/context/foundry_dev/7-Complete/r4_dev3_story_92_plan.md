# Implementation Plan: Story #92 - Bulk Delete & Copy to Tomorrow

## Overview
Implement bulk operations functionality for the edit mode menu, enabling users to select multiple activities for deletion or copying to tomorrow. This will replace the current placeholder actions with full-featured bulk operations.

## Current State Analysis
- Edit mode menu has placeholder "Bulk delete coming soon!" and "Copy to tomorrow coming soon!" notifications
- Both actions are context-aware disabled when no activities exist
- Menu items already have keyboard shortcuts (D for bulk delete, T for copy tomorrow)
- Activity system supports SQLite and localStorage backends
- Need to create shared bulk selection infrastructure

## Files to Create/Modify

### New Files
1. **js/bulk-operations.js** - Core bulk selection system
   - BulkSelectMode class for managing selected items
   - UI overlay system for checkboxes
   - Header controls (select all/none, count display)
   - Mode activation/deactivation

2. **js/bulk-delete.js** - Bulk delete implementation
   - Confirmation dialog with item list
   - Batch deletion logic with transaction safety
   - Rollback on failure
   - Success feedback

3. **js/copy-tomorrow.js** - Copy to tomorrow implementation
   - Activity duplication logic
   - ID generation for copies
   - Confirmation dialog
   - Progress feedback for large operations

4. **css/bulk-operations.css** - Bulk mode styling
   - Checkbox overlays on activity cards
   - Selected state visual feedback
   - Bulk header toolbar
   - Confirmation dialog styles
   - Mobile-optimized touch targets

### Modified Files
1. **js/edit-mode-menu.js** - Connect to bulk operations
   - Replace placeholder notifications with actual functionality
   - Integration with BulkOperations.start()
   - Update disabled logic to check for bulk mode conflicts

2. **index.html** - Include new script and style files
   - Add bulk-operations.css
   - Add bulk-operations.js, bulk-delete.js, copy-tomorrow.js
   - Maintain proper loading order

## Implementation Steps

### Phase 1: Core Bulk Selection System
1. **Create BulkSelectMode class** (js/bulk-operations.js)
   - Constructor takes action type ('delete' or 'copy')
   - selectedIds Set for tracking selections
   - toggle(), selectAll(), selectNone() methods
   - getSelectedActivities() method

2. **Implement UI overlay system**
   - Create checkbox overlays for existing activity cards
   - Add bulk mode header with controls
   - Handle click events for selection
   - Visual feedback for selected items

3. **Mode lifecycle management**
   - enter() method to activate bulk mode
   - exit() method to clean up and return to normal
   - State tracking to prevent conflicts

### Phase 2: Bulk Delete Implementation
1. **Create confirmation dialog** (js/bulk-delete.js)
   - List selected activity titles
   - Clear warning about permanent deletion
   - Cancel/Delete buttons with proper focus

2. **Implement batch deletion**
   - Transaction wrapper for SQLite operations
   - Fallback for localStorage
   - Progress indicator for large batches
   - Rollback mechanism on failures

3. **UI updates and feedback**
   - Smooth removal animations
   - Success notification with count
   - Activity list refresh
   - Return to normal mode

### Phase 3: Copy to Tomorrow Implementation
1. **Create duplication logic** (js/copy-tomorrow.js)
   - Deep copy activities with new IDs
   - Set timeframe to 'tomorrow'
   - Preserve all other properties

2. **Batch insertion**
   - Transaction safety for multiple inserts
   - Progress feedback for large operations
   - Error handling with partial success

3. **Confirmation and feedback**
   - Show count and summary
   - Success notification
   - Option to switch to tomorrow view

### Phase 4: Integration and Polish
1. **Update edit mode menu handlers**
   - Replace placeholder actions
   - Integrate with BulkOperations.start()
   - Update tooltips and labels

2. **Mobile optimizations**
   - 44px minimum touch targets for checkboxes
   - Finger-friendly selection areas
   - Responsive confirmation dialogs

3. **ADHD-friendly enhancements**
   - Clear visual selection states
   - Persistent count display
   - Confirmation prevents accidental actions
   - Easy exit from bulk mode

## Technical Architecture

### BulkOperations System
```javascript
class BulkOperations {
  constructor() {
    this.mode = null; // 'delete' | 'copy' | null
    this.selectedIds = new Set();
    this.overlay = null;
    this.header = null;
  }
  
  start(actionType) {
    // Enter bulk mode
    this.mode = actionType;
    this.createOverlay();
    this.showHeader();
    this.bindEvents();
  }
  
  exit() {
    // Clean up and return to normal
    this.removeOverlay();
    this.hideHeader();
    this.unbindEvents();
    this.mode = null;
    this.selectedIds.clear();
  }
}
```

### Event Flow
1. User clicks "Bulk Delete" or "Copy to Tomorrow" in edit menu
2. BulkOperations.start(actionType) called
3. UI enters bulk selection mode with checkboxes
4. User selects activities and clicks action button
5. Confirmation dialog shows with selected items
6. On confirm, batch operation executes with progress feedback
7. Success/error feedback shown
8. Return to normal edit mode

### Data Safety
- SQLite transactions for atomic operations
- Rollback on any failure in batch
- Validation before deletion/copying
- Backup references for error recovery

## Dependencies
- **ActivityDisplay** - For accessing current activities
- **EditMode** - Must be active for bulk operations
- **ActivitySQLite** - For database operations
- **Modal system** - For confirmation dialogs
- **Notification system** - For success/error feedback

## Risk Mitigation

### Data Loss Prevention
- Multiple confirmation steps for deletion
- Clear indication of what will be deleted
- Transaction rollback on partial failures
- No bulk operations outside of edit mode

### Performance Concerns
- Limit selections to reasonable numbers (100 max)
- Progressive rendering for large batches
- Debounced UI updates during selection
- Memory cleanup after operations

### User Experience
- Clear visual feedback for all states
- Easy escape from bulk mode (ESC key)
- Undo support for bulk delete (if UndoManager exists)
- Progress indicators for slow operations

### Mobile Performance
- Touch-optimized selection areas
- Smooth animations even with many items
- Responsive dialogs that fit small screens
- Battery-conscious update patterns

## Testing Strategy

### Core Functionality
- [ ] Bulk mode activates from edit menu
- [ ] Checkboxes appear on all activity cards
- [ ] Individual selection works correctly
- [ ] Select all/none buttons work
- [ ] Count display updates accurately
- [ ] Exit mode cleans up properly

### Bulk Delete
- [ ] Confirmation dialog shows selected items
- [ ] Deletion works with 1, 5, 20+ items
- [ ] Transaction rollback on failure
- [ ] UI updates correctly after deletion
- [ ] Works with both SQLite and localStorage

### Copy to Tomorrow
- [ ] Activities copied with new IDs
- [ ] All properties preserved correctly
- [ ] Timeframe set to 'tomorrow'
- [ ] Large batches handle gracefully
- [ ] Source activities remain unchanged

### Edge Cases
- [ ] No activities selected (disable action)
- [ ] All activities selected
- [ ] Database errors during operations
- [ ] Network issues (if applicable)
- [ ] Memory pressure with large selections

### Mobile Testing
- [ ] Touch targets meet 44px minimum
- [ ] Selection works on various screen sizes
- [ ] Dialogs display properly on mobile
- [ ] Performance acceptable on older devices

### Safe Mode Compatibility
- [ ] 60px touch targets in safe mode
- [ ] No animations in safe mode
- [ ] Clear visual feedback maintained
- [ ] All features accessible

## Accessibility Requirements

### Screen Reader Support
- Checkboxes have proper labels
- Selection count announced
- Confirmation dialogs read correctly
- Progress updates announced

### Keyboard Navigation
- TAB through checkboxes
- SPACE to toggle selection
- ESC to exit bulk mode
- Arrow keys in confirmation dialogs

### Visual Design
- High contrast selection states
- Clear focus indicators
- Consistent with existing UI patterns
- Color is not the only selection indicator

## Definition of Done

### Acceptance Criteria
- [x] Research and planning complete
- [ ] Bulk Delete mode from Edit Mode Menu
- [ ] Copy to Tomorrow from Edit Mode Menu
- [ ] Multi-select interface with checkboxes
- [ ] Select all/none options
- [ ] Action confirmation dialogs
- [ ] Visual feedback during operations
- [ ] Exit bulk mode when complete
- [ ] Count of selected items shown

### Quality Gates
- [ ] All edge cases handled
- [ ] Mobile responsive design
- [ ] ADHD-friendly interaction patterns
- [ ] No data loss risks
- [ ] Performance acceptable with 50+ activities
- [ ] Safe mode compatibility
- [ ] Accessibility compliance
- [ ] Code review passed

## Future Enhancements (Out of Scope)
- Bulk edit (change properties of multiple items)
- Copy to specific dates beyond tomorrow
- Drag & drop bulk selection
- Bulk operations on filtered views
- Import/export selected activities

## Questions for PM Review
1. Should there be a maximum limit on bulk selections for performance?
2. For copy operations, should we show a preview of what will be copied?
3. Should bulk delete integrate with undo system if available?
4. Any specific animation preferences for selection feedback?
5. Should bulk operations be available outside edit mode?