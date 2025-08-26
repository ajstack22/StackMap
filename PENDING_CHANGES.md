# Pending Changes

## Title: Fix activity reordering bug caused by incorrect merge logic

### Changes Made:
- Fixed the REAL cause of the reordering bug in App.js onUpdate callback
- Removed the "smart merge" logic that was comparing modifiedAt timestamps
- The merge was overwriting the reordered array with stale data from the store
- When reordering, the newActivities array IS the source of truth for order
- This was causing cards to jump back to their original positions
- Previous stale closure fix in useEditMode was also needed but wasn't the only issue
- Added smooth animations for activity reordering to reduce disorientation
- Implemented platform-specific animations (iOS preset, Android spring, Web CSS)
- Created configureReorderAnimation() utility for consistent animation behavior
- Added CSS transitions for web platform in styles
- Documented animation approach in /docs/features/reorder-animations.md

