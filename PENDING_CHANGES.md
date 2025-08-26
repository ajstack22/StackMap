# Pending Changes

## Title: CRDT sync with sort order tracking and data migration

### Changes Made:
- Implemented CRDT-based sync to replace complex 2200-line system
- Fixed 30-second reversion issue where completed activities would revert
- Fixed description field syncing using proper CRDT values
- Added orderChangedAt timestamp and sortIndex to track reorder operations
- Sort order now properly syncs between devices when activities are reordered
- Added automatic migration from old data format to CRDT format
- Migration handles field name normalization (title→text, emoji→icon)
- Fixed lint error preventing deployment
- Updated version to 25.08.27 for app store submission
- Built Android AAB bundle ready for deployment

