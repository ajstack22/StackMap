# Story: Convert Tasks to Activities

## User Story
As a parent, I want the app to use "activity" terminology throughout so that it feels like a fun daily planner rather than a chore list for my child.

## Acceptance Criteria
- [ ] All user-facing text says "activity" not "task"
- [ ] Database migrated from "tasks" to "activities" table
- [ ] File names use "activity" terminology
- [ ] CSS classes use .activity-card not .task-card
- [ ] API/function names updated throughout
- [ ] Empty states reference activities appropriately
- [ ] No broken functionality from naming changes

## Technical Requirements

### Architecture
- Global find/replace with careful review
- Database migration with rollback capability
- Phased approach to prevent breaking changes

### Implementation Details
```javascript
// Migration approach
1. Update user-facing strings first
2. Add database aliases for compatibility
3. Update internal code references
4. Rename files last (with redirects)

// Key files to rename:
task-display.js → activity-display.js
task-sqlite.js → activity-sqlite.js
task-cards.js → activity-cards.js
```

### Performance Targets
- No performance impact from changes
- Migration completes in < 2 seconds
- Zero downtime during transition

### Platform Considerations
- **Web/PWA**: Update cached file names
- **iOS**: No WebView caching issues  
- **Android**: Clear WebView cache
- **TV**: Ensure focus management still works

## ADHD Design Principles
- Consistent terminology reduces cognitive load
- "Activity" is more positive/engaging than "task"
- Maintains familiar app structure during transition
- No sudden UI changes that could confuse users

## Testing Requirements
- Unit tests for renamed functions
- Integration tests for data migration
- Manual testing of all renamed features
- Search functionality still works
- No broken links or references
- Accessibility labels updated

## Dependencies
- Should be done before other major features
- No dependencies on other stories

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Tests passing
- [ ] Works offline
- [ ] Accessible (WCAG 2.1 AA)
- [ ] No console errors
- [ ] Performance targets met
- [ ] Data migration tested and reversible

## References
- Related issues: This is foundational for all other stories