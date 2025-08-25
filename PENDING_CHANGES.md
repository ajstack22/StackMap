# Pending Changes

## Title: Fix stale data bug when reordering activities

### Changes Made:
- Fixed EditModeList onUpdate handler to merge fresh store data with reordered array
- Prevents recently edited cards from reverting when reordering other cards
- Uses timestamp comparison to preserve the most recent version of each activity
- Ensures reorder operations don't overwrite concurrent edits

