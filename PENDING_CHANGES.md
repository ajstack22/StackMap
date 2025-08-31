# Pending Changes

## Title: Fix iOS Sync Preview - Revert String() Wrapping

### Changes Made:
- Reverted String() wrapping in pullData URL construction that caused "Malformed decodeURI input" error
- Kept syncService pattern: set minimalSync.syncId BEFORE initializeEncryption() 
- Simple URL construction without encoding works (hex IDs don't need encoding)

