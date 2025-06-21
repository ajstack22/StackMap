# StackMap Unified Deployment Guide

## Overview

This guide ensures all platforms (Web/PWA, Android, iOS) are deployed from the same source code, preventing version fragmentation.

## Quick Start

```bash
# Run the unified deployment script
./scripts/unified-deploy.sh
```

## Deployment Options

### 1. Staging Only (Web)
- Deploys current code to https://stackmap.app/qual/
- No mobile builds
- Use for testing before production

### 2. Production Only (Web)
- Deploys from staging to https://stackmap.app/
- Requires confirmation
- No mobile builds

### 3. Demo Only (Web)
- Deploys to https://stackmap.app/demo/
- Preserves demo-specific content (Mushroom Kingdom theme)
- Backs up current demo before updating

### 4. Mobile Only (Android & iOS)
- Builds debug APK for Android
- Builds iOS app (macOS only)
- Copies from root → www → native platforms

### 5. Everything (Full Pipeline)
- Increments build number
- Deploys to staging
- Confirms and deploys to production
- Builds mobile apps
- Updates version tracking

## Architecture

```
┌─────────────────┐
│   Root Files    │  ← Source of Truth
│  (index.html,   │
│   *.js, etc)    │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
   ┌─────────────┐   ┌─────────────┐
   │  Web/PWA    │   │build-capacitor│
   │  (Direct)   │   │  script       │
   └─────────────┘   └──────┬──────┘
                            │
                            ▼
                      ┌─────────────┐
                      │  www/       │
                      │  (Copy)     │
                      └──────┬──────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
              ┌──────────┐      ┌──────────┐
              │ Android  │      │   iOS    │
              │  (.apk)  │      │  (.app)  │
              └──────────┘      └──────────┘
```

## Version Tracking

The `version.json` file tracks:
- Current version number
- Build number (auto-incremented)
- Last deployment timestamp for each platform
- Changelog for each version

Example:
```json
{
  "version": "1.4.0",
  "build": 42,
  "lastDeployment": {
    "web": "2025-01-20T15:30:00Z",
    "android": "2025-01-20T15:35:00Z",
    "ios": "2025-01-20T15:40:00Z"
  }
}
```

## Development Workflow

### 1. Make Changes
Always edit files in the root directory:
- `index.html`
- `styles/*.css`
- `js/*.js`
- `components.js`
- etc.

**NEVER** edit files in:
- `www/` - This is auto-generated
- `android/app/src/main/assets/` - This is copied from www
- `ios/App/App/public/` - This is copied from www

### 2. Test Locally
```bash
# Web testing
python -m http.server 5500

# Mobile testing (with live reload)
npx cap run android --livereload --external
npx cap run ios --livereload --external
```

### 3. Deploy
```bash
# Use the unified script
./scripts/unified-deploy.sh

# Or individual commands:
./scripts/deploy-to-qual.sh        # Staging only
./scripts/deploy-qual-to-prod.sh   # Production only
./scripts/build-capacitor.sh       # Prepare mobile
```

## Important Rules

### DO:
- ✅ Always edit files in the root directory
- ✅ Use `unified-deploy.sh` for deployments
- ✅ Test on staging before production
- ✅ Check version.json for deployment history
- ✅ Commit all changes before deploying

### DON'T:
- ❌ Edit files in www/ directory
- ❌ Deploy different versions to different platforms
- ❌ Skip staging deployment
- ❌ Edit files directly in Android/iOS projects
- ❌ Deploy without incrementing build number

## Mobile-Specific Notes

### Android
- Debug APK is built automatically
- Signed release APK requires keystore
- Output: `android/stackmap-debug.apk`

### iOS
- Requires macOS with Xcode
- Requires provisioning profiles for release
- TestFlight deployment needs manual upload

## Troubleshooting

### "Files out of sync"
1. Run `./scripts/build-capacitor.sh`
2. Run `npx cap sync`
3. Rebuild mobile apps

### "Version mismatch"
1. Check `version.json`
2. Ensure all platforms deployed from same build
3. Use unified deployment script

### "Changes not appearing"
1. Clear browser cache (PWA)
2. Uninstall/reinstall app (mobile)
3. Check deployment timestamps in version.json

## Emergency Rollback

If something goes wrong:

```bash
# Web rollback
ssh stackmap-cpanel "cd ~/public_html && tar -xzf backups/production-TIMESTAMP.tar.gz"

# Mobile rollback
# Revert to previous commit and rebuild
git checkout HEAD~1
./scripts/unified-deploy.sh
```

## Future Improvements

1. **CI/CD Integration**: GitHub Actions for automated builds
2. **Release Channels**: Separate beta/stable tracks
3. **OTA Updates**: CodePush for React Native (if migrated)
4. **Version API**: Endpoint to check latest version

## Summary

The unified deployment system ensures:
- Single source of truth (root files)
- Consistent versioning across platforms
- Tracked deployment history
- Prevented version fragmentation
- Simplified deployment process

Always use `./scripts/unified-deploy.sh` for deployments!