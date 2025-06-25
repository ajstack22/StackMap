# Round 8 Dev 2 - Story #111: Display Modes Implementation

## Story Overview
**Priority**: Important - Key differentiator  
**Developer**: Dev 2  
**Estimated Effort**: 2 days  
**Dependencies**: Time Field (Story #109), Display Toggle (Round 5)  

## Problem Statement
The display mode toggle exists but the actual Numbers and Times modes aren't implemented. Users need to see activities either with sequential numbers (1, 2, 3...) for simple ordering or with times for schedule-based planning. This is a key feature that helps users with different planning styles.

## Acceptance Criteria

### ✅ **Numbers Mode Implementation**
- [ ] Display sequential numbers on each activity (1, 2, 3...)
- [ ] Numbers update automatically when reordering
- [ ] Numbers reset per day (today/tomorrow separate)
- [ ] Visual number badge on cards
- [ ] Numbers respect filters (filtered items keep sequence)
- [ ] Clear number visibility on all themes

### ✅ **Times Mode Implementation**
- [ ] Display time on activities that have times
- [ ] Sort activities by time (earliest first)
- [ ] Activities without times appear at end
- [ ] Time format respects user preference (12/24 hour)
- [ ] Visual time indicators (morning/afternoon/evening)
- [ ] Graceful mixed time/no-time display

### ✅ **Mode Switching**
- [ ] Instant switch between modes (<100ms)
- [ ] Maintain scroll position during switch
- [ ] Animate badge transitions smoothly
- [ ] No flash of unstyled content
- [ ] Preserve selection state
- [ ] Update URL parameter (?mode=times)

### ✅ **Visual Design**
- [ ] Number badges: Circular, primary color
- [ ] Time badges: Rounded rectangle, time-based colors
- [ ] Clear visual distinction between modes
- [ ] Consistent sizing and positioning
- [ ] Mobile-optimized badge sizes
- [ ] Accessibility compliant contrast

### ✅ **Sorting Logic**
- [ ] Numbers mode: Manual order (drag position)
- [ ] Times mode: Chronological order
- [ ] Consistent sorting within groups
- [ ] Handle time conflicts (same time)
- [ ] Null times sort to end
- [ ] Maintain sort on updates

### ✅ **Performance**
- [ ] Use badge cache for efficiency
- [ ] Batch DOM updates
- [ ] Smooth 60fps transitions
- [ ] No memory leaks
- [ ] Efficient sort algorithms
- [ ] Quick mode persistence

## Technical Implementation

### **Mode Manager Enhancement**
```javascript
class DisplayModeManager {
  constructor() {
    this.currentMode = this.loadMode() || 'numbers';
    this.sortStrategies = {
      numbers: new NumberSortStrategy(),
      times: new TimeSortStrategy()
    };
  }
  
  setMode(mode) {
    if (mode === this.currentMode) return;
    
    // Start transition
    this.startTransition();
    
    // Update mode
    this.currentMode = mode;
    this.saveMode(mode);
    
    // Re-render with new mode
    this.applyMode();
    
    // Complete transition
    this.endTransition();
  }
  
  getSortedActivities(activities) {
    return this.sortStrategies[this.currentMode].sort(activities);
  }
  
  getBadgeContent(activity, index) {
    if (this.currentMode === 'numbers') {
      return { type: 'number', content: index + 1 };
    } else {
      return { type: 'time', content: activity.time || '—' };
    }
  }
}
```

### **Sorting Strategies**
```javascript
class NumberSortStrategy {
  sort(activities) {
    // Maintain manual order (by position/order field)
    return activities.sort((a, b) => {
      return (a.order || 0) - (b.order || 0);
    });
  }
}

class TimeSortStrategy {
  sort(activities) {
    return activities.sort((a, b) => {
      // Activities with times come first
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      if (!a.time && !b.time) return 0;
      
      // Sort by time
      return this.compareTimeStrings(a.time, b.time);
    });
  }
  
  compareTimeStrings(timeA, timeB) {
    // Convert HH:mm to comparable numbers
    const [hoursA, minutesA] = timeA.split(':').map(Number);
    const [hoursB, minutesB] = timeB.split(':').map(Number);
    
    const totalA = hoursA * 60 + minutesA;
    const totalB = hoursB * 60 + minutesB;
    
    return totalA - totalB;
  }
}
```

### **Badge Rendering System**
```javascript
class BadgeRenderer {
  renderNumberBadge(number) {
    const badge = document.createElement('div');
    badge.className = 'activity-badge activity-badge--number';
    badge.textContent = number;
    badge.setAttribute('aria-label', `Activity number ${number}`);
    return badge;
  }
  
  renderTimeBadge(time, format = '12h') {
    const badge = document.createElement('div');
    badge.className = 'activity-badge activity-badge--time';
    
    if (time) {
      const formatted = TimeFormatter.format(time, format);
      badge.textContent = formatted;
      badge.setAttribute('aria-label', `Scheduled for ${formatted}`);
      
      // Add time period class for coloring
      const hour = parseInt(time.split(':')[0]);
      if (hour < 12) badge.classList.add('morning');
      else if (hour < 17) badge.classList.add('afternoon');
      else badge.classList.add('evening');
    } else {
      badge.textContent = '—';
      badge.classList.add('no-time');
      badge.setAttribute('aria-label', 'No time set');
    }
    
    return badge;
  }
}
```

### **File Changes Required**
- `js/display-mode-manager.js` - Enhanced mode logic
- `js/sort-strategies.js` (NEW) - Sorting implementations
- `js/badge-renderer.js` (NEW) - Badge creation system
- `css/activity-badges.css` (NEW) - Badge styling
- `js/activity-display.js` - Integration updates
- `js/time-formatter.js` - Time display formatting
- `js/url-state.js` - URL parameter updates

## Visual Design Specifications

### **Numbers Mode Badges**
```css
.activity-badge--number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}
```

### **Times Mode Badges**
```css
.activity-badge--time {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

.activity-badge--time.morning {
  background: #fef3c7;
  color: #92400e;
}

.activity-badge--time.afternoon {
  background: #dbeafe;
  color: #1e3a8a;
}

.activity-badge--time.evening {
  background: #e9d5ff;
  color: #581c87;
}

.activity-badge--time.no-time {
  background: #f3f4f6;
  color: #6b7280;
}
```

### **Transition Animations**
```css
.activity-badge {
  transition: all 0.3s ease-out;
}

.mode-transitioning .activity-badge {
  transform: scale(0.8);
  opacity: 0.5;
}
```

## User Experience Flow

### **Numbers Mode Display**
```
[1] Morning Routine
    Get ready for the day
    
[2] Team Standup
    Daily sync meeting
    
[3] Deep Work Session
    Focus on project X
```

### **Times Mode Display**
```
[7:30 AM] Morning Routine
          Get ready for the day
          
[9:00 AM] Team Standup
          Daily sync meeting
          
[2:00 PM] Deep Work Session
          Focus on project X
          
[—] Email Review
    Check and respond
```

## Testing Requirements

### **Numbers Mode Tests**
- [ ] Numbers display correctly
- [ ] Sequence maintained on reorder
- [ ] Numbers update on add/delete
- [ ] Separate numbering per day
- [ ] Numbers visible on all themes

### **Times Mode Tests**
- [ ] Times display correctly
- [ ] Sorting works properly
- [ ] No-time items at end
- [ ] 12/24 hour formats work
- [ ] Time periods colored correctly

### **Mode Switching Tests**
- [ ] Switch is instant
- [ ] No flashing/glitches
- [ ] Scroll position maintained
- [ ] State persisted
- [ ] URL updates correctly

### **Integration Tests**
- [ ] Works with filtering
- [ ] Drag-drop updates numbers
- [ ] Edit mode compatible
- [ ] Performance acceptable
- [ ] Cache working properly

## Performance Considerations

### **Optimization Strategies**
- Use virtual DOM diffing for updates
- Batch badge updates in single frame
- Cache formatted times
- Reuse badge elements where possible
- Minimize reflows during transitions

### **Performance Targets**
- Mode switch: <100ms
- Sort operation: <50ms for 100 items
- Badge render: <5ms per badge
- Smooth 60fps transitions
- Memory stable during switches

## Success Metrics

### **Functionality**
- [ ] Both modes fully implemented
- [ ] Sorting works correctly
- [ ] Transitions smooth
- [ ] State persistence working
- [ ] All edge cases handled

### **User Experience**
- [ ] Modes clearly different
- [ ] Intuitive operation
- [ ] Visual design polished
- [ ] Mobile experience smooth
- [ ] Accessibility compliant

### **Performance**
- [ ] Meets all targets
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] Quick mode switches
- [ ] Efficient rendering

## Risk Mitigation

### **Sorting Complexity**
- Well-tested algorithms
- Clear sort priorities
- Handle edge cases
- Performance monitoring
- Fallback strategies

### **Visual Consistency**
- Design system adherence
- Cross-theme testing
- Accessibility validation
- User feedback
- Iterative refinement

## Definition of Done

### **Feature Complete**
- [ ] Numbers mode working
- [ ] Times mode working
- [ ] Sorting correct
- [ ] Transitions smooth
- [ ] State persistence

### **Quality Assured**
- [ ] All tests passing
- [ ] Performance validated
- [ ] Accessibility checked
- [ ] Cross-browser tested
- [ ] Mobile optimized

### **User Ready**
- [ ] Intuitive to use
- [ ] Visually polished
- [ ] Help available
- [ ] No regressions
- [ ] Documentation complete

---

**Story #111 completes the display modes feature, giving users flexible ways to view and organize their activities based on their planning style.**