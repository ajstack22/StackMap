# Pending Changes

## Title: User-Centered Onboarding & Sync API Fixes

### Changes Made:

#### 1. New User-Centered Onboarding Experience
- **Created**: `src/components/Onboarding/OnboardingUserCentered.js` - Complete replacement onboarding wizard focused on user journey
- **Modified**: `App.js` - Set new onboarding as default, fixed undefined variable errors
- **Features**:
  - Journey-based flow (new user vs existing user)
  - Conversational UI with step-by-step guidance
  - Native sync code generation without web redirects
  - StackMap branding with logo, tagline, and footer links
  - Support for both sync and backup restore options
  - PIN protection setup
  - Multi-device sync configuration

#### 2. Sync Service Improvements
- **Modified**: `src/services/sync/syncService.js`
  - Fixed API URL to dynamically compute based on environment (localhost, qual, prod)
  - Now correctly uses `/qual/api/sync/` when on qual environment
  - Changed from static `API_BASE_URL` constant to dynamic `getApiBaseUrl()` function calls

#### 3. Onboarding Sync Fix
- **Modified**: `src/components/Onboarding/OnboardingUserCentered.js`
  - Users are now created in the store BEFORE sync setup
  - First user is set as active/current user
  - Prevents validation errors when creating sync during onboarding
  - Proper data structure initialization with user days and activities

#### 4. API Error Fixes
- **Modified**: `api/sync/create.php`
  - Fixed undefined `sendError()` function call
  - Replaced with proper HTTP response code and JSON error
- **Modified**: `api/sync/push.php`
  - Fixed undefined `sendError()` function call
  - Replaced with proper HTTP response code and JSON error

#### 5. Console Logging Improvements
- **Modified**: `src/utils/AsyncStorage.web.js`
  - Added `VERBOSE_LOGGING` flag to control debug output
  - Reduced console noise during normal operation
- **Modified**: `App.js`
  - Conditional logging for URL params
  - Reduced startup logging verbosity

### Bug Fixes:
- Fixed JavaScript error "sync is not defined" - changed to proper variable name `syncPhrase`
- Fixed JavaScript error with undefined `showPrivacy` and `showSupport` variables
- Fixed text input losing focus after one character in onboarding
- Fixed React hooks error by properly structuring render functions
- Fixed API 500 errors caused by undefined function calls

### Known Issues:
- Text node warnings in React Native Web (cosmetic, non-blocking)
- TypeScript errors in existing codebase (pre-existing, not related to these changes)

### Testing Notes:
- Onboarding flow tested on web (localhost:5503)
- Sync API tested on qual environment
- API endpoints verified working after fixes

### Deployment Notes:
- API fixes are in codebase and will deploy with next `deploy-all.sh`
- No database schema changes required
- Backward compatible with existing sync data