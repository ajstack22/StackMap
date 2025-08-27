# Pending Changes

## Title: Fix auto-deletion of new cards due to sync race condition

### Changes Made:

- Changed sync interval from 5 seconds to 30 seconds to reduce conflicts with user edits
- Increased debounce delay to 5 seconds to ensure local changes are fully saved before syncing
- Added check to skip periodic sync if there's a pending debounced sync from user changes
- Added `modifiedAt` timestamp to all new activities (both manually created and added from library) for proper sync conflict resolution
- Prevented periodic sync from interfering with user changes by checking for pending debounce timer

### Technical Details:
- The issue was that periodic sync (every 5 seconds) would pull server data before local changes were pushed
- New activities without `modifiedAt` timestamps were being lost during sync merges
- Now ensures all new activities have timestamps and sync respects ongoing user edits

