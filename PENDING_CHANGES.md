# Pending Changes

## Title: Fix iOS Window.location Undefined Error

### Changes Made:
- Added proper platform checks before accessing window.location
- Fixed minimalSyncService.js checkForRecoveryPhrase() for React Native
- Added window.location existence checks in joinWithInviteCode()
- Updated syncStoreIntegration.js with robust browser detection
- Prevents "Cannot read property 'hash' of undefined" error on iOS

