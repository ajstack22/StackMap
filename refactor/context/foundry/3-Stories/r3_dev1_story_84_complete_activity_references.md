# Story #84: Complete Activity Reference Updates

## Story Overview
**Round**: 3  
**Developer**: 1  
**Priority**: Critical - Must complete before other features

## Background
Story #70 (Convert Tasks to Activities) completed the file renames and database schema updates, but internal code references still use the old "task" terminology. This needs to be completed before any new features are built on top of the activity system.

## User Story
As a developer, I need all code references updated from "task" to "activity" so the codebase is consistent and future development doesn't introduce confusion or bugs.

## Acceptance Criteria
- [ ] All JavaScript class names updated (TaskDisplay → ActivityDisplay, etc.)
- [ ] All function names updated (createTask → createActivity, etc.)
- [ ] All variable names updated consistently
- [ ] All event names updated (tasksChanged → activitiesChanged)
- [ ] All SQL queries reference 'activities' table
- [ ] All localStorage keys updated
- [ ] All CSS classes updated (.task-* → .activity-*)
- [ ] All HTML IDs and classes updated
- [ ] All comments and documentation updated

## Research Requirements
Before creating your plan, research:

1. **Remaining References**:
   - Search for "task" in all JS files
   - Search for "Task" in all JS files
   - Search for "task" in all CSS files
   - Search for "task" in HTML files

2. **Critical Files to Update**:
   - `js/activity-display.js` (was task-display.js)
   - `js/activity-sqlite.js` (was task-sqlite.js)
   - `js/activity-cards.js` (was task-cards.js)
   - `js/activity-timer.js` (was task-timer.js)
   - `js/commands/activity-commands.js`
   - Any other files with task references

3. **Event System**:
   - Document all events that need renaming
   - Find all listeners for these events
   - Ensure coordinated updates

4. **Storage Keys**:
   - List all localStorage keys with "task"
   - Plan migration for existing data

## Implementation Order
1. Update all class names and exports
2. Update all function names
3. Update all event names (coordinated)
4. Update all variable names
5. Update all storage keys with migration
6. Update all CSS classes
7. Update all HTML references
8. Update all comments

## Testing Requirements
- [ ] All renamed functions work correctly
- [ ] Events fire and are received properly
- [ ] Storage migration preserves existing data
- [ ] No console errors
- [ ] All features still functional

## Migration Considerations
- Must handle existing localStorage data
- Should provide rollback capability
- Log all changes for debugging

## Definition of Done
- [ ] Zero references to "task" (except in migration code)
- [ ] All tests pass
- [ ] Manual testing confirms all features work
- [ ] Code review approved
- [ ] No regressions

## Time Estimate
- Research: 2 hours
- Implementation: 6 hours
- Testing: 2 hours

---
Note: This is a critical technical debt item that blocks consistent development. Must be completed before any other activity-related features.