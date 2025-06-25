# Story #81: Header User/Day Pill Display

## Story Overview
**Round**: 2  
**Developer**: 1  
**Priority**: High - Core navigation element

## Background
The legacy StackMap shows a "pill" in the header with the current user's emoji and day (Today/Tomorrow). Clicking this pill opens a selector panel. This is the primary way users understand their current context and switch between users/days.

## User Story
As a user, I want to see who's logged in and what day I'm viewing at a glance, and easily switch between users or days by clicking the pill.

## Acceptance Criteria
- [ ] Header subtitle shows: [emoji] [day]
- [ ] Pill has visual button appearance
- [ ] Clicking pill triggers action
- [ ] Updates when user changes
- [ ] Updates when day changes
- [ ] Works on mobile (large touch target)

## Research Requirements
Before creating your plan, research:

1. **Current Header Structure**:
   - Examine `index.html` header section
   - Find subtitle element
   - Check existing header styles

2. **User Management**:
   - Study `js/user-manager.js`
   - How to get current user?
   - How to detect user changes?
   - User data structure (emoji location)

3. **Day Management**:
   - Study `js/today-tomorrow.js`
   - How to get current day?
   - How to detect day changes?
   - Event system used?

4. **Legacy Implementation**:
   - How did legacy app show the pill?
   - What happens on click? (opens panel)
   - Visual styling reference

## Implementation Plan Template
Create your plan in: `/refactor/context/foundry/4-PlanReview/r2_dev1_story_81_plan.md`

```markdown
# Implementation Plan: Header User/Day Pill

## Phase 1: Research Findings

### Current Header Structure
- Subtitle element ID: [find it]
- Current content: [what's there now]
- Parent structure: [header hierarchy]

### User Manager API
- Get current user: [method name]
- User object structure:
```javascript
{
  id: "xxx",
  name: "Emma",
  emoji: "😊",
  // other fields
}
```
- Change event: [event name]

### Today Tomorrow API  
- Get current day: [method name]
- Values: ["today", "tomorrow"]
- Change event: [event name]

### Legacy Reference
- Visual appearance: [description]
- Click behavior: Opens left panel
- Styling details: [note specifics]

## Phase 2: Implementation Order

### Step 1: Create Header Pill Manager
**File**: js/header-pill.js (NEW)
```javascript
class HeaderPill {
  constructor() {
    this.subtitle = null;
  }
  
  init() {
    this.subtitle = document.getElementById('subtitle');
    this.setupEventListeners();
    this.updatePill();
  }
  
  updatePill() {
    const user = UserManager.getCurrentUser();
    const day = TodayTomorrow.getCurrentDay();
    
    if (!user) {
      this.subtitle.innerHTML = 'No user selected';
      return;
    }
    
    this.subtitle.innerHTML = `
      <span class="pill-emoji">${user.emoji}</span>
      <span class="pill-day">${day === 'today' ? 'Today' : 'Tomorrow'}</span>
    `;
  }
  
  setupEventListeners() {
    // Click handler
    this.subtitle.addEventListener('click', () => {
      this.handlePillClick();
    });
    
    // User change listener
    document.addEventListener('user-changed', () => {
      this.updatePill();
    });
    
    // Day change listener  
    document.addEventListener('day-changed', () => {
      this.updatePill();
    });
  }
  
  handlePillClick() {
    // For now, just log
    console.log('Pill clicked - will open selector');
    // TODO: Integrate with panel system in next story
  }
}
```

### Step 2: Update HTML Structure
**File**: index.html
```diff
- <p class="subtitle" id="subtitle">Your daily routine</p>
+ <button class="subtitle pill-button" id="subtitle" aria-label="Switch user or day">
+   <span>Loading...</span>
+ </button>
```

### Step 3: Add Pill Styles
**File**: css/header-pill.css (NEW)
```css
.pill-button {
  /* Base button reset */
  background: none;
  border: none;
  font: inherit;
  cursor: pointer;
  
  /* Pill appearance */
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.05);
  transition: background 0.2s;
  
  /* Touch target */
  min-height: 44px;
}

.pill-button:hover {
  background: rgba(0, 0, 0, 0.1);
}

.pill-button:active {
  background: rgba(0, 0, 0, 0.15);
}

.pill-emoji {
  font-size: 1.3em;
  line-height: 1;
}

.pill-day {
  font-weight: 500;
}

/* Safe mode enhancement */
.safe-mode .pill-button {
  min-height: 60px;
  padding: 12px 20px;
}
```

### Step 4: Initialize in App
**File**: js/app.js
```diff
+ import HeaderPill from './header-pill.js';

  initializeComponents() {
    // ... existing code
+   
+   // Initialize header pill
+   this.headerPill = new HeaderPill();
+   this.headerPill.init();
  }
```

### Step 5: Link Stylesheet
**File**: index.html
```diff
  <!-- In <head> section -->
+ <link rel="stylesheet" href="css/header-pill.css">
```

## Phase 3: Testing Plan
- [ ] Pill displays current user emoji
- [ ] Pill displays current day
- [ ] Updates when user switches
- [ ] Updates when day changes
- [ ] Click feedback works
- [ ] Mobile touch target adequate
- [ ] Works with no user (edge case)

## Integration Notes
- Panel opening will be handled in Story #82
- For now, just log the click
- Ensure events fire correctly
- Test with UserManager mock if needed
```

## Visual States
```
Normal:    [😊 Today    ]
Hover:     [😊 Today    ] (darker bg)
Active:    [😊 Today    ] (darkest bg)
Tomorrow:  [😊 Tomorrow ]
No User:   [Select User ]
```

## Code Quality Requirements
1. **No innerHTML with user data** - Use textContent for safety
2. **Event cleanup** - Remove listeners if needed
3. **Null checks** - Handle missing user gracefully
4. **Accessibility** - Proper ARIA labels
5. **Performance** - Debounce updates if rapid

## Definition of Done
- [ ] Research documented with findings
- [ ] Detailed plan in 4-PlanReview
- [ ] PM approval received
- [ ] Pill shows user emoji + day
- [ ] Visual button appearance
- [ ] Click handler works (logs for now)
- [ ] Updates on user change
- [ ] Updates on day change
- [ ] Mobile-friendly size
- [ ] Code reviewed
- [ ] No regressions

## Time Estimate
- Research: 1.5 hours
- Plan Creation: 1 hour
- Implementation: 3 hours
- Testing: 1 hour

## Questions for PM Before Starting
1. What should show if no user exists yet?
2. Should pill be disabled during certain states?
3. Any animation on update?
4. Exact padding/sizing requirements?
5. Should we show user name or just emoji?

---
Note: This is a highly visible UI element that users interact with frequently. It must be reliable and feel responsive.