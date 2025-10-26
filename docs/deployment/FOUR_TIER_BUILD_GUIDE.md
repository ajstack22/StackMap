# Four-Tier Build System Guide

## Overview

StackMap supports a 4-tier deployment system with different build types that automatically connect to different API endpoints:

- **QUAL** → `stackmap.app/qual/api`
- **STAGE** → `stackmap.app/stage/api`
- **BETA** → `stackmap.app/beta/api`
- **PROD** → `stackmap.app/api`

### Platform Identifier Strategy

**iOS Bundle IDs:**
- QUAL: `app.stackmap.qual` (local simulator only)
- STAGE/BETA/PROD: `app.stackmap` (single bundle ID, differentiated via TestFlight groups)

**Android Package Names:**
- All environments: `com.stackmapnative` (single package, differentiated via Gradle flavors)

**Rationale:** Using a single identifier for distribution tiers (stage/beta/prod) simplifies app store management and matches platform requirements (TestFlight needs same bundle ID for internal/external testing).

## Architecture

### Build Configuration

The build type is determined by `/src/config/buildConfig.js` which:

1. Checks for `BUILD_TYPE` environment variable (highest priority)
2. Detects web environment from URL (for web builds)
3. Falls back to `__DEV__` flag for React Native (debug = qual, release = prod)

### API URL Mapping

Each build type automatically connects to its corresponding API endpoint:

```javascript
qual  → https://stackmap.app/qual/api/sync
stage → https://stackmap.app/stage/api/sync
beta  → https://stackmap.app/beta/api/sync
prod  → https://stackmap.app/api/sync
```

## Usage

### Android

#### Development (Debug) Builds

```bash
# Default debug (uses qual environment)
npm run android

# Specific environment debug builds
npm run android:qual    # QUAL environment
npm run android:stage   # STAGE environment
npm run android:beta    # BETA environment
npm run android:prod    # PROD environment
```

#### Production (Release) Builds

```bash
# Build release APK/AAB for specific environment
npm run android:build:qual    # Builds qualRelease
npm run android:build:stage   # Builds stageRelease
npm run android:build:beta    # Builds betaRelease
npm run android:build:prod    # Builds prodRelease
```

**Direct Gradle Commands:**

```bash
cd android

# Debug builds
./gradlew assembleQualDebug
./gradlew assembleStageDebug
./gradlew assembleBetaDebug
./gradlew assembleProdDebug

# Release builds
./gradlew assembleQualRelease
./gradlew assembleStageRelease
./gradlew assembleBetaRelease
./gradlew assembleProdRelease

# Bundle for Play Store
./gradlew bundleQualRelease
./gradlew bundleStageRelease
./gradlew bundleBetaRelease
./gradlew bundleProdRelease
```

#### Build Outputs

Each environment uses the same package name but different build configurations:
- **Package Name:** `com.stackmapnative` (all environments)
- Different app names (e.g., "StackMap BETA")
- Differentiated via Gradle build flavors
- Play Store tracks handle distribution

**APK Locations:**
```
android/app/build/outputs/apk/qual/release/app-qual-release.apk
android/app/build/outputs/apk/stage/release/app-stage-release.apk
android/app/build/outputs/apk/beta/release/app-beta-release.apk
android/app/build/outputs/apk/prod/release/app-prod-release.apk
```

### iOS

**Single Bundle ID Strategy:**
iOS uses `.xcconfig` files to manage environment configurations. All stage/beta/prod builds share the same bundle ID (`app.stackmap`):

**Configuration Files:**
- `ios/Qual.xcconfig` - Bundle ID: `app.stackmap.qual`, Display Name: "StackMap QUAL"
- `ios/Stage.xcconfig` - Bundle ID: `app.stackmap`, Display Name: "StackMap STAGE"
- `ios/Beta.xcconfig` - Bundle ID: `app.stackmap`, Display Name: "StackMap"
- `ios/Prod.xcconfig` - Bundle ID: `app.stackmap`, Display Name: "StackMap"

**Key Configuration:**
All xcconfig files specify:
- `PRODUCT_BUNDLE_IDENTIFIER` - Bundle ID
- `PRODUCT_NAME` - Display name
- `BUILD_TYPE_ENV` - Runtime environment variable
- `CODE_SIGN_STYLE` - Automatic (Xcode generates profiles dynamically)
- `DEVELOPMENT_TEAM` - 84W9WSYQQB

**Differentiation:**
- **QUAL:** Unique bundle ID for local simulator testing
- **STAGE/BETA/PROD:** Same bundle ID, differentiated by TestFlight groups and display names

#### Development Builds

```bash
# Default (uses qual environment)
npm run ios

# Specific environment builds
npm run ios:qual    # Sets BUILD_TYPE=qual
npm run ios:stage   # Sets BUILD_TYPE=stage
npm run ios:beta    # Sets BUILD_TYPE=beta
npm run ios:prod    # Sets BUILD_TYPE=prod
```

#### Production Builds

**Automated via Fastlane (Recommended):**

iOS production builds are fully automated using fastlane:

```bash
# STAGE (TestFlight Internal Testing)
cd ios && fastlane stage_ios

# BETA (TestFlight External Testing)
cd ios && fastlane beta_ios

# PROD (App Store)
cd ios && fastlane prod_ios
```

**Key Points:**
- All use bundle ID `app.stackmap` (except qual)
- Automatic code signing with `-allowProvisioningUpdates`
- No manual provisioning profile management
- Xcode generates Distribution profiles on-the-fly
- Differentiated by xcconfig files (Stage.xcconfig, Beta.xcconfig, Prod.xcconfig)

**Manual Xcode Builds (Not Recommended):**

If needed, you can build manually:
1. Open `ios/StackMapNative.xcworkspace` in Xcode
2. Select appropriate configuration (Stage/Beta/Prod)
3. Product → Archive
4. Upload to TestFlight/App Store

**Note:** Fastlane automation is preferred as it handles signing, versioning, and uploads automatically.

### Web

#### Development

```bash
# Local development (always uses qual)
npm run web
```

#### Production Builds

```bash
# Build for specific environment
npm run build:web:qual    # QUAL environment
npm run build:web:stage   # STAGE environment
npm run build:web:beta    # BETA environment
npm run build:web:prod    # PROD environment

# Default production build (uses URL detection)
npm run build:web
```

**Web Deployment:**

After building, deploy the `web/build/` directory to:
- QUAL: `stackmap.app/qual/`
- STAGE: `stackmap.app/stage/`
- BETA: `stackmap.app/beta/`
- PROD: `stackmap.app/`

The build automatically detects its environment from the URL when running.

## Testing Build Types

### Verify Build Type

Add this temporary code to verify the build type:

```javascript
import { BUILD_TYPE, API_URL } from './src/config/buildConfig';

console.log('Build Type:', BUILD_TYPE);
console.log('API URL:', API_URL);
```

### Manual Testing

1. **Android**: Check app name in launcher (e.g., "StackMap BETA")
2. **iOS**: Check logs for `[BuildConfig]` messages in __DEV__ mode
3. **Web**: Check URL - deployment path determines environment
4. **All platforms**: Verify API calls go to correct endpoint in network tab

## Migration from Old System

The old system used:
- `__DEV__` flag: `true` → qual, `false` → prod
- No support for stage/beta environments

The new system:
- Maintains backward compatibility (debug → qual, release → prod)
- Adds stage and beta via build flavors/environment variables
- Centralizes configuration in `/src/config/buildConfig.js`

**Files Updated:**
- `/src/config/buildConfig.js` - NEW: Centralized build configuration
- `/src/services/sync/minimalSyncService.js` - Uses buildConfig
- `/src/services/sync/syncStoreIntegration.js` - Uses buildConfig
- `/android/app/build.gradle` - Added product flavors
- `/package.json` - Added build scripts

## Troubleshooting

### Android: "No variant found"

Make sure you're using the correct variant name:
- `qualDebug`, `qualRelease`
- `stageDebug`, `stageRelease`
- `betaDebug`, `betaRelease`
- `prodDebug`, `prodRelease`

### iOS: BUILD_TYPE not recognized

The BUILD_TYPE environment variable only works when:
1. Set in Xcode scheme arguments, OR
2. Passed via command line: `BUILD_TYPE=beta npm run ios`

### Web: Wrong API endpoint

Web uses URL detection. Make sure:
1. Build is deployed to correct path (e.g., `/beta/` for beta)
2. BUILD_TYPE was set during webpack build
3. Clear browser cache if seeing old endpoint

### API calls still going to old endpoint

1. Verify BUILD_TYPE is set correctly (check console logs)
2. Clear app data/cache
3. Rebuild the app (don't use cached build)
4. Check import path: `import { API_URL } from '../../config/buildConfig'`

## Best Practices

### Development Workflow

1. **Local dev**: Use debug builds (auto-connects to qual)
2. **Internal testing**: Use `qualRelease` builds
3. **Pre-production**: Use `stageRelease` builds
4. **Beta testing**: Use `betaRelease` builds
5. **Production**: Use `prodRelease` builds

### CI/CD Integration

```bash
# Example CI script
BUILD_ENV=$1  # qual, stage, beta, or prod

# Android
cd android
./gradlew bundle${BUILD_ENV^}Release
cd ..

# iOS
BUILD_TYPE=$BUILD_ENV xcodebuild archive ...

# Web
BUILD_TYPE=$BUILD_ENV npm run build:web
```

### Version Management

Consider adding build type to version name:
- `2025.10.10.2-qual`
- `2025.10.10.2-stage`
- `2025.10.10.2-beta`
- `2025.10.10.2` (prod has no suffix)

This is already configured in Android build.gradle via `versionNameSuffix`.

## Future Enhancements

Potential improvements:
1. Add build type indicator in UI (settings screen)
2. Add build type to error reports
3. Add environment-specific app icons
4. Add environment-specific splash screens
5. Add automatic environment detection test on app launch
