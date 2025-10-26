# Stage Deployment Guide

**Status:** Active
**Version:** 1.0
**Last Updated:** January 11, 2025
**Part of:** Four-Tier Deployment Strategy

---

## Overview

The Stage deployment tier is an internal validation layer that sits between Qual (development) and Beta (external testing). Stage provides a safe environment for internal team testing with production-like mobile builds before releasing to external beta testers.

### Four-Tier Strategy

```
QUAL   → Local testing (multiple times/day)
  ↓
STAGE  → Internal validation (before beta)
  ↓
BETA   → External testing (1-2 times/week)
  ↓
PROD   → Public release (weekly/bi-weekly)
```

### Key Characteristics

- **Purpose:** Internal team validation only (just the developer)
- **Database:** Uses qual database (safe for testing)
- **Mobile-Only:** No web deployment (mobile apps only)
- **Validation:** Less strict (warnings only, non-blocking)
- **Environment:** Uses stage/api endpoint pointing to qual database
- **Ideal For:** Quick internal testing before opening to beta testers

---

## Quick Start

### Prerequisites

1. **Qual Version Tested**
   - Stage uses the current version from qual
   - Run qual deployment and test locally first
   - Uncommitted changes are allowed (stage is internal only)

2. **Fastlane Credentials Configured**
   - iOS: App Store Connect API Key
   - Android: Google Play Service Account JSON
   - Same credentials as beta/prod deployments

### Basic Stage Deployment

```bash
# Deploy to all stage platforms (recommended)
./scripts/deploy_stage.sh --all

# Deploy to specific platforms
./scripts/deploy_stage.sh --ios          # iOS TestFlight only
./scripts/deploy_stage.sh --android      # Android Play Store only
```

**Note:** Stage is mobile-only. There is no `--web` option since stage uses the qual web environment.

---

## What Stage Deployment Does

### 1. Pre-Deployment Checks (Warnings Only) ⚠️

- **Git Status:** Checks for uncommitted changes (warns but doesn't block)
- **Version Check:** Retrieves current version from package.json
- **Stage Suffix:** Adds `-stage` suffix (e.g., `2025.10.10.1-stage`)
- **Confirmation:** Prompts for deployment approval

**Key Difference from Beta:** Stage allows uncommitted changes since it's for internal testing only.

### 2. Test Suite Execution (Non-Blocking) 🧪

Stage deployments run tests but only issue warnings:

- **Tier 0 (Smoke):** Quick sanity check (warns if fails)
- **Tier 1 (Critical):** Encryption, auth, data integrity (warns if fails)

**Important:** Test failures generate warnings but do NOT block deployment. This allows rapid iteration during internal testing.

### 3. Platform Deployments 📱

#### iOS Stage (TestFlight Internal Testing)
- Builds release IPA using `fastlane stage_ios`
- Uploads to TestFlight Internal Testing group
- Uses stage/api endpoint (qual database)
- Processing time: 5-15 minutes after upload
- Internal testing only (not external beta group)

#### Android Stage (Play Store Internal Testing)
- Builds release AAB using `fastlane stage_android`
- Uploads to Google Play Internal Testing track
- Uses stage/api endpoint (qual database)
- Creates draft release (requires manual publish)
- Internal testing only (up to 100 testers)

#### Web (No Stage Deployment)
- Stage does NOT deploy web
- Use qual web environment for testing: `https://stackmap.app/qual`
- Mobile apps connect to qual database via stage/api endpoint

### 4. Post-Deployment Report 📊

- Deployment summary with timings
- Platform-specific installation instructions
- Test warnings (if any)
- Next steps for beta promotion

---

## Version Management

### Version Format

```
Qual Version:   2025.10.10.2
Stage Version:  2025.10.10.2-stage
Beta Version:   2025.10.10.2-beta
Prod Version:   2025.10.10.2  (no suffix)
```

### Version Flow

1. **Qual Deployment:** Auto-increments version (e.g., `2025.10.10.2`)
2. **Stage Deployment:** Adds `-stage` suffix (e.g., `2025.10.10.2-stage`)
3. **Beta Deployment:** Changes suffix to `-beta` (e.g., `2025.10.10.2-beta`)
4. **Prod Deployment:** Removes suffix, promotes version

### Key Points

- Stage does NOT increment version (inherits from qual)
- Stage suffix is added automatically
- Multiple stage deployments can use same version
- Stage → Beta transition changes suffix (not version number)

---

## Detailed Deployment Steps

### Step 1: Prepare for Stage

```bash
# 1. Deploy to qual and test locally
./scripts/qual_deploy.sh --all

# 2. Test on simulators/emulators
# iOS: Install on simulator
# Android: Install on emulator
# Web: Test at stackmap.app/qual

# 3. Check current version (optional)
grep '"version":' package.json
```

**Note:** Unlike beta, you don't need to commit changes. Stage allows uncommitted changes for rapid iteration.

### Step 2: Run Stage Deployment

```bash
# Full stage deployment (mobile only)
./scripts/deploy_stage.sh --all
```

**What Happens:**
1. Script checks for uncommitted changes (warns but doesn't block)
2. Retrieves current version from package.json
3. Adds `-stage` suffix to version
4. Prompts for confirmation
5. Runs test suite (smoke + critical tests, warnings only)
6. Builds and uploads iOS to TestFlight Internal Testing
7. Builds and uploads Android to Play Store Internal Testing
8. Generates deployment report with next steps

### Step 3: Verify Stage Builds

#### iOS (TestFlight Internal Testing)

1. Wait 5-15 minutes for Apple processing
2. Check App Store Connect:
   ```
   https://appstoreconnect.apple.com/apps
   ```
3. Verify build appears in TestFlight → Internal Testing
4. Build should show version with `-stage` suffix
5. Install via TestFlight app on your device
6. Verify app shows "Stage" environment indicator

**Testing Checklist:**
- App launches successfully
- Uses stage/api endpoint (check network logs)
- Connected to qual database
- All critical features work
- Sync operates correctly

#### Android (Play Console Internal Testing)

1. Check Google Play Console:
   ```
   https://play.google.com/console/
   ```
2. Navigate to: Release → Testing → Internal testing
3. Verify draft release appears with `-stage` version
4. Publish draft to internal testers (manual step required)
5. Install via Play Store (you must join internal testing program)
6. Verify app shows "Stage" environment indicator

**Publishing Draft:**
1. Go to Play Console
2. Click on Internal testing track
3. Find the stage draft release
4. Click "Review and publish"
5. Wait 5-10 minutes for processing

**Testing Checklist:**
- App launches successfully
- Uses stage/api endpoint (check logs)
- Connected to qual database
- All critical features work
- Sync operates correctly

#### Web Testing

**No Stage Web Deployment:**
- Stage does not deploy web
- Use qual web environment for testing:
  ```
  https://stackmap.app/qual
  ```
- Mobile apps (stage) connect to same qual database
- Test cross-platform sync between mobile stage and qual web

### Step 4: Internal Testing

1. **Install on Your Device**
   - iOS: TestFlight app (internal testing group)
   - Android: Play Store (internal testing track)
   - Web: stackmap.app/qual

2. **Test Critical Flows**
   - User authentication
   - Data sync with qual database
   - All core features
   - Cross-platform data consistency

3. **Verify Environment**
   - Check app uses stage/api endpoint
   - Confirm qual database connection
   - Test sync between mobile stage and qual web

4. **Track Issues**
   - Note any bugs found
   - Document any warnings from test suite
   - Identify issues to fix before beta

### Step 5: Fix or Promote

**Option A: Fix Issues and Re-Deploy Stage**

If issues found during stage testing:
```bash
# 1. Fix issues in codebase (no commit required)
# 2. Optional: Re-deploy to qual
./scripts/qual_deploy.sh --all

# 3. Re-deploy to stage with fixes
./scripts/deploy_stage.sh --all
```

**Option B: Promote to Beta**

When stage testing passes and you're ready for external testers:
```bash
# 1. Commit all changes (beta requires clean git)
git add -A
git commit -m "Ready for beta: [description]"

# 2. Update PENDING_CHANGES.md with release notes

# 3. Deploy to beta
./scripts/deploy_beta.sh --all
```

---

## Database & API Configuration

### Stage Environment

**API Endpoint:**
```
stage/api → qual-api.stackmap.app
```

**Database:**
- Uses qual database (same as qual environment)
- Shared with qual web and qual mobile
- Safe for testing without affecting production data

**Configuration:**
- Mobile apps built with stage environment flag
- API calls automatically routed to stage/api
- Sync operations use qual database

### Data Safety

**Why Qual Database?**
- Stage is for internal testing only
- Safe to test with non-production data
- No risk of corrupting production database
- Easy to reset if needed

**Data Consistency:**
- Stage mobile apps sync with qual database
- Qual web uses same qual database
- Test cross-platform sync safely
- Data isolated from production

---

## Fastlane Lanes

### iOS Stage Lane

**Command:**
```bash
cd ios
fastlane stage_ios changelog:"Stage release 2025.10.10.1-stage" skip_increment:true
```

**What It Does:**
1. Validates environment and credentials
2. Backs up Info.plist
3. Configures stage environment variables
4. Builds release IPA
5. Uploads to TestFlight Internal Testing
6. Restores Info.plist
7. Logs deployment details

**Lane Location:** `ios/fastlane/Fastfile` (line ~631)

### Android Stage Lane

**Command:**
```bash
cd android
fastlane stage_android
```

**What It Does:**
1. Validates signing credentials
2. Configures stage environment variables
3. Cleans build directory
4. Builds release AAB
5. Uploads to Play Store Internal Testing
6. Creates draft release
7. Logs deployment details

**Lane Location:** `android/fastlane/Fastfile` (line ~380)

---

## Comparison with Other Tiers

| Feature | QUAL | STAGE | BETA | PROD |
|---------|------|-------|------|------|
| **Purpose** | Local dev testing | Internal validation | External testing | Public release |
| **API Endpoint** | qual-api | qual-api (stage path) | beta-api | api |
| **Database** | Qual DB | Qual DB | Prod DB | Prod DB |
| **Platforms** | Web + Mobile | Mobile only | Web + Mobile | Web + Mobile |
| **Web Deploy** | Yes (qual) | No (use qual) | Yes (beta) | Yes (prod) |
| **iOS** | Simulator | TestFlight Internal | TestFlight Internal | App Store |
| **Android** | Emulator | Play Internal | Play Internal | Play Production |
| **Git Clean** | Optional | Optional | Required | Required |
| **Test Blocking** | No | No (warnings) | Yes (critical) | Yes (all) |
| **Version Suffix** | None | `-stage` | `-beta` | None |
| **Frequency** | Multiple/day | Before beta | 1-2/week | Weekly/bi-weekly |
| **Testers** | Developer | Developer | Internal team | Public users |

### When to Use Each Tier

**QUAL:**
- Rapid development iteration
- Testing new features locally
- Multiple times per day
- No need for mobile store deployment

**STAGE:**
- Validate build before beta
- Test mobile apps with store deployment
- Internal testing only (just you)
- Quick iteration without strict validation

**BETA:**
- Open to internal team testers
- External testing before production
- Requires clean git and passing tests
- 1-2 times per week

**PROD:**
- Public release to all users
- Requires beta validation
- Full test suite must pass
- Weekly or bi-weekly cadence

---

## Common Issues & Troubleshooting

### Issue: Uncommitted Changes Warning

**Warning:**
```
⚠️  Uncommitted changes detected
Stage deployment allows uncommitted changes (internal testing only)
Consider committing before deploying to beta/prod.
```

**This is Normal:**
- Stage allows uncommitted changes
- Warning is informational only
- Deployment will continue
- Commit changes before promoting to beta

### Issue: Test Warnings

**Warning:**
```
⚠️  Test Warnings (not blocking):
  ⚠️  Tier 0 (Smoke): FAILED
  ⚠️  Tier 1 (Critical): FAILED
```

**What This Means:**
- Tests failed but deployment continues
- Fix these issues before deploying to beta
- Beta deployment will block if tests fail
- Stage is for rapid iteration and testing

**Solution:**
```bash
# Run tests locally to identify failures
npm run test:smoke
npm run test:critical

# Fix failing tests
# Re-deploy to stage
./scripts/deploy_stage.sh --all
```

### Issue: iOS Upload Fails

**Error:**
```
❌ iOS stage deployment failed
```

**Common Causes:**
1. API Key credentials not configured
2. Network connectivity issues
3. Build number conflict
4. Certificate/provisioning profile issues

**Solutions:**
```bash
# Check API key is configured
ls ~/.fastlane/AuthKey_*.p8

# Check environment variables
env | grep APP_STORE_CONNECT

# Review fastlane logs
ls -lt /tmp/stackmap-logs/fastlane-stage-ios-*.log | head -1

# View last log
tail -50 /tmp/stackmap-logs/fastlane-stage-ios-*.log | tail -1

# Retry with manual fastlane
cd ios
fastlane stage_ios changelog:"Manual retry" skip_increment:true
```

### Issue: Android Upload Fails

**Error:**
```
❌ Android stage deployment failed
```

**Common Causes:**
1. Service account credentials not configured
2. Version code conflict
3. Build signing issues
4. Gradle build timeout

**Solutions:**
```bash
# Check service account JSON path
security find-generic-password -s 'stackmap-play-store-json-path' -w

# Verify signing credentials
cd android
./gradlew signingReport

# Clean and rebuild
./gradlew clean
./gradlew assembleRelease

# Review fastlane logs
ls -lt /tmp/stackmap-logs/fastlane-stage-android-*.log | head -1

# View last log
tail -50 /tmp/stackmap-logs/fastlane-stage-android-*.log | tail -1

# Retry with manual fastlane
cd android
fastlane stage_android
```

### Issue: Version Already Has Stage Suffix

**Warning:**
```
⚠️  Version already has stage suffix: 2025.10.10.2-stage
```

**This is Normal If:**
- Re-deploying stage without qual deployment first
- Version was manually set with stage suffix
- Testing multiple stage iterations

**Solution:** No action needed. Deployment will continue with existing stage version.

### Issue: Can't Find Stage Build

**iOS:**
- Wait 5-15 minutes for Apple processing
- Check App Store Connect under TestFlight → Internal Testing
- Verify you're in correct internal testing group
- Check TestFlight app on device

**Android:**
- Check draft release in Play Console
- Must manually publish draft to make visible
- Join internal testing program if not already joined
- Wait 5-10 minutes after publishing

---

## Best Practices

### 1. Use Stage Before Beta

**Always:**
- Deploy to qual and test locally
- Deploy to stage for mobile validation
- Test on actual devices via TestFlight/Play Store
- Only promote to beta when stage passes

**Why:**
- Catches mobile-specific issues early
- Tests actual store deployment process
- Validates app works with store distribution
- Prevents wasting beta testers' time with broken builds

### 2. Rapid Iteration

**Stage Allows:**
- Uncommitted changes (fast iteration)
- Test failures (warnings only)
- Multiple deployments per day
- Quick fixes without strict process

**Use Stage To:**
- Test a quick fix before beta
- Validate mobile builds work correctly
- Catch deployment issues early
- Iterate quickly on internal testing

### 3. Environment Verification

**Always Verify:**
- App uses stage/api endpoint
- Connected to qual database
- No production data access
- Environment indicator visible in app

**Check:**
```bash
# View app logs to confirm endpoint
# iOS: Xcode console
# Android: adb logcat
```

### 4. Communication

**Before Stage:**
- Not necessary (internal testing only)
- Just you testing the build

**Before Beta:**
- Notify team testers
- Provide what changed since last beta
- Set expectations for testing focus

### 5. Test Coverage

**In Stage:**
- Focus on core functionality
- Test critical user flows
- Verify mobile-specific features
- Check store deployment worked

**Before Beta:**
- All tests must pass (no warnings)
- Full regression testing completed
- All known issues fixed
- Ready for external testers

---

## Stage → Beta Promotion Checklist

Before promoting stage to beta, ensure:

- [ ] Stage builds installed and tested on actual devices
- [ ] All critical features working correctly
- [ ] App uses correct stage/api endpoint
- [ ] Sync with qual database working
- [ ] No crashes or major bugs found
- [ ] Test warnings addressed and fixed
- [ ] All changes committed to git
- [ ] PENDING_CHANGES.md updated with release notes
- [ ] Ready to open to internal team testers

**When Ready:**
```bash
# 1. Commit all changes
git add -A
git commit -m "Ready for beta: [description]"

# 2. Update PENDING_CHANGES.md

# 3. Deploy to beta
./scripts/deploy_beta.sh --all
```

---

## Automation Opportunities

### Future Enhancements

1. **Automated Stage on Qual Deploy**
   - Auto-deploy stage after successful qual
   - Only if tests pass
   - Requires CI/CD setup

2. **Stage Test Reports**
   - Generate HTML test reports
   - Track warning trends over time
   - Alert if warnings increase

3. **Device Testing Automation**
   - AWS Device Farm integration
   - Automated smoke tests on stage builds
   - Screenshot comparison

4. **Slack Notifications**
   - Notify when stage build ready
   - Alert on deployment failures
   - Link to TestFlight/Play Console

---

## Related Documentation

- **Four-Tier Strategy:** [README.md](./README.md)
- **Beta Deployment:** [BETA_DEPLOYMENT_GUIDE.md](./BETA_DEPLOYMENT_GUIDE.md)
- **Three-Tier Plan:** [THREE_TIER_DEPLOYMENT_PLAN.md](./THREE_TIER_DEPLOYMENT_PLAN.md)
- **Fastlane iOS:** [../../ios/DEPLOYMENT_GUIDE.md](../../ios/DEPLOYMENT_GUIDE.md)
- **Fastlane Android:** [../../android/fastlane/Fastfile](../../android/fastlane/Fastfile)
- **Testing Guide:** [../testing/simple-testing-guide.md](../testing/simple-testing-guide.md)

---

## Support

### Getting Help

**Deployment Issues:**
- Review this guide's troubleshooting section
- Check fastlane logs in `/tmp/stackmap-logs/`
- Review platform-specific deployment guides

**Fastlane Configuration:**
- iOS: See `ios/fastlane/Fastfile` (line ~631 for stage_ios)
- Android: See `android/fastlane/Fastfile` (line ~380 for stage_android)

**App Store/Play Store:**
- Apple: https://developer.apple.com/support/
- Google: https://support.google.com/googleplay/android-developer/

**Script Issues:**
- Check `scripts/deploy_stage.sh` for deployment logic
- Review logs in `/tmp/stackmap-logs/`
- Ensure Fastlane credentials are configured

---

**Document Version:** 1.0
**Last Updated:** January 11, 2025
**Next Review:** After first stage deployment with team
**Maintainer:** DevOps Team
