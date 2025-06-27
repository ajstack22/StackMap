# Story #90: Pin/Keep Activities Feature

## Story Overview
**Round**: 4  
**Developer**: 1  
**Priority**: High - Core feature for daily routines

## Background
The Edit Mode Menu has a placeholder for "Pin Activities". This feature allows users to mark activities that should automatically copy to tomorrow, essential for daily routines like "brush teeth" or "take medicine".

## User Story
As a parent, I want to pin recurring activities so that daily routines automatically appear in tomorrow's plan without manual re-entry.

## Acceptance Criteria
- [ ] Pin button appears on each activity card in edit mode
- [ ] Visual indicator shows pinned state (gold border/background)
- [ ] Pin state toggles with single tap
- [ ] Pin state persists in database
- [ ] Edit Mode Menu "Pin Activities" opens bulk pin mode
- [ ] In bulk pin mode, tap activities to toggle pin state
- [ ] Exit bulk pin mode with done button
- [ ] Pinned activities are clearly distinguishable

## Technical Requirements

### Data Model Update
```javascript
// Add to activity object
{
  id: 123,
  title: "Brush Teeth",
  pinned: false,  // New field
  // ... existing fields
}
```

### Implementation Details
1. **Pin Button on Cards**
   - Small pin icon in corner (📌)
   - 44px touch target (60px in safe mode)
   - Toggle on tap
   - Visual feedback (color change)

2. **Bulk Pin Mode**
   - Triggered from Edit Mode Menu
   - Shows all activities with pin state
   - Tap to toggle
   - "Done" button to exit
   - Count of pinned activities

3. **Visual States**
   - Unpinned: Normal appearance
   - Pinned: Gold border or background
   - Pin icon changes color
   - Accessible contrast ratios

### Files to Modify/Create
- `js/activity-pin.js` - Pin functionality
- `js/activity-display.js` - Add pin button rendering
- `js/activity-sqlite.js` - Schema update for pinned field
- `js/edit-mode-menu.js` - Connect pin menu action
- `css/activity-pin.css` - Pin styling
- `index.html` - Include new files

## Implementation Guidelines
1. Pin state is independent of completion
2. Pins persist across all days
3. Visual indicator must be clear but not overwhelming
4. Bulk mode for managing multiple pins
5. Consider colorblind users (not just color)

## Testing Requirements
- [ ] Pin button appears in edit mode
- [ ] Pin state toggles correctly
- [ ] Visual feedback immediate
- [ ] Pin state persists in database
- [ ] Bulk pin mode works
- [ ] Edit menu action connected
- [ ] Mobile touch targets adequate
- [ ] Safe mode sizing works

## ADHD Considerations
- Single tap action (not hold or swipe)
- Clear visual feedback
- Reduces daily setup burden
- Consistent routine support

## Integration Notes
- Works with existing edit mode
- Compatible with reorder mode
- Pin state survives migrations
- Will be used by Complete Day feature

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Pin feature intuitive to use
- [ ] Visual states clear
- [ ] Database migration safe
- [ ] Mobile responsive
- [ ] Code review passed

## Time Estimate
- Implementation: 6 hours
- Testing: 2 hours
- Total: 8 hours