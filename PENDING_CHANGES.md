# Pending Changes

## Title: Fix sync import creating default user with starter cards

### Changes Made:
- Added initializeForImport method that doesn't pull data after import
- Modified startPeriodicSync to skip initial sync when importing  
- Changed import flow to restore data BEFORE enabling sync
- Added store check to prevent race condition where default user gets created
- Fixed timing issue where React state shows 0 users even after import
- This prevents both sync overwrite AND starter cards initialization

