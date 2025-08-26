# Pending Changes

## Title: Fix sort order syncing in CRDT implementation

### Changes Made:
- Reorder operations now add orderChangedAt timestamp and sortIndex to all items
- CRDT merger uses orderChangedAt to determine which order is newer
- Sort order properly syncs between devices while preserving CRDT field merging
- Reordering is now tracked as a distinct operation from field modifications

