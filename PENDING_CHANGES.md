# Pending Changes

## Title: Fix 400 errors for established syncs on page load

### Changes Made:
- Fixed AsyncStorage keys to use original keys (@sync_enabled, @sync_version) instead of V2 keys
- This allows V2 service to properly load existing sync configuration
- Fixed encryption initialization check to use encryptionService.masterKey
- Removed broken isInitialized() function check that didn't exist
- These fixes ensure existing syncs properly initialize encryption on page load
- Resolves 400 errors that were occurring because encryption wasn't ready

