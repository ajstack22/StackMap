# Pending Changes

## Title: Fix critical data loss and sync disconnection issues

### Changes Made:

- Added safety check to prevent applying empty state that would delete all user data
- Enhanced logging to track sync versions and merge operations
- Increased _justJoinedSync flag duration from 5 to 10 seconds to prevent race conditions
- Added detailed merge logging to understand what data is being combined
- Protected against empty merge results that would wipe out local data

### Critical Fixes:
- **Data Loss Prevention**: Never apply state if merge results in zero users
- **Version Tracking**: Enhanced logging to track version mismatches between browsers
- **Merge Safety**: Keep local data if merge would result in data loss

### Technical Details:
- The issue was that when switching browsers, the sync would pull remote data and overwrite local data
- Version numbers were getting out of sync between browsers
- CRDT merger could produce empty results that would delete all data
- Now prevents applying any state that would result in data loss

