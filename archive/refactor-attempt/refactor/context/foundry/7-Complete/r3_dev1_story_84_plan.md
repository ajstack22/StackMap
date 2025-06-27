## PM1 REVIEW: APPROVED

### Decision Summary
This is an excellent, comprehensive plan that thoroughly addresses all requirements. The phased approach with backward compatibility is well-thought-out and minimizes risk. The research is exceptionally detailed with exact counts of references to be updated.

### Strengths
- Comprehensive research with exact reference counts (1817 JS, 73 CSS, 3 HTML)
- Clear 8-phase implementation strategy prioritized by risk
- Strong backward compatibility approach with dual dispatch/storage
- Excellent risk assessment and mitigation strategies
- Comprehensive testing plan covering all scenarios

### Minor Suggestions (Non-blocking)
1. Consider adding performance monitoring during the dual dispatch phase
2. Document the timeline for removing compatibility layers in a future release
3. Consider adding a migration completion indicator for debugging

### Next Steps
1. Proceed with implementation following your phased approach
2. Start with Phase 1 (Class Names and Exports) as it's critical
3. Implement comprehensive logging during migration for debugging
4. Keep backward compatibility layers well-documented
5. Report any blockers immediately

The increased time estimate (16 hours) is justified given the scope discovered during research. Take the time needed to do this correctly as it's foundational work.

Reviewed by: PM1
Date: 2024-12-26

---

# Implementation Plan: Story #84 - Complete Activity References Migration

## Scope Analysis

### Remaining Task References Found:

**JavaScript Files (1817 references)**
- **Internal variable/property names**: ~1200+ occurrences
  - `task.id`, `task.title`, `task.completed`, `task.notes`, etc.
  - `this.task`, `self.tasks`, `currentTask`, `selectedTask`
  - Function parameters: `function(task)`, `task => `
  
- **Method/Function names**: ~300+ occurrences
  - `createTask()`, `updateTask()`, `deleteTask()`, `completeTask()`
  - `getTaskById()`, `findTask()`, `filterTasks()`
  - `taskToElement()`, `renderTask()`, `handleTaskClick()`

- **Event names**: 15 occurrences
  - `taskCompleted`, `tasksUpdated`, `taskChanged`
  - `taskAdded`, `taskDeleted`, `taskReordered`
  - `taskTimerStarted`, `taskTimerStopped`

- **localStorage keys**: 32 operations
  - `stackmap_tasks` (primary storage key)
  - `stackmap-tasks` (legacy format)
  - `stackmap-task_${id}` (individual task cache)
  - `stackmap_task_draft_${id}` (draft storage)
  - `stackmap-tasks-backup-${timestamp}` (backup keys)
  - `stackmap_migration_tasks_to_activities` (migration flag)

- **Comments/Strings**: ~200+ occurrences
  - Error messages mentioning "task"
  - Console logs with "task"
  - ARIA labels and announcements

**CSS Files (73 references)**
- Mostly in `activity-migration.css` for backward compatibility
- Some genuine class references that need updating

**HTML Files (3 references)**
- Skip links: "Skip to tasks" → "Skip to activities"
- Comments mentioning tasks

## Implementation Strategy

### Phase 1: Class Names and Exports (Priority: Critical)
1. **activity-display.js**
   - Already has backward compatibility: `window.TaskDisplay = ActivityDisplay`
   - Internal references still use task terminology
   - Update all internal variable names
   - Keep exports for compatibility

2. **activity-sqlite.js**
   - Update internal method names
   - Maintain dual API surface for compatibility

3. **activity-cards.js**
   - Update all task references to activity
   - Keep task property names in data for compatibility

4. **activity-timer.js**
   - Update timer-related task references
   - Update event names

### Phase 2: Function Names (Priority: High)
Update function names while maintaining aliases:
```javascript
// Old
createTask() { ... }

// New with compatibility
createActivity() { ... }
createTask() { return this.createActivity(...arguments); } // Alias
```

Target files:
- activity-display.js: createTask, updateTask, deleteTask, etc.
- activity-sqlite.js: saveTask, loadTasks, etc.
- app.js: handleTaskClick, validateTask, etc.

### Phase 3: Event System Update (Priority: High)
Coordinated event renaming with dual dispatch:
```javascript
// Dispatch both during transition
this.dispatchEvent('activitiesUpdated', data);
this.dispatchEvent('tasksUpdated', data); // Compatibility
```

Events to update:
- taskCompleted → activityCompleted
- tasksUpdated → activitiesUpdated
- taskChanged → activityChanged
- taskAdded → activityAdded
- taskDeleted → activityDeleted
- taskReordered → activityReordered
- taskTimerStarted → activityTimerStarted
- taskTimerStopped → activityTimerStopped

### Phase 4: Variable Names (Priority: Medium)
Systematic update of internal variables:
- Loop variables: `tasks.forEach(task => ...)` → `activities.forEach(activity => ...)`
- Properties: `this.tasks` → `this.activities`
- Local variables: `const task = ...` → `const activity = ...`

### Phase 5: Storage Keys Migration (Priority: High)
Implement dual-key strategy:
```javascript
// Read from both keys
let data = localStorage.getItem('stackmap_activities');
if (!data) data = localStorage.getItem('stackmap_tasks');

// Write to both during transition
localStorage.setItem('stackmap_activities', data);
localStorage.setItem('stackmap_tasks', data); // Compatibility
```

Keys to migrate:
- stackmap_tasks → stackmap_activities
- stackmap-tasks → stackmap-activities
- stackmap-task_* → stackmap-activity_*
- stackmap_task_draft_* → stackmap_activity_draft_*

### Phase 6: CSS Classes (Priority: Low)
Update remaining CSS classes:
- Verify activity-migration.css is properly mapping all classes
- Update any direct .task-* references in other CSS files
- Ensure no visual breakage

### Phase 7: HTML Updates (Priority: Low)
- Update skip links text
- Update any comments
- Update meta descriptions if needed

### Phase 8: Comments and Documentation (Priority: Low)
- Update all code comments
- Update console.log messages
- Update error messages
- Update ARIA labels and announcements

## Risk Assessment

### Potential Breaking Changes:
1. **Event System**: Components listening for old events won't receive updates
   - **Mitigation**: Dual event dispatch during transition period
   
2. **Storage Keys**: Data loss if keys change without migration
   - **Mitigation**: Read from both old and new keys, write to both

3. **External Dependencies**: Other components may expect old API
   - **Mitigation**: Maintain backward compatibility exports

4. **Third-party Integration**: Unknown external code using our APIs
   - **Mitigation**: Keep aliases for all public methods

### Backward Compatibility Requirements:
- All window.Task* exports must remain
- Old event names must still fire
- Old storage keys must still be readable
- Old method names must work via aliases

## Testing Plan

### Manual Testing Checklist:
- [ ] Create new activity - works correctly
- [ ] Edit existing activity - saves properly
- [ ] Complete activity - state updates
- [ ] Delete activity - removes cleanly
- [ ] Reorder activities - persists order
- [ ] Timer functions - start/stop/save time
- [ ] Page reload - data persists
- [ ] User switching - activities load correctly
- [ ] Day switching (today/tomorrow) - correct activities show
- [ ] Bulk operations - work as expected
- [ ] Edit mode - all functions work
- [ ] Mobile view - responsive and functional
- [ ] Safe mode (?safe=true) - simplified UI works

### Integration Testing:
- [ ] Visual cards system still works
- [ ] Activity library integration
- [ ] Quick add functionality
- [ ] Undo/redo system
- [ ] Photo attachments
- [ ] Voice recordings
- [ ] Export/import data
- [ ] Demo mode

### Regression Testing:
- [ ] No console errors on any action
- [ ] All existing features remain functional
- [ ] Performance not degraded
- [ ] Memory usage stable
- [ ] No visual glitches

### Compatibility Testing:
- [ ] Old API calls still work
- [ ] Old events still fire
- [ ] Old storage data loads
- [ ] Mixed old/new code works

## Implementation Order:
1. Update storage migration to handle new keys
2. Update all class names with backward compatibility
3. Update all method names with aliases
4. Implement dual event dispatch
5. Update internal variable names systematically
6. Update CSS classes via migration file
7. Update HTML references
8. Update all comments and strings
9. Extensive testing
10. Remove transition code in future release

## Time Estimate:
- Research: ✅ 2 hours (complete)
- Implementation: 8-10 hours (increased due to scope)
- Testing: 3-4 hours (comprehensive testing needed)
- Total: 13-16 hours

## Success Criteria:
- Zero references to "task" outside of migration/compatibility code
- All features continue to work exactly as before
- No console errors or warnings
- Backward compatibility maintained
- Clean, consistent codebase using "activity" terminology