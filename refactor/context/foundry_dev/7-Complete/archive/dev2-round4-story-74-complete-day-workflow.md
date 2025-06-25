# Story: Add Complete Day Button

## User Story
As a parent, I want a "Complete Day" button so that my child can feel closure at the end of each day and we can easily transition tomorrow's plan to today.

## Acceptance Criteria
- [ ] Button appears when viewing today + tomorrow has activities
- [ ] Shows confirmation dialog before proceeding
- [ ] Moves all tomorrow's activities to today
- [ ] Keeps pinned activities for new tomorrow
- [ ] Removes completed unpinned activities
- [ ] Triggers celebration on completion

## Technical Requirements

### Implementation
```javascript
function completeDay() {
  // 1. Move tomorrow → today
  // 2. Copy pinned → tomorrow  
  // 3. Remove completed unpinned
  // 4. Update views
  // 5. Celebrate!
}
```

### Mobile Considerations
- Bottom position for thumb reach
- Clear confirmation dialog
- Loading state during transition
- Prevent double-tap

## ADHD Accommodations
- Provides daily closure ritual
- Clear explanation of what will happen
- Celebration reinforces positive behavior
- Can't accidentally trigger

## Definition of Done
- [ ] Activities move correctly
- [ ] Pinned activities handled properly
- [ ] Celebration triggers
- [ ] State persists after refresh
- [ ] Works for all users

## References
- Legacy: Complete day workflow
- Depends on: #71 (today/tomorrow), #74 (pinning)