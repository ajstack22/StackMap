# Story #71: Add Today/Tomorrow Day Selector

## Story Overview
**Round**: 1  
**Developer**: 2  
**Priority**: High - Core navigation feature

## Background
The legacy StackMap has a clear Today/Tomorrow concept where users can plan activities for the current day or the next day. The refactor needs this same functionality with a visual selector that matches the legacy app's child-friendly design.

## User Story
As a child, I want to see what activities I have for today and plan what I'll do tomorrow, so I can feel prepared and in control of my schedule.

## Acceptance Criteria
- [ ] Today/Tomorrow selector visible in UI
- [ ] Shows activity count for each day
- [ ] Current day clearly highlighted
- [ ] Smooth transition between days
- [ ] Data persists correctly per day
- [ ] Integrates with existing today-tomorrow.js

## Research Requirements
Before creating your plan, research:

1. **Existing Code**: 
   - Study `js/today-tomorrow.js` - What's already implemented?
   - Check how legacy app shows day selector (in HybridPanelManager)
   - Look for any existing day-switching logic

2. **Data Structure**:
   - How are activities stored per day?
   - Is there a "tomorrow" field in the database?
   - How does rollover work (tomorrow → today)?

3. **UI Patterns**:
   - Where should selector appear? (header? panel?)
   - How does legacy app present it?
   - Mobile-friendly touch targets needed

4. **State Management**:
   - How is current day tracked?
   - What components need to know about day changes?
   - Event system for day switches?

## Implementation Plan Template
Create your plan in: `/refactor/context/foundry/4-PlanReview/r1_dev2_story_71_plan.md`

```markdown
# Implementation Plan: Today/Tomorrow Selector

## Phase 1: Research Findings
### Existing today-tomorrow.js
- Current functionality: [describe what exists]
- Missing pieces: [what needs to be added]
- Integration points: [where it connects]

### Legacy App Approach
- Location: [where selector appears]
- Behavior: [how it works]
- Visual design: [screenshot/description]

### Data Structure
- Today activities stored in: [location]
- Tomorrow activities stored in: [location]
- Rollover mechanism: [how it works]

## Phase 2: Implementation Order

### Step 1: Enhance today-tomorrow.js
**File**: js/today-tomorrow.js
```javascript
// Add new methods:
class TodayTomorrow {
  static getCurrentDay() {
    // Implementation
  }
  
  static switchToDay(day) {
    // Implementation
    // Fire event for other components
  }
  
  static getDayCounts() {
    // Return {today: 5, tomorrow: 3}
  }
}
```

### Step 2: Create Selector Component
**File**: js/day-selector-ui.js (NEW)
```javascript
class DaySelectorUI {
  constructor() {
    this.currentDay = 'today';
  }
  
  render(container) {
    // Create UI elements
  }
  
  // etc...
}
```

### Step 3: Add to Header
**File**: index.html
```diff
<!-- Show where in header it goes -->
```

### Step 4: Style the Selector
**File**: css/day-selector.css (NEW)
```css
/* Mobile-first styles */
```

### Step 5: Integration Points
- Update activity display when day switches
- Save current day to localStorage
- Handle edge cases (midnight rollover?)

## Phase 3: Testing Plan
- [ ] Test day switching
- [ ] Verify counts update
- [ ] Test persistence
- [ ] Mobile touch targets
- [ ] Keyboard navigation

## Edge Cases
1. What happens at midnight?
2. Empty days handling
3. Mid-edit day switch
```

## Visual Design Reference
```
┌─────────────────────────────┐
│ ☀️ Today (12)  🌙 Tomorrow (5) │
└─────────────────────────────┘

Active state: Blue background
Inactive: Gray background
```

## Code Patterns to Follow
```javascript
// Event-driven updates
document.addEventListener('day-changed', (e) => {
  const newDay = e.detail.day;
  this.refreshActivities(newDay);
});

// Clear state indication
const selector = document.querySelector('.day-selector');
selector.dataset.currentDay = 'today';
```

## Integration Requirements
1. Must work with existing UserManager
2. Must trigger activity list refresh
3. Must update header pill (if implemented)
4. Must save state to localStorage
5. Must be keyboard accessible

## Common Pitfalls to Avoid
- Don't assume activities array structure
- Handle timezone issues for rollover
- Ensure counts are always accurate
- Don't break existing today-tomorrow.js functionality
- Test with 0 activities edge case

## Definition of Done
- [ ] Research documented
- [ ] Detailed plan in 4-PlanReview
- [ ] PM approval received
- [ ] Selector shows in UI
- [ ] Day switching works
- [ ] Counts are accurate
- [ ] State persists
- [ ] Mobile-friendly
- [ ] Tests pass

## Time Estimate
- Research: 2 hours
- Plan Creation: 1.5 hours
- Implementation: 4-5 hours
- Testing: 1.5 hours

## Questions for PM Before Starting
1. Should selector be in header or separate?
2. What happens to completed activities when switching days?
3. Should we show relative dates (Today) or actual dates (Dec 18)?
4. Auto-rollover at midnight or manual?

---
Note: This is a core navigation feature. Users will interact with it constantly, so it must be intuitive and reliable.