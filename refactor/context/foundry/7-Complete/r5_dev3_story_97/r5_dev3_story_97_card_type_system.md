# Round 5 Dev 3 - Story #97: Card Type System

## Story Overview
**Priority**: High - Core categorization restoration  
**Developer**: Dev 3  
**Estimated Effort**: 3-4 days  
**Dependencies**: Round 4 complete, Stories #95/#96 positioning established  

## Problem Statement
The refactor has lost the original StackMap's sophisticated card type system that allowed users to categorize activities as recurring, frequent, or single-use. This classification system was crucial for helping users understand and manage different types of activities in their daily routines.

## Acceptance Criteria

### ✅ **Card Type Classification System**
- [ ] Three card types: Recurring, Frequent, Single-use
- [ ] Type indicators displayed on each card
- [ ] User can assign/change card types during creation and editing
- [ ] Default type assignment based on patterns or user preference
- [ ] Type inheritance for duplicated activities

### ✅ **Visual Type Indicators**
- [ ] Circular type buttons positioned at bottom-center of cards (44px diameter)
- [ ] Purple theme with Material Design-style icons
- [ ] Icons: Recurring (↻ refresh), Frequent (⭐ star), Single-use (📅 event)
- [ ] Subtle background colors to distinguish types
- [ ] Safe mode support (60px diameter)

### ✅ **Type-Based Functionality**
- [ ] Recurring activities auto-suggest for tomorrow
- [ ] Frequent activities track usage patterns
- [ ] Single-use activities archive after completion
- [ ] Type-specific actions in context menus
- [ ] Filtering by activity type

### ✅ **Integration with Pin System**
- [ ] Recurring activities default to pinned state
- [ ] Pin behavior varies by type (recurring auto-pin, single-use never pin)
- [ ] Type influences Complete Day workflow behavior
- [ ] Compatible with existing pin indicators (Story #90)

### ✅ **Type Management Interface**
- [ ] Type selector in add/edit activity forms
- [ ] Bulk type assignment capabilities
- [ ] Type change confirmation for activities with history
- [ ] Type statistics and insights (optional)

## Technical Implementation

### **File Changes Required**
- `js/activity-types.js` - New file for type system logic
- `js/activity-cards.js` - Add type indicator rendering
- `js/activity-display.js` - Type-based filtering and behavior
- `js/edit-mode-menu.js` - Type management actions
- `css/activity-types.css` - Type indicator styling
- `css/cards.css` - Integration with card layout
- `js/db-schema.js` - Add type field to activity schema

### **Data Model Updates**
```javascript
// Activity type field addition
{
  type: {
    category: 'recurring' | 'frequent' | 'single-use',
    assignedAt: timestamp,
    confidence: number,      // Auto-assignment confidence (0-1)
    lastUsed: timestamp,     // For frequent type tracking
    usageCount: number       // For pattern recognition
  }
}

// Type definitions
const ACTIVITY_TYPES = {
  recurring: {
    icon: '↻',
    label: 'Recurring',
    description: 'Daily/weekly routines',
    defaultPinned: true,
    autoSuggest: true
  },
  frequent: {
    icon: '⭐',
    label: 'Frequent',
    description: 'Often-used activities',
    defaultPinned: false,
    trackUsage: true
  },
  singleUse: {
    icon: '📅',
    label: 'Single-use',
    description: 'One-time activities',
    defaultPinned: false,
    archiveOnComplete: true
  }
}
```

### **Key Functions to Implement**
```javascript
// Core type system functions
ActivityTypes.assignType(activityId, type, confidence)
ActivityTypes.suggestType(activityData)
ActivityTypes.getTypeIcon(type)
ActivityTypes.getTypeColor(type)
ActivityTypes.handleTypeSpecificBehavior(activity, action)
ActivityTypes.filterByType(activities, typeFilter)
ActivityTypes.getTypeStatistics()
```

## User Experience Requirements

### **Visual Design**
- Type indicators positioned at bottom-center of cards
- Consistent with original StackMap purple theme
- Clear icons that communicate purpose
- Subtle hover/focus effects
- Integration with card layout without crowding

### **Type Assignment Flow**
- Smart default suggestions based on content/patterns
- Easy type changing through context menus or edit mode
- Visual feedback when type is changed
- Confirmation for destructive type changes

### **Mode-Specific Visibility**
- Type indicators visible in normal view mode
- Enhanced type management in edit mode
- Type-based filtering and organization
- Type statistics in settings or analytics

### **Accessibility**
- Screen reader labels for type indicators
- Keyboard navigation for type selection
- High contrast theme support
- Clear visual distinction between types

## Success Metrics

### **Functional Verification**
- [ ] All three activity types function correctly
- [ ] Type indicators display consistently
- [ ] Type-specific behaviors work as designed
- [ ] Type assignment and changes persist correctly
- [ ] Filtering by type functions properly

### **User Experience Verification**
- [ ] Users can easily understand type meanings
- [ ] Type assignment feels intuitive
- [ ] Visual indicators are clear and accessible
- [ ] Type-based workflows improve activity management
- [ ] Performance remains smooth with type calculations

## Testing Requirements

### **Unit Tests**
- Type assignment logic
- Type suggestion algorithms
- Type indicator rendering
- Type-specific behavior functions
- Database schema migration

### **Integration Tests**
- Works with pin system (Story #90)
- Compatible with card numbering (Story #95)
- Integrates with edit controls (Story #96)
- Maintains Complete Day workflow compatibility

### **Manual Testing**
- [ ] Test type assignment for new activities
- [ ] Test type changing for existing activities
- [ ] Test type indicators on various card sizes
- [ ] Test type-based filtering
- [ ] Test accessibility with screen readers
- [ ] Test type-specific behaviors

## Dependencies & Coordination

### **Technical Dependencies**
- Story #95 (Card Numbering) - coordinate indicator positioning
- Story #96 (Edit Controls) - integrate type management into edit flow
- Round 4 pin system - coordinate with type-based pinning logic

### **Round 5 Coordination**
- **Story #95 (Dev 1)**: Coordinate card layout with number badges
- **Story #96 (Dev 2)**: Integrate type management into edit controls
- Shared CSS classes for card indicator positioning system

## Implementation Phases

### **Phase 1: Core Type System**
- Define type categories and behaviors
- Add type field to database schema
- Implement basic type assignment

### **Phase 2: Visual Indicators**
- Create type indicator components
- Position indicators on cards
- Style indicators with purple theme

### **Phase 3: Type-Specific Behaviors**
- Implement recurring activity auto-suggestions
- Add frequent activity usage tracking
- Create single-use archiving behavior

### **Phase 4: Management Interface**
- Add type selection to activity forms
- Implement bulk type assignment
- Create type-based filtering

## Risk Assessment

### **Technical Risks**
- Card layout complexity with multiple indicators
- Performance impact of type-based calculations
- Database migration complexity
- Integration conflicts with existing systems

### **Mitigation Strategies**
- Use CSS Grid for flexible card layout
- Implement efficient type calculation algorithms
- Plan database migration carefully
- Test integration thoroughly with existing features

## Definition of Done

### **Code Quality**
- [ ] Mobile-first responsive implementation
- [ ] Accessibility requirements fully met
- [ ] Performance benchmarks maintained
- [ ] Comprehensive error handling

### **Integration**
- [ ] Seamless integration with existing card system
- [ ] Compatible with all current features
- [ ] No breaking changes to user workflows
- [ ] Database migration successful

### **User Experience**
- [ ] Intuitive type assignment and management
- [ ] Clear visual communication of type meaning
- [ ] Improved activity organization capabilities
- [ ] Consistent with StackMap design principles

## Future Enhancement Opportunities

### **Advanced Type Features**
- Custom user-defined types
- Type-based scheduling recommendations
- Type history and analytics
- Smart type learning from user patterns

### **Integration Opportunities**
- Type-based notification settings
- Type-specific templates
- Type-based export/sharing
- Type analytics dashboard

---

**Story #97 restores the sophisticated activity categorization system that made StackMap effective for organizing different types of daily activities and routines.**