# Pending Changes

## Title: Fix iOS Sync Preview to Match Web Implementation

### Changes Made:
- Fixed minimalSyncService.js to properly set this.syncId in initializeEncryption()
- Fixed URL encoding using encodeURIComponent() for React Native compatibility
- Added validation for syncId and deviceId types to prevent encoding errors
- Updated OnboardingUserCentered.js to use pullData(true) for force full pull as per documentation
- Ensures iOS sync preview works the same as web

