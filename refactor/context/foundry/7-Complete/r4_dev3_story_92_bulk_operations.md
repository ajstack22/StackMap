# Story #92: Bulk Delete & Copy to Tomorrow

## Story Overview
**Round**: 4  
**Developer**: 3  
**Priority**: Medium - Efficiency features

## Background
The Edit Mode Menu has placeholders for "Bulk Delete" and "Copy to Tomorrow". These features enable efficient management of multiple activities at once.

## User Story
As a user, I want to select multiple activities to delete them together or copy them to tomorrow, so I can manage my activities more efficiently.

## Acceptance Criteria
- [ ] Bulk Delete mode from Edit Mode Menu
- [ ] Copy to Tomorrow from Edit Mode Menu
- [ ] Multi-select interface with checkboxes
- [ ] Select all/none options
- [ ] Action confirmation dialogs
- [ ] Visual feedback during operations
- [ ] Exit bulk mode when complete
- [ ] Count of selected items shown

## Technical Requirements

### Bulk Select Mode
```javascript
// Shared bulk selection system
class BulkSelectMode {
  constructor(actionType) {
    this.actionType = actionType; // 'delete' or 'copy'
    this.selectedIds = new Set();
  }
  
  toggle(activityId) {
    if (this.selectedIds.has(activityId)) {
      this.selectedIds.delete(activityId);
    } else {
      this.selectedIds.add(activityId);
    }
  }
}
```

### Implementation Components
1. **Bulk Select UI**
   - Checkbox overlay on each activity
   - Header with count and actions
   - Select All / Select None buttons
   - Cancel and Action buttons

2. **Bulk Delete**
   - Confirmation: "Delete X activities?"
   - List titles of items to delete
   - Batch delete from database
   - Smooth removal animation

3. **Copy to Tomorrow**
   - Select activities to copy
   - Confirmation: "Copy X activities to tomorrow?"
   - Duplicate to tomorrow (new IDs)
   - Show success message

### Files to Create/Modify
- `js/bulk-operations.js` - Bulk selection logic
- `js/bulk-delete.js` - Delete functionality
- `js/copy-tomorrow.js` - Copy functionality  
- `js/edit-mode-menu.js` - Connect menu actions
- `css/bulk-operations.css` - Bulk mode styling
- `index.html` - Include new files

## Implementation Guidelines
1. Shared selection system for both features
2. Clear visual states for selected items
3. Prevent accidental deletions
4. Smooth animations for feedback
5. Handle edge cases (no selection)

## Testing Requirements
- [ ] Bulk mode activates from menu
- [ ] Checkboxes appear on activities
- [ ] Selection works correctly
- [ ] Select all/none work
- [ ] Delete confirmation works
- [ ] Items deleted properly
- [ ] Copy confirmation works
- [ ] Items copied with new IDs
- [ ] UI updates after operations
- [ ] Exit mode works

## Mobile Considerations
- Checkbox touch targets 44px
- Clear visual selection states
- Confirmation dialogs mobile-friendly
- Smooth performance with many items

## ADHD Considerations
- Clear what's selected
- Can't accidentally delete
- Visual counts help tracking
- Confirmation prevents mistakes

## Error Handling
- Transaction safety for bulk operations
- Rollback on failure
- Clear error messages
- Maintain selection on error

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Bulk operations smooth and safe
- [ ] Clear visual feedback
- [ ] Mobile responsive
- [ ] No data loss risks
- [ ] Code review passed

## Time Estimate
- Implementation: 10 hours
- Testing: 3 hours
- Total: 13 hours