# Story: Per-User Activity Storage

## User Story
As a parent with multiple children, I want each child to have their own separate activity lists so that each child's daily plan is personalized to their needs.

## Acceptance Criteria
- [ ] Each user has separate today activities
- [ ] Each user has separate tomorrow activities
- [ ] User switcher updates view instantly
- [ ] No data leakage between users
- [ ] Quick user switching (<100ms)
- [ ] Current user clearly indicated

## Technical Requirements

### Implementation
```javascript
// Query pattern
SELECT * FROM activities 
WHERE user_id = ? AND day = ?

// Cache current user's data
currentUserActivities = {...}
```

### Mobile Considerations
- Minimal profile switcher UI
- Cache for instant switching
- Memory efficient for many users
- Profile pictures for recognition

## ADHD Accommodations
- Clear current user indicator
- Consistent activity order per user
- No confusing merged views
- Visual user identification

## Definition of Done
- [ ] 4+ users perform well
- [ ] No cross-user data
- [ ] Switching is instant
- [ ] Works offline
- [ ] Memory efficient

## References
- Legacy: Multi-user support
- Depends on: User system