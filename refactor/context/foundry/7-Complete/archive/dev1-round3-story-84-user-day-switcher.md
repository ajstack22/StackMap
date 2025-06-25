# Story: Combined User/Day Switcher

## User Story
As a child, I want to tap my name to see a fun menu where I can switch to another family member or change between today and tomorrow.

## Acceptance Criteria
- [ ] Tapping center pill opens switcher modal
- [ ] Shows all user profiles with emojis
- [ ] Shows Today/Tomorrow options
- [ ] Current selections highlighted
- [ ] One tap to switch and close
- [ ] Fun, kid-friendly design

## Technical Requirements

### Implementation
```javascript
// Switcher UI structure
<div class="switcher-modal">
  <div class="switcher-section">
    <h3>Who's using StackMap?</h3>
    <div class="user-grid">
      <button class="user-option selected">
        <span class="emoji">😊</span>
        <span class="name">Emma</span>
      </button>
      <button class="user-option">
        <span class="emoji">🦁</span>
        <span class="name">Jake</span>
      </button>
      <button class="user-option guest">
        <span class="emoji">👋</span>
        <span class="name">Guest</span>
      </button>
    </div>
  </div>
  
  <div class="switcher-section">
    <h3>Which day?</h3>
    <div class="day-options">
      <button class="day-option selected">
        <span class="icon">☀️</span>
        <span class="label">Today</span>
        <span class="count">(12 activities)</span>
      </button>
      <button class="day-option">
        <span class="icon">🌙</span>
        <span class="label">Tomorrow</span>
        <span class="count">(5 activities)</span>
      </button>
    </div>
  </div>
</div>
```

### Mobile Considerations
- Full screen modal on mobile
- Large touch targets (60px+)
- Swipe down to dismiss
- Activity counts help decision

## ADHD Accommodations
- Visual selection state
- Activity counts prevent confusion
- One tap action (no confirm)
- Emojis for quick recognition
- No cognitive overload

## Definition of Done
- [ ] Smooth open/close animation
- [ ] Selection updates header immediately
- [ ] Activity list refreshes
- [ ] Keyboard navigable
- [ ] Works with 4+ users

## References
- Part of unified header system
- Replaces separate user/day controls