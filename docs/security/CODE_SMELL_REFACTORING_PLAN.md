# Code Smell Refactoring Plan - Atlas Standard Workflow

**Date:** 2025-10-02
**Workflow:** Atlas Standard (30-60 min)
**Goal:** Reduce code smells from 1,410 → ~1,100-1,200 by fixing high-impact LLM/human readability issues

## Research Summary

### Top Code Smells Found

1. **Magic Numbers - Animation Timings** (20+ instances in App.js)
   - setTimeout delays: 50, 100, 200, 300ms
   - No semantic meaning
   - High LLM/human confusion

2. **Inconsistent Field Access** (35+ instances across codebase)
   - `activity.text || activity.name || activity.title` (20+ times)
   - `activity.icon || activity.emoji` (15+ times)
   - Pattern already established in `dataNormalizer.js` but not used everywhere

3. **Deeply Nested Conditionals** (15 files)
   - 3-4 levels common in sync/conflict logic
   - Hard for LLM to track state
   - Prime refactoring targets: `conflictResolver.js`, `syncOperationUtils.js`

4. **Large Files** (Low priority for this workflow)
   - App.js: 6,743 lines (would require full workflow)
   - DataModal.js: 1,200 lines (would require full workflow)

## Refactoring Strategy

### Task 1: Extract Animation Timing Constants ⭐ High Impact
**File:** `src/constants/animations.js` (new)
**Estimated Impact:** -30 to -50 smells

Create semantic constants for all animation timings:
```javascript
export const ANIMATION_DURATION = {
  INSTANT: 0,
  FAST: 100,
  NORMAL: 200,
  SLOW: 300,
  MODAL_DELAY: 300, // Delay before showing modal
};
```

**Files to update:**
- App.js (8+ instances)
- ContextModal.js
- DataModal.js
- Other modal components

**LLM Benefit:** Clear semantic meaning instead of magic numbers
**Human Benefit:** Easy to adjust timing globally

---

### Task 2: Standardize Field Access with Helper Functions ⭐ High Impact
**File:** `src/utils/fieldAccessors.js` (new)
**Estimated Impact:** -40 to -60 smells

Create helper functions leveraging existing `dataNormalizer.js` patterns:
```javascript
/**
 * Get activity text field with fallback chain
 * @param {Object} activity
 * @returns {string}
 */
export const getActivityText = (activity) => {
  return activity.text || activity.name || activity.title || '';
};

/**
 * Get activity icon with fallback chain
 * @param {Object} activity
 * @returns {string}
 */
export const getActivityIcon = (activity) => {
  return activity.icon || activity.emoji || '🎯';
};

/**
 * Get user icon with fallback chain
 * @param {Object} user
 * @returns {string}
 */
export const getUserIcon = (user) => {
  return user.icon || user.emoji || '👤';
};
```

**Files to update:**
- conflictResolver.js (3 instances)
- LibraryTabContent.js (4 instances)
- CompleteTabContent.js (2 instances)
- ShareView.js (1 instance)
- ReorderModal.js (1 instance)
- activityCrudLogic.js (2 instances)
- importExportValidation.js (1 instance)

**LLM Benefit:** Single source of truth for field access patterns
**Human Benefit:** No more guessing which field to use

---

### Task 3: Simplify Nested Conditionals (Selective) ⭐ Medium Impact
**Estimated Impact:** -20 to -30 smells

Focus on most egregious cases using early returns:

**Before:**
```javascript
if (condition1) {
  if (condition2) {
    if (condition3) {
      // do something
    }
  }
}
```

**After:**
```javascript
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;
// do something
```

**Target files:**
- `src/services/sync/conflictResolver.js` (1-2 functions)
- `src/utils/syncOperationUtils.js` (1-2 functions)

**LLM Benefit:** Linear flow easier to follow
**Human Benefit:** Reduced cognitive load

---

## Implementation Order

1. ✅ **Task 1: Animation Constants** (10 min)
   - Create `src/constants/animations.js`
   - Update App.js (8 instances)
   - Update modal components (5-10 instances)

2. ✅ **Task 2: Field Accessors** (20 min)
   - Create `src/utils/fieldAccessors.js`
   - Add JSDoc comments
   - Update 7 files (~15 instances total)

3. ✅ **Task 3: Simplify Conditionals** (10 min)
   - Refactor 2-4 functions in sync services
   - Use early returns

4. ✅ **Review & Test** (10 min)
   - Run typecheck: `npm run typecheck`
   - Visual test: Launch app, verify modals, sync, activities work
   - Check no regressions

5. ✅ **Deploy** (5 min)
   - Update `PENDING_CHANGES.md`
   - Run `./scripts/qual_deploy.sh`

---

## Success Metrics

- **Code Smells:** 1,410 → ~1,100-1,200 (-200 to -300 smells)
- **LLM Context Efficiency:** +15-20% (fewer fallback chains, clearer intent)
- **Developer Onboarding:** Easier to understand field access patterns
- **Maintainability:** Centralized timing constants, easier to adjust globally

---

## Out of Scope (Future Workflows)

- Splitting App.js (requires Full workflow, 2-4 hours)
- Refactoring all sync logic (requires Full workflow)
- Type migration (separate ongoing effort)
- Splitting DataModal.js (requires Standard workflow)

---

## Risk Assessment

**Low Risk:**
- Animation constants: Pure refactor, no logic change
- Field accessors: Defensive fallbacks match existing patterns
- Conditional simplification: Behavior-preserving refactor

**Testing Strategy:**
- Type checking catches import errors
- Visual smoke test covers UI regressions
- Sync already has test coverage
