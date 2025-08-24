# Pending Changes

## Title: Fix critical sync bug with timestamp preservation

### Changes Made:
- Fixed critical sync bug where Android devices were causing activities to revert from completed to uncompleted
- Added preservation of `uncompletedAt` and `uncompletedBy` fields in dataValidator.ts
- Added preservation of `modifiedAt`, `lastModified`, `deletedAt`, `deletedBy`, and `category` fields
- Root cause: The `repairSyncedData` function was stripping timestamp metadata fields needed for conflict resolution
- Impact: Activities now properly maintain their completion state across all synced devices

