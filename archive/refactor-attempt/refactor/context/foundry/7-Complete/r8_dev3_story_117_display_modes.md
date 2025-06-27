# Round 8 Dev 3 - Story #117: Display Modes

## Story Overview
**Priority**: CRITICAL - User preference for time display  
**Developer**: Dev 3  
**Estimated Effort**: 2 days  
**Dependencies**: Activity display system exists  

## Problem Statement
Users have different relationships with time and scheduling. Some prefer estimate-based planning (1 hour, 2 hours) while others need specific time slots (9:00 AM, 2:30 PM). This fundamental difference in time perception requires two distinct display modes to accommodate different ADHD/autism time processing styles.

## Acceptance Criteria

### ✅ **Numbers Mode**
- [ ] Activities show duration estimates (1h, 30m, 2h)
- [ ] Time estimates are stackable/additive
- [ ] Focus on "how long" rather than "when"
- [ ] Visual time blocks based on duration
- [ ] Gentle time awareness without pressure

### ✅ **Times Mode**
- [ ] Activities show specific times (9:00 AM, 2:30 PM)
- [ ] Clear start/end time display
- [ ] Focus on "when" rather than "how long"
- [ ] Calendar-style time slots
- [ ] Traditional scheduling approach

### ✅ **Mode Toggle System**
- [ ] Easy toggle between Numbers/Times modes
- [ ] Mode preference saved per user
- [ ] Instant switching without reload
- [ ] Clear indication of current mode
- [ ] Mode affects all time displays

### ✅ **Time Blindness Accommodations**
- [ ] **Numbers Mode**: Gentle time awareness helpers
- [ ] **Times Mode**: Visual time relationship indicators
- [ ] Optional time estimation assistance
- [ ] Flexible scheduling in both modes
- [ ] No judgment for time perception differences

### ✅ **Integration & Consistency**
- [ ] Mode affects activity cards, edit mode, quick add
- [ ] Consistent time display throughout app
- [ ] Mode respects across app restarts
- [ ] Export/import preserves time format preferences
- [ ] Search works in both modes

## Technical Implementation

### **New Components**
- `js/display-mode-manager.js` - Mode switching logic
- `js/time-formatter.js` - Mode-specific formatting
- `css/display-modes.css` - Mode-specific styling

### **Enhanced Components**
- `js/activity-cards.js` - Mode-aware time display
- `js/activity-display.js` - Mode switching integration
- `js/quick-add-ui.js` - Mode-appropriate time inputs
- `js/user-manager.js` - Mode preference storage

### **Database Schema**
```javascript
// User preference schema
{
  userId: 'string',
  displayMode: 'numbers|times',
  timePreferences: {
    showDurations: boolean,
    showStartTimes: boolean,
    timeFormat: '12h|24h'
  }
}

// Activity time schema (supports both modes)
{
  duration: number, // minutes (for numbers mode)
  startTime: string, // ISO time (for times mode)
  endTime: string, // ISO time (for times mode)
  timeMode: 'estimate|scheduled'
}
```

## User Experience Requirements

### **Mode Discovery**
- [ ] Clear mode explanation on first use
- [ ] Example of each mode shown
- [ ] Easy switching with immediate feedback
- [ ] Mode benefits explained for different users
- [ ] No wrong choice messaging

### **Accessibility Features**
- [ ] Screen reader announces mode changes
- [ ] High contrast mode indicators
- [ ] Keyboard shortcuts for mode toggle
- [ ] Focus management during mode switch
- [ ] Clear visual hierarchy in both modes

## Success Metrics
- [ ] Users can switch between modes easily
- [ ] Mode preference persists correctly
- [ ] Time displays are clear in both modes
- [ ] No performance impact from mode switching
- [ ] Both modes accommodate time processing differences

## Definition of Done
- [ ] Both display modes implemented
- [ ] Mode switching functional
- [ ] User preferences saved
- [ ] Consistent time display across app
- [ ] Accessibility requirements met
- [ ] Time blindness accommodations working

---

**Story #117 provides critical accommodation for different time processing styles, essential for ADHD/autism-friendly design.**