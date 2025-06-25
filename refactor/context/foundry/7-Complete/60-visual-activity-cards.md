# Issue #60: Visual Activity Cards System

## Summary
Implement the visual activity card system that makes StackMap accessible for non-readers and visual learners. This is the core differentiator from standard task apps and critical for special needs users.

## Background
The current refactor uses text-based tasks, but the original StackMap's strength is visual cards with emojis, colors, and minimal text. Users with ADHD, autism, or learning disabilities need visual-first interfaces.

## Requirements

### Core Card Features
1. **Visual Card Display**
   - Large emoji as primary identifier (minimum 48px)
   - Optional short title (13 characters max)
   - Optional description (50 characters max)
   - Customizable background colors
   - Card number indicator (or time)

2. **Card Types**
   - Recurring (daily/weekly activities)
   - Frequent (common but not scheduled)
   - Single-use (one-time tasks)

3. **Card Interactions**
   - Single tap to complete/uncomplete
   - Long press for options (edit mode)
   - Drag to reorder (edit mode only)
   - Visual feedback for all interactions

4. **Card States**
   - Active (ready to complete)
   - Completed (checked off)
   - Disabled (not available yet)
   - In-progress (optional)

### Technical Requirements

1. **Performance**
   - Support 100+ cards without lag
   - 60fps scrolling
   - < 100ms card render time
   - < 50MB memory with full card set

2. **Compatibility**
   - Android 5+ support (no modern CSS Grid)
   - Touch-optimized (no hover states)
   - Keyboard navigable
   - Screen reader accessible

3. **Storage**
   - Cards stored in SQLite
   - Sync with task system
   - Offline-first operation
   - Export/import support

### User Experience

1. **Mobile-First Layout**
   - 2 cards per row (portrait phone)
   - 3-4 cards per row (landscape/tablet)
   - Fixed card aspect ratio
   - Responsive sizing

2. **Visual Hierarchy**
   - Emoji largest element
   - Title secondary
   - Number/time indicator subtle
   - Completion state obvious

3. **Accessibility**
   - Alternative text for all cards
   - High contrast mode
   - Large touch targets
   - Focus indicators

## Implementation Plan

### Phase 1: Card Component (MVP)
- Basic card rendering
- Emoji + title display
- Tap to complete
- SQLite storage

### Phase 2: Card Management
- Card creation/editing UI
- Card type system
- Color customization
- Drag and drop reordering

### Phase 3: Card Library
- Pre-built card templates
- Personal card library
- Card categories
- Search/filter cards

### Phase 4: Advanced Features
- Card animations
- Time-based cards
- Card groups/routines
- Card sharing

## Success Criteria
1. Users can complete tasks without reading text
2. Card interactions feel intuitive and responsive
3. System handles 100+ cards smoothly
4. Works offline after initial load
5. Accessible to screen reader users

## Technical Approach

### Data Model
```javascript
// Card schema for SQLite
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  emoji TEXT NOT NULL,
  title TEXT,
  description TEXT,
  color TEXT,
  type TEXT DEFAULT 'single',
  category TEXT,
  position INTEGER,
  userId TEXT,
  created INTEGER,
  modified INTEGER
);

// Card-Task relationship
CREATE TABLE card_tasks (
  cardId TEXT,
  taskId TEXT,
  date TEXT,
  completed INTEGER DEFAULT 0,
  PRIMARY KEY (cardId, taskId, date)
);
```

### Rendering Strategy
Use DOM-based cards with CSS transforms for animations:
- Better accessibility than Canvas
- Native emoji rendering
- CSS animations for feedback
- Virtual scrolling for performance

### State Management
- Cards as presentation layer
- Tasks as data layer
- Sync card actions to task updates
- Optimistic UI with undo support

## Dependencies
- Existing task system
- SQLite storage
- Edit mode system
- Theme manager
- Virtual scroll adapter

## Related Issues
- #61: Card Creation UI
- #62: Card Library System
- #63: Card Animation System
- #64: Card Accessibility

## Notes
- Start with MVP card display
- Ensure backwards compatibility with text tasks
- Consider progressive enhancement approach
- Test with actual special needs users

This is the most critical missing feature for achieving StackMap parity.