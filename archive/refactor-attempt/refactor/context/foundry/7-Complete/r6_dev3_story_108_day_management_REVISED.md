# Round 6 Dev 3 - Story #108: Day Management System (REVISED PRIORITY)
## MOVED TO ROUND 6 - CRITICAL CORE FUNCTIONALITY

### Story Overview
**Priority**: CRITICAL - This is THE core feature of StackMap  
**Developer**: Dev 3  
**Estimated Effort**: 2-3 days  
**Dependencies**: None - This IS the foundation  

### Problem Statement
StackMap's entire value proposition is "Manage Today and Tomorrow" but users currently cannot even view tomorrow's activities. This is not an enhancement - this is broken core functionality. The app name itself implies a daily planning stack that moves through time. Without day management, StackMap is just a task list.

### Why This Is Critical
1. **Users cannot plan tomorrow** - Breaking the core workflow
2. **Complete Day has no meaning** - Without tomorrow, there's nothing to complete
3. **Pins are pointless** - Pins exist to carry activities to tomorrow
4. **Templates lack context** - Many templates are day-specific
5. **Users are confused** - The UI shows "Today" with no way to see tomorrow

### Acceptance Criteria

#### ✅ **Visual Day Selector**
- [ ] Today | Tomorrow toggle buttons in main UI (not in header dropdown)
- [ ] Clear visual indication of selected day
- [ ] Smooth transitions between days (300ms fade)
- [ ] Touch targets minimum 44px (60px in safe mode)
- [ ] Keyboard shortcuts: T for Today, M for toMorrow
- [ ] Screen reader announces: "Viewing today's activities" / "Viewing tomorrow's activities"

#### ✅ **State Management**
- [ ] Global DayManager singleton
```javascript
DayManager.currentDay // 'today' | 'tomorrow'
DayManager.setDay(day)
DayManager.on('dayChanged', callback)
```
- [ ] URL state: `?day=tomorrow` for deep linking
- [ ] Browser back/forward navigation works
- [ ] State persists per user session
- [ ] Default to 'today' on fresh load

#### ✅ **Activity Display Integration**
- [ ] Activities filtered by current day automatically
- [ ] Empty state: "No activities planned for tomorrow"
- [ ] Activity count badge per day
- [ ] Add activity button respects current day
- [ ] Quick Add uses current day context

#### ✅ **Visual Design**
- [ ] Today: Primary blue (#3b82f6)
- [ ] Tomorrow: Secondary purple (#8b5cf6)
- [ ] Active day has solid background
- [ ] Inactive day has outline style
- [ ] Consistent with existing button patterns

#### ✅ **Animation & Transitions**
- [ ] Fade out current activities
- [ ] Fade in new day's activities
- [ ] No layout shift during transition
- [ ] Loading spinner if fetch takes >200ms
- [ ] Smooth scroll to top on day change

#### ✅ **Mobile Optimizations**
- [ ] Swipe gestures (optional): Swipe left for tomorrow
- [ ] Bottom sheet pattern on mobile
- [ ] Thumb-reachable position
- [ ] Works in landscape orientation
- [ ] No conflict with drag-to-reorder

#### ✅ **Accessibility Excellence**
- [ ] Full keyboard navigation
- [ ] Clear focus indicators
- [ ] ARIA labels and live regions
- [ ] High contrast mode support
- [ ] Reduced motion respects preferences

### Technical Implementation

#### **New Files**
- `js/day-manager.js` - Core day state management
- `js/day-selector-ui.js` - UI component for day selection
- `css/day-management.css` - Styling for day selector

#### **Modified Files**
- `js/activity-display.js` - Filter by current day
- `js/app.js` - Initialize day management
- `index.html` - Add day selector UI
- `js/quick-add-ui.js` - Respect current day
- `js/activity-cards.js` - Show current day context

#### **Key Functions**
```javascript
// Day Manager API
DayManager.init()
DayManager.getCurrentDay() // 'today' | 'tomorrow'
DayManager.setDay(day)
DayManager.isToday()
DayManager.isTomorrow()
DayManager.on('change', callback)
DayManager.off('change', callback)

// URL State
DayManager.updateURL()
DayManager.loadFromURL()

// UI Integration
DaySelectorUI.init()
DaySelectorUI.updateActiveDay()
DaySelectorUI.bindEvents()
```

### User Experience Flow

1. **Default State**: User sees "Today" selected, today's activities shown
2. **Switching Days**: User clicks "Tomorrow", smooth fade transition
3. **Adding Activities**: Add button creates activity for current visible day
4. **URL Sharing**: Can share link to specific day view
5. **Quick Toggle**: Keyboard users can press T or M to switch

### Edge Cases

1. **Empty Days**: Show encouraging empty state, not error
2. **Many Activities**: Virtual scroll works per day
3. **Mid-Transition**: Clicking during transition queues the action
4. **Failed Loads**: Show cached data with sync indicator
5. **Time Zones**: Use device local time for day boundaries

### Success Metrics

1. **Functional**: Both days accessible and switchable
2. **Performance**: Day switch completes in <300ms
3. **Accessibility**: Full keyboard and screen reader support
4. **Reliability**: State persists across refreshes
5. **Intuitive**: New users discover tomorrow without help

### Inclusive Enhancements

1. **Visual Schedule Preview**: Small preview of other day on hover
2. **Day Badges**: Show activity count for non-visible day
3. **Gentle Transitions**: Respect reduced motion preferences
4. **Clear Context**: Always show which day is active
5. **Flexible Timing**: Allow "late night" to still be "today"

### Definition of Done

- [ ] Users can switch between Today and Tomorrow
- [ ] Activities correctly filter by day
- [ ] State persists across sessions
- [ ] Keyboard navigation fully supported
- [ ] Screen readers announce day changes
- [ ] URL updates reflect current day
- [ ] Browser back/forward works correctly
- [ ] Mobile gestures implemented (optional)
- [ ] Empty states for both days
- [ ] Visual design matches StackMap patterns

---

**This story restores StackMap's fundamental promise: helping users manage both today and tomorrow. Without this, we don't have StackMap.**