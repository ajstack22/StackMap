# Pending Changes

## Title: Fix Sync Join to Overwrite Local Data & Onboarding Sync Preview

### Changes Made:
- Fixed sync join behavior to completely replace local data with remote data (no merging)
- Updated syncStoreIntegration.js joinSync() to use applyState() directly instead of handleDataReceived()
- Fixed onboarding sync preview to work with new minimalSync response format
- Updated OnboardingUserCentered.js to handle { success, data } response instead of { encrypted_blob }
- Added proper minimalSync initialization in onboarding to ensure device ID is set
- Ensures all platforms generate consistent sync IDs using nacl.hash algorithm
- When joining sync groups, local data is now fully replaced with sync group data as intended

