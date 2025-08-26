# Pending Changes

## Title: Fix stale closure bug in activity reordering (not sync related!)

### Changes Made:
- Fixed stale closure issue in useEditMode hook causing incorrect card reordering
- Added useRef to track current activities array instead of using stale closure values
- Updated all handlers (handleMoveUp, handleMoveDown, handleReorder, etc.) to use activitiesRef.current
- Removed initialActivities from dependency arrays to prevent stale references
- This fixes the bug where moving multiple cards would cause previous moves to revert
- Root cause: The hook was using stale activities array from before the first move when processing the second move

### Investigation Results:
- Searched codebase for similar stale closure patterns
- Most other components handle this correctly by:
  - Using Zustand stores to get fresh state (e.g., toggleActivity)
  - Using setState callbacks that receive current state
  - Not capturing arrays in closures
- No other obvious instances of this bug pattern found
- The useEditMode hook was unique in how it captured the array prop in multiple callbacks

