# Round 9 Dev 2 - Story #119: Enhanced Filtering & Search - Implementation Plan

## Story Overview
**Story**: #119 - Enhanced Filtering & Search
**Developer**: Dev 2
**Estimated Effort**: 2-3 days
**Dependencies**: Edit Mode (Story #95), Activity Types (Story #116)

## Implementation Plan

### Phase 1: Core Search Infrastructure (Day 1 Morning)

#### 1.1 Create Search Engine Module
**File**: `js/search-filter.js`
```javascript
class SearchFilter {
  constructor() {
    this.searchIndex = new Map(); // Activity ID -> searchable text
    this.filters = new Set();
    this.debounceTimer = null;
  }
  
  // Fuzzy string matching algorithm
  fuzzyMatch(query, text) {
    // Implement Levenshtein distance for typo tolerance
    // Score based on match position and accuracy
  }
  
  // Real-time search with debouncing
  search(query, options = {}) {
    clearTimeout(this.debounceTimer);
    return new Promise((resolve) => {
      this.debounceTimer = setTimeout(() => {
        const results = this.performSearch(query, options);
        resolve(results);
      }, 150); // 150ms debounce
    });
  }
  
  // Index activities for fast searching
  indexActivity(activity) {
    const searchableText = `${activity.title} ${activity.description}`.toLowerCase();
    this.searchIndex.set(activity.id, searchableText);
  }
}
```

#### 1.2 Filter System Architecture
**File**: `js/filter-manager.js`
```javascript
class FilterManager {
  constructor() {
    this.activeFilters = {
      type: null,      // recurring, template, etc.
      timeRange: null, // morning, afternoon, evening
      status: null,    // completed, pending
      pinned: null,    // true, false
    };
  }
  
  // Bitwise operations for performance
  applyFilters(activities) {
    let filtered = activities;
    
    if (this.activeFilters.type) {
      filtered = filtered.filter(a => a.type === this.activeFilters.type);
    }
    
    // Apply other filters...
    return filtered;
  }
}
```

### Phase 2: UI Components (Day 1 Afternoon)

#### 2.1 Search Bar Component
**File**: `js/search-ui.js`
```javascript
class SearchUI {
  constructor() {
    this.searchInput = null;
    this.resultsContainer = null;
    this.searchHistory = [];
  }
  
  render() {
    return `
      <div class="search-container">
        <input type="search" 
               class="search-input" 
               placeholder="Search activities..."
               autocomplete="off">
        <button class="search-clear" aria-label="Clear search">×</button>
        <div class="search-suggestions"></div>
      </div>
    `;
  }
  
  highlightMatches(text, query) {
    // Highlight matching portions of text
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}
```

#### 2.2 Filter UI Component
**File**: `js/filter-ui.js`
```javascript
class FilterUI {
  constructor() {
    this.filterChips = [];
  }
  
  renderFilterChips() {
    return `
      <div class="filter-chips">
        <button class="filter-chip" data-filter="type">
          Type <span class="chip-count"></span>
        </button>
        <button class="filter-chip" data-filter="time">
          Time <span class="chip-count"></span>
        </button>
        <button class="filter-chip" data-filter="status">
          Status <span class="chip-count"></span>
        </button>
        <button class="filter-chip" data-filter="pinned">
          Pinned <span class="chip-count"></span>
        </button>
        <button class="clear-filters">Clear all</button>
      </div>
    `;
  }
}
```

### Phase 3: Edit Mode Integration (Day 2 Morning)

#### 3.1 Update Edit Mode
**File**: Update `js/edit-mode.js`
```javascript
// Add search bar to edit mode header
// Ensure filtered results remain editable
// Add bulk actions for search results

editModeHeader() {
  return `
    <div class="edit-mode-header">
      <div class="edit-mode-search">
        ${this.searchUI.render()}
      </div>
      <div class="edit-mode-filters">
        ${this.filterUI.renderFilterChips()}
      </div>
      <div class="bulk-actions">
        <button>Select All</button>
        <button>Delete Selected</button>
      </div>
    </div>
  `;
}
```

#### 3.2 Search Result Actions
**File**: `js/edit-mode-search.js`
```javascript
class EditModeSearch {
  // Apply bulk actions to search results
  bulkUpdateSearchResults(action, activityIds) {
    switch(action) {
      case 'delete':
        this.deleteActivities(activityIds);
        break;
      case 'pin':
        this.pinActivities(activityIds);
        break;
      // Other bulk actions...
    }
  }
}
```

### Phase 4: Advanced Search Features (Day 2 Afternoon)

#### 4.1 Smart Search Parser
**File**: `js/smart-search.js`
```javascript
class SmartSearch {
  parseQuery(query) {
    // Natural language processing
    if (query.includes('tomorrow')) {
      return { date: this.getTomorrowDate() };
    }
    
    if (query.includes('morning')) {
      return { timeRange: 'morning' };
    }
    
    // Tag search
    if (query.startsWith('#')) {
      return { tag: query.substring(1) };
    }
    
    return { text: query };
  }
}
```

#### 4.2 Search Suggestions
```javascript
class SearchSuggestions {
  getSuggestions(query) {
    const suggestions = [];
    
    // Recent searches
    suggestions.push(...this.getRecentSearches(query));
    
    // Smart suggestions
    if (query.length > 2) {
      suggestions.push(...this.getSmartSuggestions(query));
    }
    
    return suggestions.slice(0, 5); // Limit to 5
  }
}
```

### Phase 5: Performance & Polish (Day 3)

#### 5.1 Performance Optimizations
- Implement virtual scrolling for large result sets
- Cache search results
- Use Web Workers for indexing
- Optimize filter operations with bitwise flags

#### 5.2 Mobile Optimizations
```css
/* css/search-filter.css */
.search-container {
  position: sticky;
  top: env(safe-area-inset-top);
  background: var(--surface-color);
  padding: 1rem;
  z-index: 100;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 16px; /* Prevent zoom on iOS */
  border-radius: 8px;
  border: 2px solid var(--border-color);
}

/* Touch-friendly filter chips */
.filter-chip {
  min-height: 44px;
  padding: 0.5rem 1rem;
  margin: 0.25rem;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Voice search button */
.voice-search {
  position: absolute;
  right: 3rem;
  top: 50%;
  transform: translateY(-50%);
  min-width: 44px;
  min-height: 44px;
}
```

### Testing Plan

#### Unit Tests
```javascript
// test/search-filter.test.js
describe('SearchFilter', () => {
  test('fuzzy matches with typos', () => {
    const search = new SearchFilter();
    const results = search.fuzzyMatch('exercse', 'exercise');
    expect(results.score).toBeGreaterThan(0.8);
  });
  
  test('debounces search input', async () => {
    // Test 150ms debounce timing
  });
  
  test('highlights matching text', () => {
    // Test highlighting algorithm
  });
});
```

#### Integration Tests
1. Search with 100+ activities
2. Apply multiple filters simultaneously
3. Test search in edit mode
4. Verify bulk actions on filtered results
5. Test voice search (if available)

#### Performance Tests
- Search response time < 100ms
- Filter animations at 60fps
- No UI blocking during search
- Memory usage under 50MB

### Accessibility Checklist
- [ ] Keyboard navigation for all controls
- [ ] Screen reader announcements for results
- [ ] High contrast mode support
- [ ] Focus management during search
- [ ] Alternative to voice search

### Implementation Order
1. Core search engine (fuzzy matching, indexing)
2. Basic UI components (search bar, filter chips)
3. Edit mode integration
4. Advanced features (smart search, suggestions)
5. Performance optimizations
6. Accessibility enhancements

### Risk Mitigation
- **Large datasets**: Implement virtual scrolling
- **Complex queries**: Set query length limits
- **Performance**: Use Web Workers for heavy operations
- **Mobile keyboards**: Handle viewport changes gracefully
- **Offline support**: Cache search index locally

### Success Metrics
- Search accuracy > 90%
- Response time < 100ms
- User can find any activity in < 3 seconds
- Filter combinations work intuitively
- Edit mode efficiency improves by 50%

## Approval Checklist
- [ ] Plan aligns with Story #119 requirements
- [ ] Dependencies (Edit Mode, Activity Types) considered
- [ ] Mobile-first approach maintained
- [ ] Performance targets defined
- [ ] Accessibility requirements included
- [ ] Testing strategy comprehensive
- [ ] Implementation phases logical