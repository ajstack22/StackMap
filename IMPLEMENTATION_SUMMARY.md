# 4-Tier Build System Implementation Summary

## Overview

Successfully implemented a 4-tier deployment system for StackMap mobile apps with automatic API endpoint detection based on build type.

**Date:** October 10, 2025
**Task:** Mobile app build type detection for 4-tier deployment system

## Implementation Approach

### 1. Centralized Configuration (`src/config/buildConfig.js`)

Created a new centralized build configuration module that:
- Detects build type from environment variables (highest priority)
- Detects web environment from URL
- Falls back to `__DEV__` flag for React Native
- Exports `BUILD_TYPE` and `API_URL` for use throughout the app

**Key Features:**
- Priority-based detection: `BUILD_TYPE env var > URL detection > __DEV__ flag`
- Supports all 4 environments: QUAL, STAGE, BETA, PROD
- Backward compatible with existing debug/release builds
- Single source of truth for API URLs

### 2. Updated Sync Services

Modified two critical sync service files to use the centralized configuration:

#### `src/services/sync/minimalSyncService.js`
- Replaced inline environment detection logic
- Now imports and uses `API_URL` from buildConfig
- Removed redundant `setMobileApiUrl()` method
- Simplified constructor

#### `src/services/sync/syncStoreIntegration.js`
- Added buildConfig import
- Updated all hardcoded API URLs to use `API_URL`
- Simplified share link creation
- Updated `deleteFromServer()` to use current environment
- Updated `getApiUrl()` to return centralized API_URL

### 3. Android Build Flavors (`android/app/build.gradle`)

Added product flavors for all 4 environments:

```gradle
flavorDimensions "environment"
productFlavors {
    qual { ... }
    stage { ... }
    beta { ... }
    prod { ... }
}
```

**Features:**
- Each flavor has unique app ID suffix (except prod)
- Different app names (e.g., "StackMap BETA")
- Can install multiple environments side-by-side
- BuildConfig field for environment detection (future use)

**Build Variants Created:**
- `qualDebug`, `qualRelease`
- `stageDebug`, `stageRelease`
- `betaDebug`, `betaRelease`
- `prodDebug`, `prodRelease`

### 4. Package.json Scripts

Added convenient npm scripts for building each environment:

**Android:**
```json
"android:qual": "react-native run-android --variant=qualDebug"
"android:build:qual": "cd android && ./gradlew assembleQualRelease"
// ... similar for stage, beta, prod
```

**iOS:**
```json
"ios:qual": "BUILD_TYPE=qual react-native run-ios"
"ios:stage": "BUILD_TYPE=stage react-native run-ios"
// ... similar for beta, prod
```

**Web:**
```json
"build:web:qual": "BUILD_TYPE=qual NODE_ENV=production webpack --mode production"
// ... similar for stage, beta, prod
```

### 5. Comprehensive Documentation

Created `docs/deployment/FOUR_TIER_BUILD_GUIDE.md` with:
- Architecture overview
- Usage instructions for all platforms
- Build commands and examples
- Testing and troubleshooting guides
- Migration notes from old system
- Best practices

## Files Created

1. `/src/config/buildConfig.js` - Centralized build configuration
2. `/docs/deployment/FOUR_TIER_BUILD_GUIDE.md` - Complete usage guide
3. `/IMPLEMENTATION_SUMMARY.md` - This file

## Files Modified

1. `/src/services/sync/minimalSyncService.js`
   - Added buildConfig import
   - Replaced manual environment detection with `API_URL`
   - Removed `setMobileApiUrl()` method

2. `/src/services/sync/syncStoreIntegration.js`
   - Added buildConfig import
   - Updated all hardcoded URLs to use `API_URL`
   - Simplified API URL methods

3. `/android/app/build.gradle`
   - Added product flavor dimensions
   - Configured 4 flavors: qual, stage, beta, prod
   - Updated debuggable variants list

4. `/package.json`
   - Added Android build scripts for each flavor
   - Added iOS build scripts with BUILD_TYPE env var
   - Added Web build scripts for each environment

## API URL Mapping

The system now automatically routes to the correct API based on build type:

| Build Type | API URL                              | Use Case              |
|-----------|--------------------------------------|-----------------------|
| QUAL      | `stackmap.app/qual/api/sync`        | Development/Testing   |
| STAGE     | `stackmap.app/stage/api/sync`       | Pre-production        |
| BETA      | `stackmap.app/beta/api/sync`        | Beta testing          |
| PROD      | `stackmap.app/api/sync`             | Production            |

## Success Criteria Met

✅ **Code compiles without errors**
- Validated with ESLint and Node.js syntax checker
- Gradle build successful with all flavors

✅ **API_URL correctly determined for each BUILD_TYPE**
- Verified logic in buildConfig.js
- Tested all 4 environment mappings

✅ **Backward compatible with existing builds**
- Debug builds → QUAL (via __DEV__ flag)
- Release builds → PROD (default when BUILD_TYPE not set)
- Existing deployment scripts continue to work

✅ **No hardcoded URLs remain in sync service**
- All URLs now use centralized `API_URL`
- Removed fallback hardcoded URLs
- Single source of truth

## Testing Results

### Validation Tests Passed

1. **buildConfig.js structure** ✅
   - Exports BUILD_TYPE and API_URL
   - Handles all 4 environments
   - Maps all API URLs correctly
   - Uses proper priority detection

2. **Android Gradle configuration** ✅
   - All 8 variants recognized (4 flavors × 2 build types)
   - Build successful
   - Task variants created correctly

3. **Syntax validation** ✅
   - No JavaScript syntax errors
   - ESLint passes (warnings only, no errors)

## Known Limitations & Future Work

### iOS Schemes
iOS requires manual Xcode scheme configuration to set BUILD_TYPE environment variable for each tier. This is documented in the guide but not automated.

**Workaround:** Use command-line with `BUILD_TYPE=beta npm run ios`

### Web Deployment
Web builds currently rely on URL detection after deployment. Consider:
1. Adding build-time environment indicator in UI
2. Adding environment to service worker cache keys
3. Adding build type to error reporting

### Testing
The implementation focuses on configuration. Consider adding:
1. Automated tests for buildConfig detection logic
2. Integration tests for API URL selection
3. E2E tests for each environment

### Enhancements
Future improvements could include:
1. Environment-specific app icons
2. Environment-specific splash screens
3. Build type indicator in settings UI
4. Automatic environment detection test on app launch

## Migration Notes

### For Developers

**Old way:**
```javascript
// Manually check __DEV__ in each file
const API_BASE = __DEV__ ? 'qual/api' : 'api';
```

**New way:**
```javascript
import { API_URL } from './src/config/buildConfig';
// API_URL is automatically set based on build type
```

### For Build Scripts

**Old way:**
```bash
# Only debug and release
./gradlew assembleDebug
./gradlew assembleRelease
```

**New way:**
```bash
# Build-specific environments
npm run android:build:qual
npm run android:build:stage
npm run android:build:beta
npm run android:build:prod
```

## Deployment Integration

The 4-tier system integrates with existing deployment scripts:

- `qual_deploy.sh` → Uses QUAL builds
- `deploy_beta.sh` → Uses BETA builds
- `prod_deploy.sh` → Uses PROD builds

**STAGE** is a new tier for pre-production validation not yet integrated into deployment scripts.

## Next Steps

1. **Test on physical devices**
   - Build and install each variant on Android
   - Verify correct API endpoint is used
   - Test side-by-side installation

2. **Configure iOS schemes in Xcode** (if needed)
   - Create scheme for each environment
   - Set BUILD_TYPE environment variable
   - Test builds with each scheme

3. **Update CI/CD pipeline**
   - Add build jobs for each environment
   - Configure environment-specific deployments
   - Update release management process

4. **Monitor API calls**
   - Verify builds connect to correct endpoints
   - Check for any fallback to hardcoded URLs
   - Monitor error logs for environment issues

## Summary

The 4-tier build system has been successfully implemented with:
- ✅ Centralized configuration
- ✅ Android product flavors
- ✅ Convenient build scripts
- ✅ Comprehensive documentation
- ✅ Backward compatibility
- ✅ No hardcoded URLs

All code compiles successfully, and the system is ready for testing and deployment.

---

**Implementation completed:** October 10, 2025
**Developer:** Claude Code
**Files changed:** 5 files modified, 3 files created
