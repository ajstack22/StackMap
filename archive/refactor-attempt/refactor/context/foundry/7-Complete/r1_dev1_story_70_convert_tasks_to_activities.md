# Story #70: Convert Tasks to Activities Throughout Codebase

## 🔴 REQUIRED MODIFICATIONS - PM REVIEW FEEDBACK

**Status**: Plan not found - Developer must create implementation plan

### Required Actions:
1. **CREATE PLAN**: No plan exists yet in 4-PlanReview folder
2. **FILE NAME**: Must be `r1_dev1_story_70_plan.md`
3. **LOCATION**: `/refactor/context/foundry/4-PlanReview/`

### Plan Must Include:
1. **Complete Research Findings** documenting:
   - All database tables/columns with "task"
   - All localStorage keys with "task"
   - All user-visible text with "task"
   - All files needing rename

2. **Detailed Implementation Steps** with:
   - Exact file paths
   - Code diffs showing changes
   - Order of operations
   - Migration system design

3. **Safety Measures**:
   - Backup procedures
   - Rollback plan with git commands
   - Data verification steps
   - User communication during migration

4. **Comprehensive Testing**:
   - Test data sets (small, medium, large)
   - Mobile device testing
   - Performance benchmarks
   - Edge case handling

### Timeline:
- Research: 2 hours
- Plan Creation: 2 hours
- Submit within: 4 hours

**DO NOT START CODING** until plan is approved!

---

## Story Overview
**Round**: 1  
**Developer**: 1  
**Priority**: Critical - Blocks all other UI work

## Background
The refactor incorrectly uses "tasks" terminology everywhere, but StackMap is an **activity card app** for children. This is not just a naming change - it's about aligning with the app's core purpose and user mental model.

## User Story
As a child using StackMap, I want to see "activities" not "tasks" because activities sound fun and tasks sound like work.

## Acceptance Criteria
- [ ] All user-visible text shows "activity/activities" not "task/tasks"
- [ ] Database schema updated (with migration)
- [ ] All JavaScript variables/functions renamed
- [ ] CSS classes renamed to match
- [ ] Storage keys migrated safely
- [ ] No data loss during migration

## Research Requirements
Before creating your plan, research:
1. **Database Schema**: How is data currently stored?
   - Check `js/task-sqlite.js` for schema
   - Check `js/db-schema.js` for structure
   - Note all tables and columns using "task"

2. **Storage Keys**: What localStorage keys exist?
   - Search for `localStorage.getItem` and `setItem`
   - List all keys containing "task"

3. **User-Facing Text**: Where does "task" appear?
   - Check all `.innerHTML` and `.textContent`
   - Review `index.html` for hardcoded text

4. **File Names**: Which files need renaming?
   - List all files with "task" in the name
   - Plan the rename strategy

## Implementation Plan Template
Create your plan in: `/refactor/context/foundry/4-PlanReview/r1_dev1_story_70_plan.md`

```markdown
# Implementation Plan: Convert Tasks to Activities

## Phase 1: Research Findings
### Database Schema
- Current tables: [list them]
- Columns to rename: [list them]
- Migration strategy: [describe]

### Storage Keys
- Keys found: [list them]
- Migration needed for: [list them]

### Files to Rename
- task-sqlite.js → activity-sqlite.js
- [list all others]

## Phase 2: Implementation Order
### Step 1: Create Migration System
**File**: js/migration-tasks-to-activities.js (NEW)
```javascript
// Show exact code structure
```

### Step 2: Update Database Schema
**File**: js/db-schema.js
```diff
- taskId INTEGER
+ activityId INTEGER
```

### Step 3: Update Storage Layer
**File**: js/task-sqlite.js → js/activity-sqlite.js
- Line-by-line changes shown as diffs

### Step 4: Update UI Components
[Continue with specific file changes]

## Phase 3: Testing Plan
- [ ] Test data migration with sample data
- [ ] Test backwards compatibility
- [ ] Test all CRUD operations
- [ ] Verify no UI breaks

## Rollback Plan
If issues occur:
1. How to revert schema
2. How to restore data
3. Which commits to revert
```

## Code Patterns to Follow
```javascript
// BEFORE (Don't use):
const tasks = await TaskSQLite.getAllTasks();
taskCard.classList.add('task-card');
localStorage.setItem('tasks', JSON.stringify(data));

// AFTER (Use this):
const activities = await ActivitySQLite.getAllActivities();
activityCard.classList.add('activity-card');
localStorage.setItem('activities', JSON.stringify(data));
```

## Migration Safety Requirements
1. **Backup First**: Create backup of all data before migration
2. **Test Migration**: Run on test data before real data
3. **Incremental**: Can pause/resume if needed
4. **Reversible**: Can rollback if issues found
5. **Logging**: Track what was migrated

## Common Pitfalls to Avoid
- Don't just find/replace blindly - check context
- Some "task" might be in different contexts (e.g., "background task")
- Watch for compound words: "taskCard" → "activityCard"
- Test data migration thoroughly before committing

## Definition of Done
- [ ] Research complete and documented
- [ ] Detailed plan created in 4-PlanReview
- [ ] Plan reviewed and approved by PM
- [ ] Implementation matches plan exactly
- [ ] All tests pass
- [ ] Data migration verified
- [ ] No "task" visible to users
- [ ] Code review passed

## Time Estimate
- Research: 2 hours
- Plan Creation: 2 hours  
- Implementation: 6-8 hours
- Testing: 2 hours

## Questions for PM Before Starting
1. Should we keep "task" in any internal APIs for compatibility?
2. What about URL routes - change those too?
3. How do we handle users mid-session during deployment?

---
Remember: This is a critical change that affects the entire codebase. Take time to plan thoroughly. A good plan prevents bugs and rework.