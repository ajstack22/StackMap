# Pending Changes

## Title: Fix iOS Sync Preview using syncService Pattern

### Changes Made:
- Applied syncService pattern to onboarding: set minimalSync.syncId BEFORE calling initializeEncryption()
- This critical pattern matches how syncStoreIntegration.js handles mobile sync (line 705)
- Fixed "Malformed decodeURI input" error on iOS by ensuring syncId is available during encryption init
- Added error handling to sync preview to better diagnose issues
- Ensures iOS and Android generate same sync IDs as web for same recovery phrase

