# Pending Changes

## Title: Fix Duplicate Sync Group Creation Error

### Changes Made:

1. **Fixed Double Creation Bug** (src/components/Onboarding/OnboardingUserCentered.js)
   - Removed redundant `createSyncGroup()` call 
   - `syncService.initialize()` already creates the group internally
   - This was causing "Sync ID already exists" errors

2. **Fixed Sync API Error Handling** (qual/api/sync/)
   - Fixed undefined `sendError()` function in create.php and push.php
   - Added debug logging to diagnose sync issues

3. **Improved Sync Service Error Handling** (src/services/sync/syncService.js)
   - Better detection of JSON vs HTML error responses
   - Clearer error messages when API endpoints fail

4. **Enhanced Sync Code Generation** (src/components/Onboarding/OnboardingUserCentered.js)
   - Improved randomness for mobile sync code generation
   - Added timestamp mixing for better entropy

### Root Cause:
The sync group was being created TWICE:
1. First by `syncService.initialize()` (which checks if group exists and creates if needed)
2. Then again by explicit `createSyncGroup()` call (which failed with 409 Conflict)

### Testing Needed:
- Create new sync from onboarding wizard - should succeed on first try
- No more "Sync ID already exists" errors
- Sync should work properly between devices

### Risk Level: Low
- Simple fix removing redundant call
- Core sync logic unchanged

