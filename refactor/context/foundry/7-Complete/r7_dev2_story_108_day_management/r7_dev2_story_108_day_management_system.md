# Round 7 Dev 2 - Story #108: Day Management System

## Story Overview
**Priority**: Critical - Core navigation  
**Developer**: Dev 2  
**Estimated Effort**: 3 days  
**Dependencies**: User data separation (Story #107)  

## Problem Statement
StackMap's core value proposition is helping users plan Today and Tomorrow, but the refactor lacks any day switching capability. Users cannot view or plan tomorrow's activities, breaking the fundamental daily planning workflow. We need a complete day management system with UI controls and proper state management.

## Acceptance Criteria

### ✅ **Day Selector UI Component**
- [ ] Today | Tomorrow toggle in unified header
- [ ] Visual indicator for active day (color/underline)
- [ ] Smooth transition animations between days
- [ ] Touch-friendly with 44px minimum targets
- [ ] Keyboard accessible (T for Today, M for Tomorrow)
- [ ] Screen reader announcements for day changes

### ✅ **Day State Management**
- [ ] Current day tracked in application state
- [ ] Day context available globally via DayManager
- [ ] URL updates to reflect current day (?day=tomorrow)
- [ ] Browser back/forward navigation works correctly
- [ ] Day state persists per user session
- [ ] Deep linking to specific day works

### ✅ **Activity Display Integration**
- [ ] Activity display respects current day
- [ ] Smooth transition when switching days
- [ ] Activity counts shown per day
- [ ] Empty states for days without activities
- [ ] Loading states during day switches
- [ ] No flashing or jarring transitions

### ✅ **Visual Design**
- [ ] Today highlighted with primary color
- [ ] Tomorrow with secondary color
- [ ] Clear visual hierarchy
- [ ] Consistent with StackMap design language
- [ ] Mobile-first responsive design
- [ ] Safe mode compatible (larger targets)

### ✅ **Data Integration**
- [ ] Loads correct activities for selected day
- [ ] Integrates with user-specific data
- [ ] Handles missing data gracefully
- [ ] Prefetches tomorrow data for performance
- [ ] Caches day data appropriately
- [ ] Updates badge numbers per day

### ✅ **Edit Mode Behavior**
- [ ] Edit mode works correctly for both days
- [ ] Day context maintained during edits
- [ ] New activities go to current day
- [ ] Bulk operations respect day boundaries
- [ ] Clear indication of which day is being edited

## Technical Implementation

### **Component Architecture**
```javascript
// Day manager for state
class DayManager {
  constructor() {
    this.currentDay = 'today'; // 'today' | 'tomorrow'
    this.listeners = new Set();
  }
  
  getCurrentDay() { return this.currentDay; }
  setCurrentDay(day) { /* Update state, notify listeners */ }
  subscribe(callback) { /* Add listener */ }
  unsubscribe(callback) { /* Remove listener */ }
  
  // Utility methods
  isToday() { return this.currentDay === 'today'; }
  isTomorrow() { return this.currentDay === 'tomorrow'; }
  toggle() { /* Switch between days */ }
}

// UI Component
class DaySelector {
  constructor(container) {
    this.container = container;
    this.dayManager = window.DayManager;
  }
  
  render() { /* Create toggle UI */ }
  updateVisualState() { /* Update active indicators */ }
  handleDayChange(day) { /* Handle selection */ }
}
```

### **State Structure**
```javascript
// Application state includes day context
const AppState = {
  currentUser: 'userId',
  currentDay: 'today|tomorrow',
  ui: {
    daySelector: {
      animating: false,
      lastChanged: timestamp
    }
  }
};

// URL state management
// /?day=today (default, can be omitted)
// /?day=tomorrow
```

### **File Changes Required**
- `js/day-manager.js` (NEW) - Day state management
- `js/day-selector.js` (NEW) - UI component
- `css/day-selector.css` (NEW) - Styling
- `js/unified-header.js` - Integrate day selector
- `js/activity-display.js` - Respect current day
- `js/url-state-manager.js` (NEW) - URL state sync
- `js/keyboard-shortcuts.js` - Add T/M shortcuts

## User Experience Requirements

### **Intuitive Navigation**
- Clear visual distinction between days
- Instant feedback on day selection
- Smooth animated transitions
- No confusion about current day
- Natural placement in header

### **Performance**
- Day switches feel instant (<100ms)
- No loading spinners needed
- Prefetch tomorrow data
- Smooth animations at 60fps
- No layout shifts

### **Accessibility**
- Full keyboard navigation
- Clear focus indicators
- Screen reader support
- High contrast mode support
- Reduced motion respected

### **Mobile Optimization**
- Touch targets meet 44px minimum
- Swipe gestures considered (future)
- Works in portrait and landscape
- No accidental switches
- Clear tap feedback

## Visual Design Specifications

### **Header Integration**
```
[☰] StackMap        [Today | Tomorrow]  [👤]
     ↑                      ↑              ↑
   Menu                Day Selector      User
```

### **State Styling**
- **Active Day**: 
  - Background: Primary color (10% opacity)
  - Text: Primary color
  - Border: 2px solid primary
  - Font weight: Bold

- **Inactive Day**:
  - Background: Transparent
  - Text: Secondary text color
  - Border: None
  - Font weight: Normal

### **Animations**
- State change: 200ms ease-out
- Background fade: 150ms
- Slide indicator: 250ms spring

## Testing Requirements

### **Functional Tests**
- [ ] Day selector appears in header
- [ ] Clicking Tomorrow shows tomorrow's activities
- [ ] URL updates when switching days
- [ ] Back button returns to previous day
- [ ] Refresh maintains current day
- [ ] Deep links work correctly

### **Integration Tests**
- [ ] Works with user switching
- [ ] Edit mode respects day context
- [ ] Activities display correctly per day
- [ ] Complete Day workflow integration
- [ ] Performance with many activities

### **Accessibility Tests**
- [ ] Keyboard navigation (T/M keys)
- [ ] Screen reader announces day changes
- [ ] Focus management correct
- [ ] High contrast mode visible
- [ ] Touch targets adequate size

### **Edge Cases**
- [ ] Rapid day switching
- [ ] Network issues during switch
- [ ] Missing data for a day
- [ ] URL manipulation attempts
- [ ] Browser history edge cases

## Implementation Phases

### **Phase 1: Core Infrastructure**
1. Create DayManager singleton
2. Implement state management
3. Add URL state synchronization
4. Create event system

### **Phase 2: UI Component**
1. Create DaySelector component
2. Integrate into UnifiedHeader
3. Add styling and animations
4. Implement keyboard shortcuts

### **Phase 3: Integration**
1. Update ActivityDisplay for day context
2. Modify all data operations
3. Add prefetching logic
4. Test all workflows

## Success Metrics

### **Functional Success**
- [ ] Users can switch between days
- [ ] Correct activities shown per day
- [ ] State persists appropriately
- [ ] URLs are bookmarkable
- [ ] No data mixing between days

### **Performance Metrics**
- [ ] Day switch < 100ms
- [ ] Animations at 60fps
- [ ] No memory leaks
- [ ] Efficient data loading
- [ ] Smooth user experience

### **User Experience Success**
- [ ] Intuitive day navigation
- [ ] Clear current day indication
- [ ] No user confusion
- [ ] Accessibility compliance
- [ ] Mobile-friendly interaction

## Risk Mitigation

### **State Management Complexity**
- Single source of truth (DayManager)
- Clear state flow
- Comprehensive testing
- Event-driven updates
- Debug logging

### **Performance Concerns**
- Prefetch tomorrow data
- Cache day data
- Efficient DOM updates
- Animation frame management
- Memory cleanup

## Definition of Done

### **Feature Complete**
- [ ] Day selector UI implemented
- [ ] State management working
- [ ] URL synchronization active
- [ ] Keyboard shortcuts functional
- [ ] All integrations complete

### **Quality Assured**
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Accessibility validated
- [ ] Cross-browser tested
- [ ] Mobile experience verified

### **User Ready**
- [ ] Intuitive interaction
- [ ] Smooth animations
- [ ] Clear visual design
- [ ] No regressions
- [ ] Documentation complete

---

**Story #108 implements the critical day management system that enables StackMap's core value proposition of planning Today and Tomorrow.**