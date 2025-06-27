# Implementation Plan: Pin/Keep System (Story #115)

## Overview
The Pin/Keep System enables activities to persist across day boundaries, supporting recurring habits, ongoing projects, and important reminders. This plan outlines a phased implementation approach that prioritizes stability and integrates seamlessly with existing systems.

## Phase 1: Data Model & Storage (Day 1 Morning)

### 1.1 Schema Updates
```javascript
// Enhanced activity schema in js/storage.js
{
  id: 'string',
  title: 'string',
  description: 'string',
  timeframe: 'string',
  isPinned: false,              // New: Pin status
  pinType: null,                 // New: 'daily'|'carry-forward'|'permanent'|null
  pinCreatedAt: null,            // New: When pinned (for analytics)
  lastPinTypeChange: null,       // New: Track pin type changes
  // ... existing fields
}
```

### 1.2 Migration Strategy
- Add pin fields with safe defaults to existing activities
- Create migration function in `js/migrations.js`
- Test with sample data before production rollout

### 1.3 Storage Functions
```javascript
// New functions in js/storage.js
- pinActivity(activityId, pinType)
- unpinActivity(activityId)
- getPinnedActivities()
- updatePinType(activityId, newType)
```

## Phase 2: Core Pin Functionality (Day 1 Afternoon)

### 2.1 Create Pin System Module
**File**: `js/pin-system.js`
```javascript
class PinSystem {
  // Pin type definitions
  static PIN_TYPES = {
    DAILY: 'daily',           // Stays in same timeframe
    CARRY_FORWARD: 'carry-forward',  // Moves to tomorrow
    PERMANENT: 'permanent'    // Never completes
  };

  // Core methods
  async pinActivity(activityId, pinType = 'daily') {}
  async unpinActivity(activityId) {}
  async togglePin(activityId) {}
  async changePinType(activityId, newType) {}
  
  // Query methods
  async getPinnedActivities() {}
  async isPinned(activityId) {}
  
  // Integration methods
  async handleDayCompletion(pinnedActivities) {}
  async carryForwardPins() {}
}
```

### 2.2 Pin Behavior Logic
- **Daily Pins**: Mark as incomplete, keep in original timeframe
- **Carry-Forward Pins**: Clone to tomorrow, mark original complete
- **Permanent Pins**: Never mark complete, always visible

## Phase 3: UI Components (Day 2 Morning)

### 3.1 Visual Design System
**File**: `css/pin-indicators.css`
```css
/* Pin indicator styles */
.pin-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 20px;
  transition: transform 0.2s ease;
}

.pin-indicator.pinned {
  color: var(--primary-color);
  transform: rotate(-45deg);
}

/* Pin type visual differentiation */
.pin-daily { color: var(--blue-500); }
.pin-carry-forward { color: var(--green-500); }
.pin-permanent { color: var(--purple-500); }

/* Accessibility */
.pin-indicator[aria-pressed="true"]::before {
  content: "📌 Pinned: ";
}
```

### 3.2 Pin Controls Integration
**Updates to**: `js/activity-cards.js`
```javascript
// Add pin button to card controls
renderPinButton(activity) {
  return `
    <button 
      class="pin-toggle ${activity.isPinned ? 'pinned' : ''}"
      aria-label="${activity.isPinned ? 'Unpin' : 'Pin'} activity"
      aria-pressed="${activity.isPinned}"
      data-activity-id="${activity.id}"
    >
      📌
    </button>
  `;
}
```

### 3.3 Edit Mode Integration
**Updates to**: `js/card-edit-controls.js`
- Add pin type selector in edit mode
- Show current pin status
- Allow pin type changes

## Phase 4: Complete Day Integration (Day 2 Afternoon)

### 4.1 Modify Complete Day Flow
**Updates to**: `js/complete-day.js`
```javascript
async processCompletedDay() {
  const pinnedActivities = await PinSystem.getPinnedActivities();
  
  // Handle each pin type
  for (const activity of pinnedActivities) {
    switch (activity.pinType) {
      case 'daily':
        // Reset completion status, keep in place
        await this.resetDailyPin(activity);
        break;
      case 'carry-forward':
        // Clone to tomorrow
        await this.carryForwardPin(activity);
        break;
      case 'permanent':
        // Skip - never completes
        break;
    }
  }
  
  // Continue with normal completion flow
}
```

### 4.2 User Feedback
- Show pin preservation in completion summary
- Highlight carried-forward activities
- Confirm permanent pins remain untouched

## Phase 5: Advanced Features (Day 3 Morning)

### 5.1 Bulk Operations
```javascript
// Bulk pin management
- pinMultipleActivities(activityIds, pinType)
- unpinAll()
- convertAllPinsToType(newType)
```

### 5.2 Pin Analytics
- Track pin usage patterns
- Most frequently pinned activities
- Pin type distribution
- Help users understand their habits

### 5.3 Smart Suggestions
- Suggest pinning frequently recreated activities
- Recommend pin types based on activity patterns
- Offer to convert completed recurring tasks to pins

## Testing Strategy

### Unit Tests
```javascript
// js/tests/pin-system.test.js
- Test pin/unpin functionality
- Verify pin type behaviors
- Test Complete Day integration
- Check migration handling
```

### Integration Tests
- Pin persistence across app restarts
- Complete Day workflow with various pin types
- UI interaction tests
- Performance with many pinned items

### User Testing Scenarios
1. **Basic Pin Flow**: Pin → Complete Day → Verify persistence
2. **Pin Type Changes**: Switch types and verify behavior
3. **Bulk Operations**: Pin multiple, complete day
4. **Edge Cases**: Delete pinned activity, corrupt pin data

## Performance Considerations

### Optimization Points
1. **Query Efficiency**: Index isPinned field in storage
2. **Render Performance**: Lazy load pin indicators
3. **Batch Operations**: Group pin updates
4. **Memory Usage**: Limit pinned activities display

### Benchmarks
- Pin toggle: < 100ms
- Load pinned activities: < 200ms
- Complete day with pins: < 500ms additional

## Rollback Strategy

### Feature Flags
```javascript
const FEATURES = {
  PIN_SYSTEM_ENABLED: true,
  ADVANCED_PIN_TYPES: false,  // Roll out gradually
  BULK_PIN_OPS: false
};
```

### Data Safety
- Keep original activity data intact
- Pin fields are additive only
- Can disable UI without data loss

## Success Metrics

### Technical Metrics
- Zero data loss through day completion
- Pin operations < 100ms
- No memory leaks with 100+ pins

### User Metrics
- 80% of users discover pin feature
- 60% actively use pins weekly
- < 5% confusion about pin behaviors

## Timeline

### Day 1
- Morning: Data model & storage (4 hours)
- Afternoon: Core pin functionality (4 hours)

### Day 2
- Morning: UI components & integration (4 hours)
- Afternoon: Complete Day integration (4 hours)

### Day 3
- Morning: Advanced features & polish (3 hours)
- Afternoon: Testing & documentation (3 hours)

## Dependencies

### Required Before Start
- ✅ Day Management System (Story #108)
- ✅ Complete Day Workflow (Story #112)

### Integration Points
- `js/complete-day.js`: Respect pin status
- `js/activity-cards.js`: Display indicators
- `js/storage.js`: Enhanced schema
- `js/activity-display.js`: Filter options

## Risks & Mitigations

### Risk 1: Data Loss
**Mitigation**: Extensive testing, gradual rollout, backup before migration

### Risk 2: User Confusion
**Mitigation**: Clear visual indicators, tooltips, onboarding flow

### Risk 3: Performance Impact
**Mitigation**: Indexed queries, lazy loading, performance monitoring

### Risk 4: Complex Pin Interactions
**Mitigation**: Start simple (daily pins only), add types gradually

## Next Steps

1. Review plan with team
2. Set up feature branch
3. Implement Phase 1 (data model)
4. Create test harness
5. Begin iterative development

---

**Implementation begins upon approval. This plan prioritizes stability and user understanding while delivering essential pin functionality.**