# Pending Changes

## Title: Fix pullData error when joining sync via URL

### Changes Made:
- Added pullData() method to syncServiceV2 as alias to pull() for backward compatibility
- Exposed encryptionService as property on syncServiceV2 for onboarding component access
- Fixed "E.default.pullData is not a function" error during sync join flow
- Maintained compatibility with existing onboarding code that expects these methods

