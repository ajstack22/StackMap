# Pending Changes

## Title: Add Debug Logging for Android Sync 404 Error

### Changes Made:
- Added detailed logging to minimalSyncService.js joinSync method
- Logs sync ID, device ID, API base URL, and full URL
- Will help diagnose why Android gets 404 while iOS/web work
- Updated Android/iOS version codes to 250831045

