# Implementation Plan: Story #86 - Enhanced Edit Menu

## ✅ PM REVIEW - PLAN APPROVED

### Revisions Made:
1. ✅ Changed keyboard shortcuts to modal approach (single letters when menu open)
2. ✅ Answered all open questions with clear decisions
3. ✅ Added comprehensive error handling section
4. ✅ Added safe mode compatibility section

### APPROVED FOR IMPLEMENTATION - Proceed with coding

## Current Implementation Review

The edit mode menu was implemented in Round 2 (Story #83) with:
- Menu button that appears in header during edit mode
- Dropdown with 9 actions (Add, Quick Add, Library, Reorder, Pin, Bulk Delete, Complete Day, Copy Tomorrow)
- Basic keyboard navigation (Arrow keys, Escape)
- Mobile responsive (icon-only on small screens)
- Integration with existing features where available
- Placeholder notifications for unimplemented features

### Current Limitations
- No keyboard shortcuts for quick access
- All menu items always enabled (no context awareness)
- No visual indicators of counts or status
- Basic responsive behavior could be improved
- No tooltips showing keyboard shortcuts

## Feature Implementation Plan

### 1. Keyboard Shortcuts

#### Modal Keyboard Approach (Menu-Open Only)
When the edit mode menu is open, single letter shortcuts will work:
- `A`: Add Activity
- `Q`: Quick Add  
- `L`: Activity Library
- `R`: Toggle Reorder Mode
- `D`: Bulk Delete (with confirmation)
- `C`: Complete Day (with confirmation)
- `P`: Pin Activities
- `T`: Copy to Tomorrow
- `Escape`: Close menu

#### Implementation Details
- Keyboard shortcuts ONLY work when menu dropdown is open
- Add keyboard listener to dropdown element (not global)
- Show keyboard shortcuts in menu items (e.g., "Add Activity (A)")
- Visual indicator: Bold the shortcut letter in labels
- No modifier keys needed - avoids all browser conflicts
- Toast notification when attempting disabled action

### 2. Dynamic Disabling

#### Context Detection Logic
- **Reorder**: Disable if fewer than 2 activities exist
- **Complete Day**: Disable if no activities for current day
- **Copy to Tomorrow**: Disable if no activities for today
- **Bulk Delete**: Disable if no activities exist
- **Pin Activities**: Keep disabled (not implemented yet)

#### Visual Feedback
- Disabled items get `disabled` attribute and class
- Reduced opacity (0.5) for disabled items
- Cursor changes to `not-allowed`
- Tooltip explains why item is disabled

### 3. Status Indicators

#### Count Bubbles
- Show activity count next to relevant menu items
- Update counts in real-time
- Use CSS for styling (small badge style)

#### Which Items Get Counts
- **Add Activity**: No count needed
- **Quick Add**: No count needed
- **Activity Library**: Total available templates
- **Reorder Mode**: Current activity count
- **Pin Activities**: Number of pinned (when implemented)
- **Bulk Delete**: Current activity count
- **Complete Day**: Activities remaining today
- **Copy to Tomorrow**: Activities to copy

#### Update Strategy
- Listen for 'activitiesChanged' events
- Debounce updates to prevent performance issues
- Cache counts to avoid recalculation

### 4. Responsive Improvements

#### Current Issues
- Menu label hidden on screens < 400px
- Dropdown might overflow on very small screens
- Touch targets could be larger on mobile

#### Improvements
- Better breakpoint at 480px
- Ensure dropdown fits in viewport
- Larger touch targets on mobile (min 48px)
- Swipe down to close on mobile
- Better animation on mobile

## Technical Architecture

### Event System
- Create `updateMenuState()` method to refresh all dynamic elements
- Subscribe to relevant events:
  - `activitiesChanged`
  - `dayViewChanged` 
  - `editModeChanged`
- Debounce updates with 100ms delay

### Performance Considerations
- Cache DOM queries
- Use requestAnimationFrame for visual updates
- Debounce event handlers
- Clean up listeners on destroy

### Memory Management
- Store references to event handlers for cleanup
- Clear cached data on view changes
- Remove global keyboard listener when edit mode disabled

## Accessibility Plan

### Keyboard Shortcut Announcements
- Use aria-label to include shortcut info
- Announce shortcuts when menu opens
- Provide setting to disable shortcuts

### Screen Reader Updates
- Announce count changes
- Read disabled state and reason
- Use aria-live regions for dynamic updates

### Focus Management
- Maintain focus position when updating menu
- Return focus to trigger on close
- Handle focus for disabled items

## Testing Strategy

### Keyboard Shortcuts
- [ ] Test all shortcuts on Mac (Cmd)
- [ ] Test all shortcuts on Windows (Ctrl)
- [ ] Verify no conflicts with browser shortcuts
- [ ] Test with menu open and closed
- [ ] Verify tooltips show correct shortcuts

### Context-Aware Disabling
- [ ] Test with 0, 1, 2+ activities
- [ ] Test on today and tomorrow views
- [ ] Verify disabled state updates dynamically
- [ ] Check tooltip explanations

### Count Updates
- [ ] Add/remove activities updates counts
- [ ] Switch between today/tomorrow updates
- [ ] Verify no performance degradation
- [ ] Test with many activities (50+)

### Mobile Responsiveness
- [ ] Test at 320px, 375px, 480px, 768px
- [ ] Verify touch targets are adequate
- [ ] Test swipe gestures
- [ ] Check dropdown positioning

### Accessibility
- [ ] Test with VoiceOver/NVDA
- [ ] Verify all shortcuts announced
- [ ] Test keyboard-only navigation
- [ ] Verify focus management

## Error Handling

### Activity Count Failures
- If activity count fetch fails, show cached count with warning icon
- Cache expires after 5 minutes (configurable)
- Fallback: Show "?" instead of count if no cache available
- Log errors but don't show error messages to user

### Stale Data Handling
- Add timestamp to cached data
- Refresh cache on:
  - Menu open (if cache > 30 seconds old)
  - Any activity CRUD operation
  - View change (today/tomorrow)
- Show subtle refresh icon when updating

### Fallback UI States
- If counts unavailable: Hide count badges entirely
- If action status unknown: Enable by default (fail open)
- If keyboard handler fails: Fall back to click-only
- If animation fails: Skip to final state

## Safe Mode Compatibility

### Touch Targets
- Normal mode: 48px minimum touch targets
- Safe mode (?safe=true): 60px minimum touch targets
- Increase padding in safe mode: 16px → 20px
- Larger font size in safe mode: 14px → 16px

### Animation Handling
- Detect safe mode via `window.StackMapSafeMode`
- Disable all transitions and animations
- Use immediate show/hide instead of fade
- No transform animations on menu items

### Testing Safe Mode
- [ ] All features work with ?safe=true
- [ ] Touch targets meet 60px minimum
- [ ] No animations or transitions
- [ ] Keyboard shortcuts still functional
- [ ] Visual feedback remains clear

## Risk Assessment

### Potential Issues
- ~~Keyboard shortcuts might conflict with browser/OS shortcuts~~ (Solved with modal approach)
- Performance impact from real-time updates
- Complex state management with multiple update sources
- Mobile gestures might conflict with system gestures

### Mitigation Strategies
- Modal shortcuts eliminate browser conflicts
- Implement debouncing (100ms) and caching
- Centralize state updates in single method
- Test thoroughly on real devices

## Implementation Order

1. **Set up update infrastructure** (updateMenuState method, event subscriptions)
2. **Implement context-aware disabling** (easiest to test)
3. **Add status indicators** (builds on update infrastructure)
4. **Implement keyboard shortcuts** (most complex)
5. **Enhance responsive behavior** (final polish)

## Dependencies
- ActivityDisplay/TaskDisplay for activity counts
- EditMode for state management
- DaySelector for current day context
- QuickAddUI for template counts (if available)

## Files to Modify

1. **js/edit-mode-menu.js**
   - Add keyboard shortcut handler
   - Implement updateMenuState method
   - Add context detection logic
   - Enhance menu item creation with counts
   - Improve responsive behavior

2. **css/edit-mode-menu.css**
   - Add styles for disabled state
   - Create count badge styles
   - Improve mobile styles
   - Add tooltip styles for shortcuts

## Decisions Made (Per PM Feedback)

1. **Keyboard shortcuts**: Work only when menu is open (modal approach)
2. **Disabled shortcuts**: Show toast notification explaining why action is disabled
3. **Count updates**: Real-time with 100ms debounce for performance
4. **Accessibility**: WCAG 2.1 AA compliance is sufficient

## Definition of Done

- [ ] All keyboard shortcuts implemented and working
- [ ] Context-aware disabling functioning correctly
- [ ] Count badges showing accurate numbers
- [ ] Mobile experience improved
- [ ] No performance degradation
- [ ] All tests passing
- [ ] Accessibility requirements met
- [ ] No console errors
- [ ] Documentation updated