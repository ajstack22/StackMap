# Pending Changes

## Title: CRDT sync with sort order tracking and data migration

### Changes Made:
- Implemented CRDT-based sync to replace complex 2200-line system
- Reduced sync codebase to ~1150 lines total (V2 service + CRDT merger)
- Fixed 30-second reversion issue where completed activities would revert
- Fixed description field syncing using proper CRDT values
- Added orderChangedAt timestamp and sortIndex to track reorder operations
- Sort order now properly syncs between devices when activities are reordered
- Added automatic migration from old data format to CRDT format
- Migration handles field name normalization (title→text, emoji→icon)
- Fixed iOS rendering issue after sync/import with force refresh
- Updated version to 25.08.27 for app store submission
- Wrapped all console.log statements in __DEV__ checks for production
- Built Android AAB bundle ready for deployment

