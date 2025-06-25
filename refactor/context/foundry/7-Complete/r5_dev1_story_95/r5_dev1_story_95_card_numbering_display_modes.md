# Round 5 Dev 1 - Story #95: Restore Card Numbering & Display Modes

## Story Overview
**Priority**: High - Core UX restoration  
**Developer**: Dev 1  
**Estimated Effort**: 2-3 days  
**Dependencies**: Round 4 complete  

## Problem Statement
The refactor has lost the original StackMap's signature card identification system. Users cannot quickly identify activities by number ("card 3") or time display, and the display mode toggle is non-functional. This breaks the visual scanning patterns that made StackMap effective for ADHD users.

## Acceptance Criteria

### ✅ **Card Numbering System**
- [ ] Sequential numbers (1, 2, 3...) displayed on each activity card
- [ ] Numbers positioned in top-right corner as circular badges (44px diameter)
- [ ] Numbers auto-update when cards are reordered
- [ ] Numbers visible in normal view mode
- [ ] Safe mode support (60px diameter badges)

### ✅ **Time Pills Display**  
- [ ] Time estimates displayed as alternative to numbers
- [ ] Same position as numbers (top-right corner, circular)
- [ ] Format: "15m", "1h", "2h30m" for different durations
- [ ] Fallback to "?" if no time estimate available
- [ ] Color coding: Green (<30m), Yellow (30m-2h), Orange (>2h)

### ✅ **Display Mode Toggle**
- [ ] Working toggle button between "Numbers" and "Time" modes
- [ ] Button integrated into unified header or day selector area
- [ ] User preference persisted in localStorage
- [ ] Smooth transition between display modes
- [ ] Keyboard shortcut support (suggested: 'M' for mode)

### ✅ **Visual Implementation**
- [ ] Badges styled consistently with original StackMap design
- [ ] High contrast mode support
- [ ] Reduced motion support (disable transitions)
- [ ] Mobile touch targets (44px minimum)
- [ ] Clear visual hierarchy

### ✅ **Integration Requirements**
- [ ] Works with existing ActivityDisplay system
- [ ] Compatible with pin system (Story #90)
- [ ] Maintains edit mode functionality
- [ ] No performance regression with large activity lists

## Technical Implementation

### **File Changes Required**
- `js/activity-display.js` - Add numbering logic and display mode toggle
- `js/activity-cards.js` - Update card rendering to include number/time badges
- `css/cards.css` - Add badge styling and positioning
- `css/visual-cards.css` - Enhance visual card appearance
- `index.html` - Add display mode toggle button to header

### **Data Model Updates**
```javascript
// Activity display preferences
{
  displayMode: 'numbers' | 'time',  // User preference
  cardNumber: number,               // Auto-generated sequence
  timeEstimate: number | null       // Minutes estimate
}
```

### **Key Functions to Implement**
```javascript
// Core functions needed
ActivityDisplay.setDisplayMode(mode)
ActivityDisplay.toggleDisplayMode()
ActivityDisplay.updateCardNumbers()
ActivityCard.renderNumberBadge(number)
ActivityCard.renderTimeBadge(minutes)
```

## User Experience Requirements

### **Visual Design**
- Badges positioned consistently in top-right corner
- Clear contrast against card background
- Readable fonts (minimum 14px)
- Subtle shadows for depth
- Animation on mode switch (unless reduced motion)

### **Interaction Patterns**
- Single tap/click to toggle display mode
- Immediate visual feedback
- Smooth transitions between modes
- No layout shift when switching modes

### **Accessibility**
- ARIA labels for badges ("Card number 3", "Estimated 15 minutes")
- Screen reader announcements on mode change
- Keyboard navigation support
- High contrast theme compatibility

## Success Metrics

### **Functional Verification**
- [ ] All cards show sequential numbering
- [ ] Display mode toggle works consistently
- [ ] Time estimates display correctly when available
- [ ] Preferences persist across app restarts
- [ ] No performance impact on card rendering

### **User Experience Verification**
- [ ] Quick visual scanning possible ("find card 5")
- [ ] Time-based identification functional ("15-minute tasks")
- [ ] Smooth mode switching experience
- [ ] Consistent with original StackMap UX patterns

## Testing Requirements

### **Unit Tests**
- Card numbering assignment logic
- Display mode toggle functionality
- Time estimate formatting
- Badge rendering with various inputs

### **Integration Tests**
- Works with activity reordering
- Compatible with edit mode
- Maintains pin system integration
- Persists user preferences correctly

### **Manual Testing**
- [ ] Test with 1 activity (shows "1")
- [ ] Test with 20+ activities (proper numbering)
- [ ] Test mode toggle responsiveness
- [ ] Test time estimate accuracy
- [ ] Test accessibility with screen readers
- [ ] Test safe mode badge sizing

## Dependencies & Coordination

### **Technical Dependencies**
- Round 4 completion (pin system)
- ActivityDisplay system stable
- CSS framework established

### **Round 5 Coordination**
- **Story #96 (Dev 2)**: Direct card edit controls - may need to position around badges
- **Story #97 (Dev 3)**: Card type system - coordinate badge positioning
- Shared CSS classes for badge positioning system

## Risk Assessment

### **Technical Risks**
- Performance impact with many cards
- Badge positioning conflicts with other UI elements
- Display mode state management complexity

### **Mitigation Strategies**
- Use CSS transforms for efficient badge positioning
- Implement virtual scrolling if performance issues arise
- Centralize display mode state management
- Test thoroughly with large activity lists

## Definition of Done

### **Code Quality**
- [ ] All code follows mobile-first patterns
- [ ] Accessibility requirements met
- [ ] Performance benchmarks maintained
- [ ] Error handling implemented

### **Integration**
- [ ] Works seamlessly with existing systems
- [ ] No breaking changes to other features
- [ ] Backward compatibility maintained
- [ ] Documentation updated

### **User Experience**
- [ ] Matches original StackMap visual patterns
- [ ] Intuitive display mode switching
- [ ] Clear visual card identification
- [ ] Responsive across all devices

---

**Story #95 restores the core visual identification system that made StackMap's card interface distinctive and effective for quick activity scanning.**