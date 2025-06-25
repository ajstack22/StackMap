# Implementation Plan: Convert Tasks to Activities

## Phase 1: Research Findings

### Database Schema
**Current tables and columns found:**
- `tasks` table in SQLite (task-sqlite.js)
  - taskId, title, description, parentId, etc.
- `storage` table for key-value pairs
- `cards` table with taskId column
- `attachments` table with task_id column

**Schema in db-schema.js:**
- task object with fields: id, title, description, status, parentId, etc.
- IndexedDB stores: tasks, attachments
- References to taskId throughout

### Storage Keys
**Keys found in localStorage:**
- `stackmap_tasks`
- `stackmap_tasks_backup`
- `stackmap_task_drafts`
- `stackmap_last_task_id`
- `stackmap_device_id` (contains "task" but not related)
- Various user-prefixed keys with "task"

### User-Facing Text
**Locations where "task" appears:**
- task-display.js: Error messages, console logs
- task-cards.js: UI elements, aria-labels
- task-timer.js: Timer-related text
- HTML: Various aria-labels and placeholders
- Button texts: "Add Task", "Delete Task", etc.
- Error messages: "Unable to load tasks"

### Files to Rename
**JavaScript files:**
- task-sqlite.js → activity-sqlite.js
- task-display.js → activity-display.js
- task-cards.js → activity-cards.js
- task-timer.js → activity-timer.js
- task-reorder.js → activity-reorder.js
- task-card-pool.js → activity-card-pool.js
- commands/task-commands.js → commands/activity-commands.js

**CSS files:**
- No CSS files with "task" in filename found

**HTML files:**
- test-task-display.html → test-activity-display.html

## Phase 2: Implementation Order

### Step 1: Enhance Migration System
**File**: js/migration-tasks-to-activities.js (UPDATE EXISTING)
```javascript
// Add to existing migration file:
// 1. Add database schema migration
// 2. Add file content migration
// 3. Add rollback capability
// 4. Add progress tracking
```

### Step 2: Update Database Schema
**File**: js/db-schema.js
```diff
- task: {
+ activity: {
    fields: {
      id: { type: 'number', required: false },
-     title: { type: 'string', required: true, maxLength: 500 },
+     title: { type: 'string', required: true, maxLength: 500 },
      // ... other fields remain same
    },
-   generateSyncId: function() {
-     return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
+   generateSyncId: function() {
+     return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // Update IndexedDB schema
  stores: {
-   tasks: {
+   activities: {
      keyPath: 'id',
      // ... indexes remain same
    },
    attachments: {
      indexes: [
-       { name: 'taskId', keyPath: 'taskId', unique: false },
+       { name: 'activityId', keyPath: 'activityId', unique: false },
      ]
    },
    cards: {
      indexes: [
-       { name: 'taskId', keyPath: 'taskId', unique: false },
+       { name: 'activityId', keyPath: 'activityId', unique: false },
      ]
    }
  }
```

### Step 3: Update Storage Layer
**File**: js/task-sqlite.js → js/activity-sqlite.js
- Rename file
- Update all internal references:
  - `TaskSQLite` → `ActivitySQLite`
  - `dbName: 'stackmap_tasks.db'` → `'stackmap_activities.db'`
  - All SQL queries: `tasks` → `activities`
  - All function names: `createTask` → `createActivity`, etc.
  - Column names: `task_id` → `activity_id`

### Step 4: Update UI Components
**File**: js/task-display.js → js/activity-display.js
```diff
- const TaskDisplay = {
+ const ActivityDisplay = {
-   tasks: [],
+   activities: [],
-   editingTaskId: null,
+   editingActivityId: null,
    
    loadTasks: function(callback) {
-     if (window.TaskSQLite && window.TaskSQLite.isReady) {
-       window.TaskSQLite.getTasks((tasks, error) => {
+     if (window.ActivitySQLite && window.ActivitySQLite.isReady) {
+       window.ActivitySQLite.getActivities((activities, error) => {
          // Update all references
        });
      }
    },
    
    // Update all user-facing text:
-   this.showError('Unable to load tasks');
+   this.showError('Unable to load activities');
  }
```

**File**: js/task-cards.js → js/activity-cards.js
```diff
- className: 'task-card',
+ className: 'activity-card',
- ariaLabel: 'Task: ' + title,
+ ariaLabel: 'Activity: ' + title,
- placeholder: 'Enter task name',
+ placeholder: 'Enter activity name',
```

### Step 5: Update CSS Classes
**Files**: All CSS files
```diff
- .task-card { }
+ .activity-card { }
- .task-container { }
+ .activity-container { }
- .task-timer { }
+ .activity-timer { }
```

### Step 6: Update HTML References
**File**: index.html
```diff
<!-- Update script references -->
- <script src="js/task-sqlite.js" defer></script>
+ <script src="js/activity-sqlite.js" defer></script>
- <script src="js/task-display.js" defer></script>
+ <script src="js/activity-display.js" defer></script>
- <script src="js/task-cards.js" defer></script>
+ <script src="js/activity-cards.js" defer></script>
- <script src="js/task-timer.js" defer></script>
+ <script src="js/activity-timer.js" defer></script>
- <script src="js/task-reorder.js" defer></script>
+ <script src="js/activity-reorder.js" defer></script>
- <script src="js/commands/task-commands.js" defer></script>
+ <script src="js/commands/activity-commands.js" defer></script>

<!-- Update container IDs -->
- <div id="task-container"></div>
+ <div id="activity-container"></div>

<!-- Update aria-labels -->
- aria-label="Task list"
+ aria-label="Activity list"
```

### Step 7: Update Imports and Dependencies
**All files that import task-related modules:**
```diff
- if (window.TaskDisplay) {
+ if (window.ActivityDisplay) {
- window.TaskDisplay.addTask();
+ window.ActivityDisplay.addActivity();
```

## Phase 3: Testing Plan
- [ ] Create test data with both old and new formats
- [ ] Test data migration with sample data
- [ ] Test backwards compatibility
- [ ] Test all CRUD operations
- [ ] Verify no UI breaks
- [ ] Test on mobile devices
- [ ] Test with large datasets
- [ ] Test rollback functionality

## Phase 4: Migration Safety
1. **Backup Strategy**:
   - Automatically backup all data before migration
   - Store backup with timestamp
   - Keep for 30 days

2. **Incremental Migration**:
   - Migrate in batches of 100 items
   - Show progress to user
   - Allow pause/resume

3. **Verification**:
   - Count items before and after
   - Verify data integrity
   - Log all changes

4. **Rollback Plan**:
   - Keep old data structures intact
   - Add migration version tracking
   - One-click rollback function

## Rollback Plan
If issues occur:
1. **Immediate Actions**:
   - Stop migration process
   - Restore from automatic backup
   - Revert file renames via git

2. **Data Recovery**:
   ```javascript
   // Rollback function in migration file
   rollback: function() {
     // Restore localStorage keys
     // Restore SQLite data
     // Clear migration flags
   }
   ```

3. **Git Revert Commands**:
   ```bash
   git revert <migration-commit>
   git checkout HEAD~1 -- js/task-*.js
   ```

## Time Estimate Breakdown
- Research: 2 hours ✓ (completed)
- Plan Creation: 2 hours (in progress)
- Implementation:
  - Migration system: 2 hours
  - File renames: 1 hour
  - Code updates: 3 hours
  - CSS updates: 1 hour
  - Testing: 1 hour
- Testing & Verification: 2 hours
- **Total**: 12 hours

## Risk Mitigation
1. **Data Loss Prevention**:
   - Automatic backups before migration
   - Verification counts at each step
   - Transaction-based updates

2. **User Experience**:
   - Show clear migration progress
   - Allow skip if issues
   - Maintain app functionality during migration

3. **Performance**:
   - Batch processing for large datasets
   - Background migration option
   - Progress persistence

## Definition of Done Checklist
- [ ] All research documented
- [ ] Migration system fully tested
- [ ] All files renamed
- [ ] All code references updated
- [ ] All user-facing text changed
- [ ] CSS classes migrated
- [ ] localStorage keys migrated
- [ ] SQLite schema updated
- [ ] No console errors
- [ ] All tests pass
- [ ] Migration verified on test data
- [ ] Rollback tested
- [ ] No "task" visible to users (except in historical data)
- [ ] Performance acceptable
- [ ] Code review passed

## Notes for PM
1. **Backward Compatibility**: Old "task" keys will be kept with "_migrated" suffix for 30 days
2. **API Compatibility**: Internal functions will maintain aliases for 1 version (e.g., `addTask` → `addActivity`)
3. **URL Routes**: No URL routes found in codebase
4. **Mid-session Handling**: Migration runs on app startup, shows progress screen

## Next Steps
1. Get PM approval on this plan
2. Create feature branch: `feature/tasks-to-activities-migration`
3. Implement migration system enhancements
4. Execute plan step by step
5. Thorough testing on multiple devices
6. Create rollback documentation