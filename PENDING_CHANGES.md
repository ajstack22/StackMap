# Pending Changes

## Title: Fix Sync API Errors and Improve Sync Code Generation

### Changes Made:

1. **Fixed Sync API Error Handling** (qual/api/sync/)
   - Fixed undefined `sendError()` function in create.php and push.php
   - Added debug logging to diagnose false duplicate sync ID errors
   - Improved error response handling to properly parse JSON errors

2. **Improved Sync Service Error Handling** (src/services/sync/syncService.js)
   - Better detection of JSON vs HTML error responses
   - Clearer error messages when API endpoints fail
   - Added logging for sync group creation

3. **Enhanced Sync Code Generation** (src/components/Onboarding/OnboardingUserCentered.js)
   - Improved randomness for mobile sync code generation
   - Added timestamp mixing for better entropy
   - Fixed potential race condition in sync code usage
   - Added logging to track generated sync codes

### Purpose:
- Diagnose and fix false "Sync ID already exists" errors during onboarding
- Improve error visibility for debugging sync issues
- Ensure unique sync codes are generated consistently

### Testing Needed:
- Create new sync from onboarding wizard
- Verify unique sync codes are generated
- Check error messages are clear and helpful
- Confirm sync creation succeeds on retry after conflict

### Risk Level: Low
- Only affects error handling and logging
- No changes to core sync logic
- Backward compatible

