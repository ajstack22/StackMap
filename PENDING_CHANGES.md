# Pending Changes

## Title: Fix multi-device user sync issue - preserve device-specific currentUser

### Changes Made:
- Stopped syncing currentUser field to prevent unwanted user switching across devices
- Each device now preserves its own currentUser selection (device-specific)
- Only updates currentUser if local selection is invalid or doesn't exist
- Prevents family members from all switching to the same user during sync
- Added comprehensive test suite to verify sync logic handles all edge cases