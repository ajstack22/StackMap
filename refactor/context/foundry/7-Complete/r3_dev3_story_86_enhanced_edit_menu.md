# Story #86: Enhanced Edit Mode Menu

## Story Overview
**Round**: 3  
**Developer**: 3  
**Priority**: High - Improves edit mode usability

## Background
The original Story #83 planned an edit mode menu. Now that Story #79 has implemented Quick Add functionality, we need to create an edit menu that integrates with existing features rather than duplicating them.

## User Story
As a parent in edit mode, I want a centralized menu button that gives me quick access to all editing actions, including the already-implemented quick add feature.

## Acceptance Criteria
- [ ] Menu button appears in header during edit mode
- [ ] Hidden when not in edit mode
- [ ] Opens dropdown with edit actions
- [ ] Integrates with existing Quick Add panel
- [ ] Includes: Add Activity, Quick Add (opens existing panel), Reorder
- [ ] Actions work with new "activity" terminology
- [ ] Mobile-optimized layout
- [ ] Smooth animations

## Research Requirements
Before creating your plan, research:

1. **Edit Mode System**:
   - How edit mode is triggered
   - What UI changes in edit mode
   - Current edit mode indicators

2. **Existing Features**:
   - Quick Add implementation from Story #79
   - Current Add Activity button location
   - Activity reorder functionality

3. **Activity System**:
   - Ensure using "activity" not "task"
   - ActivityDisplay methods
   - Activity-related events

4. **Header Layout**:
   - Current header structure
   - Available space in edit mode
   - Mobile constraints

## Key Integrations

### With Quick Add (Story #79)
- Menu item triggers `QuickAddUI.open()`
- Don't duplicate quick add functionality
- Use existing panel implementation

### With Activity System
- Use ActivityDisplay methods
- Listen for 'activitiesChanged' events
- Reference activities, not tasks

### With Day Selector
- Ensure menu doesn't conflict with day selector
- Proper positioning on mobile

## Implementation Notes
1. Use "activity" terminology throughout
2. Connect to existing Quick Add panel
3. Ensure all methods reference ActivityDisplay
4. Test with current edit mode flow

## Definition of Done
- [ ] Menu appears/hides with edit mode
- [ ] All actions properly connected
- [ ] Quick Add opens existing panel
- [ ] Add Activity uses current flow
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Uses activity terminology
- [ ] No regressions

## Time Estimate
- Research: 1.5 hours
- Implementation: 4 hours
- Testing: 1.5 hours

---
Note: This story builds on the R1 implementations, particularly the Quick Add panel and activity system updates.