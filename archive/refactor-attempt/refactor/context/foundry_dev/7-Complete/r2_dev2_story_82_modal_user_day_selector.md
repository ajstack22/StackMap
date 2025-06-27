# Story #82: Modal User/Day Selector

## Story Overview
**Round**: 2  
**Developer**: 2  
**Priority**: High - Core navigation feature

## Background
When users click the header pill (Story #81), a modal should open allowing them to switch users or change between Today/Tomorrow. This replaces the legacy app's hybrid panel approach with a simpler modal that's easier to implement and maintain.

## User Story
As a user, I want to quickly switch between family members or change from Today to Tomorrow view without leaving my current screen.

## Acceptance Criteria
- [ ] Modal opens when header pill clicked
- [ ] Shows day selection (Today/Tomorrow)
- [ ] Shows user grid if multiple users
- [ ] Current selections highlighted
- [ ] One click to switch and close
- [ ] Smooth open/close animations
- [ ] Backdrop closes modal
- [ ] Updates pill immediately on change

## Research Requirements
Before creating your plan, research:

1. **Modal System**:
   - Check if `js/modal.js` exists
   - Study modal patterns in codebase
   - Find existing modal styles

2. **User Data**:
   - How to get all users from UserManager
   - User switching API
   - Current user detection

3. **Day Context**:
   - How TodayTomorrow tracks state
   - Activity counts per day
   - Day switching API

4. **Visual Design**:
   - Legacy selector appearance
   - Child-friendly design needs
   - Mobile layout requirements

## Implementation Plan Template
Create your plan in: `/refactor/context/foundry/4-PlanReview/r2_dev2_story_82_plan.md`

```markdown
# Implementation Plan: Modal User/Day Selector

## Phase 1: Research Findings

### Modal Infrastructure
- Existing modal.js: [yes/no]
- Modal pattern used: [describe]
- CSS classes: [list them]

### User Manager API
- Get all users: [method]
- Switch user: [method]
- User structure:
```javascript
{
  id: "xxx",
  name: "Emma",
  emoji: "😊",
  theme: "ocean"
}
```

### Day Management API
- Switch day: [method]
- Get counts: [method]
- Activity arrays: [where stored]

### Visual Reference
- Legacy design: [description]
- Key elements: [list them]

## Phase 2: Implementation Order

### Step 1: Create Modal HTML Structure
**File**: index.html
```html
<!-- Add to body -->
<div id="userDayModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
  <div class="modal-backdrop" data-action="close"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h2 id="modalTitle">Switch View</h2>
      <button class="modal-close" aria-label="Close" data-action="close">×</button>
    </div>
    
    <div class="modal-body">
      <!-- Day selector section -->
      <div class="selector-section">
        <h3>Select Day</h3>
        <div class="day-options">
          <button class="day-option" data-day="today">
            <span class="day-icon">☀️</span>
            <span class="day-label">Today</span>
            <span class="day-count">(0)</span>
          </button>
          <button class="day-option" data-day="tomorrow">
            <span class="day-icon">🌙</span>
            <span class="day-label">Tomorrow</span>
            <span class="day-count">(0)</span>
          </button>
        </div>
      </div>
      
      <!-- User selector section (if multiple users) -->
      <div class="selector-section" id="userSection" style="display: none;">
        <h3>Select User</h3>
        <div class="user-grid" id="userGrid">
          <!-- User buttons rendered here -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### Step 2: Create Selector Manager
**File**: js/user-day-selector.js (NEW)
```javascript
class UserDaySelector {
  constructor() {
    this.modal = document.getElementById('userDayModal');
    this.userGrid = document.getElementById('userGrid');
    this.userSection = document.getElementById('userSection');
    this.isOpen = false;
  }
  
  init() {
    this.setupEventListeners();
    this.updateDayCounts();
  }
  
  open() {
    this.updateContent();
    this.modal.classList.add('modal--open');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    
    // Focus management
    this.previousFocus = document.activeElement;
    this.modal.querySelector('.modal-close').focus();
  }
  
  close() {
    this.modal.classList.remove('modal--open');
    this.isOpen = false;
    document.body.style.overflow = '';
    
    // Restore focus
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }
  
  updateContent() {
    // Update day selection
    const currentDay = TodayTomorrow.getCurrentDay();
    this.modal.querySelectorAll('.day-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.day === currentDay);
    });
    
    // Update day counts
    this.updateDayCounts();
    
    // Update user grid
    const users = UserManager.getAllUsers();
    if (users.length > 1) {
      this.renderUserGrid(users);
      this.userSection.style.display = 'block';
    } else {
      this.userSection.style.display = 'none';
    }
  }
  
  renderUserGrid(users) {
    const currentUser = UserManager.getCurrentUser();
    this.userGrid.innerHTML = users.map(user => `
      <button class="user-option ${user.id === currentUser.id ? 'active' : ''}" 
              data-user-id="${user.id}">
        <span class="user-emoji">${user.emoji}</span>
        <span class="user-name">${user.name}</span>
      </button>
    `).join('');
  }
  
  setupEventListeners() {
    // Close actions
    this.modal.querySelectorAll('[data-action="close"]').forEach(el => {
      el.addEventListener('click', () => this.close());
    });
    
    // Day selection
    this.modal.querySelectorAll('.day-option').forEach(btn => {
      btn.addEventListener('click', () => {
        TodayTomorrow.setDay(btn.dataset.day);
        this.close();
      });
    });
    
    // User selection (delegated)
    this.userGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.user-option');
      if (btn) {
        UserManager.switchUser(btn.dataset.userId);
        this.close();
      }
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  updateDayCounts() {
    const counts = this.getDayCounts();
    this.modal.querySelector('[data-day="today"] .day-count').textContent = `(${counts.today})`;
    this.modal.querySelector('[data-day="tomorrow"] .day-count').textContent = `(${counts.tomorrow})`;
  }
  
  getDayCounts() {
    // Get from current user's activities
    const user = UserManager.getCurrentUser();
    if (!user) return { today: 0, tomorrow: 0 };
    
    return {
      today: user.activities?.length || 0,
      tomorrow: user.tomorrowActivities?.length || 0
    };
  }
}

// Export for use
window.UserDaySelector = UserDaySelector;
```

### Step 3: Add Modal Styles
**File**: css/user-day-modal.css (NEW)
```css
.modal {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.modal--open {
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.2s;
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selector-section {
  padding: 20px;
}

.selector-section + .selector-section {
  border-top: 1px solid #eee;
}

.day-options {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.day-option {
  flex: 1;
  padding: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.day-option:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.day-option.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.day-icon {
  font-size: 2em;
  display: block;
  margin-bottom: 8px;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.user-option {
  padding: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.user-option:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.user-option.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.user-emoji {
  font-size: 2em;
  display: block;
  margin-bottom: 4px;
}

.user-name {
  font-size: 0.9em;
  font-weight: 500;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Mobile adjustments */
@media (max-width: 400px) {
  .modal-content {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  
  .day-options {
    flex-direction: column;
  }
}
```

### Step 4: Connect to Header Pill
**File**: js/header-pill.js
```diff
  handlePillClick() {
-   console.log('Pill clicked - will open selector');
-   // TODO: Integrate with panel system in next story
+   if (window.userDaySelector) {
+     window.userDaySelector.open();
+   }
  }
```

### Step 5: Initialize in App
**File**: js/app.js
```diff
+ import UserDaySelector from './user-day-selector.js';

  initializeComponents() {
    // ... existing code
    
+   // Initialize user/day selector
+   window.userDaySelector = new UserDaySelector();
+   window.userDaySelector.init();
  }
```

### Step 6: Add Stylesheet
**File**: index.html
```diff
  <!-- In <head> section -->
+ <link rel="stylesheet" href="css/user-day-modal.css">
```

## Phase 3: Testing Plan
- [ ] Modal opens on pill click
- [ ] Day options show correct counts
- [ ] Current day highlighted
- [ ] User grid shows (if multiple users)
- [ ] Current user highlighted
- [ ] Clicking day switches and closes
- [ ] Clicking user switches and closes
- [ ] Backdrop closes modal
- [ ] Escape key closes modal
- [ ] Focus management works
- [ ] Mobile layout responsive
```

## Integration Points
1. **With Header Pill (Story #81)**: Pill click opens modal
2. **With UserManager**: Get users, switch users
3. **With TodayTomorrow**: Get/set current day
4. **With Activities**: Show accurate counts

## Accessibility Requirements
- Proper ARIA attributes
- Focus trap while open
- Restore focus on close
- Keyboard navigation
- Screen reader announcements

## Definition of Done
- [ ] Research documented
- [ ] Detailed plan in 4-PlanReview
- [ ] PM approval received
- [ ] Modal opens from pill click
- [ ] Day selection works
- [ ] User selection works (multi-user)
- [ ] Closes after selection
- [ ] Updates pill immediately
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] No regressions

## Time Estimate
- Research: 1.5 hours
- Plan Creation: 1.5 hours
- Implementation: 4-5 hours
- Testing: 1.5 hours

## Questions for PM Before Starting
1. Should modal close on any selection or have Apply button?
2. Show activity counts always or only in edit mode?
3. Any transition animation preferences?
4. Should guest user be shown in grid?
5. Max users to show before scrolling?

---
Note: This modal is a critical navigation component. It must be fast, intuitive, and work flawlessly on all devices.