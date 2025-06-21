# StackMap Version Synchronization Protocol

## Purpose

This document defines how versions are kept synchronized across all StackMap platforms to prevent fragmentation.

## Version Strategy

### 1. Single Version Number
- All platforms share the same version number (e.g., 1.4.0)
- Build numbers differentiate deployments (e.g., 1.4.0-build42)
- Version tracked in `version.json` at root

### 2. Platform Identifiers
Each platform deployment includes:
- Version: `1.4.0`
- Build: `42`
- Platform: `web` | `android` | `ios`
- Environment: `staging` | `production`

### 3. Version Locations

#### Web/PWA
- Displayed in: Settings menu footer
- Stored in: `config/constants.js` (auto-updated by deploy script)
- Manifest: `manifest.json` (version field)

#### Android
- Displayed in: Settings → About
- Stored in: `android/app/build.gradle` (versionName & versionCode)
- Package: `com.stackmap.app` or `com.stackmap.app.debug`

#### iOS
- Displayed in: Settings → About
- Stored in: `ios/App/App/Info.plist` (CFBundleShortVersionString & CFBundleVersion)
- Bundle ID: `com.stackmap.app`

## Synchronization Process

### 1. Pre-Deployment Version Check
```javascript
// version-sync.js
function checkVersionSync() {
    const rootVersion = require('./version.json');
    const webVersion = extractWebVersion();
    const androidVersion = extractAndroidVersion();
    const iosVersion = extractIosVersion();
    
    if (!allVersionsMatch(rootVersion, webVersion, androidVersion, iosVersion)) {
        throw new Error('Version mismatch detected!');
    }
}
```

### 2. Automatic Version Updates
The unified deployment script automatically:
1. Reads current version from `version.json`
2. Increments build number
3. Updates all platform-specific files
4. Commits version changes
5. Tags the release

### 3. Version Update Locations

#### Update Web Version
```javascript
// In config/constants.js
CONFIG.APP_VERSION = '1.4.0';
CONFIG.APP_BUILD = '42';
CONFIG.APP_BUILD_DATE = '2025-01-20';
```

#### Update Android Version
```gradle
// In android/app/build.gradle
versionCode 142  // 1.4.0 = 140, build 2 = 142
versionName "1.4.0"
```

#### Update iOS Version
```xml
<!-- In ios/App/App/Info.plist -->
<key>CFBundleShortVersionString</key>
<string>1.4.0</string>
<key>CFBundleVersion</key>
<string>42</string>
```

## Version Display

### User-Facing Version String
Format: `v{version} (build {build})`
Example: `v1.4.0 (build 42)`

### Developer Version String
Format: `{version}-{platform}-{environment}-build{build}`
Example: `1.4.0-android-debug-build42`

### Version API Endpoint
Future enhancement to check versions:
```
GET https://stackmap.app/api/version
{
    "current": {
        "version": "1.4.0",
        "build": 42,
        "platforms": {
            "web": "2025-01-20T15:30:00Z",
            "android": "2025-01-20T15:35:00Z",
            "ios": "2025-01-20T15:40:00Z"
        }
    }
}
```

## Version Verification

### Manual Check
1. Open each platform
2. Navigate to Settings/About
3. Verify version matches `version.json`

### Automated Check
```bash
# Run version verification
./scripts/verify-versions.sh

# Output:
# ✓ Web: 1.4.0-build42
# ✓ Android: 1.4.0-build42
# ✓ iOS: 1.4.0-build42
# All versions synchronized!
```

## Troubleshooting Version Mismatches

### Symptom: Different versions on different platforms
**Cause**: Manual deployment without unified script
**Fix**: 
1. Run `./scripts/unified-deploy.sh`
2. Select option 4 (Everything)
3. Let script update all platforms

### Symptom: Build number confusion
**Cause**: Multiple developers deploying
**Fix**:
1. Always pull latest before deploying
2. Check `version.json` for current build
3. Use unified script to auto-increment

### Symptom: Old version showing after update
**Cause**: Caching issues
**Fix**:
1. Web: Clear service worker cache
2. Android: Clear app data
3. iOS: Delete and reinstall app

## Best Practices

1. **Always use unified deployment script**
   - Never deploy platforms individually
   - Script ensures version sync

2. **Version bumping rules**
   - Patch: Bug fixes (1.4.0 → 1.4.1)
   - Minor: New features (1.4.0 → 1.5.0)
   - Major: Breaking changes (1.4.0 → 2.0.0)

3. **Build number increments**
   - Automatic on each deployment
   - Never manually edit build numbers
   - Continuous across all platforms

4. **Commit version changes**
   - Version updates are committed automatically
   - Tag releases: `git tag v1.4.0-build42`
   - Push tags: `git push --tags`

## Implementation Checklist

- [x] Create `version.json` master file
- [x] Update `unified-deploy.sh` to sync versions
- [x] Add version display to all platforms
- [ ] Create `verify-versions.sh` script
- [ ] Add version API endpoint
- [ ] Implement automated version checking
- [ ] Add version to crash reports
- [ ] Create version history page

## Summary

Version synchronization ensures:
- Users always know which version they're running
- Support can identify version-specific issues
- Developers can track deployment history
- No platform has outdated code

The `version.json` file is the single source of truth, and the unified deployment script is the only way to deploy.