# Adversarial Code Review: Round 1a - Convert Tasks to Activities

## Story Overview
Converting all "task" terminology to "activity" throughout the codebase.

## Critical Issues Found

### 1. **Incomplete Conversion Risk** 🔴
The story assumes a simple find/replace, but there are hidden dependencies:
- **localStorage keys**: `stackmap_tasks` → need migration or users lose data
- **Event names**: `task-updated`, `task-deleted` → breaking change for listeners
- **CSS classes**: `.task-card` → affects all styling
- **Database table name**: Direct rename could lose all user data

**Impact**: Users could lose all their data on update.

### 2. **Breaking API Changes** 🔴
```javascript
// Current
window.TaskDisplay.addTask()
window.TaskTimer.getTimer(taskId)

// After rename
window.ActivityDisplay.addActivity()
window.ActivityTimer.getTimer(activityId)
```
**Impact**: Any third-party integrations or bookmarklets will break.

### 3. **Migration Timing Issue** 🟡
The story doesn't specify when/how to migrate existing data:
- Users with `tasks` table need data migrated to `activities`
- localStorage keys need migration
- What happens if migration fails mid-process?

### 4. **Mixed Terminology Period** 🟡
During development, some files will use "task" while others use "activity":
- Could cause confusion in PR reviews
- Import statements will break temporarily
- Search functionality impaired

### 5. **Performance Impact** 🟡
Database migration on mobile devices:
- Large task lists could take significant time
- No progress indicator mentioned
- No rollback strategy

## Security Concerns

### 1. **Data Loss During Migration**
- No backup mechanism before table rename
- No verification that data migrated correctly
- No way to recover if migration fails

### 2. **Race Conditions**
- What if user adds task during migration?
- Multiple tabs open could corrupt data

## Missing Requirements

1. **Data Migration Strategy**
   - Need explicit migration code, not just rename
   - Backup mechanism before migration
   - Progress indicator for large datasets

2. **Backwards Compatibility**
   - Keep API aliases for 1-2 versions
   - Warn developers about deprecation

3. **Testing Plan**
   - How to test with real user data?
   - Edge cases: empty DB, corrupted data, mid-migration failure

4. **Rollback Plan**
   - What if deployment fails?
   - How to revert without data loss?

## Recommendations

### Immediate Actions Required:
1. **Create migration script** that:
   ```javascript
   // 1. Backup existing data
   // 2. Create new activities table
   // 3. Copy data with verification
   // 4. Only drop tasks table after verification
   ```

2. **Add compatibility layer**:
   ```javascript
   window.TaskDisplay = window.ActivityDisplay; // Temporary alias
   ```

3. **Phased approach**:
   - Phase 1: UI strings only
   - Phase 2: Internal code (with aliases)
   - Phase 3: Database migration
   - Phase 4: Remove aliases

### Risk Mitigation:
1. Add feature flag for rollback
2. Test migration with production data copy
3. Add telemetry to track migration success
4. Keep tasks table for 30 days as backup

## Verdict: ⚠️ NEEDS MAJOR REVISION

This story is too risky as written. Breaking it into smaller, safer phases with proper migration planning is essential to prevent data loss and user disruption.