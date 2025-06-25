# StackMap Refactor - Remaining Rounds Plan

**Created**: December 25, 2024  
**Goal**: Achieve feature parity with legacy StackMap  
**Estimated Rounds**: 7-8 (Rounds 7-14)

---

## 📋 Round 7: Critical Foundation - User Data & Day Management

### Story #107: User Data Separation (Dev 1)
**Priority**: Critical - Multi-user foundation  
**Effort**: 3 days  

**Problem**: Activities are currently global, not separated per user. This breaks multi-user functionality.

**Acceptance Criteria**:
- [ ] Separate activity storage per user (today activities)
- [ ] Separate tomorrow activity storage per user
- [ ] User context threading through all operations
- [ ] Data migration for existing activities to current user
- [ ] User deletion cleans up all user-specific data
- [ ] Custom title support per user
- [ ] Activity count tracking per user

**Technical Requirements**:
- Modify `js/db-schema.js` to support user-specific tables
- Update `js/activity-display.js` to filter by current user
- Enhance `js/user-manager.js` with data isolation
- Create migration script for existing data

---

### Story #108: Day Management System (Dev 2)
**Priority**: Critical - Core navigation  
**Effort**: 3 days  

**Problem**: No way to switch between Today/Tomorrow views, breaking daily planning workflow.

**Acceptance Criteria**:
- [ ] Day selector UI in unified header (Today | Tomorrow)
- [ ] Visual indicator for active day
- [ ] Smooth transition animations between days
- [ ] Persist selected day per user session
- [ ] Day context available throughout app
- [ ] URL state for bookmarkable day views
- [ ] Keyboard shortcuts (T for today, M for tomorrow)

**Technical Requirements**:
- Create `js/day-manager.js` for day state management
- Create `js/day-selector.js` for UI component
- Update `js/unified-header.js` to include day selector
- Modify `js/activity-display.js` to respect current day
- Add `css/day-selector.css` for styling

---

### Story #109: Time Field Implementation (Dev 3)
**Priority**: Important - Enables time-based features  
**Effort**: 3 days  

**Problem**: Activities have no time field, preventing time-based sorting and display modes.

**Acceptance Criteria**:
- [ ] Time field in activity data model
- [ ] Time input UI in edit mode (12/24 hour support)
- [ ] Time parsing for various formats
- [ ] Time validation and error handling
- [ ] Time display on activity cards
- [ ] Default time suggestions based on patterns
- [ ] Time zone awareness
- [ ] Persist time format preference per user

**Technical Requirements**:
- Update `js/db-schema.js` with time field
- Create `js/time-input.js` for time entry component
- Create `js/time-parser.js` for format handling
- Update `js/activity-edit.js` with time input
- Enhance `js/activity-cards.js` to display time

---

## 📋 Round 8: Core Features - Complete Day & Display Modes

### Story #110: Complete Day Workflow Enhancement (Dev 1)
**Priority**: Critical - Daily planning core  
**Effort**: 2 days  

**Problem**: Complete Day button exists but doesn't implement the full legacy workflow.

**Acceptance Criteria**:
- [ ] Move all tomorrow activities to today
- [ ] Keep pinned activities for tomorrow (duplicate)
- [ ] Remove unpinned activities
- [ ] Sorting wave animation during transition
- [ ] Confirmation dialog with preview
- [ ] Success notification
- [ ] Undo capability for 10 seconds
- [ ] Handle edge cases (empty tomorrow, max activities)

**Technical Requirements**:
- Enhance `js/complete-day.js` with full workflow
- Add animation system for sorting wave
- Integrate with pin system from Round 4
- Add confirmation modal component
- Implement undo mechanism

---

### Story #111: Display Modes Implementation (Dev 2)
**Priority**: Important - Key differentiator  
**Effort**: 2 days  

**Problem**: Display mode toggle exists but Numbers/Times modes aren't implemented.

**Acceptance Criteria**:
- [ ] Numbers mode: Sequential numbering (1, 2, 3...)
- [ ] Times mode: Show time + sort by time
- [ ] Smooth transition between modes
- [ ] Persist mode preference per user
- [ ] Handle activities without times gracefully
- [ ] Time format respects user preference
- [ ] Visual distinction between modes
- [ ] Mode indicator in header

**Technical Requirements**:
- Enhance `js/display-mode-toggle.js` with mode logic
- Update `js/activity-display.js` for mode-specific rendering
- Add time-based sorting algorithm
- Create mode-specific CSS classes
- Integrate with badge cache for performance

---

### Story #112: Card Filtering System (Dev 3)
**Priority**: Important - Edit mode enhancement  
**Effort**: 1.5 days  

**Problem**: No way to search/filter activities in edit mode.

**Acceptance Criteria**:
- [ ] Search input in edit mode header
- [ ] Real-time filtering as user types
- [ ] Filter by title and description
- [ ] Clear filter button
- [ ] "No results" message
- [ ] Filter indicator showing X of Y activities
- [ ] Maintain filter during edit operations
- [ ] Keyboard focus management

**Technical Requirements**:
- Create `js/activity-filter.js` for search logic
- Update `js/edit-mode-menu.js` with search UI
- Enhance `js/activity-display.js` with filtering
- Add debounced search for performance
- Style with mobile-first approach

---

## 📋 Round 9: Polish & Limits (2-3 days per dev)

### Story #113: Character & Count Limits (Dev 1)
- 13-character title limit with counter
- 50 activity maximum with warnings
- Description character limits
- Validation and error messages

### Story #114: Card Menu Enhancement (Dev 2)
- Duplicate card function
- Add to library option
- Card type selection UI
- Quick actions menu

### Story #115: UI States & Feedback (Dev 3)
- Loading states for async operations
- Error message system
- Confirmation dialogs
- Empty states for all views

---

## 📋 Round 10: Advanced Edit Features (2 days per dev)

### Story #116: Bulk Edit Operations (Dev 1)
- Select multiple cards
- Bulk delete/move/duplicate
- Bulk time assignment
- Selection indicators

### Story #117: Advanced Filtering (Dev 2)
- Filter by type (recurring/frequent/single)
- Filter by completion status
- Filter by time range
- Save filter presets

### Story #118: Edit Mode Enhancements (Dev 3)
- Inline title editing
- Quick type switching
- Keyboard navigation
- Accessibility improvements

---

## 📋 Round 11: Data Management (2-3 days per dev)

### Story #119: Data Import/Export (Dev 1)
- Export activities to JSON
- Import from backup
- Legacy data migration
- Format validation

### Story #120: Activity Templates Enhancement (Dev 2)
- Save any activity as template
- Template categories
- Quick template application
- Template sharing prep

### Story #121: Data Integrity (Dev 3)
- Automatic backups
- Data corruption detection
- Recovery mechanisms
- Storage optimization

---

## 📋 Round 12: Sync Foundation (3 days per dev)

### Story #122: Sync Architecture (Dev 1)
- Sync state management
- Operation logging
- Conflict detection
- Queue management

### Story #123: Google Drive Integration (Dev 2)
- OAuth setup
- Drive API integration
- File management
- Permission handling

### Story #124: Sync UI (Dev 3)
- Sync status indicators
- Conflict resolution UI
- Sync settings
- Error handling

---

## 📋 Round 13: Performance & Testing (2 days per dev)

### Story #125: Large Dataset Optimization (Dev 1)
- Virtual scrolling enhancement
- Lazy loading strategies
- Memory management
- Performance monitoring

### Story #126: Cross-Platform Testing (Dev 2)
- iOS/Android verification
- PWA functionality
- Offline scenarios
- Edge case handling

### Story #127: Accessibility Audit (Dev 3)
- Screen reader testing
- Keyboard navigation
- Color contrast
- ARIA improvements

---

## 📋 Round 14: Final Polish (2 days per dev)

### Story #128: Animation Polish (Dev 1)
- Micro-interactions
- Transition smoothing
- Loading animations
- Celebration effects

### Story #129: Help System (Dev 2)
- In-app help tooltips
- Feature discovery
- Onboarding enhancement
- FAQ integration

### Story #130: Launch Preparation (Dev 3)
- Final bug fixes
- Performance audit
- Security review
- Migration tools

---

## 📊 Summary

### Total Rounds Remaining: 8 (Rounds 7-14)

### Time Estimates:
- **Rounds 7-8**: 18 days (detailed, critical features)
- **Rounds 9-10**: 12 days (polish and edit features)
- **Rounds 11-12**: 18 days (data and sync)
- **Rounds 13-14**: 12 days (testing and polish)

**Total**: ~60 development days across 8 rounds

### Critical Path (Minimum Viable Parity):
- **Rounds 7-9**: 27 days
- Achieves core feature parity
- Sync can be added post-launch

### Recommendation:
Focus on Rounds 7-9 for MVP launch. Rounds 10-14 can be completed post-launch based on user feedback and priorities.