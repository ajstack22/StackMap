# Story: Return to Core Activity Planning (EPIC)

## Epic Overview
This epic encompasses the full pivot back to StackMap's core purpose: helping children map out their day with activity cards. It consolidates stories #70-#79 into a cohesive mobile-first implementation plan.

## User Story
As a parent of a child with ADHD/autism, I want a mobile-friendly daily activity planner so that my child can visually map out and complete their daily routines with minimal friction.

## Core Features to Implement

### 1. Activity-Based Architecture (#70)
- Convert all "task" references to "activity"
- Align with child-friendly terminology

### 2. Day Planning System (#71)
- Today/Tomorrow toggle
- Per-user activity lists for each day
- Mobile-optimized day selector

### 3. Activity Sequencing (#72)
- Numbered cards (1, 2, 3...)
- Clear order for daily routines
- Visual sequence indicators

### 4. Daily Closure Workflow (#73)
- "Complete Day" functionality
- Move tomorrow → today
- Maintain pinned activities

### 5. Recurring Activities (#74)
- Pin/keep system for daily routines
- Visual pin indicators
- Mobile-friendly pin controls

### 6. Time-Based View (#75)
- Alternative to numbered view
- Schedule integration
- Native time pickers

### 7. Multi-User Support (#76)
- Separate activity lists per child
- Quick user switching
- Profile management

### 8. Daily Reset Logic (#77)
- Automatic activity reset
- Handle app lifecycle on mobile
- Timezone-aware

### 9. Mobile Edit Mode (#78)
- Bottom sheet UI patterns
- Thumb-friendly controls
- Gesture support

### 10. Quick Activity Creation (#79)
- Template system
- Smart suggestions
- Minimal typing

## Mobile-First Architecture

### Layout Approach
```
┌─────────────────────┐
│ [User] [Today|Tomorrow] │ ← Fixed header
├─────────────────────┤
│                     │
│   Activity Cards    │ ← Scrollable area
│                     │
├─────────────────────┤
│ [Complete Day]      │ ← Context actions
└─────────────────────┘
```

### Touch Interactions
- Tap: Toggle activity complete
- Long press: Enter selection mode
- Swipe right: Pin/unpin
- Swipe left: Delete (with confirm)
- Drag: Reorder activities

### Performance Requirements
- Initial load < 1 second
- Instant user switching
- 60fps scrolling
- Offline-first operation

## Implementation Priority

### Phase 1: Foundation (1-2 weeks)
1. Convert tasks → activities (#70)
2. Add Today/Tomorrow system (#71)
3. Implement card numbering (#72)

### Phase 2: Core Workflows (1-2 weeks)
4. Complete Day functionality (#73)
5. Pin/keep system (#74)
6. Per-user storage (#76)

### Phase 3: Enhanced Features (1 week)
7. Time display mode (#75)
8. Daily reset system (#77)

### Phase 4: Mobile Excellence (1 week)
9. Enhanced edit mode (#78)
10. Template quick-add (#79)

## Success Metrics
- App works entirely one-handed
- Parent can set up child's day in < 2 minutes
- Child can complete activities independently
- Zero data loss scenarios
- Works offline reliably

## Testing Strategy
- Device testing: iPhone SE → iPad Pro
- Android 6+ compatibility
- Offline scenarios
- Multi-user switching
- Daily reset edge cases
- Time zone changes

## Definition of Done
- [ ] All 10 sub-stories complete
- [ ] Matches core legacy functionality
- [ ] Mobile performance targets met
- [ ] Offline mode fully functional
- [ ] Multi-user tested with 4+ profiles
- [ ] Daily workflows documented
- [ ] Parent onboarding flow created

## References
- Legacy app: StackMapApp.js, renderer.js
- Related issues: #70-#79
- Research: Mobile-first ADHD accommodations