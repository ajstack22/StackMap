# Story: Left Menu - Activity Management

## User Story
As a parent in edit mode, I want a clear menu of activity management options so that I can quickly add, organize, and manage my child's daily activities.

## Acceptance Criteria
- [ ] Menu slides in from left when button tapped
- [ ] Shows activity management options
- [ ] Only available in edit/grownup mode
- [ ] Clear section groupings
- [ ] Backdrop to dismiss menu
- [ ] Smooth slide animation

## Technical Requirements

### Implementation
```javascript
// Menu items structure
{
  sections: [
    {
      title: 'Add Activities',
      items: [
        { icon: '➕', label: 'Add Activity', action: 'add-activity' },
        { icon: '⚡', label: 'Quick Add', action: 'quick-templates' },
        { icon: '📚', label: 'Browse Library', action: 'activity-library' }
      ]
    },
    {
      title: 'Organize',
      items: [
        { icon: '🔄', label: 'Reorder Mode', action: 'reorder' },
        { icon: '📌', label: 'Pin Activities', action: 'pin-mode' },
        { icon: '🗑️', label: 'Bulk Delete', action: 'bulk-delete' }
      ]
    },
    {
      title: 'Day Planning',
      items: [
        { icon: '✅', label: 'Complete Day', action: 'complete-day' },
        { icon: '📋', label: 'Copy to Tomorrow', action: 'copy-tomorrow' }
      ]
    }
  ]
}
```

### Mobile Considerations
- 80% screen width on mobile
- Full height with scroll if needed
- Swipe right to close
- Touch-friendly spacing

## ADHD Accommodations
- Clear icons for each action
- Grouped related functions
- No nested menus
- Visual feedback on tap
- Common actions at top

## Definition of Done
- [ ] Menu opens/closes smoothly
- [ ] All actions connected
- [ ] Keyboard accessible
- [ ] Respects edit mode state
- [ ] Works with gesture navigation

## References
- Part of unified header system
- Replaces scattered edit buttons