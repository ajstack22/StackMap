# Stage Deployment Setup Guide

## Overview

The stage deployment tier is designed for internal validation using release builds before external beta testing. Stage uses the qual database for safe testing but with production-like build configurations.

**Key Characteristics:**
- Mobile-only tier (no web deployment)
- Uses qual database (safe test data)
- Release builds distributed via TestFlight Internal Testing (iOS) and Play Internal Testing (Android)
- Single bundle ID strategy on iOS (`app.stackmap`)
- Internal team testing only

## How It Works

### 1. Fastlane Sets BUILD_TYPE

The fastlane lanes set the environment variable before building:

**iOS** (`ios/fastlane/Fastfile:401-508`):
```ruby
ENV["BUILD_TYPE"] = "stage"
```

**Android** (`android/fastlane/Fastfile:338-406`):
```ruby
ENV["BUILD_TYPE"] = "stage"
```

### 2. Babel Inlines the Variable

The `babel.config.js` configuration uses `transform-inline-environment-variables` to replace `process.env.BUILD_TYPE` with the actual value during bundling:

```javascript
plugins: [
  ['transform-inline-environment-variables', {
    include: ['BUILD_TYPE', 'NODE_ENV']
  }],
  // ...
]
```

This means that during the React Native bundle process:
```javascript
// Before bundling (source code):
const buildType = process.env.BUILD_TYPE;

// After bundling (what runs on device):
const buildType = "stage";
```

### 3. BuildConfig Determines API URL

The `src/config/buildConfig.js` file reads the inlined value and maps it to the correct API endpoint:

```javascript
function getBuildType() {
  if (process.env.BUILD_TYPE) {
    return process.env.BUILD_TYPE.toLowerCase(); // Returns "stage"
  }
  // ... fallback logic
}

function getApiUrl(buildType) {
  const apiUrls = {
    qual: 'https://stackmap.app/qual/api/sync',
    stage: 'https://stackmap.app/stage/api/sync',
    beta: 'https://stackmap.app/beta/api/sync',
    prod: 'https://stackmap.app/api/sync'
  };
  return apiUrls[buildType] || apiUrls.prod;
}
```

### 4. Sync Service Uses the Configuration

The sync service imports the API_URL:

```javascript
import { API_URL } from '../../config/buildConfig';

class MinimalSyncService {
  constructor() {
    this.API_BASE = API_URL; // Points to stage endpoint
  }
}
```

## Build Type Mapping

| Build Type | API Endpoint | Use Case |
|------------|--------------|----------|
| `qual` | `https://stackmap.app/qual/api/sync` | Local testing, multiple deploys/day |
| `stage` | `https://stackmap.app/stage/api/sync` | Pre-production validation |
| `beta` | `https://stackmap.app/beta/api/sync` | TestFlight/Play Internal Testing |
| `prod` | `https://stackmap.app/api/sync` | Production release |

## iOS Configuration

### Single Bundle ID Strategy

**Bundle ID:** `app.stackmap` (shared with beta and prod)

**Why one bundle ID?**
- TestFlight requires the same bundle ID for Internal and External testing groups
- No need for separate App Store Connect listings
- Simpler provisioning profile management
- Matches original working approach

**Differentiation:**
- **Display Name:** "StackMap STAGE" (visible on device home screen)
- **BUILD_TYPE_ENV:** `stage` (runtime environment variable)
- **TestFlight Group:** Internal Testing (up to 100 testers, no review required)
- **Automatic Signing:** Xcode generates Distribution profiles on-the-fly

**QUAL Exception:** Only QUAL uses a different bundle ID (`app.stackmap.qual`) for local simulator testing.

### Android Configuration

**Package Name:** `com.stackmapnative` (shared with all environments)

Android uses build variants to differentiate environments, similar to iOS but via Gradle flavors.

## Usage

### iOS Stage Deployment
```bash
cd ios && fastlane stage_ios
# Builds with Stage.xcconfig (bundle ID: app.stackmap)
# Uploads to TestFlight Internal Testing
```

### Android Stage Deployment
```bash
cd android && fastlane stage_android
# Builds stageRelease variant
# Uploads to Play Internal Testing
```

## Verification

To verify the correct endpoint is being used:

1. Build with the stage lane
2. Run the app
3. Check the console logs (in development builds):
   ```
   [BuildConfig] Build Type: stage
   [BuildConfig] API URL: https://stackmap.app/stage/api/sync
   ```

## Next Steps

Before the stage lanes will actually use the stage API endpoint, you need to:

1. **Set up the stage API endpoint** on your server
   - Create `/stage/api/sync/` directory structure
   - Copy sync API files (create_timestamp.php, push_timestamp.php, pull_timestamp.php, etc.)
   - Configure database connection for stage environment

2. **Test the stage deployment**
   ```bash
   # iOS
   cd ios && fastlane stage_ios

   # Android
   cd android && fastlane stage_android
   ```

3. **Verify in the app** that it connects to the stage endpoint

## Troubleshooting

### Environment Variable Not Set

If the app doesn't use the stage endpoint:

1. **Clear Metro cache**:
   ```bash
   npx react-native start --reset-cache
   ```

2. **Rebuild the app** - environment variables are inlined at build time, not runtime

3. **Check fastlane output** - verify the lane sets `BUILD_TYPE=stage` before bundling

### Wrong API Endpoint

If the app uses the wrong endpoint:

1. **Check build logs** for `[BuildConfig]` messages
2. **Verify babel config** includes the transform plugin
3. **Ensure fastlane sets BUILD_TYPE** before running the build command

## Technical Details

### Why Inline Variables?

React Native doesn't have access to environment variables at runtime on mobile devices. By inlining them at build time:

- Variables become part of the JavaScript bundle
- No runtime environment variable access needed
- Each build type gets its own hardcoded configuration
- Secure - can't be changed after deployment

### Order of Operations

1. Fastlane sets `BUILD_TYPE=stage` environment variable
2. Fastlane calls React Native bundler
3. Babel reads `BUILD_TYPE` from environment
4. Babel replaces all `process.env.BUILD_TYPE` with `"stage"`
5. Bundled JavaScript contains hardcoded `"stage"` value
6. buildConfig.js returns `https://stackmap.app/stage/api/sync`
7. App connects to stage endpoint

## Related Files

- `babel.config.js` - Inlines environment variables
- `src/config/buildConfig.js` - Maps BUILD_TYPE to API URL
- `src/services/sync/minimalSyncService.js` - Uses API_URL
- `ios/fastlane/Fastfile` - iOS stage_ios lane (lines 401-508)
- `android/fastlane/Fastfile` - Android stage_android lane (lines 338-406)
