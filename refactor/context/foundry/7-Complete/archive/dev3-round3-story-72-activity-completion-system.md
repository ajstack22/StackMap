# Story: Implement Activity Card Numbering

## User Story
As a child with ADHD, I want numbered activity cards so that I know exactly what order to do things without having to make decisions.

## Acceptance Criteria
- [ ] Cards display numbers (1, 2, 3...)
- [ ] Numbers update automatically when reordering
- [ ] Numbers are visually prominent but not overwhelming
- [ ] Option to switch between numbers and times view
- [ ] Numbers large enough for young children (min 24px)

## Technical Requirements

### Implementation
```javascript
// Display logic
activities.forEach((activity, index) => {
  activity.displayNumber = index + 1;
});

// CSS positioning
.activity-number {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 24px;
  font-weight: bold;
}
```

### Mobile Considerations
- High contrast for outdoor visibility
- Don't interfere with touch targets
- Consider RTL languages

## ADHD Accommodations
- Sequential numbering reduces decision fatigue
- No gaps in numbering (confusing)
- Clear visual hierarchy
- Consistent position on all cards

## Definition of Done
- [ ] Numbers visible on all cards
- [ ] Reordering updates numbers
- [ ] Works with drag-and-drop
- [ ] Accessible to screen readers
- [ ] User preference saved

## References
- Legacy: Card numbering in renderer.js
- Related: #75 (time display mode)