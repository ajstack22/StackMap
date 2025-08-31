# Pending Changes

## Title: Fix iOS "Malformed decodeURI input" Error

### Changes Made:
- Removed unused encodeBase64/decodeBase64 functions that used deprecated escape/unescape
- Added better error handling to catch non-JSON responses before parsing
- These functions were causing the "Malformed decodeURI input" error on iOS
- Encryption is properly handled by encryptionService using tweetnacl-util

