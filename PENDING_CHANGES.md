# Pending Changes

## Title: Fix deleteFromServer to properly access sync ID

### Changes Made:
- Fixed deleteFromServer method to use this.getSyncId() instead of this.minimalSync.syncId
- Changed deviceId access to use minimalSync.deviceId directly (without this.)
- Resolved "Cannot read properties of undefined" error when deleting server data
- Server delete operation should now work correctly with proper sync ID access

