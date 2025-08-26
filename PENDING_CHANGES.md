# Pending Changes

## Title: Fix description and sort order not syncing with proper CRDT

### Changes Made:
- Fixed description field being lost during sync (wasn't included in CRDT merge)  
- Implemented description as proper CRDT field with timestamp and device tracking
- Fixed sort order using simplified CRDT approach (most-recent-list-wins)
- Description now merges correctly using CRDT conflict resolution, not last-write-wins

