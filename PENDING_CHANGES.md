# Pending Changes

## Title: Fix Sync Service Import References

### Changes Made:

1. **Updated DataModal.js**
   - Changed import from syncServiceSimple to syncServiceWeb
   - This was preventing the manual sync button from working

2. **Updated all component imports**
   - OnboardingNew.js - now imports syncServiceWeb
   - SyncBlockingIndicator.js - now imports syncServiceWeb
   - SyncProgress.js - now imports syncServiceWeb
   - SyncStatusIndicator.js - now imports syncServiceWeb
   - useSyncOnChange.js hook - now imports syncServiceWeb

3. **Consistent sync service usage**
   - All components now use the new web sync service
   - No more references to the problematic syncServiceSimple
   - Manual sync button should now call the correct service

### Technical Details:
- DataModal was still importing the old syncServiceSimple
- This caused the manual sync button to fail silently
- The new syncServiceWeb was loading but not being used by components
- All imports now point to the correct service

### Testing Notes:
- Manual sync button should now work and show logs
- Sync should initialize with correct state from localStorage
- All sync-related components should function properly

