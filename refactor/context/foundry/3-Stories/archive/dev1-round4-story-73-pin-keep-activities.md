# Story: Add Pin/Keep Activities Feature

## User Story
As a parent, I want to pin recurring activities so that daily routines like "brush teeth" automatically appear in tomorrow's plan without manual re-entry.

## Acceptance Criteria
- [ ] Pin icon on each activity card (44px touch target)
- [ ] Visual indicator for pinned state
- [ ] Pinned activities copy to tomorrow on "Complete Day"
- [ ] Quick pin/unpin with single tap
- [ ] Pin state persists in database

## Technical Requirements

### Implementation
```javascript
// Pin toggle
activity.pinned = !activity.pinned;

// Complete day handling
if (activity.pinned) {
  copyToTomorrow(activity);
}

// Visual state
.pinned { border: 2px solid gold; }
```

### Mobile Considerations
- Pin icon positioned for one-handed use
- Optional: Swipe right to pin
- Haptic feedback on pin/unpin
- Clear visual feedback

## ADHD Accommodations
- Reduces repetitive setup tasks
- Maintains routine consistency
- Visual indicator prevents confusion
- Single action (not multi-step)

## Definition of Done
- [ ] Pin toggle works reliably
- [ ] Visual states are clear
- [ ] Complete Day respects pins
- [ ] Works with reordering
- [ ] Touch targets adequate

## References
- Legacy: Pin functionality
- Related: #73 (complete day)