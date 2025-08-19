# Pending Changes

## Title: Complete Fix for Sync Onboarding Starter Activities

### Changes Made:

1. **Added All 12 Starter Activities** (src/components/Onboarding/OnboardingUserCentered.js)
   - Was only adding 4 activities in sync flow
   - Now includes complete set of 12 tutorial cards
   - Matches exact starter set from regular onboarding

2. **Fixed Double Sync Creation** 
   - Removed redundant createSyncGroup() call
   - Initialize() already creates the group internally

3. **Fixed API Errors** (qual/api/sync/)
   - Fixed undefined sendError() in PHP files
   - Better error handling

### What Was Wrong:
- Sync onboarding was only creating 4 starter activities
- Regular onboarding creates 12 starter activities
- This inconsistency meant sync users missed important tutorial content

### Testing:
- Create new user with sync enabled
- Should see all 12 welcome cards
- Cards include: Welcome, Edit Mode, Users, Share, Sync, Import/Export, Preferences, Activities, Day, Access, Data, Library

