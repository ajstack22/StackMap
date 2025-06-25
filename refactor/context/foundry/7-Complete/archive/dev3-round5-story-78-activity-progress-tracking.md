# Story: Mobile Edit Mode Enhancement

## User Story
As a parent using my phone, I want mobile-optimized editing controls so that I can quickly manage activities one-handed while supervising my child.

## Acceptance Criteria
- [ ] Bottom sheet for activity creation
- [ ] Thumb-reachable controls
- [ ] Swipe gestures for delete/duplicate
- [ ] Inline editing (no modals)
- [ ] Multi-select with checkboxes
- [ ] Batch operations support

## Technical Requirements

### Implementation
```javascript
// Bottom sheet pattern
.bottom-sheet {
  position: fixed;
  bottom: 0;
  transform: translateY(100%);
  transition: transform 0.3s;
}

// Swipe actions
onSwipeRight: () => deleteActivity()
onSwipeLeft: () => duplicateActivity()
```

### Mobile Considerations
- FAB for add button
- Native emoji keyboard
- Prevent accidental exits
- Landscape support
- Haptic feedback

## ADHD Accommodations
- Clear mode indicators
- Consistent gestures
- Undo capabilities
- Visual feedback
- Focused interface

## Definition of Done
- [ ] One-handed operation
- [ ] Gestures work reliably
- [ ] No accidental deletions
- [ ] Smooth animations
- [ ] Works in landscape

## References
- Current edit mode limitations
- Mobile UI patterns