# Story: Add Time Display Mode

## User Story
As a parent, I want an optional time-based view so that my child can see activities in chronological order when they have a schedule to follow.

## Acceptance Criteria
- [ ] Toggle between Numbers and Times display modes
- [ ] Activities with times sort chronologically
- [ ] Native mobile time pickers for editing
- [ ] Activities without times appear at end
- [ ] Mode preference saved per user
- [ ] Clear visual distinction between modes

## Technical Requirements

### Implementation
```javascript
// Sort logic
if (displayMode === 'times') {
  activities.sort(byScheduledTime);
} else {
  activities.sort(byPosition);
}

// Time input
<input type="time" /> // Native picker
```

### Mobile Considerations
- Native time pickers (no custom UI)
- Mode toggle with icons + labels
- Respect 12/24 hour preference
- Large toggle buttons (60px)

## ADHD Accommodations
- Consistent card layout in both modes
- No jarring transitions
- Visual time indicators (morning ☀️, night 🌙)
- Clear which mode is active

## Definition of Done
- [ ] Mode toggle works instantly
- [ ] Sorting is correct
- [ ] Time entry is mobile-friendly
- [ ] Preference persists
- [ ] Works with all features

## References
- Legacy: Time display mode
- Related: #72 (number display)