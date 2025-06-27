# Implementation Plan: Story #90 - Pin/Keep Activities Feature

## Overview
Implement a comprehensive pin activities feature that allows users to mark activities as "pinned" so they automatically copy to tomorrow's list. This includes individual pin buttons on activity cards, bulk pin mode from the edit menu, visual indicators, and persistent storage.

## Files to Create/Modify

### New Files to Create
1. **js/activity-pin.js** - Core pin functionality and bulk pin mode
2. **css/activity-pin.css** - Pin visual styling and states

### Existing Files to Modify
1. **js/db-schema.js** - Add `pinned` field to activity schema
2. **js/activity-display.js** - Add pin button rendering to activity elements
3. **js/activity-sqlite.js** - Update database schema and migrations
4. **js/edit-mode-menu.js** - Connect "Pin Activities" action to bulk mode
5. **index.html** - Include new CSS and JS files

## Implementation Steps

### Phase 1: Data Model Extension (1.5 hours)
1. **Update Activity Schema** 
   - Add `pinned: { type: 'boolean', default: false }` to db-schema.js
   - Update schema version to 3
   - Add database migration for existing activities

2. **Database Integration**
   - Modify activity-sqlite.js to handle pinned field
   - Ensure pinned state persists across CRUD operations
   - Test backward compatibility with existing data

### Phase 2: Core Pin Functionality (2 hours)
1. **Create activity-pin.js Module**
   - Pin state management functions
   - Bulk pin mode controller
   - Event handling for pin toggles
   - Integration with ActivityDisplay

2. **Pin Button Integration**
   - Modify activity-display.js to render pin buttons
   - Add pin button to createActivityElement method
   - Handle individual pin toggle actions
   - Update visual state on pin changes

### Phase 3: Visual Design Implementation (1.5 hours)
1. **Create activity-pin.css Styles**
   - Pin button styling (📌 icon)
   - Pinned state visual indicators (gold border/background)
   - Bulk pin mode overlay
   - Touch target sizing (44px/60px safe mode)
   - Accessibility and contrast compliance

2. **Visual State Management**
   - Normal vs pinned activity appearance
   - Pin button active/inactive states
   - Bulk mode visual feedback
   - Mobile responsive design

### Phase 4: Bulk Pin Mode (2 hours)
1. **Bulk Pin Interface**
   - Full-screen overlay for bulk pin mode
   - Activity list with pin state toggles
   - "Done" button and navigation
   - Count display of pinned activities

2. **Edit Menu Integration**
   - Replace "Pin mode coming soon!" with actual functionality
   - Connect edit-mode-menu.js pin-mode action
   - Update activity count display for pinned items

### Phase 5: Testing and Polish (1 hour)
1. **Comprehensive Testing**
   - Individual pin button functionality
   - Bulk pin mode operations
   - Visual state accuracy
   - Database persistence verification
   - Mobile touch target testing
   - Safe mode compatibility

2. **Performance Optimization**
   - Efficient pin state rendering
   - Minimal DOM manipulation
   - Memory leak prevention

## Dependencies

### Required APIs and Features
- `window.ActivityDisplay` - For activity rendering integration
- `window.ActivitySQLite` - For database operations
- `window.EditModeMenu` - For bulk mode triggering
- `window.Modal` - For bulk pin mode overlay (if needed)

### Existing Features Integration
- Edit Mode system for showing pin buttons
- Activity CRUD operations for pin state persistence
- Visual card system compatibility
- Today/Tomorrow activity management

### CSS Framework
- Existing CSS variables and theming
- Touch target standards (44px/60px)
- Safe mode design patterns
- ADHD-friendly visual design

## Risk Mitigation

### Data Integrity Risks
- **Schema Migration Safety**: Use careful database versioning and migration scripts
- **Backward Compatibility**: Ensure existing activities work with default pinned:false
- **Data Loss Prevention**: Test migration thoroughly before deployment

### User Experience Risks
- **Accidental Pin Toggles**: Require deliberate tap, provide visual feedback
- **Visual Clarity**: Ensure pinned state is obvious but not overwhelming
- **Performance**: Optimize rendering to prevent lag with many activities

### Technical Implementation Risks
- **Memory Leaks**: Proper event listener cleanup in bulk mode
- **Mobile Compatibility**: Test touch targets on actual devices
- **Integration Conflicts**: Verify compatibility with existing edit mode features

## Implementation Details

### Pin Button Specification
```javascript
// Pin button element structure
<button class="activity-pin-button" 
        data-activity-id="${activityId}"
        aria-label="Toggle pin status"
        style="min-width: 44px; min-height: 44px;">
    <span class="pin-icon">📌</span>
</button>
```

### Pinned Activity Visual States
```css
/* Pinned activity styling */
.activity-item.pinned {
    border: 2px solid #FFD700; /* Gold border */
    background: linear-gradient(135deg, #FFF9E6, #FFFACD);
}

.activity-pin-button.pinned .pin-icon {
    color: #B8860B; /* Dark goldenrod */
}
```

### Database Schema Update
```javascript
// Updated activity schema
pinned: { 
    type: 'boolean', 
    default: false, 
    required: false,
    description: 'Whether activity should copy to tomorrow'
}
```

## Testing Strategy

### Manual Testing Checklist
- [ ] Pin button appears in edit mode only
- [ ] Pin button has adequate touch target (44px/60px)
- [ ] Single tap toggles pin state
- [ ] Visual feedback is immediate and clear
- [ ] Pin state persists after page reload
- [ ] Bulk pin mode accessible from edit menu
- [ ] Bulk mode shows all activities with current pin state
- [ ] Bulk mode tap toggles work correctly
- [ ] Done button exits bulk mode properly
- [ ] Pinned activity count updates correctly

### Integration Testing
- [ ] Pin state survives activity edits
- [ ] Pinned activities work with reorder mode
- [ ] Pin state preserved during data export/import
- [ ] Visual cards maintain pin state if linked to activities
- [ ] No conflicts with timer or other activity features

### Accessibility Testing
- [ ] Pin buttons have proper ARIA labels
- [ ] Pinned state announced to screen readers
- [ ] Keyboard navigation works in bulk mode
- [ ] High contrast mode maintains pin visibility
- [ ] Color blind users can distinguish pinned state

## Time Estimate Breakdown
- **Phase 1 (Data Model)**: 1.5 hours
- **Phase 2 (Core Logic)**: 2 hours  
- **Phase 3 (Visual Design)**: 1.5 hours
- **Phase 4 (Bulk Mode)**: 2 hours
- **Phase 5 (Testing)**: 1 hour
- **Total**: 8 hours

## Success Criteria
- All acceptance criteria from Story #90 implemented
- Pin functionality intuitive and responsive
- Visual states clearly distinguish pinned activities
- Database integration robust and migration-safe
- Mobile-first design with proper touch targets
- Integration with existing edit mode seamless
- Code follows project patterns and standards