# Pending Changes

## Title: Fix Sync Onboarding Issues

### Changes Made:

1. **Fixed Double Sync Creation Bug** (src/components/Onboarding/OnboardingUserCentered.js)
   - Removed redundant `createSyncGroup()` call that was causing "already exists" errors
   - `syncService.initialize()` already handles sync group creation internally

2. **Added Missing Starter Activities** (src/components/Onboarding/OnboardingUserCentered.js)
   - Fixed missing welcome cards when sync is enabled during onboarding
   - Added starter activities (Welcome, Edit Mode, Switch Users, Sync) to first user
   - Now matches the behavior of non-sync onboarding

3. **Fixed Sync API Error Handling** (qual/api/sync/)
   - Fixed undefined `sendError()` function in create.php and push.php
   - Added debug logging for better error diagnosis

4. **Improved Error Messages** (src/services/sync/syncService.js)
   - Better detection and reporting of JSON vs HTML error responses
   - Clearer error messages when API endpoints fail

### Root Causes Fixed:
1. Sync group was being created twice (once in initialize, once explicitly)
2. Users created during sync setup had empty activity arrays
3. Main onboarding handler skipped adding activities when users already existed

### Testing:
- Create sync from onboarding - should work first try
- Welcome cards should appear for first user
- Sync should work properly between devices

