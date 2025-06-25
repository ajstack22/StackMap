# Story: Unified Header Navigation

## User Story
As a child using StackMap, I want a simple header with clear buttons and my name/day shown so that I always know where I am and what I can do.

## Acceptance Criteria
- [ ] Left menu button opens edit/activity management options
- [ ] Right menu button opens settings/preferences  
- [ ] Center pill shows user emoji + name + current day
- [ ] Tapping center pill opens combined user/day switcher
- [ ] Header is always visible and consistent
- [ ] Touch targets are large (44px min, 60px safe mode)

## Technical Requirements

### Implementation
```javascript
// Header structure
<header class="unified-header">
  <button class="menu-left" aria-label="Activities menu">
    ☰
  </button>
  
  <button class="user-day-pill" aria-label="Switch user or day">
    <span class="user-emoji">😊</span>
    <span class="user-name">Emma</span>
    <span class="day-indicator">Today</span>
  </button>
  
  <button class="menu-right" aria-label="Settings menu">
    ⚙️
  </button>
</header>
```

### Mobile Considerations
- Fixed header with safe area padding
- Menus slide in from sides
- Center pill expands to modal on tap
- Smooth transitions between states

## ADHD Accommodations
- Clear visual hierarchy
- Consistent button placement
- No hidden options
- Immediate visual feedback
- Predictable behavior

## Definition of Done
- [ ] Header responsive on all screen sizes
- [ ] Menus accessible via keyboard
- [ ] State persists across views
- [ ] Works offline
- [ ] Smooth animations

## References
- Legacy: Header with user/day pill
- Depends on: Menu system (stories #82, #83)

## Implementation Notes
**This section describes what WILL be implemented, not what has been done.**

### Planned Files
1. **`js/unified-header.js`** - Core header functionality
   - Will transform existing header structure
   - Will manage user/day pill updates
   - Must integrate with existing navigation
   - Must handle keyboard navigation

2. **`css/unified-header.css`** - Responsive header styles
   - Mobile-first design approach
   - Touch targets: 44px default, 60px in safe mode
   - Must work with existing CSS

### Files to Modify
1. **`index.html`**
   - Add unified-header.css link
   - Add unified-header.js script
   - May need to modify existing header structure

### Key Features to Implement

#### Header Structure
- Left menu button - Opens activity management (edit mode only?)
- Center pill - Shows current user/day context
- Right button - Opens settings (grownup mode only?)

#### Integration Requirements
1. Must work with existing user-manager.js
2. Must work with existing today-tomorrow.js
3. Must not break existing navigation
4. Must check if LeftMenu exists before using

### Open Questions
- Should left menu be visible in kid mode?
- Should settings require grownup mode?
- How to handle existing header code?
- What if no users exist yet?

### Testing Plan
- Create test harness to verify functionality
- Test responsive behavior
- Test with/without existing components
- Test error states