# Pending Changes

## Title: Fix Sync Data Decryption in Onboarding

### Changes Made:
1. **Fixed sync data not being decrypted in OnboardingUserCentered.js**:
   - `fetchSyncPreview` was expecting `pullResult.data` but `pullData()` returns raw encrypted blob
   - Added decryption step using `syncService.encryptionService.decryptData()`
   - Fixed both `fetchSyncPreview` and `importSyncData` functions
   
2. **Root cause**: The `pullData()` function returns the raw server response with `encrypted_blob`, not decrypted data. The onboarding flow was checking for `.data` property which doesn't exist until after decryption.

