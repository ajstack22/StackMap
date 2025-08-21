# Pending Changes

## Title: Support Modal Fixes and Onboarding Cleanup

### Changes Made:

1. **Fixed "Create New Sync" visibility on mobile platforms**
   - File: `src/components/Modals/DataModal/DataModal.js:1658`
   - Removed Platform.OS === 'web' condition to enable sync creation on iOS/Android

2. **Fixed Support button to open modal instead of direct link**
   - File: `src/components/EditModeToolbar/EditModeToolbar.js:150`
   - Fixed spread operator syntax to properly include Support action with modal callback

3. **Fixed Support links in onboarding to open modal**
   - Files: `App.js:5629`, `src/components/Onboarding/OnboardingUserCentered.js:42,552`
   - Added onShowSupport prop to make Support links open modal instead of direct URL

4. **Fixed team photo display on web (IN PROGRESS)**
   - File: `src/components/Modals/SupportModal/SupportModal.js:46-63`
   - Changed from React Native Image to native HTML img tag for web
   - Using ES6 import for the image
   - Issue: Image loads (304 status) but may still show as white box

5. **Cleaned up unused onboarding code**
   - Deleted: `src/components/Onboarding/OnboardingNew.js` (~99KB)
   - Deleted: `src/components/Onboarding/OnboardingUserCentered.index.js`
   - Updated: `App.js` to remove conditional onboarding logic
   - Updated: `src/components/Onboarding/index.js` to export OnboardingUserCentered

### Current Issue:
- Team photo returns 304 (cached) but may display as white box
- Need to verify if the image URL is correctly resolved by webpack

### Next Steps:
- Run `./scripts/deploy-all.sh` for proper deployment