# Pending Changes

## Title: Fix Sync Configuration Persistence and API Integration

### Changes Made:

#### 1. Fixed Sync Configuration Not Persisting After Onboarding
- **Issue**: Sync settings weren't being saved with correct AsyncStorage keys
- **Root Cause**: Onboarding used `syncEnabled` but sync service expects `@sync_enabled`
- **Fixes in `src/components/Onboarding/OnboardingUserCentered.js`**:
  - Changed AsyncStorage keys to match sync service (`@sync_enabled`, `@sync_id`)
  - Removed storing recovery phrase separately (handled by sync service)

#### 2. Fixed Simple Sync Service Recovery Phrase Storage
- **Issue**: Recovery phrase wasn't being stored for later retrieval
- **Fixes in `src/services/sync/simpleSyncService.js`**:
  - Added storing recovery phrase in `enable()` method
  - Already had proper restore and clear in `restoreState()` and `disable()`

#### 3. Fixed Simple Sync Service API Workflow
- **Issue**: Sync was getting 404/500 errors from API
- **Root Cause**: Must create sync group before updating it
- **Fixes in `src/services/sync/simpleSyncService.js`**:
  - Updated `pushState()` to call `create.php` if sync group doesn't exist
  - Updated `sync()` and `pullData()` to handle 404 responses properly
  - Fixed absolute API URL: `https://stackmap.app/api/sync`

