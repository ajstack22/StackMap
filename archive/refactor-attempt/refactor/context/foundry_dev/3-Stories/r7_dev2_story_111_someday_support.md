# Round 7 Dev 2 - Story #111: Someday Support
## Legacy Feature Restoration

### Story Overview
**Priority**: HIGH - Essential for complete activity management  
**Developer**: Dev 2  
**Estimated Effort**: 3 days  
**Dependencies**: Day Management System (Story #108)  

### Problem Statement
Legacy StackMap had three timeframes: Today, Tomorrow, and Someday. The Someday bucket was crucial for ADHD users who need to capture ideas without commitment pressure. Currently, users must either force activities into Today/Tomorrow (creating overwhelm) or not capture them at all (losing ideas). This missing feature breaks the "trusted system" aspect of StackMap.

### User Value
- **Parking Lot**: Capture ideas without time pressure
- **Reduced Overwhelm**: Not everything needs a date
- **Brain Dump**: Get thoughts out of head into trusted system
- **Future Planning**: Hold activities until ready to schedule
- **Inspiration Bank**: Save activity ideas for later

### Acceptance Criteria

#### ✅ **Someday as Third Timeframe**
- [ ] Add 'someday' to activity timeframe enum
- [ ] Extend day selector: Today | Tomorrow | Someday
- [ ] Consistent UI treatment with other timeframes
- [ ] Database support for someday timeframe
- [ ] Activity display filtering includes someday

#### ✅ **Visual Design**
- [ ] Someday uses calm gray/neutral color (#6b7280)
- [ ] Icon: 💭 (thought bubble) or 🌤️ (partly cloudy)
- [ ] Same card layout as today/tomorrow
- [ ] Visual distinction but not diminished
- [ ] Clear "Someday" label on cards

#### ✅ **Someday-Specific Features**
- [ ] No daily rollover for someday items
- [ ] No "overdue" or time pressure indicators
- [ ] Optional categories within someday
- [ ] Bulk move from someday to today/tomorrow
- [ ] Search/filter within someday items

#### ✅ **Drag and Drop**
- [ ] Drag from someday to today/tomorrow
- [ ] Drag from today/tomorrow to someday
- [ ] Visual feedback during drag
- [ ] Drop zones highlight appropriately
- [ ] Smooth animation on drop

#### ✅ **Quick Actions**
- [ ] "Move to today" button on someday cards
- [ ] "Move to tomorrow" button on someday cards
- [ ] Context menu includes someday option
- [ ] Keyboard shortcut: S for someday
- [ ] Bulk selection for moving multiple

#### ✅ **Empty State**
- [ ] Encouraging message: "Your idea parking lot"
- [ ] Subtle prompt: "Save ideas here without pressure"
- [ ] Quick examples of someday items
- [ ] No shame or judgment
- [ ] Optional: Hide someday when empty

#### ✅ **Integration Points**
- [ ] Quick Add includes someday option
- [ ] Templates can target someday
- [ ] Complete Day ignores someday items
- [ ] Pin system works in someday (for important ideas)
- [ ] Activity count shows someday separately

### Technical Implementation

#### **Database Changes**
```sql
-- Already supports through timeframe field
-- Ensure 'someday' is valid value
ALTER TABLE activities 
  CHECK (timeframe IN ('today', 'tomorrow', 'someday'));
```

#### **New/Modified Files**
- `js/day-manager.js` - Add someday support
- `js/day-selector-ui.js` - Three-way selector
- `css/someday.css` - Someday-specific styling
- `js/activity-display.js` - Filter for someday
- `js/drag-drop-reorder.js` - Cross-timeframe drops

#### **Key Functions**
```javascript
// Extend DayManager
DayManager.TIMEFRAMES = ['today', 'tomorrow', 'someday'];
DayManager.isSomeday() => boolean;
DayManager.moveTo(activityId, timeframe);

// Someday-specific
SomedayManager = {
  // Organize someday items
  categorize(activityId, category),
  
  // Bulk operations
  moveMultipleToToday(activityIds),
  
  // Smart suggestions
  suggestForScheduling() => Activity[],
  
  // Analytics
  getAverageTimeTillScheduled() => days
}
```

### User Experience Enhancements

#### **Smart Someday Features**
1. **Age Indicators**: Subtle aging (not pressure)
   - New: Bright
   - Week old: Slightly faded
   - Month old: More faded
   - Year old: Very faded (not gone)

2. **Categories** (Optional)
   - Work Ideas
   - Personal Projects
   - Health Goals
   - Learning Topics
   - Fun Activities

3. **Review Prompts** (Gentle)
   - "You have 15 someday ideas"
   - "Maybe review your someday list?"
   - Never pushy or judgmental

#### **Mobile Optimizations**
- Swipe right to access someday
- Long-press to quick-move items
- Collapsible someday section
- Compact view option
- Search within someday

### Visual Mockup

```
┌─────────────────────────────────┐
│ [☰] StackMap               [☰] │
├─────────────────────────────────┤
│ [Today] [Tomorrow] [Someday💭]  │
├─────────────────────────────────┤
│          Someday Ideas          │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Learn Spanish                │ │
│ │ 💭 Added 3 days ago         │ │
│ │ [→Today] [→Tomorrow]        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Organize photo library       │ │
│ │ 💭 Added 2 weeks ago        │ │
│ │ [→Today] [→Tomorrow]        │ │
│ └─────────────────────────────┘ │
│                                 │
│ [+ Add Someday Idea]            │
└─────────────────────────────────┘
```

### Accessibility

- [ ] Screen reader announces "Someday activities"
- [ ] Keyboard navigation between timeframes
- [ ] Clear focus indicators
- [ ] Alt text for someday icons
- [ ] High contrast mode support
- [ ] Voice input: "Add to someday"

### Performance Considerations

- [ ] Lazy load someday items
- [ ] Virtual scroll for long lists
- [ ] Cache someday count
- [ ] Efficient filtering
- [ ] Smooth animations under 60fps

### Success Metrics

1. **Adoption**: 60% of users utilize someday
2. **Retention**: Someday items eventually scheduled
3. **Satisfaction**: Reduced overwhelm reported
4. **Usage**: Average 10-20 items in someday
5. **Flow**: Smooth movement between timeframes

### Testing Scenarios

1. **Empty Someday**: First time user experience
2. **Full Someday**: 100+ items performance
3. **Drag Operations**: All direction combinations
4. **Categories**: Organize within someday
5. **Bulk Moves**: Select 10, move to today
6. **Search**: Find items in large someday list

### Future Enhancements (Not This Story)

- AI categorization of someday items
- Smart scheduling suggestions
- Someday templates
- Collaborative someday lists
- Time-based auto-scheduling

### Definition of Done

- [ ] Someday appears as third timeframe option
- [ ] Activities can be created in someday
- [ ] Drag and drop between all timeframes works
- [ ] Someday items persist separately
- [ ] Visual design matches StackMap patterns
- [ ] No time pressure on someday items
- [ ] Quick move actions functional
- [ ] Empty state encouraging
- [ ] Mobile experience optimized
- [ ] Accessibility requirements met
- [ ] Performance targets achieved
- [ ] User documentation updated

---

**This story restores the "trusted system" aspect of StackMap by providing a pressure-free space for capturing future ideas and activities.**