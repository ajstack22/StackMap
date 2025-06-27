# Issue #41: Implement Today/Tomorrow Day Support

## 🚨 CRITICAL: Development Process
1. **BEFORE IMPLEMENTING**: Post your DETAILED implementation plan to Issue #41 on GitHub for PM adversarial review
2. **AFTER COMPLETING**: Update Issue #41 with completion status for final adversarial review
3. **DO NOT MERGE**: Until PM completes adversarial review and approves
4. **THINK HARD**: This is SUPER IMPORTANT - time blindness is a core ADHD challenge

## Problem Statement
ADHD users struggle with time perception and planning. They need a simple "Today/Tomorrow" view that:
- Shows only immediate tasks (reduces overwhelm)
- Makes planning tangible (not abstract dates)
- Automatically rolls over incomplete tasks
- Provides gentle, non-judgmental transitions

## Research Context
From ADHD time perception research:
- **Time blindness** affects 75% of ADHD adults
- **"Now" vs "Not Now"** is the primary time distinction
- **Executive dysfunction** makes date planning hard
- **Shame around incomplete tasks** needs gentle handling

## Core Features

### 1. Task Time Properties
```javascript
const TaskTimeframes = {
    TODAY: 'today',
    TOMORROW: 'tomorrow', 
    LATER: 'later',      // Everything else
    OVERDUE: 'overdue'   // Missed today tasks
};
```

### 2. Automatic Rollover
- At midnight (or first app open):
  - Yesterday's incomplete → Today (with gentle note)
  - Today → Tomorrow
  - Tomorrow → Later

### 3. RSD-Aware Messaging
```javascript
const RolloverMessages = {
    single: "Moved 1 task forward - no worries!",
    multiple: "Brought {count} tasks with you - fresh start!",
    allDone: "Yesterday complete! Ready for today ✨",
    welcome: "Good morning! Let's see what's on for today."
};
```

## Implementation Design

### View Structure
```javascript
const TodayTomorrowView = {
    sections: {
        today: {
            title: 'Today',
            emptyMessage: 'Nothing planned yet - want to add something?',
            icon: '☀️'
        },
        tomorrow: {
            title: 'Tomorrow', 
            emptyMessage: 'Tomorrow is looking clear',
            icon: '🌙'
        }
    },
    
    init: function() {
        this.rolloverCheck();
        this.render();
        this.setupDragBetweenDays();
    }
};
```

### Data Model Updates
```javascript
// Add to task model
{
    id: 'task_123',
    title: 'Task name',
    timeframe: 'today', // New field
    originalDate: '2024-06-23', // Track for rollover
    rolloverCount: 0 // Times rolled forward
}
```

### Rollover Logic
```javascript
async function performDailyRollover() {
    const now = new Date();
    const lastRollover = await Storage.get('lastRollover');
    
    if (isSameDay(lastRollover, now)) {
        return; // Already done today
    }
    
    // Get incomplete today tasks
    const incompleteTasks = await getTodayTasks({ completed: false });
    
    if (incompleteTasks.length > 0) {
        // Move to today with increment
        for (const task of incompleteTasks) {
            task.rolloverCount++;
            task.timeframe = 'today';
            await updateTask(task);
        }
        
        // Show gentle message
        showRolloverMessage(incompleteTasks.length);
    }
    
    // Move tomorrow to today
    await promoteTomorrowTasks();
    
    await Storage.set('lastRollover', now);
}
```

## UI/UX Requirements

### Layout
```
┌─────────────────────────┐
│ ☀️ Today (3)           │
├─────────────────────────┤
│ [Task Card 1]          │
│ [Task Card 2]          │
│ [Task Card 3]          │
│ + Add task for today   │
├─────────────────────────┤
│ 🌙 Tomorrow (2)        │
├─────────────────────────┤
│ [Task Card 4]          │
│ [Task Card 5]          │
│ + Add task for tomorrow│
└─────────────────────────┘
```

### Drag Between Days
- In edit mode, drag tasks between Today/Tomorrow
- Visual feedback when hovering over sections
- Haptic feedback on successful move

### Quick Actions
```javascript
// Swipe actions (mobile) or hover buttons (desktop)
const QuickActions = {
    moveToTomorrow: { icon: '→', label: 'Tomorrow' },
    moveToToday: { icon: '←', label: 'Today' },
    moveToLater: { icon: '📦', label: 'Later' }
};
```

## Files to Create/Modify

1. **Create `js/today-tomorrow.js`**
   - View management
   - Rollover logic
   - Drag between days

2. **Update `js/task-model.js`**
   - Add timeframe field
   - Add rollover tracking

3. **Create `css/today-tomorrow.css`**
   - Section styling
   - Drag feedback
   - Mobile optimizations

4. **Update navigation**
   - Add Today view as default
   - Keep full task list as option

## Implementation Checklist

### Phase 1: Core Structure
- [ ] Add timeframe to task model
- [ ] Create Today/Tomorrow view
- [ ] Filter tasks by timeframe
- [ ] Basic section rendering

### Phase 2: Rollover System
- [ ] Daily rollover check
- [ ] Move incomplete tasks
- [ ] Track rollover count
- [ ] RSD-aware notifications

### Phase 3: Interactions
- [ ] Drag between sections
- [ ] Quick action buttons
- [ ] Keyboard shortcuts (T for today, M for tomorrow)
- [ ] Touch gestures

### Phase 4: Polish
- [ ] Smooth animations
- [ ] Loading states
- [ ] Empty states
- [ ] Celebration for completing today

## Testing Requirements

### Functional Tests
1. **Rollover Logic**
   - Set date to yesterday
   - Add incomplete tasks
   - Advance date
   - Verify tasks moved

2. **Drag and Drop**
   - Drag from Today to Tomorrow
   - Drag from Tomorrow to Today
   - Verify persistence

3. **Edge Cases**
   - User skips several days
   - Tasks rolled over 5+ times
   - Timezone changes

### Performance Tests
- 100+ tasks performance
- Rollover with 50+ tasks
- Smooth drag animations

## Definition of Done
- [ ] Today/Tomorrow views working
- [ ] Automatic rollover functioning
- [ ] RSD-aware messaging throughout
- [ ] Drag between days works
- [ ] Quick actions implemented
- [ ] Persists across sessions
- [ ] No console errors
- [ ] Smooth animations
- [ ] Mobile gestures work
- [ ] Accessibility verified
- [ ] Video demo provided

## Success Metrics
- **Reduced overwhelm** - Users report less anxiety
- **Task completion up** - Today view increases focus
- **Positive rollover** - No shame about incomplete tasks
- **Daily engagement** - Users return each day

## Gentle Design Principles
1. **No judgment** - Tasks roll forward without criticism
2. **Fresh starts** - Each day feels new
3. **Celebration** - Completing "Today" feels good
4. **Flexibility** - Easy to adjust plans
5. **Forgiveness** - Built into the system

Remember: Time blindness is real. Make time tangible, gentle, and manageable!