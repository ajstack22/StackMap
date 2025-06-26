# Implementation Plan: Display Modes

**Story**: r8_dev3_story_117_display_modes.md
**Team**: 3 (PM3 + Dev3)
**Generated**: 2025-06-26

## Overview

This implementation introduces two distinct display modes for time perception: **Numbers Mode** (duration-based planning) and **Times Mode** (schedule-based planning). This addresses fundamental differences in how users with ADHD/autism process time, allowing them to choose between "how long" vs "when" approaches to activity planning.

## Technical Approach

### 1. File Structure
```
/refactor/
├── js/
│   ├── display-mode-manager.js    # NEW: Central mode management
│   ├── time-formatter.js          # ENHANCE: Add mode-aware formatting
│   ├── activity-display.js        # ENHANCE: Mode-specific rendering
│   ├── activity-cards.js          # ENHANCE: Card time display
│   ├── quick-add-ui.js           # ENHANCE: Mode-appropriate inputs
│   ├── settings-manager.js        # ENHANCE: Mode preference storage
│   └── display-mode-toggle.js     # REFACTOR: Support new modes
├── css/
│   ├── display-modes.css          # NEW: Mode-specific styling
│   └── base.css                   # ENHANCE: Mode classes
└── tests/
    └── display-modes.test.js      # NEW: Mode testing
```

### 2. Key Components

**DisplayModeManager (NEW)**
- Central authority for display mode state
- Handles mode switching and persistence
- Dispatches mode change events
- Provides mode-specific formatting helpers

**Enhanced Activity Display**
- Numbers Mode: Show duration estimates (1h, 30m)
- Times Mode: Show specific times (9:00 AM, 2:30 PM)
- Smooth transitions between modes
- Consistent mode application across all views

**Enhanced Time Input**
- Numbers Mode: Duration pickers (sliders, presets)
- Times Mode: Time pickers (clock interface)
- Mode-appropriate validation
- Contextual help text

### 3. Data Model

```javascript
// Enhanced activity schema
{
  id: 'string',
  title: 'string',
  // Time data supports both modes
  duration: number,           // Minutes (for Numbers Mode)
  scheduledTime: string,      // ISO time (for Times Mode)
  timeMode: 'estimate|scheduled',  // Activity's time type
  
  // Existing fields
  completed: boolean,
  priority: 'string',
  // ...
}

// User preferences schema
{
  userId: 'string',
  preferences: {
    displayMode: 'numbers|times',    // Current mode
    timeFormat: '12h|24h',          // Time display format
    showDurations: boolean,         // Show durations in Times Mode
    showStartTimes: boolean,        // Show times in Numbers Mode
    timeBlindnessHelpers: boolean   // Enable assistance features
  }
}
```

### 4. API Design

```javascript
// DisplayModeManager API
window.DisplayModeManager = {
  // Mode management
  getCurrentMode: () => 'numbers|times',
  setMode: (mode) => void,
  toggleMode: () => void,
  
  // Format helpers
  formatActivityTime: (activity, options) => string,
  formatDuration: (minutes) => string,
  formatScheduledTime: (time, format) => string,
  
  // Time blindness helpers
  getTimeContext: (time) => object,
  getRelativeTime: (time) => string,
  getDurationVisual: (minutes) => string,
  
  // Events
  onModeChange: (callback) => void,
  offModeChange: (callback) => void
};
```

## Implementation Steps

### Phase 1: Core Infrastructure (Day 1 Morning)
1. [x] Create `display-mode-manager.js` with basic mode switching
2. [x] Update `settings-manager.js` to store mode preferences
3. [x] Create `display-modes.css` with mode-specific styles
4. [x] Add mode classes to base.css (`.mode-numbers`, `.mode-times`)

### Phase 2: Activity Display Integration (Day 1 Afternoon)
5. [x] Refactor existing display mode in `activity-display.js`
6. [x] Update activity badge creation for both modes
7. [x] Enhance `formatTimeEstimate` for Numbers Mode
8. [x] Add `formatScheduledTime` for Times Mode
9. [x] Update activity card rendering in both modes

### Phase 3: Input Enhancement (Day 2 Morning)
10. [x] Create mode-aware time input components
11. [x] Update quick-add UI for mode-appropriate inputs
12. [x] Add duration picker for Numbers Mode
13. [x] Enhance time picker for Times Mode
14. [x] Add contextual help and examples

### Phase 4: Time Blindness Features (Day 2 Afternoon)
15. [x] Add visual duration indicators (progress bars)
16. [x] Implement relative time helpers
17. [x] Create time relationship visualizations
18. [x] Add gentle time awareness notifications
19. [x] Implement estimation assistance

### Phase 5: Testing & Polish
20. [x] Write comprehensive unit tests
21. [x] Test mode switching performance
22. [x] Verify accessibility compliance
23. [x] Test on all platforms (mobile, TV, web)
24. [x] Add first-use onboarding

## Testing Strategy

### Unit Tests
- Mode switching logic
- Time formatting in both modes
- Preference persistence
- Event dispatching

### Integration Tests
- Mode consistency across components
- Data migration from old display mode
- Performance with large activity lists
- Mode switching without data loss

### Accessibility Tests
- Screen reader announcements
- Keyboard navigation
- Focus management
- High contrast modes

### Platform Tests
- Mobile: Touch targets, viewport sizes
- TV: Remote navigation, large displays
- PWA: Offline mode persistence
- Web: Cross-browser compatibility

## Risk Mitigation

**Risk 1: User Confusion**
- Migration from current "numbers/time" to new modes
- **Mitigation**: Clear onboarding, examples, easy switching

**Risk 2: Performance Impact**
- Re-rendering all activities on mode switch
- **Mitigation**: Optimize rendering, use virtual scrolling

**Risk 3: Data Compatibility**
- Existing activities lack duration/scheduled time
- **Mitigation**: Smart defaults, migration helpers

**Risk 4: Accessibility Regression**
- Mode switching affecting screen readers
- **Mitigation**: Thorough ARIA testing, announcements

## Dependencies

### Existing Modules
- `activity-display.js` - Activity rendering
- `time-formatter.js` - Time formatting utilities
- `settings-manager.js` - Preference storage
- `storage.js` - Data persistence

### No External Libraries
- Pure vanilla JavaScript implementation
- No framework dependencies

## Success Criteria

1. [x] Users can switch between Numbers/Times modes instantly
2. [x] Mode preference persists across sessions
3. [x] All time displays respect current mode
4. [x] No performance degradation (< 100ms switch time)
5. [x] Accessibility standards maintained (WCAG 2.1 AA)
6. [x] Time blindness accommodations functional
7. [x] Works on all platforms without modification
8. [x] Clear visual distinction between modes
9. [x] Smooth migration from existing display mode
10. [x] No data loss during mode switches

## Migration Strategy

### From Current Implementation
The current "numbers/time" mode toggles between activity numbering and time estimates. The new implementation:

1. Preserves existing localStorage key initially
2. Maps old "numbers" → keep as Numbers Mode
3. Maps old "time" → migrate to Times Mode
4. Adds new preference structure gradually
5. Maintains backward compatibility

### User Communication
- Show mode explanation on first encounter
- Highlight benefits of each mode
- Easy switching with immediate preview
- No forced migration

---
*This plan addresses the critical need for accommodating different time processing styles in ADHD/autism-friendly design, providing users with control over how they perceive and interact with time.*