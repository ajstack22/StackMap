# Story: Unified Header Navigation (Revised)

## Story ID
#81

## Developer Assignment
Round 2, Developer 1

## User Story
As a user, I want a simple header with my name/emoji and current day shown, similar to the legacy app but with modern mobile-first design.

## Context from Legacy App
The legacy StackMap uses a subtitle element that shows:
- User emoji (larger size)
- Current day (Today/Tomorrow)
- Clickable to open user/day selector
- Title is customizable (13 char limit)

## Acceptance Criteria
- [ ] Header shows app title (customizable per user)
- [ ] Subtitle pill shows: [emoji] [day]
- [ ] Clicking pill opens user/day selector
- [ ] Header stays fixed at top
- [ ] Works with existing user-manager.js
- [ ] Works with existing today-tomorrow.js

## Technical Requirements

### Research Tasks
1. Examine existing header in refactor/index.html
2. Check how user-manager.js stores current user
3. Check how today-tomorrow.js tracks current day
4. Identify any existing header JavaScript

### Implementation Plan
```javascript
// Minimal changes to existing header
// Update subtitle element to show user + day
const updateHeaderPill = () => {
  const subtitle = document.getElementById('subtitle');
  const currentUser = UserManager.getCurrentUser();
  const currentDay = TodayTomorrow.getCurrentDay();
  
  if (subtitle && currentUser) {
    subtitle.innerHTML = `
      <span class="user-emoji">${currentUser.emoji}</span>
      <span class="day-text">${currentDay === 'today' ? 'Today' : 'Tomorrow'}</span>
    `;
    subtitle.classList.add('clickable-pill');
  }
};
```

### Integration Points
1. **UserManager** 
   - Check API: getCurrentUser(), onUserChange event
   - May need to add event listeners

2. **TodayTomorrow**
   - Check API: getCurrentDay(), onDayChange event
   - May need to add event listeners

3. **Modal System**
   - Use existing modal.js for selector
   - Don't create new modal system

### Mobile Considerations
- Touch target minimum 44px height
- Pill should be easily tappable
- Consider fat finger problem

## Definition of Done
- [ ] Research complete - understand existing code
- [ ] Header shows user emoji + day
- [ ] Click opens selector (reuse existing modal)
- [ ] Updates when user/day changes
- [ ] No breaking changes to existing code
- [ ] Works on mobile devices

## Out of Scope
- Left/right menu buttons (separate stories)
- Sliding menus (separate stories)
- Major header redesign
- New modal systems

## Dependencies
- Depends on existing user-manager.js
- Depends on existing today-tomorrow.js
- Should work with existing modal.js

## Notes for Developer
- Start by reading existing code
- Make minimal changes
- Don't assume APIs exist - verify first
- Test with no users scenario
- Keep it simple - this is just the pill