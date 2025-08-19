# Pending Changes

## Title: Fix Sync Data Not Being Pushed to Server

### Changes Made:

1. **Fixed Change Tracking for New Syncs** (src/services/sync/syncService.js)
   - Set empty baseline state for change tracker when creating new sync
   - This makes all initial data appear as "new" changes that need syncing
   - Removed premature markAsSynced() call after createSyncGroup

2. **Added Debug Logging** 
   - Log API URL being used (qual vs prod)
   - Log generated sync IDs for troubleshooting
   - Log when setting empty baseline

3. **Increased Store Update Wait Time** (src/components/Onboarding/OnboardingUserCentered.js)
   - Wait 500ms instead of 100ms after setting users
   - Ensures store fully updates before sync initialization

4. **All 12 Starter Activities Included**
   - Complete tutorial card set for new users

5. **Fixed Double Sync Creation**
   - Removed redundant createSyncGroup() call

### Root Cause:
The change tracker had no baseline for new syncs, so it couldn't detect that the initial data needed to be pushed. By setting an empty baseline, all data appears as "new" and gets synced.

### Testing:
1. Create sync on web with onboarding
2. Sync code should work on other devices
3. All starter activities should appear

