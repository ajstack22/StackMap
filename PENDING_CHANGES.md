# Pending Changes

## Title: Production Deployment Preparation - Debug Removal & API Fix

### Changes Made:
1. **Removed Debug UI Components**
   - Archived debug buttons to `/src/utils/ArchivedOnboardingDebug.js`
   - Deleted `SyncDebugger.js` and `TestEncryption.js` components
   - Removed all debug UI references from `App.js` and `OnboardingUserCentered.js`

2. **Fixed Mobile API URLs for Production**
   - Removed forced QUAL API redirect for mobile builds
   - Mobile release builds now correctly use production API
   - Mobile debug builds use QUAL API
   - Web properly detects qual vs prod based on URL

### API URL Configuration:
- **Web**: Auto-detects based on URL path (/qual/ vs /)
- **Mobile Debug**: Uses QUAL API (https://stackmap.app/qual/api/sync)
- **Mobile Release**: Uses Production API (https://stackmap.app/api/sync)

### Ready for Production:
✅ Debug UI removed  
✅ API URLs properly configured  
✅ Mobile builds will hit correct endpoints  
✅ Web deployment will preserve .htaccess and sensitive files

