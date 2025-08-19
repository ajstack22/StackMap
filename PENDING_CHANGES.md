# Pending Changes

## Title: Fix Sync Onboarding - Data Not Syncing to Server

### Changes Made:

1. **Fixed Data Not Pushing After Sync Creation** (src/services/sync/syncService.js)
   - Don't mark state as synced after creating new sync group
   - Only mark as synced when joining existing sync
   - This ensures data gets pushed on first sync

2. **Force Immediate Sync After Onboarding** (src/components/Onboarding/OnboardingUserCentered.js)
   - Added explicit sync() call after initialize()
   - Ensures starter activities are pushed to server

3. **Added All 12 Starter Activities**
   - Complete set of tutorial cards now included
   - Matches regular onboarding flow

4. **Fixed Double Sync Creation Bug**
   - Removed redundant createSyncGroup() call

### Root Cause:
After creating a new sync group, the code was marking the state as "synced" even though it hadn't pushed the actual user data. This prevented the first real sync from pushing data.

### Testing:
1. Create sync on web with onboarding
2. Check sync code works on other devices
3. All 12 starter activities should sync

