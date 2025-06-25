# Round 8 Dev 3 - Story #112: Card Filtering System

## Story Overview
**Priority**: Important - Organization feature  
**Developer**: Dev 3  
**Estimated Effort**: 2 days  
**Dependencies**: Activity data model, Display system  

## Problem Statement
Legacy StackMap includes filtering capabilities to help users focus on specific types of activities. The refactor lacks any filtering system, making it difficult for users to manage large lists or focus on particular categories of tasks. This is essential for users with ADHD who need to reduce visual clutter.

## Acceptance Criteria

### ✅ **Filter UI Components**
- [ ] Filter toggle button in header/toolbar
- [ ] Filter dropdown with multiple options
- [ ] Active filter indicators
- [ ] Clear all filters option
- [ ] Mobile-optimized filter UI
- [ ] Keyboard shortcuts for common filters

### ✅ **Filter Types**
- [ ] By completion status (complete/incomplete)
- [ ] By pin status (pinned/unpinned)
- [ ] By time (has time/no time)
- [ ] By text search (title/description)
- [ ] By category (future implementation ready)
- [ ] Combination filters (AND logic)

### ✅ **Filter Behavior**
- [ ] Instant filtering (<50ms)
- [ ] Maintains activity order within filter
- [ ] Shows count of filtered items
- [ ] Empty state when no matches
- [ ] URL state for shareable filters
- [ ] Filter persistence per user

### ✅ **Visual Feedback**
- [ ] Smooth filter transitions
- [ ] Clear indication of active filters
- [ ] Filtered item count display
- [ ] No jarring layout shifts
- [ ] Loading state if needed
- [ ] Accessible filter states

### ✅ **Integration Requirements**
- [ ] Works with both display modes
- [ ] Respects current day context
- [ ] Updates badge counts
- [ ] Compatible with edit mode
- [ ] Works with bulk operations
- [ ] Performance with 50+ items

## Technical Implementation

### **Filter Manager Architecture**
```javascript
class FilterManager {
  constructor() {
    this.activeFilters = new Map();
    this.filterStrategies = {
      completed: new CompletionFilter(),
      pinned: new PinFilter(),
      timed: new TimeFilter(),
      search: new SearchFilter()
    };
  }
  
  applyFilter(type, value) {
    this.activeFilters.set(type, value);
    this.updateDisplay();
  }
  
  removeFilter(type) {
    this.activeFilters.delete(type);
    this.updateDisplay();
  }
  
  getFilteredActivities(activities) {
    let filtered = [...activities];
    
    for (const [type, value] of this.activeFilters) {
      filtered = this.filterStrategies[type].apply(filtered, value);
    }
    
    return filtered;
  }
}
```

### **Filter UI Component**
```javascript
class FilterPanel {
  render() {
    return `
      <div class="filter-panel">
        <button class="filter-toggle">
          <span class="filter-icon">🔽</span>
          Filters ${this.getActiveCount() > 0 ? `(${this.getActiveCount()})` : ''}
        </button>
        
        <div class="filter-dropdown">
          ${this.renderFilterOptions()}
          <button class="clear-filters">Clear All</button>
        </div>
      </div>
    `;
  }
}
```

### **File Changes Required**
- `js/filter-manager.js` (NEW) - Core filtering logic
- `js/filter-panel.js` (NEW) - Filter UI component
- `js/filter-strategies.js` (NEW) - Individual filter implementations
- `css/filter-panel.css` (NEW) - Filter styling
- `js/activity-display.js` - Integration with filtering
- `js/url-state.js` - Filter state in URL
- `js/keyboard-shortcuts.js` - Filter shortcuts

## Visual Design Specifications

### **Filter Toggle States**
```
Default:
[🔽 Filters]

Active (2 filters):
[🔽 Filters (2)]  <- Highlighted

Expanded:
[🔼 Filters (2)]
├─ ☑ Show completed
├─ ☐ Show incomplete
├─ ☐ Pinned only
├─ ☐ Has time
└─ [Search...]
```

### **Active Filter Indicators**
- Filter button highlighted when active
- Badge showing count of active filters
- Individual filter chips below header
- Clear (×) button on each chip

## Testing Requirements

### **Functional Tests**
- [ ] Each filter type works correctly
- [ ] Multiple filters combine properly
- [ ] Filter counts accurate
- [ ] Clear all works
- [ ] URL state updates

### **Performance Tests**
- [ ] Filtering is instant
- [ ] No lag with many items
- [ ] Smooth animations
- [ ] Memory efficient

### **Integration Tests**
- [ ] Works with display modes
- [ ] Respects day context
- [ ] Edit mode compatible
- [ ] Bulk ops respect filters

## Success Metrics

### **Functionality**
- [ ] All filter types working
- [ ] Smooth user experience
- [ ] State persistence
- [ ] No data issues

### **Performance**
- [ ] <50ms filter time
- [ ] 60fps animations
- [ ] Efficient memory use
- [ ] Quick state restore

## Definition of Done

### **Feature Complete**
- [ ] All filters implemented
- [ ] UI polished
- [ ] State management working
- [ ] Keyboard shortcuts active

### **Quality Assured**
- [ ] Tests passing
- [ ] Performance validated
- [ ] Accessibility checked
- [ ] Mobile optimized

---

**Story #112 adds powerful filtering capabilities to help users focus on what matters most.**