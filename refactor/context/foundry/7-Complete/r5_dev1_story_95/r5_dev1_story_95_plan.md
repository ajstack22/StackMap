# Implementation Plan: Story #95 - Restore Card Numbering & Display Modes

## Overview
I will restore the original StackMap card identification system by implementing sequential numbering (1, 2, 3...) and time-based display modes. This includes creating circular badges positioned in the top-right corner of activity cards, a display mode toggle button, and persistent user preferences. The system will support both numbers and time estimates with proper accessibility and mobile-first design.

## Files to Modify
1. **js/activity-display.js** - Add display mode management, card numbering logic, and toggle functionality
2. **css/activity-cards.css** - Add badge styling, positioning, and responsive design
3. **css/base.css** - Add display mode toggle button styles and animations
4. **index.html** - Integrate display mode toggle button in the unified header area

## Implementation Steps

### Step 1: Display Mode State Management
- Add display mode properties to ActivityDisplay object
- Implement `getDisplayMode()` and `setDisplayMode()` methods
- Add localStorage persistence for user preference
- Create `toggleDisplayMode()` function with event dispatching

### Step 2: Card Badge Rendering System
- Modify `createActivityElement()` to include badge container
- Create `renderNumberBadge(number)` function for sequential numbering
- Create `renderTimeBadge(minutes)` function for time estimates
- Add proper ARIA labels and accessibility attributes

### Step 3: CSS Badge Styling
- Design circular badge positioning (top-right corner)
- Implement responsive sizing (44px normal, 60px safe mode)
- Add color coding for time estimates (Green <30m, Yellow 30m-2h, Orange >2h)
- Support high contrast and reduced motion modes

### Step 4: Header Toggle Integration
- Add display mode toggle button to unified header
- Position near day selector for intuitive access
- Implement keyboard shortcut support ('M' key)
- Add smooth transition animations

### Step 5: Card Numbering Logic
- Implement auto-numbering system that updates on render
- Ensure numbers update correctly when cards are reordered
- Handle edge cases (empty lists, single cards)
- Maintain number consistency across view changes

### Step 6: Time Estimate System
- Add time estimate formatting ("15m", "1h", "2h30m")
- Implement fallback display ("?") for missing estimates
- Add color coding based on duration ranges
- Support time input in activity edit modal

## Dependencies
- Round 4 pin system (Story #90) must be complete and stable
- ActivityDisplay.createActivityElement() method must be functional
- Unified header system must be in place
- CSS framework established for consistent styling
- Safe mode detection (window.StackMapSafeMode) available

## Testing Plan
- [ ] Test card numbering with 1, 5, 20+ activities
- [ ] Verify display mode toggle functionality
- [ ] Test localStorage persistence across browser sessions
- [ ] Verify badge positioning doesn't interfere with existing UI
- [ ] Test time estimate formatting with various durations
- [ ] Test keyboard shortcut ('M' key) functionality
- [ ] Mobile testing at 320px, 375px, 768px viewports
- [ ] Safe mode testing (?safe=true) - verify 60px badges
- [ ] High contrast mode testing
- [ ] Screen reader testing for ARIA labels
- [ ] Test integration with pin system (Story #90)
- [ ] Performance testing with 50+ cards
- [ ] Test reordering maintains correct numbering

## Risk Mitigation

### Performance Concerns
- Use CSS transforms for badge positioning to avoid layout recalculation
- Implement efficient re-numbering algorithm that only updates changed cards
- Consider virtual scrolling integration for large lists

### UI Conflicts
- Ensure badges don't overlap with pin icons or edit buttons
- Test badge positioning with various card content lengths
- Coordinate with other Round 5 stories for shared UI space

### State Management
- Centralize display mode state in ActivityDisplay object
- Ensure proper cleanup of event listeners
- Handle edge cases like corrupted localStorage preferences

### Browser Compatibility
- Provide fallbacks for CSS features not supported in older browsers
- Test localStorage availability and handle quota exceeded errors
- Ensure keyboard events work across different browser implementations

## Integration Notes
- Display mode preference will be stored as 'stackmap_display_mode' in localStorage
- Badge positioning will use absolute positioning within relatively positioned card containers
- Event 'displayModeChanged' will be dispatched for other components to listen
- Time estimates will be stored in activity.timeEstimate field (minutes)
- Compatible with existing pin system visual indicators

## Accessibility Considerations
- Each badge will have appropriate ARIA labels
- Display mode toggle will announce state changes to screen readers
- High contrast mode will override color coding with accessible alternatives
- Keyboard navigation will be fully supported
- Touch targets will meet 44px minimum (60px in safe mode)

## Performance Targets
- Badge rendering should add <10ms to card creation time
- Display mode toggle should respond within 100ms
- No layout shift when switching between modes
- Memory usage should not increase significantly with large card lists