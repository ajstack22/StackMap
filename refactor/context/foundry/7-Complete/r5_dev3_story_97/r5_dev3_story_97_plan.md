# Implementation Plan: Story #97 - Card Type System

## Overview
Implement a sophisticated card type system that allows users to categorize activities as recurring, frequent, or single-use. This system will restore critical functionality from the original StackMap that helps users organize different types of activities with appropriate behaviors and visual indicators.

## Current State Analysis
- Activity cards system exists with pin functionality (Story #90)
- Database schema supports metadata and could be extended for types
- Card layout uses CSS Grid with proper mobile-first responsive design
- Pin buttons positioned with 44px touch targets (60px in safe mode)
- Visual card system integrated with activity display
- Need to add type indicators and type-specific behaviors

## Files to Create/Modify

### New Files
1. **js/activity-types.js** - Core type system logic
   - ActivityTypes class for managing type assignment and behavior
   - Type suggestion algorithms
   - Type-specific action handlers
   - Type filtering and statistics

2. **css/activity-types.css** - Type indicator styling
   - Type indicator buttons (bottom-center positioning)
   - Purple theme with Material Design icons
   - Mobile-responsive touch targets
   - Safe mode compatibility
   - Integration with existing card layout

### Modified Files
1. **js/db-schema.js** - Add type field to activity schema
   - Extend activity fields with type category
   - Add migration logic for existing activities
   - Update validation rules

2. **js/activity-cards.js** - Add type indicator rendering
   - Integrate type indicators into card creation
   - Position indicators at bottom-center
   - Handle type display in different view modes

3. **js/activity-display.js** - Type-based filtering and behavior
   - Add type filtering capabilities
   - Implement type-specific behaviors
   - Update activity rendering to include types

4. **js/edit-mode-menu.js** - Type management actions
   - Add type assignment to bulk operations
   - Integrate type changing in edit workflows

5. **index.html** - Include new script and style files
   - Add activity-types.css
   - Add activity-types.js
   - Maintain proper loading order

## Implementation Steps

### Phase 1: Core Type System Foundation
1. **Create ActivityTypes class** (js/activity-types.js)
   - Define three type categories with properties
   - Implement type assignment logic
   - Create type suggestion algorithms
   - Add type validation functions

2. **Update database schema** (js/db-schema.js)
   - Add type field to activity structure
   - Implement schema migration for v4
   - Update validation rules to include type
   - Add default type assignment logic

3. **Create type indicator styling** (css/activity-types.css)
   - Position indicators at bottom-center of cards
   - 44px diameter (60px in safe mode)
   - Purple theme with clear icons
   - Responsive design for mobile/tablet/desktop

### Phase 2: Visual Type Indicators
1. **Implement type indicator rendering** (js/activity-cards.js)
   - Add type indicator to card creation
   - Position at bottom-center without interfering with pins
   - Handle different card sizes and orientations
   - Integrate with existing card pool system

2. **Create type-specific visual design**
   - Recurring: ↻ refresh icon, light purple background
   - Frequent: ⭐ star icon, medium purple background
   - Single-use: 📅 event icon, deep purple background
   - Hover and focus states for accessibility

3. **Coordinate with pin system positioning**
   - Ensure type indicators don't conflict with pin buttons
   - Create flexible layout system for multiple indicators
   - Test visual hierarchy and user experience

### Phase 3: Type-Specific Behaviors
1. **Implement type-based functionality**
   - Recurring: Auto-suggest for tomorrow, default pinned
   - Frequent: Track usage patterns, suggest based on frequency
   - Single-use: Archive after completion, never auto-pin

2. **Integrate with Complete Day workflow**
   - Recurring activities carry over automatically
   - Frequent activities suggested based on patterns
   - Single-use activities archived when completed

3. **Add type-based filtering** (js/activity-display.js)
   - Filter activities by type category
   - Show/hide based on type preferences
   - Maintain performance with large activity sets

### Phase 4: Type Management Interface
1. **Add type selection to activity forms**
   - Type selector in add/edit activity dialogs
   - Smart default suggestions based on content
   - Visual preview of type assignment

2. **Implement bulk type management**
   - Bulk type assignment in edit mode
   - Type change confirmation for activities with history
   - Undo support for type changes

3. **Create type management actions**
   - Context menu options for type changing
   - Keyboard shortcuts for type assignment
   - Type-based bulk operations

## Technical Architecture

### Type System Core
```javascript
const ACTIVITY_TYPES = {
  recurring: {
    id: 'recurring',
    icon: '↻',
    label: 'Recurring',
    description: 'Daily/weekly routines',
    color: '#8b5cf6', // Purple-500
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    defaultPinned: true,
    autoSuggest: true,
    behaviors: ['carryOver', 'autoPin', 'suggestTomorrow']
  },
  frequent: {
    id: 'frequent',
    icon: '⭐',
    label: 'Frequent',
    description: 'Often-used activities',
    color: '#7c3aed', // Purple-600
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    defaultPinned: false,
    trackUsage: true,
    behaviors: ['trackUsage', 'suggestBasedOnPattern']
  },
  singleUse: {
    id: 'single-use',
    icon: '📅',
    label: 'Single-use',
    description: 'One-time activities',
    color: '#6d28d9', // Purple-700
    backgroundColor: 'rgba(109, 40, 217, 0.1)',
    defaultPinned: false,
    archiveOnComplete: true,
    behaviors: ['archiveOnComplete', 'neverAutoPin']
  }
};

class ActivityTypes {
  // Core type management functions
  static assignType(activityId, type, confidence = 1.0) { }
  static suggestType(activityData) { }
  static getTypeDefinition(typeId) { }
  static getTypeIndicator(type) { }
  static handleTypeSpecificBehavior(activity, action) { }
  static filterByType(activities, typeFilter) { }
  static getTypeStatistics() { }
  static migrateExistingActivities() { }
}
```

### Database Schema Extension
```javascript
// Add to activity schema in db-schema.js
{
  // ... existing fields
  type: {
    category: { type: 'enum', values: ['recurring', 'frequent', 'single-use'], default: 'frequent' },
    assignedAt: { type: 'timestamp', autoSet: true },
    confidence: { type: 'number', min: 0, max: 1, default: 1.0 },
    assignedBy: { type: 'enum', values: ['user', 'auto', 'suggested'], default: 'auto' },
    lastUsed: { type: 'timestamp', nullable: true },
    usageCount: { type: 'number', default: 0 },
    patternScore: { type: 'number', min: 0, max: 1, default: 0 }
  }
}
```

### Visual Positioning System
```css
/* Type indicator positioning at bottom-center */
.activity-card {
  position: relative;
  padding-bottom: 60px; /* Space for indicators */
}

.activity-type-indicator {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.safe-mode .activity-type-indicator {
  width: 60px;
  height: 60px;
  font-size: 24px;
}

/* Pin indicator positioning (top-right) */
.activity-pin-button {
  position: absolute;
  top: 12px;
  right: 12px;
}
```

## Dependencies and Coordination

### Technical Dependencies
- **Story #90 (Pin System)** - Coordinate indicator positioning and behaviors
- **Database Schema v3** - Extend to v4 with type fields
- **Activity Display System** - Integrate type rendering and filtering
- **Card Layout System** - Ensure flexible positioning for multiple indicators

### Round 5 Coordination
- **Story #95 (Dev 1 - Card Numbering)** - Coordinate bottom positioning with type indicators
- **Story #96 (Dev 2 - Edit Controls)** - Integrate type management into edit workflows
- **Shared CSS classes** - Create consistent indicator positioning system

### Integration Points
- Pin system: Type-based default pinning logic
- Complete Day workflow: Type-specific carry-over behaviors
- Bulk operations: Type-based bulk management
- Activity library: Type-based templates and suggestions

## Risk Mitigation

### Layout Complexity
- **Risk**: Multiple indicators crowding card layout
- **Mitigation**: Use CSS Grid for flexible positioning, test various screen sizes
- **Fallback**: Progressive disclosure of indicators based on available space

### Performance Impact
- **Risk**: Type calculations affecting render performance
- **Mitigation**: Efficient algorithms, caching, lazy evaluation
- **Monitoring**: Performance benchmarks during development

### Data Migration
- **Risk**: Existing activities without type assignments
- **Mitigation**: Smart default assignment, gradual migration, user review
- **Safety**: Backup before migration, rollback capability

### User Experience Confusion
- **Risk**: Users confused by type meanings or assignments
- **Mitigation**: Clear onboarding, intuitive defaults, help documentation
- **Testing**: User testing with ADHD/autism accommodation feedback

## Testing Strategy

### Unit Tests
- [ ] Type assignment logic with edge cases
- [ ] Type suggestion algorithms accuracy
- [ ] Type-specific behavior functions
- [ ] Database migration success
- [ ] Type indicator rendering

### Integration Tests
- [ ] Coordination with pin system positioning
- [ ] Type-based filtering performance
- [ ] Complete Day workflow with type behaviors
- [ ] Bulk operations with type management
- [ ] Mobile responsive design

### Manual Testing
- [ ] Type assignment for new activities
- [ ] Type changing for existing activities
- [ ] Visual indicators at different screen sizes
- [ ] Type-based behaviors (recurring carry-over, etc.)
- [ ] Accessibility with screen readers
- [ ] Safe mode compatibility (60px targets)

### Accessibility Testing
- [ ] Screen reader labels for type indicators
- [ ] Keyboard navigation for type selection
- [ ] High contrast mode support
- [ ] Color-blind friendly design

## Performance Considerations

### Rendering Optimization
- Efficient type indicator creation and positioning
- Minimal DOM manipulation during type changes
- CSS-based visual states over JavaScript

### Calculation Efficiency
- Lazy evaluation of type suggestions
- Caching of type-based calculations
- Debounced updates during bulk operations

### Memory Management
- Cleanup of event listeners
- Efficient data structures for type tracking
- Garbage collection of temporary type objects

## Accessibility Requirements

### Visual Design
- High contrast type indicators (4.5:1 minimum)
- Clear iconography that works without color
- Consistent visual hierarchy
- Support for custom themes

### Screen Reader Support
- Proper ARIA labels for type indicators
- Semantic markup for type information
- Announced changes when type is modified
- Alternative text for type icons

### Keyboard Navigation
- TAB navigation through type selectors
- SPACE/ENTER activation for type indicators
- Arrow keys for type option navigation
- ESC to cancel type changes

## Definition of Done

### Functional Requirements
- [ ] All three activity types function correctly
- [ ] Type indicators display consistently across devices
- [ ] Type-specific behaviors work as designed
- [ ] Type assignment and changes persist correctly
- [ ] Type-based filtering functions properly
- [ ] Integration with pin system completed

### Quality Requirements
- [ ] Mobile-first responsive implementation
- [ ] 44px touch targets (60px in safe mode)
- [ ] Performance maintains current benchmarks
- [ ] Comprehensive error handling
- [ ] Accessibility requirements fully met
- [ ] Database migration tested and safe

### User Experience Requirements
- [ ] Intuitive type assignment and management
- [ ] Clear visual communication of type meaning
- [ ] Improved activity organization capabilities
- [ ] Consistent with StackMap design principles
- [ ] ADHD/autism accommodation considerations

### Integration Requirements
- [ ] Seamless integration with existing systems
- [ ] No breaking changes to current workflows
- [ ] Compatible with all existing features
- [ ] Proper coordination with Round 5 stories

## Future Enhancement Opportunities

### Advanced Features (Out of Scope)
- Custom user-defined types
- Type-based scheduling recommendations
- Advanced type analytics and insights
- Machine learning for type suggestion

### Integration Opportunities
- Type-based notification settings
- Type-specific activity templates
- Type-based export/sharing capabilities
- Type analytics dashboard

## Questions for PM Review

1. Should there be a maximum limit on type changes for data integrity?
2. For auto-type assignment, what confidence threshold should trigger suggestions?
3. Should type indicators be clickable for quick type changing in normal mode?
4. Any specific animation preferences for type assignment feedback?
5. Should type statistics be exposed to users or kept internal?
6. How should conflicting type behaviors be prioritized (e.g., pinned single-use activity)?

---

**This plan implements the sophisticated activity categorization system that will restore StackMap's effectiveness for organizing different types of daily activities and routines while maintaining mobile-first design and accessibility standards.**