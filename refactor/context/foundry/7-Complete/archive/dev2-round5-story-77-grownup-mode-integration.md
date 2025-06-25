# Story: Daily Reset System

## User Story
As a parent, I want the app to automatically reset recurring activities each day so that morning routines are ready without manual setup.

## Acceptance Criteria
- [ ] Reset triggers at midnight local time
- [ ] Recurring activities marked incomplete
- [ ] Single-use activities keep status
- [ ] Works when app is closed
- [ ] Per-user reset tracking
- [ ] No duplicate resets

## Technical Requirements

### Implementation
```javascript
// On app launch
if (lastResetDate < today) {
  resetRecurringActivities();
  updateLastResetDate();
}

// Reset only affects recurring
if (activity.type === 'recurring') {
  activity.completed = false;
}
```

### Mobile Considerations
- No background processing needed
- Check on app launch/resume
- Lightweight operation
- Handle timezone changes

## ADHD Accommodations
- Predictable daily experience
- No lost progress
- Maintains routine structure
- Silent operation (no disruption)

## Definition of Done
- [ ] Resets at midnight
- [ ] Handles edge cases
- [ ] Per-user logic works
- [ ] No data loss
- [ ] Performance acceptable

## References
- Legacy: Daily reset
- Related: #74 (pinned activities)