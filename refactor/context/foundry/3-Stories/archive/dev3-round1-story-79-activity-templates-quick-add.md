# Story: Activity Templates & Quick Add

## User Story
As a parent setting up the app, I want quick-access templates so that I can rapidly add common activities without typing on my phone.

## Acceptance Criteria
- [x] Grid of common activity templates
- [x] One-tap to add from template
- [x] Time-based suggestions
- [x] Recent activities section
- [x] Search with minimal typing
- [x] Category browsing

## Technical Requirements

### Implementation
```javascript
// Template structure
templates = [
  { icon: '🦷', title: 'Brush Teeth', 
    category: 'morning' },
  { icon: '🛏️', title: 'Bedtime', 
    category: 'evening' }
]

// Smart suggestions
if (hour < 10) show('morning');
else if (hour > 18) show('evening');
```

### Mobile Considerations
- Large tap targets in grid
- Predictive search
- Offline template access
- Minimal scrolling
- Quick category filters

## ADHD Accommodations
- Visual emoji-first design
- Reduce choice overload
- Time-relevant suggestions
- Consistent template order
- No typing required

## Definition of Done
- [x] Templates load instantly
- [x] One-tap adds activity
- [x] Search works well
- [x] Suggestions relevant
- [x] Works offline

## References
- Legacy: Activity library
- Default activities list

## Implementation Details

### Files Created
1. **`js/activity-templates.js`** - Core template system
   - Modal-based UI with three views (Templates, Recent, Search)
   - Time-based suggestions using TIME_CATEGORIES
   - Recent activities tracking with localStorage persistence
   - Search with 300ms debounce for performance
   - Integration with DaySelector for today/tomorrow support

2. **`css/activity-templates.css`** - Mobile-first styles
   - Large touch targets (44px default, 60px safe mode)
   - Responsive grid (3x3 mobile, 4x4 tablet)
   - Visual feedback and smooth transitions
   - ADHD-friendly visual hierarchy

3. **`test-activity-templates.html`** - Test harness
   - Standalone testing of all features
   - Mock dependencies for isolated testing

### Files Modified
1. **`js/task-display.js`**
   - Replaced "Browse Activities" with "Quick Add" button
   - Updated button handler to open ActivityTemplates modal

2. **`index.html`**
   - Added script include for activity-templates.js
   - Added CSS include for activity-templates.css

### Key Features Implemented

#### Time-Based Suggestions
```javascript
TIME_CATEGORIES: {
    MORNING: { start: 5, end: 10, label: 'Morning', icon: '🌅' },
    MIDDAY: { start: 10, end: 14, label: 'Midday', icon: '☀️' },
    AFTERNOON: { start: 14, end: 18, label: 'Afternoon', icon: '🌤️' },
    EVENING: { start: 18, end: 21, label: 'Evening', icon: '🌙' },
    NIGHT: { start: 21, end: 5, label: 'Night', icon: '🌌' }
}
```

#### Recent Activities Tracking
- Stores last 10 used activities in localStorage
- Shows relative timestamps ("2 min ago", "1 hour ago")
- Removes duplicates automatically

#### Quick Template Grid
- 9 popular activities always available
- One-tap to add without any configuration
- Visual emoji-first design

#### Search Functionality
- Searches title, description, and category
- Debounced input for performance
- Results limited to 20 for mobile performance

### Integration Points
1. **DaySelector** - Activities added to correct day
2. **UserManager** - Activities assigned to current user
3. **EditMode** - Requires edit mode to add activities
4. **Modal** - Uses existing modal system
5. **StackMapDefaultActivities** - Leverages existing activity data

### Performance Optimizations
- Debounced search (300ms)
- Limited search results (20 max)
- Recent activities cached in memory
- CSS transitions disabled in safe mode

### Accessibility Features
- ARIA labels on all interactive elements
- Keyboard navigation support
- Large touch targets for motor difficulties
- Clear visual feedback on interactions

## Testing Instructions
1. Open `test-activity-templates.html` in browser
2. Click "Open Quick Add Templates"
3. Test all three tabs (Templates, Recent, Search)
4. Verify time-based suggestions match current time
5. Add activities and verify they appear in recent
6. Test search functionality
7. Verify "Browse All Activities" opens full library

## Future Enhancements
- Custom template creation
- Favorite templates
- Template usage analytics
- Voice input for search
- Gesture-based quick add