# Pending Changes

## Title: Fix sync not propagating updates to all devices

### Changes Made:
- Fixed sync timer to always pull updates (was only syncing when device had pending changes)
- Added immediate debounced sync on requestSync() instead of waiting for next interval
- This fixes the issue where completing a card on one device didn't sync to others
- Sync now works correctly: changes sync immediately (2s debounce) and all devices pull every 5s

