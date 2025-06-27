# Story: Header User/Day Pill (Like Legacy)

## Story ID
#81

## Developer Assignment
Round 2, Developer 1

## User Story
As a user, I want to see my emoji and current day in the header, and tap it to change users or switch between today/tomorrow.

## Legacy App Pattern
The legacy app shows:
1. Title (customizable, 13 char limit)
2. Subtitle pill: `<emoji> Today` or `<emoji> Tomorrow`
3. Clicking subtitle opens left panel with user/day selector
4. Uses HybridPanelManager for the selector UI

## Acceptance Criteria
- [ ] Subtitle shows current user emoji + day
- [ ] Subtitle is clickable (cursor: pointer)
- [ ] Click opens modal with user/day selection
- [ ] Updates immediately when user/day changes
- [ ] Works with existing user-manager.js
- [ ] Works with existing today-tomorrow.js

## Technical Requirements

### Implementation
```javascript
// Add to app.js or create header-manager.js
class HeaderManager {
  init() {
    this.updateSubtitle();
    
    // Listen for user changes
    document.addEventListener('user-changed', () => {
      this.updateSubtitle();
    });
    
    // Listen for day changes
    document.addEventListener('day-changed', () => {
      this.updateSubtitle();
    });
    
    // Make subtitle clickable
    const subtitle = document.getElementById('subtitle');
    if (subtitle) {
      subtitle.classList.add('clickable-pill');
      subtitle.addEventListener('click', () => {
        this.showUserDayModal();
      });
    }
  }
  
  updateSubtitle() {
    const subtitle = document.getElementById('subtitle');
    const currentUser = UserManager.getCurrentUser();
    const currentDay = TodayTomorrow.getCurrentDay();
    
    if (subtitle && currentUser) {
      const dayText = currentDay === 'today' ? 'Today' : 'Tomorrow';
      subtitle.innerHTML = `
        <span class="user-emoji">${currentUser.emoji}</span>
        <span class="day-text">${dayText}</span>
      `;
    }
  }
  
  showUserDayModal() {
    // Use existing modal system
    Modal.show('user-day-selector', {
      users: UserManager.getAllUsers(),
      currentUser: UserManager.getCurrentUser(),
      currentDay: TodayTomorrow.getCurrentDay(),
      onUserSelect: (userId) => {
        UserManager.switchUser(userId);
      },
      onDaySelect: (day) => {
        TodayTomorrow.setDay(day);
      }
    });
  }
}
```

### Modal Content
```html
<div class="user-day-modal">
  <!-- Day Selection -->
  <div class="day-section">
    <button class="day-option" data-day="today">
      <span>☀️</span>
      <span>Today</span>
      <span class="count">(12)</span>
    </button>
    <button class="day-option" data-day="tomorrow">
      <span>🌙</span>
      <span>Tomorrow</span>
      <span class="count">(5)</span>
    </button>
  </div>
  
  <!-- User Selection (if multiple users) -->
  <div class="user-section">
    <div class="user-grid">
      <!-- User buttons rendered here -->
    </div>
  </div>
</div>
```

## CSS Requirements
```css
.clickable-pill {
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(0,0,0,0.05);
  transition: background 0.2s;
}

.clickable-pill:hover {
  background: rgba(0,0,0,0.1);
}

.user-emoji {
  font-size: 1.2em;
  margin-right: 4px;
}
```

## Definition of Done
- [ ] Subtitle shows emoji + day
- [ ] Click opens modal
- [ ] Modal allows user switching (if multiple users)
- [ ] Modal allows day switching
- [ ] Changes update immediately
- [ ] Mobile touch-friendly

## Notes
- Keep it simple - no sliding panels yet
- Use existing modal.js if possible
- Don't break existing header functionality
- Test with 1 user (no user switching shown)
- Test with multiple users