# Round 7 Dev 3 - Story #109: Time Field Implementation

## Story Overview
**Priority**: Important - Enables time-based features  
**Developer**: Dev 3  
**Estimated Effort**: 3 days  
**Dependencies**: Activity data model, Edit mode system  

## Problem Statement
Activities in legacy StackMap can have associated times for scheduling and time-based display modes. The refactor lacks any time field, preventing users from organizing activities by time of day. This is essential for the "Times" display mode and helps users with ADHD maintain structured schedules.

## Acceptance Criteria

### ✅ **Data Model Enhancement**
- [ ] Add `time` field to activity schema
- [ ] Support null/empty time (not all activities have times)
- [ ] Store in 24-hour format internally (HH:mm)
- [ ] Maintain backward compatibility
- [ ] Handle timezone considerations
- [ ] Validate time format on save

### ✅ **Time Input Component**
- [ ] User-friendly time input in edit mode
- [ ] Support both 12-hour and 24-hour formats
- [ ] Smart parsing of various input formats
- [ ] Visual time picker option
- [ ] Keyboard-friendly input
- [ ] Touch-optimized for mobile

### ✅ **Time Display**
- [ ] Show time on activity cards when present
- [ ] Format according to user preference
- [ ] Relative time indicators (morning, afternoon, evening)
- [ ] Visual time icons
- [ ] Graceful handling of missing times
- [ ] Consistent formatting throughout app

### ✅ **Time Parsing Intelligence**
- [ ] Parse common formats: "3pm", "15:00", "3:30 PM"
- [ ] Handle edge cases: "noon", "midnight"
- [ ] Suggest times based on activity title
- [ ] Learn from user patterns
- [ ] Default to sensible times
- [ ] Clear validation feedback

### ✅ **User Preferences**
- [ ] 12-hour vs 24-hour format setting
- [ ] Default time suggestions toggle
- [ ] Time zone selection (future-ready)
- [ ] Persist format preference per user
- [ ] Quick format switching
- [ ] Preview of format changes

### ✅ **Integration Requirements**
- [ ] Works with existing edit mode
- [ ] Integrates with display modes (Story #111)
- [ ] Compatible with activity templates
- [ ] Supports bulk time assignment
- [ ] Time-based sorting ready
- [ ] Performance optimized

## Technical Implementation

### **Data Schema Updates**
```javascript
// Enhanced activity schema
const ActivitySchema = {
  id: 'string',
  userId: 'string',
  title: 'string',
  description: 'string',
  time: 'HH:mm|null', // NEW: 24-hour format
  timeZone: 'string', // NEW: Future-ready
  // ... other fields
};

// User preferences
const UserPreferences = {
  timeFormat: '12h|24h', // Display format
  defaultTimeSlots: {
    morning: '09:00',
    afternoon: '14:00',
    evening: '19:00'
  },
  suggestTimes: boolean
};
```

### **Time Input Component**
```javascript
class TimeInput {
  constructor(options = {}) {
    this.format = options.format || '12h';
    this.value = options.value || null;
    this.onChange = options.onChange;
  }
  
  render() {
    // Smart input with picker option
  }
  
  parse(input) {
    // Intelligent parsing logic
  }
  
  format(time) {
    // Format for display
  }
  
  validate(time) {
    // Validation logic
  }
}
```

### **Time Parser Utility**
```javascript
class TimeParser {
  static parse(input) {
    // Handle formats:
    // "3pm" → "15:00"
    // "3:30 PM" → "15:30"
    // "1530" → "15:30"
    // "noon" → "12:00"
    // "midnight" → "00:00"
  }
  
  static format(time, format = '12h') {
    // Convert HH:mm to display format
  }
  
  static isValid(time) {
    // Validate time format
  }
  
  static suggestTime(activityTitle) {
    // AI suggestions based on title
    // "Morning routine" → "07:00"
    // "Lunch" → "12:00"
    // "Evening workout" → "18:00"
  }
}
```

### **File Changes Required**
- `js/db-schema.js` - Add time field
- `js/time-input.js` (NEW) - Time input component
- `js/time-parser.js` (NEW) - Time parsing utilities
- `js/time-formatter.js` (NEW) - Display formatting
- `css/time-input.css` (NEW) - Time input styling
- `js/activity-edit.js` - Integrate time input
- `js/activity-cards.js` - Display time on cards
- `js/settings-manager.js` - Time format preference

## User Experience Design

### **Time Input Interface**
```
┌─────────────────────────────────┐
│ Activity Time                   │
│ ┌─────────────┐ ┌─────────────┐ │
│ │ 3:30 PM    ▼│ │    🕐      │ │
│ └─────────────┘ └─────────────┘ │
│  Text Input      Visual Picker  │
│                                 │
│ Quick times:                    │
│ [Morning] [Afternoon] [Evening] │
└─────────────────────────────────┘
```

### **Visual Time Picker**
- Clock face interface for touch
- Hour/minute selection
- AM/PM toggle for 12-hour
- Current time indicator
- Quick 15-minute increments
- Accessible keyboard navigation

### **Smart Suggestions**
- Based on activity title keywords
- Learn from user patterns
- Time of day awareness
- Previous similar activities
- Contextual hints

## Testing Requirements

### **Input Parsing Tests**
- [ ] Parse "3pm" correctly
- [ ] Parse "15:30" correctly
- [ ] Parse "3:30 PM" correctly
- [ ] Handle "noon" and "midnight"
- [ ] Reject invalid formats
- [ ] Handle edge cases

### **Display Format Tests**
- [ ] 12-hour format displays correctly
- [ ] 24-hour format displays correctly
- [ ] User preference respected
- [ ] Consistent formatting
- [ ] Handle null times gracefully

### **Integration Tests**
- [ ] Time saves with activity
- [ ] Time loads correctly
- [ ] Edit mode integration works
- [ ] Display modes show time
- [ ] Sorting by time works
- [ ] Performance acceptable

### **User Experience Tests**
- [ ] Input feels natural
- [ ] Picker works on mobile
- [ ] Keyboard navigation works
- [ ] Suggestions helpful
- [ ] Validation clear
- [ ] Format switching smooth

## Implementation Phases

### **Phase 1: Data Layer**
1. Update schema with time field
2. Create migration for existing data
3. Add time validation
4. Update storage operations

### **Phase 2: Input Components**
1. Build TimeInput component
2. Create TimeParser utility
3. Implement visual picker
4. Add smart suggestions

### **Phase 3: Integration**
1. Integrate with edit mode
2. Update activity cards
3. Add user preferences
4. Test all workflows

## Visual Specifications

### **Time Display on Cards**
```
┌─────────────────────────┐
│ [✓] Morning Routine     │
│     Get ready for work  │
│                         │
│ 🕐 7:30 AM             │
└─────────────────────────┘
```

### **Time Input States**
- **Empty**: Placeholder "Add time (optional)"
- **Focused**: Blue border, show picker icon
- **Valid**: Green checkmark indicator
- **Invalid**: Red border, error message
- **Suggested**: Yellow highlight

## Success Metrics

### **Functionality**
- [ ] Time field working end-to-end
- [ ] All input formats parsed correctly
- [ ] Display formats working
- [ ] Preferences persisted
- [ ] Integration complete

### **User Experience**
- [ ] Input feels intuitive
- [ ] Parsing seems smart
- [ ] Display is clear
- [ ] Mobile experience smooth
- [ ] Accessibility compliant

### **Performance**
- [ ] No lag on input
- [ ] Parsing is instant
- [ ] No impact on load time
- [ ] Efficient storage
- [ ] Smooth animations

## Risk Mitigation

### **Parsing Complexity**
- Start with common formats
- Clear validation messages
- Fallback to manual input
- Extensive testing
- User feedback collection

### **Timezone Issues**
- Store in consistent format
- Display in local time
- Future-ready for TZ support
- Clear documentation
- No DST bugs

### **Mobile Input Challenges**
- Native picker option
- Large touch targets
- Quick time buttons
- Prevent keyboard issues
- Test on various devices

## Definition of Done

### **Core Functionality**
- [ ] Time field in data model
- [ ] Time input component complete
- [ ] Parsing working for all formats
- [ ] Display formatting correct
- [ ] Preferences implemented

### **Integration Complete**
- [ ] Edit mode shows time input
- [ ] Cards display time
- [ ] Settings include format option
- [ ] No regressions
- [ ] Performance maintained

### **User Experience**
- [ ] Input feels natural
- [ ] Mobile experience polished
- [ ] Accessibility validated
- [ ] Visual design consistent
- [ ] Documentation complete

---

**Story #109 implements the time field infrastructure that enables time-based organization and scheduling in StackMap.**