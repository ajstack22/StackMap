# Pending Changes

## Title: Fix sync key showing null after browser refresh

### Changes Made:
- Updated syncServiceV2.getRecoveryPhrase() to retrieve stored recovery phrase from encryptionService
- Added retry mechanism with 500ms delay if recovery phrase isn't immediately available
- Added null checks to prevent "null" or "undefined" in sync URLs
- Show "Loading sync key..." placeholder when key is not yet loaded
- Prevent copying empty/null sync keys with error toast message
- QR code defaults to base URL when sync key is not available

