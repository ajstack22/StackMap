# StackMap Deployment Guide

## Quick Deploy (All Platforms)

The easiest way to deploy to all platforms:

```bash
./scripts/deploy-all.sh
```

This script will:
1. Auto-increment version numbers
2. Run tests (unless skipped)
3. Build for all platforms
4. Deploy to respective stores/servers
5. Commit version changes

### Skip Tests (Emergency Deploy)
```bash
./scripts/deploy-all.sh --skip-tests
```

## Platform-Specific Deployment

### iOS Deployment

#### TestFlight Release
```bash
./scripts/deploy-ios.sh
```

This will:
1. Build iOS app
2. Archive to Xcode
3. Upload to TestFlight
4. Auto-increment build number

#### App Store Release
1. Complete TestFlight testing
2. In App Store Connect:
   - Go to "My Apps" → StackMap
   - Click "+" next to iOS App
   - Select tested build
   - Fill in release notes
   - Submit for review

### Android Deployment

#### Google Play Release
```bash
./scripts/react-native/build-android-release.sh
```

This will:
1. Clean previous builds
2. Build release APK
3. Build release Bundle (AAB)
4. Sign with release key

#### Upload to Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Select StackMap app
3. Go to "Production" → "Create new release"
4. Upload the AAB file from `android/app/build/outputs/bundle/release/`
5. Fill in release notes
6. Submit for review

### Web Deployment

#### Production Deploy
```bash
./scripts/deploy-web.sh
```

This will:
1. Build optimized production bundle
2. Upload to stackmap.app
3. Clear CDN cache
4. Verify deployment

#### Qual Environment Deploy
```bash
NODE_ENV=production PUBLIC_URL=/qual npm run build:web
./scripts/deploy-web.sh --qual
```

## Version Management

### Version Files
- `package.json` - Main version
- `ios/App/Info.plist` - iOS version
- `android/app/build.gradle` - Android version

### Auto-increment on Deploy
The deploy scripts automatically increment versions:
- Patch version for regular releases (1.0.0 → 1.0.1)
- Minor version for features (1.0.0 → 1.1.0)
- Major version for breaking changes (1.0.0 → 2.0.0)

### Manual Version Update
```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

## Build Configuration

### Environment Variables
```bash
# Production
NODE_ENV=production

# API endpoints
REACT_APP_API_URL=https://stackmap.app/api
REACT_APP_SYNC_URL=https://stackmap.app/api/sync
```

### Build Commands

#### iOS
```bash
# Debug build
xcodebuild -workspace ios/App.xcworkspace -scheme App -configuration Debug

# Release build
xcodebuild -workspace ios/App.xcworkspace -scheme App -configuration Release
```

#### Android
```bash
# Debug APK
cd android && ./gradlew assembleDebug

# Release APK
cd android && ./gradlew assembleRelease

# Release Bundle (for Play Store)
cd android && ./gradlew bundleRelease
```

#### Web
```bash
# Development build
npm run build:web

# Production build
NODE_ENV=production npm run build:web
```

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Version numbers updated
- [ ] CHANGELOG.md updated
- [ ] No console.log statements
- [ ] Build tested locally

### iOS Checklist
- [ ] Provisioning profiles valid
- [ ] Certificates not expired
- [ ] TestFlight tested
- [ ] Screenshots updated
- [ ] Release notes written

### Android Checklist
- [ ] Keystore secure
- [ ] ProGuard rules updated
- [ ] Target API level current
- [ ] Release notes written
- [ ] APK size optimized

### Web Checklist
- [ ] Bundle size checked
- [ ] Service worker updated
- [ ] CDN cache cleared
- [ ] SSL certificates valid
- [ ] CORS headers configured

## CI/CD with GitHub Actions

### Automatic Builds
On push to `main`:
1. Run tests
2. Build all platforms
3. Upload artifacts
4. Deploy to qual environment

### Manual Release
1. Create release tag
2. GitHub Action triggers
3. Builds production versions
4. Creates release artifacts

## Troubleshooting

### iOS Build Failures
```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Reset pods
cd ios
pod deintegrate
pod install
```

### Android Build Failures
```bash
# Clean build
cd android
./gradlew clean
./gradlew --stop

# Clear gradle cache
rm -rf ~/.gradle/caches/
```

### Web Build Issues
```bash
# Clear cache
rm -rf node_modules/.cache
rm -rf web/build

# Rebuild
npm run build:web
```

## Security Considerations

### Secrets Management
- Never commit API keys
- Use environment variables
- Store keys in CI/CD secrets
- Rotate keys regularly

### Code Signing
- iOS: Managed by Xcode/App Store Connect
- Android: Keystore in secure location
- Web: HTTPS only deployment

## Monitoring

### Error Tracking
- Check device logs
- Monitor crash reports
- Review user feedback

### Performance
- Bundle size metrics
- Load time monitoring
- Memory usage tracking

## Rollback Procedures

### iOS
1. Cannot directly rollback
2. Submit new build with fix
3. Expedite review if critical

### Android
1. In Play Console, go to releases
2. Select previous version
3. Promote to production

### Web
```bash
./scripts/rollback-web.sh
```

## Support

For deployment issues:
1. Check deployment logs
2. Verify credentials
3. Review error messages
4. Contact platform support if needed