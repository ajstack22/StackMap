# Story: Add Today/Tomorrow Day Selector

## User Story
As a parent, I want to plan both today's and tomorrow's activities so that I can prepare my child for what's coming and reduce anxiety about transitions.

## Acceptance Criteria
- [ ] Toggle between "Today" and "Tomorrow" views
- [ ] Each user has separate today/tomorrow activity lists  
- [ ] Current day is clearly highlighted
- [ ] Selection persists across app sessions
- [ ] Mobile-friendly toggle (60px touch targets)
- [ ] Instant view switching with no loading

## Technical Requirements

### Implementation
```javascript
// Data structure
activities: {
  id, user_id, day: 'today'|'tomorrow', ...
}

// UI Component  
<div class="day-selector">
  <button class="active">Today</button>
  <button>Tomorrow</button>
</div>
```

### Mobile Considerations
- Sticky header positioning
- Thumb-reachable placement
- Clear active state (not just color)
- Optional: Swipe between days

## ADHD Accommodations
- Always visible (not hidden in menu)
- Clear which day you're viewing
- Consistent position reduces cognitive load
- No ambiguous states

## Definition of Done
- [ ] Works on all screen sizes
- [ ] Per-user separation verified
- [ ] Transitions are smooth
- [ ] Persists through refresh
- [ ] No performance impact

## References
- Legacy: renderer.js day handling
- Depends on: #70 (activity terminology)