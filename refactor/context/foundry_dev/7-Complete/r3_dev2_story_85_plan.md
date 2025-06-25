# Implementation Plan: Story #85 - Unified Header System

## Overview

This story enhances the existing unified header system to better integrate with the day selector (from Story #71) and improve state management across views. The focus is on creating a cohesive header that shows user context clearly and leverages the existing user modal (from Story #82) for user switching, while keeping the day selector as a separate component.

## Current State Analysis

### Existing Components
1. **unified-header.js** (Round 2):
   - Creates header with left menu, user-day pill, and right menu buttons
   - Listens for user/day changes via events
   - Currently opens UserDayModal on pill click
   - Has basic state management but needs improvement

2. **day-selector.js** (Round 1):
   - Fully functional day selector with Today/Tomorrow buttons
   - Includes activity counts, distress detection, loading states
   - Dispatches `dayViewChanged` events
   - Works independently below the header

3. **user-day-modal.js** (Round 2, revised):
   - Modal for user switching only (day selection removed after review)
   - Proper focus trap, accessibility, error handling
   - Works well for its single purpose

### Integration Points
- UserManager API: `getCurrentUser()`, `switchUser()`, events
- DaySelector API: `getCurrentDay()`, `isReady()`, events
- Event system: `userChanged`, `dayViewChanged`
- ViewController for navigation between views

### Issues to Address
1. Header doesn't persist state well across view changes
2. Settings view header not fully integrated
3. User-day pill shows both user and day but only switches users
4. Memory cleanup needed on view switches
5. Edit mode button visibility not managed by unified header

## Proposed Changes

### 1. Header Component Updates

#### State Management Improvements
- Add proper state persistence across views
- Implement cleanup methods for view switches
- Better initialization sequencing with dependencies

#### Enhanced User-Day Pill
- Show user name (not just emoji) on larger screens
- Better visual separation between user and day info
- Clearer indication that clicking opens user switcher
- Update aria-label to be more descriptive

#### Edit Mode Integration
- Show/hide left menu button based on edit mode state
- Listen for edit mode changes
- Consistent behavior across all views

### 2. Settings View Integration

#### Unified Header Application
- Apply unified header structure to settings view
- Keep back button but style consistently
- Show user context in settings header
- Hide edit mode button in settings

#### Navigation Improvements
- Track previous view for back button
- Ensure smooth transitions
- Update header state on view changes

### 3. Event System Enhancement

#### Better Event Handling
- Centralized event listener management
- Proper cleanup on destroy
- Prevent duplicate listeners
- Handle race conditions

#### New Events
- Listen for edit mode changes
- Listen for view changes
- Dispatch header state changes

## Implementation Steps

### Step 1: Enhance State Management
```javascript
// Add to UnifiedHeader object
previousView: 'main-view',
eventListeners: [],
isEditMode: false,

// Add cleanup method
destroy: function() {
    // Remove all event listeners
    // Clear references
    // Reset state
}
```

### Step 2: Improve User-Day Pill Display
```javascript
// Update pill to show more info
updateUserDayPill: function() {
    // Show user name on wider screens
    // Add visual separator
    // Update click hint
}
```

### Step 3: Integrate Settings Header
```javascript
// Apply unified header to settings
initSettingsHeader: function() {
    // Create consistent structure
    // Handle back button
    // Hide edit-specific elements
}
```

### Step 4: Add Edit Mode Support
```javascript
// Listen for edit mode changes
listenForEditMode: function() {
    // Show/hide left menu button
    // Update header styling
    // Manage button visibility
}
```

### Step 5: Implement View Management
```javascript
// Track and manage view changes
handleViewChange: function(newView) {
    // Store previous view
    // Update header for new view
    // Clean up old listeners
}
```

## Mobile Considerations

### Touch Targets
- Maintain 44px minimum (60px in safe mode)
- Already implemented in current code
- Verify all interactive elements meet requirements

### Responsive Behavior
- Show full user name on tablets/desktop
- Collapse to emoji only on phones
- Ensure pill doesn't overflow on small screens

### Safe Mode Support
- Larger touch targets already implemented
- Verify all new elements respect safe mode
- Test with ?safe=true parameter

## Testing Approach

### Navigation Testing
- [ ] Main view → Settings → Main (header persists)
- [ ] User context visible in all views
- [ ] Back button returns to correct view
- [ ] No duplicate headers on navigation

### State Persistence
- [ ] User change reflects immediately
- [ ] Day change updates pill
- [ ] Edit mode toggle shows/hides left menu
- [ ] State survives view switches

### Mobile Responsiveness
- [ ] Test at 320px, 375px, 768px, 1024px
- [ ] User name shows/hides appropriately
- [ ] Touch targets meet size requirements
- [ ] No text overflow issues

### Accessibility Compliance
- [ ] All buttons have proper aria-labels
- [ ] Screen reader announces changes
- [ ] Keyboard navigation works
- [ ] Focus management correct

### Integration Testing
- [ ] Works with existing day selector
- [ ] User modal opens correctly
- [ ] Edit mode menu accessible
- [ ] No conflicts with other components

## Risk Mitigation

### Breaking Changes to Avoid
- Don't modify day-selector.js functionality
- Keep existing event names unchanged
- Maintain backward compatibility
- Don't break existing integrations

### Fallback Strategies
- Graceful degradation if components missing
- Default states for missing data
- Error boundaries for failures
- Console warnings for debugging

### Memory Management
- Clean up event listeners on view change
- Avoid memory leaks from closures
- Clear references when not needed
- Use weak references where appropriate

## Files to Create/Modify

### Files to Modify
1. **/refactor/js/unified-header.js**
   - Add state management methods
   - Enhance user-day pill display
   - Add edit mode support
   - Implement cleanup methods

2. **/refactor/css/unified-header.css**
   - Add responsive styles for user name
   - Style visual separator in pill
   - Edit mode visual indicators
   - Settings view specific styles

3. **/refactor/index.html**
   - No changes needed (structure already exists)

### No New Files Needed
- All functionality fits within existing files
- Enhances rather than replaces current implementation

## Dependencies

### Required Components
- UserManager must be initialized
- DaySelector must be ready
- ViewController for navigation
- Modal system for user switching

### APIs Used
- UserManager: getCurrentUser(), events
- DaySelector: getCurrentDay(), isReady()
- ViewController: show(), current view tracking
- EditMode: state and events (if available)

## Time Estimate

- Research: 1.5 hours ✓ (completed)
- Implementation: 4 hours
  - State management: 1 hour
  - Settings integration: 1 hour
  - Edit mode support: 0.5 hours
  - User-day pill enhancement: 0.5 hours
  - Testing and refinement: 1 hour
- Testing: 1.5 hours
- Documentation: 0.5 hours

Total: ~7 hours

## Success Criteria

1. Header works identically on all views
2. Settings back button returns to previous view
3. User/day pill always reflects current state
4. Edit mode button visibility controlled properly
5. No memory leaks or duplicate listeners
6. Mobile responsive and accessible
7. Integrates seamlessly with existing components

---

**Ready for PM Review**

This plan enhances the existing unified header without breaking changes, focusing on better state management and integration across all views while maintaining the separation between user switching (via modal) and day selection (via existing selector).