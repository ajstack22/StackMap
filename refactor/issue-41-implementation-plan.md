# Issue #41: Today/Tomorrow Day Support - Detailed Implementation Plan

## Executive Summary
This implementation plan addresses the critical need for ADHD-friendly time management by introducing a "Today/Tomorrow" view system. This feature recognizes that 75% of ADHD adults experience time blindness, making traditional date-based planning ineffective.

## 🎯 Core Objectives
1. **Reduce time-related overwhelm** through simplified "Today/Tomorrow" categorization
2. **Support ADHD time perception** with tangible, immediate timeframes
3. **Implement gentle task rollover** without judgment or shame
4. **Maintain focus** on immediate tasks while allowing basic planning

## 📋 Implementation Phases

### Phase 1: Core Data Model & Infrastructure (Day 1-2)

#### 1.1 Task Model Enhancement
```javascript
// Extend task model in task-sqlite.js
const TaskSchema = {
  // Existing fields...
  timeframe: TEXT DEFAULT 'someday', // 'today', 'tomorrow', 'someday'
  originalDate: TEXT, // ISO date when task was first assigned timeframe
  rolloverCount: INTEGER DEFAULT 0,
  lastRolloverDate: TEXT
};
```

**Implementation Steps:**
1. Add migration to update existing SQLite schema
2. Create `TaskTimeframe` enum constants
3. Add validation for timeframe values
4. Update `TaskService.save()` to handle new fields
5. Create helper methods: `isToday()`, `isTomorrow()`, `needsRollover()`

#### 1.2 Storage Layer Updates
- Add indexes on `timeframe` field for performance
- Create specialized queries:
  - `getTasksByTimeframe(timeframe)`
  - `getOverdueTasks()`
  - `updateTaskTimeframes(updates)`
- Implement batch operations for rollover efficiency

### Phase 2: Rollover System (Day 3-4)

#### 2.1 Core Rollover Logic
```javascript
// rollover-manager.js
class RolloverManager {
  async performDailyRollover() {
    // 1. Check last rollover timestamp
    // 2. Get all tasks needing rollover
    // 3. Apply rollover rules:
    //    - Incomplete today → today (increment rolloverCount)
    //    - Tomorrow → today
    //    - Completed today → archive
    // 4. Show appropriate RSD-aware message
    // 5. Update lastRollover timestamp
  }
}
```

#### 2.2 Rollover Triggers
- **On app launch**: Check if new day
- **At midnight**: Background check if app is open
- **Manual trigger**: Settings option for testing
- **Multi-day gap handling**: Smart batch processing

#### 2.3 RSD-Aware Messaging System
```javascript
const RolloverMessages = {
  // Positive, encouraging messages
  single: "Brought 1 task forward - fresh start! 🌅",
  multiple: "{count} tasks came along for today's journey",
  allDone: "Yesterday complete! Today is yours ✨",
  multiDay: "Welcome back! I've organized your tasks",
  firstTime: "Good morning! Let's see what today brings"
};
```

### Phase 3: UI Implementation (Day 5-7)

#### 3.1 View Structure
```javascript
// today-tomorrow-view.js
class TodayTomorrowView {
  constructor() {
    this.sections = {
      today: { 
        id: 'today-section',
        title: 'Today', 
        icon: '☀️',
        emptyMessage: 'A clear day - add something if you'd like'
      },
      tomorrow: { 
        id: 'tomorrow-section',
        title: 'Tomorrow', 
        icon: '🌙',
        emptyMessage: 'Tomorrow is open'
      }
    };
  }
}
```

#### 3.2 Navigation Integration
**Option A (Recommended): Tab-based within main view**
```html
<div class="timeframe-tabs">
  <button class="tab-btn active" data-view="today">Today</button>
  <button class="tab-btn" data-view="tomorrow">Tomorrow</button>
  <button class="tab-btn" data-view="all">All Tasks</button>
</div>
```

**Option B: Separate views with navigation**
- Add to existing view controller system
- Maintain navigation stack depth limits

#### 3.3 Mobile-First CSS
```css
/* today-tomorrow.css */
.timeframe-section {
  margin-bottom: 2rem;
  border-radius: var(--border-radius);
  background: var(--surface-color);
}

.section-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
}

/* Drag feedback */
.drag-over {
  background: var(--highlight-color);
  transform: scale(1.02);
  transition: all 0.2s ease;
}
```

### Phase 4: Interactions & Polish (Day 8-9)

#### 4.1 Drag & Drop Implementation
- Use native HTML5 drag API with touch polyfill
- Visual feedback during drag
- Haptic feedback on successful drop (mobile)
- Undo capability for misdrops

#### 4.2 Quick Actions
```javascript
const QuickActions = {
  swipeRight: { action: 'moveToTomorrow', feedback: 'haptic' },
  swipeLeft: { action: 'moveToToday', feedback: 'haptic' },
  longPress: { action: 'showTimeframeMenu', feedback: 'haptic' }
};
```

#### 4.3 Keyboard Shortcuts
- `T`: Focus Today section
- `M`: Focus Tomorrow section
- `Space`: Toggle task between Today/Tomorrow
- `Tab`: Navigate between sections

#### 4.4 Celebrations & Feedback
- Confetti animation when completing all Today tasks
- Gentle progress indicators
- Sound effects (optional, off by default)

### Phase 5: Testing & Edge Cases (Day 10-11)

#### 5.1 Automated Tests
```javascript
// test/today-tomorrow.test.js
describe('Today/Tomorrow Feature', () => {
  // Rollover logic tests
  test('midnight rollover moves tomorrow to today');
  test('incomplete tasks stay in today with increment');
  test('multi-day gap handled correctly');
  
  // UI tests
  test('drag task between days persists');
  test('keyboard navigation works');
  test('empty states display correctly');
  
  // Edge cases
  test('timezone changes handled');
  test('DST transitions work');
  test('performance with 100+ tasks');
});
```

#### 5.2 Manual Testing Checklist
- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Test offline functionality
- [ ] Test with screen readers
- [ ] Test with large task counts
- [ ] Test timezone changes

### Phase 6: Documentation & Demo (Day 12)

#### 6.1 User Documentation
- In-app tutorial for first-time users
- Help text in settings
- FAQ section

#### 6.2 Video Demo Script
1. Show current overwhelm with date-based planning
2. Introduce Today/Tomorrow concept
3. Demo task creation and assignment
4. Show rollover in action
5. Demonstrate drag & drop
6. Show celebration on completion

## 🔄 Migration Strategy

### For Existing Users
1. **Opt-in migration**: Prompt on first launch
2. **Smart defaults**: All existing tasks → "someday"
3. **Guided setup**: Help assign first Today/Tomorrow tasks
4. **Rollback option**: Can revert within 7 days

### Data Migration
```javascript
async function migrateToTimeframes() {
  // 1. Add new columns to schema
  // 2. Set all existing tasks to 'someday'
  // 3. Prompt user to organize current tasks
  // 4. Track migration completion
}
```

## 🚦 Risk Mitigation

### Technical Risks
1. **Performance with large datasets**
   - Solution: Indexed queries, pagination
2. **Timezone handling complexity**
   - Solution: Use UTC internally, convert for display
3. **Data corruption during rollover**
   - Solution: Transactions, backup before rollover

### UX Risks
1. **User confusion with new paradigm**
   - Solution: Clear onboarding, optional feature
2. **Anxiety about "losing" tasks**
   - Solution: "All Tasks" view always available
3. **Rollover message fatigue**
   - Solution: Variety in messages, can disable

## 📊 Success Metrics

### Quantitative
- Task completion rate increase of 20%
- Daily active usage up 30%
- Reduced time to add tasks by 50%

### Qualitative
- User feedback on reduced overwhelm
- Testimonials about time management improvement
- Support ticket reduction for date-related issues

## 🛠️ Technical Dependencies

### Required Libraries
- None - using native browser APIs

### Browser Support
- iOS Safari 14+
- Chrome/Edge 88+
- Firefox 85+

### Storage Requirements
- Additional ~50 bytes per task
- Rollover history: ~1KB per month

## 📅 Timeline

**Total Duration**: 12 working days

- Days 1-2: Data model and infrastructure
- Days 3-4: Rollover system
- Days 5-7: UI implementation
- Days 8-9: Interactions and polish
- Days 10-11: Testing and bug fixes
- Day 12: Documentation and demo

## ✅ Definition of Done

- [ ] All unit tests passing
- [ ] Manual testing checklist complete
- [ ] No console errors in production build
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] User documentation complete
- [ ] Video demo recorded
- [ ] Code review completed
- [ ] PM adversarial review passed

## 🔍 Post-Implementation Monitoring

### Week 1
- Monitor rollover success rate
- Track any error reports
- Gather initial user feedback

### Month 1
- Analyze usage patterns
- A/B test message variations
- Plan minor improvements

### Month 3
- Full feature review
- Consider additional timeframes
- Plan next iteration

## 💡 Future Enhancements

1. **"This Week" view** for longer planning
2. **Recurring tasks** with smart timeframe assignment
3. **AI suggestions** for task scheduling based on patterns
4. **Time blocking** integration
5. **Focus mode** that hides Tomorrow during deep work

---

This implementation plan is designed with ADHD users at the center, recognizing time blindness as a real challenge that requires thoughtful, gentle solutions. The phased approach allows for continuous feedback and adjustment while maintaining momentum toward the final goal.