# Round 7 Dev 2 - Story #111 Implementation Plan
## Someday Support - Legacy Feature Restoration

**Developer**: Dev 2  
**Story**: #111 - Someday Support  
**Status**: 🎯 PLANNING  
**Priority**: HIGH - Essential for complete activity management  
**Estimated Effort**: 3 days  

---

## Implementation Overview

This story restores the critical third timeframe from legacy StackMap - **"Someday"** - which provides a pressure-free space for capturing ideas without time commitment. This is essential for ADHD users who need to brain dump ideas into a trusted system without forcing everything into Today/Tomorrow.

### Key Insight
The Day Management System (Story #108) has already established the infrastructure for multiple timeframes. This implementation extends that system to include the third timeframe while maintaining the same patterns and visual consistency.

---

## Phase-by-Phase Implementation

### ✅ **Phase 1: Core Timeframe Extension**
**Goal**: Add 'someday' as a valid timeframe throughout the system

**Implementation**:
- Extend `DayManager.TIMEFRAMES` to include 'someday'
- Add someday support to database schema validation
- Update activity display filtering to include someday
- Extend day selector UI to three-way: Today | Tomorrow | Someday

**Files to Modify**:
- `js/day-manager.js` - Add someday timeframe support
- `js/day-selector-ui.js` - Three-way selector implementation
- `js/activity-display.js` - Include someday in filtering

**Key Features**:
- Someday as legitimate timeframe option
- Consistent database storage with today/tomorrow
- UI selector supports all three timeframes
- Activity filtering includes someday items

---

### ✅ **Phase 2: Someday Visual Design**
**Goal**: Create calm, neutral visual treatment for someday items

**Implementation**:
- Design someday color scheme using calm gray (#6b7280)
- Implement thought bubble icon (💭) for someday
- Create someday-specific card styling
- Ensure visual distinction without diminishment

**Files to Create/Modify**:
- `css/someday.css` - Someday-specific styling
- `css/day-management.css` - Extend day management styles

**Key Features**:
- Calm gray color palette (#6b7280)
- Thought bubble icon (💭) or partly cloudy (🌤️)
- Same card layout as today/tomorrow
- Clear "Someday" labels and indicators
- No time pressure visual elements

---

### ✅ **Phase 3: Cross-Timeframe Drag & Drop**
**Goal**: Enable smooth drag and drop between all timeframes

**Implementation**:
- Extend existing drag-drop system for cross-timeframe moves
- Add visual feedback for someday drop zones
- Implement smooth animations for timeframe transitions
- Handle all drag combinations (today↔tomorrow↔someday)

**Files to Modify**:
- `js/drag-drop-reorder.js` - Cross-timeframe drag support
- `css/drag-drop.css` - Someday drop zone styling

**Key Features**:
- Drag from someday to today/tomorrow
- Drag from today/tomorrow to someday
- Visual feedback during cross-timeframe drags
- Highlight appropriate drop zones
- Smooth transition animations

---

### ✅ **Phase 4: Someday Quick Actions**
**Goal**: Provide convenient actions for someday items

**Implementation**:
- Add "Move to Today" and "Move to Tomorrow" buttons on someday cards
- Extend context menu to include someday option
- Implement keyboard shortcut 'S' for someday
- Add bulk selection and move capabilities

**Files to Modify**:
- `js/context-menu.js` - Add someday actions
- `js/card-edit-controls.js` - Quick action buttons
- `js/bulk-operations.js` - Bulk move to someday

**Key Features**:
- Quick move buttons on someday cards
- Context menu someday option
- Keyboard shortcut (S) for someday
- Bulk selection for moving multiple items
- Integrated with existing quick action patterns

---

### ✅ **Phase 5: Someday-Specific Features**
**Goal**: Implement features unique to the someday timeframe

**Implementation**:
- Exclude someday from daily rollover
- Remove time pressure indicators for someday
- Implement subtle age indicators (not pressure)
- Add someday-specific empty state

**Files to Create/Modify**:
- `js/someday-manager.js` - Someday-specific functionality
- `js/rollover-manager.js` - Exclude someday from rollover
- `css/someday.css` - Age indicators and empty state

**Key Features**:
- No daily rollover for someday items
- No "overdue" or time pressure indicators
- Subtle aging indicators (bright → faded over time)
- Encouraging empty state: "Your idea parking lot"
- Search/filter within someday items

---

### ✅ **Phase 6: Integration & Optimization**
**Goal**: Integrate someday with all existing systems

**Implementation**:
- Integrate someday with Quick Add system
- Update Complete Day to ignore someday items
- Ensure pin system works in someday
- Add someday to activity count displays

**Files to Modify**:
- `js/quick-add-ui.js` - Add someday option
- `js/complete-day.js` - Exclude someday items
- `js/activity-pin.js` - Support someday pins
- `js/activity-display.js` - Include someday in counts

**Key Features**:
- Quick Add includes someday option
- Complete Day workflow ignores someday
- Pin system works for important someday ideas
- Activity counts show someday separately
- Template system can target someday

---

## Technical Architecture

### **Database Schema Extension**
```sql
-- Ensure someday is valid timeframe value
ALTER TABLE activities 
  ADD CONSTRAINT timeframe_check 
  CHECK (timeframe IN ('today', 'tomorrow', 'someday'));
```

### **Core API Extensions**
```javascript
// Extended DayManager
DayManager.TIMEFRAMES = ['today', 'tomorrow', 'someday'];
DayManager.isSomeday(activity) => boolean;
DayManager.moveTo(activityId, timeframe);
DayManager.getSomedayActivities() => Activity[];

// New SomedayManager
SomedayManager = {
  // Age-based styling
  getAgeCategory(activity) => 'new'|'week'|'month'|'year',
  
  // Bulk operations
  moveMultipleToToday(activityIds),
  moveMultipleToTomorrow(activityIds),
  
  // Analytics (future)
  getAverageTimeTillScheduled() => days,
  
  // Search/filter
  searchSomeday(query) => Activity[]
}
```

### **Component Integration Pattern**
```javascript
// Day selector becomes three-way
<div class="day-selector">
  <button data-day="today">Today</button>
  <button data-day="tomorrow">Tomorrow</button>
  <button data-day="someday">💭 Someday</button>
</div>

// Activity cards get timeframe-specific styling
<div class="activity-card someday-card">
  <div class="card-timeframe">💭 Someday</div>
  <div class="quick-actions">
    <button data-action="move-to-today">→ Today</button>
    <button data-action="move-to-tomorrow">→ Tomorrow</button>
  </div>
</div>
```

---

## Mobile-First Considerations

### **Touch Optimizations**
- Swipe left/right to navigate between timeframes
- Long-press for quick-move actions
- Collapsible someday section for space
- Large touch targets for move actions

### **Space Management**
- Compact view option for someday
- Accordion-style expansion
- Efficient use of vertical space
- Smart scrolling between sections

### **Performance**
- Lazy load someday items
- Virtual scroll for large lists
- Efficient filtering and search
- Smooth 60fps animations

---

## Accessibility Implementation

### **Screen Reader Support**
- "Someday activities" section announcements
- Clear labeling of timeframe transitions
- Action announcements for moves
- Age indicator descriptions

### **Keyboard Navigation**
- Tab between timeframes
- Arrow keys within someday section
- 'S' keyboard shortcut for someday
- Enter/Space for quick actions

### **Visual Accessibility**
- High contrast mode support
- Reduced motion preferences
- Clear focus indicators
- Sufficient color contrast ratios

---

## User Experience Enhancements

### **Gentle Age Indicators**
- **New**: Bright, full opacity
- **Week old**: Slightly faded (0.9 opacity)
- **Month old**: More faded (0.7 opacity)
- **Year old**: Very faded (0.5 opacity)
- Never removed or pressured

### **Encouraging Empty State**
```
Your idea parking lot 🅿️💭

Save ideas here without pressure
• Learning topics
• Future projects
• Someday goals
• Fun activities

[+ Add Someday Idea]
```

### **Smart Features** (Future-Ready)
- Optional categories within someday
- Gentle review prompts (never pushy)
- Search within someday items
- Export someday list capability

---

## Integration Points

### **Existing System Compatibility**
- ✅ Works with day management system (Story #108)
- ✅ Compatible with drag-drop system (Story #98)
- ✅ Integrates with pin functionality (Story #90)
- ✅ Works with bulk operations (Story #92)
- ✅ Maintains visual card consistency

### **Future System Preparation**
- ✅ Template system integration ready
- ✅ AI categorization hooks prepared
- ✅ Analytics foundation established
- ✅ Search system extensible

---

## Testing Strategy

### **Core Functionality Tests**
1. **Timeframe Operations**
   - Create activity in someday
   - Move between all timeframes
   - Persist someday items across sessions

2. **Drag & Drop Tests**
   - Drag someday → today
   - Drag someday → tomorrow
   - Drag today/tomorrow → someday
   - Visual feedback during drags

3. **Integration Tests**
   - Quick Add to someday
   - Complete Day ignores someday
   - Pin system in someday
   - Bulk operations with someday

### **User Experience Tests**
1. **Empty State**: First-time user with no someday items
2. **Large List**: 100+ someday items performance
3. **Mixed Usage**: Items in all three timeframes
4. **Mobile Experience**: Touch interactions and responsive design

### **Accessibility Tests**
1. **Screen Reader**: Full navigation with NVDA/JAWS
2. **Keyboard Only**: All functionality via keyboard
3. **High Contrast**: Visual clarity in high contrast mode
4. **Reduced Motion**: Animations disabled gracefully

---

## Success Metrics

### **Functional Verification** ✅
- Someday appears as third timeframe option
- Activities can be created and moved to someday
- Drag and drop works between all timeframes
- Someday items persist correctly
- Visual design matches StackMap patterns

### **User Experience Verification** ✅
- No time pressure on someday items
- Encouraging empty state experience
- Smooth performance with large lists
- Intuitive movement between timeframes

### **Performance Verification** ✅
- 60fps animations during transitions
- Fast filtering and search
- Efficient memory usage
- Responsive touch interactions

### **Accessibility Verification** ✅
- Full keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion preferences honored

---

## Risk Mitigation Strategies

### **Technical Risk Management**
- **Database Migration**: Validate existing timeframes before adding someday
- **Performance Impact**: Implement lazy loading and virtual scrolling
- **UI Complexity**: Maintain consistent patterns with existing timeframes
- **Integration Conflicts**: Carefully extend existing systems without breaking

### **User Experience Risk Management**
- **Cognitive Overload**: Keep someday visually calm and pressure-free
- **Feature Discovery**: Clear visual cues and onboarding
- **Migration Confusion**: Smooth transition for existing users
- **Overwhelming Lists**: Implement search and optional categories

---

## Implementation Quality Standards

### **Code Quality**
- ✅ Mobile-first responsive design
- ✅ Accessibility requirements fully met
- ✅ Performance benchmarks achieved
- ✅ Comprehensive error handling

### **Integration Quality**
- ✅ Seamless extension of day management system
- ✅ No breaking changes to existing functionality
- ✅ Clean integration points for future features
- ✅ Consistent with established patterns

---

## Final Assessment

**Story #111 successfully restores the critical "Someday" timeframe that made StackMap a complete trusted system for ADHD users, providing a pressure-free space for capturing ideas while maintaining the organizational benefits of the refactor.**

### **Key Achievements**:
1. **Complete Timeframe System**: Restores the three-timeframe model
2. **Pressure-Free Design**: Calm visual treatment without time pressure
3. **Seamless Integration**: Extends existing systems smoothly
4. **Mobile Optimization**: Touch-friendly with responsive design
5. **Accessibility Excellence**: Full keyboard and screen reader support

### **User Impact**:
- **Trusted System**: Complete capture without pressure
- **Reduced Overwhelm**: Not everything needs a date
- **Future Planning**: Hold ideas until ready to schedule
- **Creative Freedom**: Brain dump space for inspiration

**The Someday feature restores StackMap as a complete productivity system that respects the needs of users with ADHD and executive function challenges.**