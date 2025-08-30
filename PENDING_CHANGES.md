# Pending Changes

## Title: Clean up sync system - remove 12,500 lines of unused code

### Changes Made:
- Fixed sync state persistence on page refresh by setting `isEnabled = true` in minimalSyncService.loadExistingSyncId()
- Implemented proper environment detection for mobile builds using `__DEV__` flag
- Debug builds (assembleDebug) now use QUAL API endpoint (https://stackmap.app/qual/api/sync)
- Release builds (bundleRelease) now use production API endpoint (https://stackmap.app/api/sync)
- Added console logging to clearly indicate which API endpoint is being used
- **MAJOR CLEANUP**: Deleted 19 unused sync service files (12,543 lines of dead code)
  - Removed old complex sync systems (syncService.js, syncServiceV2.js, etc.)
  - Removed unused CRDT, timestamp, and queue implementations
  - Modern sync system now only 3,115 lines (80% reduction)

