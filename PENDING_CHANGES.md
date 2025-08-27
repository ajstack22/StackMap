# Pending Changes

## Title: Fix Critical Sync Data Loss Issue

### Changes Made:
- Fixed critical bug where Browser A's data gets completely wiped when Browser B joins the sync
- Root cause: Race condition where Browser B immediately pushes empty/starter data after joining
- Added 15-second cooldown after joining sync to prevent immediate push (`_justJoinedSync` flag)
- Enhanced CRDT merger to detect empty local state and use remote state entirely
- Added safety checks in push() to prevent pushing empty data
- Updated useSyncOnChange hook to respect the _justJoinedSync flag
- Added comprehensive logging throughout sync flow for debugging
- Prevented periodic sync and manual sync requests during the join cooldown

