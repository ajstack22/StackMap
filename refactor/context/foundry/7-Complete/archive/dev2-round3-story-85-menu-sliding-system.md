# Story: Menu Sliding System

## User Story
As a user, I want smooth sliding menus that feel native to my device so that navigation feels fast and responsive.

## Acceptance Criteria
- [ ] Menus slide with 60fps performance
- [ ] Support touch gestures (swipe to close)
- [ ] Backdrop darkens content behind
- [ ] Multiple menus can't open simultaneously  
- [ ] Escape key closes menu
- [ ] Focus trapped within menu

## Technical Requirements

### Implementation
```javascript
class SlideMenu {
  constructor(options) {
    this.side = options.side; // 'left' or 'right'
    this.width = options.width; // '80%' or '300px'
    this.backdrop = true;
    this.swipeToClose = true;
  }
  
  open() {
    // 1. Close any open menus
    // 2. Create backdrop
    // 3. Slide in menu
    // 4. Trap focus
    // 5. Setup swipe handlers
  }
  
  close() {
    // 1. Slide out
    // 2. Remove backdrop
    // 3. Restore focus
    // 4. Cleanup handlers
  }
}
```

### Performance Requirements
- Use CSS transforms (not position)
- Will-change for animations
- Passive touch listeners
- RequestAnimationFrame for gestures

### Mobile Considerations
- Respect safe areas
- Handle orientation changes
- Prevent body scroll when open
- Momentum scrolling inside menu

## ADHD Accommodations
- No jarring animations
- Predictable direction
- Clear open/close states
- Can't get "stuck"
- Visual feedback during swipe

## Definition of Done
- [ ] 60fps on low-end devices
- [ ] Gesture navigation works
- [ ] No layout thrashing
- [ ] Accessible via keyboard
- [ ] Focus management correct

## References
- Foundation for menus in #82, #83
- Reusable for future modals