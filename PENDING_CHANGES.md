# Pending Changes

## Title: Enable Verbose AsyncStorage Debugging on Web

### Changes Made:
- Enabled verbose logging in AsyncStorage.web.js to track all storage operations
- Added verification after each setItem to confirm localStorage actually saved the value
- Added debugAsyncStorage() global function accessible in browser console
- Shows all sync-related items stored in localStorage
- Helps diagnose why recovery phrase isn't persisting between page refreshes

