# Beta Deployment Guide

**Status:** Active
**Version:** 2.0
**Last Updated:** January 13, 2025
**Part of:** Four-Tier Deployment Strategy

---

## Overview

The Beta deployment tier is **tier 3 of 4** in StackMap's deployment pipeline, designed for **external testing with production data**. After passing internal validation in STAGE, BETA provides a controlled environment for real-world testing with external beta testers before public release.

### Four-Tier Strategy Context

```
QUAL   → Local testing (multiple times/day) - qual DB
  ↓
STAGE  → Internal validation (1-2 times/week) - qual DB
  ↓
BETA   → External testing (1-2 times/week) - PRODUCTION DB ⚠️
  ↓
PROD   → Public release (weekly/bi-weekly) - production DB
```

### Key Difference: STAGE vs BETA

| Aspect | STAGE | BETA |
|--------|-------|------|
| **Purpose** | Internal team validation | External beta tester validation |
| **Database** | Qual database (test data) | **Production database (real data)** |
| **Testers** | Internal team only | External beta tester group |
| **Web URL** | qual.stackmap.app | beta.stackmap.app |
| **API Endpoint** | qual DB | **prod DB** |
| **Risk Level** | Low (isolated test data) | Medium (real data, limited users) |

**Critical:** BETA uses the **production database**, meaning beta testers interact with real data. This provides realistic testing conditions but requires careful monitoring.

---

## Quick Start

### Prerequisites

1. **Clean Working Directory**
   - All changes must be committed before beta deployment
   - Run `git status` to verify

2. **Qual Version Ready**
   - Beta uses the current version from qual
   - Ensure qual has been tested and is stable

3. **Fastlane Credentials Configured**
   - iOS: App Store Connect API Key
   - Android: Google Play Service Account JSON

### Basic Beta Deployment

```bash
# Deploy to all beta platforms (recommended)
./scripts/deploy_beta.sh --all

# Deploy to specific platforms
./scripts/deploy_beta.sh ios            # iOS TestFlight only
./scripts/deploy_beta.sh android        # Android Play Store only
./scripts/deploy_beta.sh web            # Web beta (PRODUCTION DATABASE)
```

**Important:** Beta web deployment uses the **production database** at beta-api.stackmap.app

---

## What Beta Deployment Does

### 1. Pre-Deployment Checks ✅

- **Git Status:** Verifies no uncommitted changes
- **Version Check:** Retrieves current version from package.json
- **Beta Suffix:** Adds `-beta` suffix (e.g., `2025.10.10.1-beta`)
- **Stage Validation:** Confirms STAGE testing has passed (manual check)
- **Confirmation:** Prompts for deployment approval
- **Database Warning:** Confirms understanding that BETA uses production DB

### 2. Test Suite Execution 🧪

Beta deployments run a comprehensive test suite:

- **Tier 0 (Smoke):** Quick sanity check (MUST PASS)
- **Tier 1 (Critical):** Encryption, auth, data integrity (MUST PASS)
- **Tier 2 (Important):** Core features (95%+ target, warning if below)

**Note:** If critical tests fail, deployment is blocked.

### 3. Platform Deployments 📱

#### Web Beta (PRODUCTION DATABASE)
- **URL:** https://beta.stackmap.app
- **API Endpoint:** beta-api.stackmap.app (PRODUCTION DATABASE)
- **Purpose:** External beta testing with real production data
- **Database:** Shared with production - **use with care!**
- **Deployment:** `./scripts/deploy_beta.sh web`
- **Note:** Beta web testers see and modify real production data

**Why Production DB for Beta?**
Beta testers need a production-like environment to provide realistic feedback. Using test data would mask real-world issues. However, this means:
- All beta tester actions affect production data
- Sync operations write to production database
- Beta testers should be trusted external users
- Monitor for data corruption or misuse

#### iOS Beta (TestFlight)
- **Bundle ID:** `app.stackmap` (same as stage and prod)
- **Display Name:** "StackMap" (matches production for realistic testing)
- **Differentiation:** TestFlight External Testing group (vs Internal for stage)
- **Signing:** Automatic with on-the-fly Distribution profile generation
- Builds release IPA using `fastlane beta_ios`
- Uploads to TestFlight External Testing
- Skips build number increment (uses qual version)
- Processing time: 5-15 minutes after upload

**Note:** Beta and stage cannot be installed side-by-side (same bundle ID). This is intentional as the user is the only tester.

#### Android Beta (Play Store)
- Builds release AAB using `fastlane beta_android`
- Uploads to Google Play Internal Testing
- Creates draft release
- Requires manual publish in Play Console

### 4. Post-Deployment Report 📊

- Deployment summary with timings
- Platform-specific URLs
- Next steps and testing instructions

---

## Version Management

### Version Format

```
Qual Version:  2025.10.10.2
Beta Version:  2025.10.10.2-beta
Prod Version:  2025.10.10.2  (suffix removed when promoted)
```

### Version Flow

1. **Qual Deployment:** Auto-increments version (e.g., `2025.10.10.2`)
2. **Beta Deployment:** Adds `-beta` suffix (e.g., `2025.10.10.2-beta`)
3. **Prod Deployment:** Removes suffix, promotes version

### Key Points

- Beta does NOT increment version
- Beta inherits version from qual
- Multiple beta deployments can use same version
- Version suffix is added automatically

---

## Detailed Deployment Steps

### Step 1: Prepare for Beta

```bash
# 1. Ensure STAGE validation has passed
# STAGE is the internal testing tier (qual DB)
# BETA should only be deployed after STAGE approval

# 2. Verify all changes committed
git status

# 3. Check current version
grep '"version":' package.json

# 4. Confirm STAGE testing complete
# Manual check: Has internal team validated in STAGE?
# Have critical workflows been tested with qual data?
```

**Important:** BETA should only be deployed after STAGE internal validation passes. STAGE uses qual database for safe internal testing. BETA uses production database for external testing.

### Step 2: Run Beta Deployment

```bash
# Full beta deployment (all platforms)
./scripts/deploy_beta.sh --all
```

**What Happens:**
1. Script checks for uncommitted changes (fails if any)
2. Retrieves current version
3. Adds `-beta` suffix
4. Prompts for confirmation
5. Runs test suite (smoke + critical + important)
6. Deploys to web (qual environment)
7. Builds and uploads iOS to TestFlight
8. Builds and uploads Android to Play Store
9. Generates deployment report

### Step 3: Verify Beta Builds

#### iOS (TestFlight)

1. Wait 5-15 minutes for Apple processing
2. Check App Store Connect:
   ```
   https://appstoreconnect.apple.com/apps
   ```
3. Verify build appears in TestFlight → Internal Testing
4. Install via TestFlight app on device

#### Android (Play Console)

1. Check Google Play Console:
   ```
   https://play.google.com/console/
   ```
2. Navigate to: Release → Testing → Internal testing
3. Verify draft release appears
4. Publish draft to internal testers (manual step)
5. Install via Play Store (join internal testing program)

#### Web

1. Access beta environment:
   ```
   https://beta.stackmap.app
   ```
2. Verify beta environment is active
3. Test web functionality
4. **Critical:** Confirm API endpoint is `beta-api.stackmap.app` (PRODUCTION DATABASE)
5. **Warning:** All beta web actions affect production data
6. Test carefully with trusted beta testers only

### Step 4: Beta Testing

1. **Install on Test Devices**
   - iOS: TestFlight app
   - Android: Play Store (internal testing track)
   - Web: stackmap.app/qual

2. **Gather Feedback**
   - **External beta tester group** (primary audience)
   - Real-world usage scenarios
   - Bug reports from production-like environment
   - Feature requests from actual users
   - Performance feedback with real data

3. **Track Issues**
   - Create GitHub issues for bugs
   - Document feature feedback
   - Prioritize fixes for production

### Step 5: Iterate or Promote

**Option A: Fix and Re-Deploy Beta**

If issues found:
```bash
# 1. Fix issues in codebase
# 2. Deploy to qual for initial testing
./scripts/qual_deploy.sh --all

# 3. Deploy to STAGE for internal validation
./scripts/deploy_stage.sh --all

# 4. After STAGE passes, re-deploy to beta
./scripts/deploy_beta.sh --all
```

**Important:** Follow the full QUAL → STAGE → BETA progression. Don't skip STAGE internal validation before re-deploying to BETA with production data.

**Option B: Promote to Production**

When beta is stable:
```bash
# 1. Update PENDING_CHANGES.md with release notes
# 2. Deploy to production
./scripts/deploy_prod.sh all
```

---

## Platform-Specific Notes

### iOS (TestFlight)

**Bundle ID Strategy:**
- **Bundle ID:** `app.stackmap` (shared with stage and prod)
- **STAGE:** TestFlight Internal Testing (up to 100 internal testers)
- **BETA:** TestFlight External Testing (up to 10,000 external testers)
- **PROD:** App Store (unlimited users)
- **Differentiation:** TestFlight groups + display names + BUILD_TYPE_ENV variable

**Build Processing:**
- Upload completes in 2-3 minutes
- Apple processing takes 5-15 minutes
- Check status in App Store Connect

**TestFlight Distribution:**
- **Internal Testing (STAGE):** No review required, instant distribution
- **External Testing (BETA):** Requires Beta App Review (1-2 days)
- Same bundle ID allows seamless progression through testing groups

**Code Signing:**
- Automatic signing with `-allowProvisioningUpdates` flag
- Xcode generates Distribution profiles on-the-fly
- No manual provisioning profile management needed

**Troubleshooting:**
- If upload fails, check API key credentials
- Verify Team ID: 84W9WSYQQB
- Check fastlane logs in `ios/fastlane/`
- Ensure bundle ID is `app.stackmap` (not app.stackmap.beta or app.stackmap.stage)

### Android (Play Store)

**Build Generation:**
- AAB build completes in 2-3 minutes
- Includes both AAB and APK

**Internal Testing:**
- Up to 100 internal testers
- No review required
- Draft release requires manual publish

**Publishing Draft:**
1. Go to Play Console
2. Navigate to Internal testing track
3. Click on draft release
4. Click "Review and publish"

**Troubleshooting:**
- If upload fails, check service account credentials
- Verify package name: com.stackmapnative
- Check fastlane logs in `android/fastlane/`

### Web (Beta Environment) - PRODUCTION DATABASE

**Environment:**
- **URL:** https://beta.stackmap.app
- **API Endpoint:** beta-api.stackmap.app
- **Database:** PRODUCTION DATABASE (shared with prod mobile apps)
- **Purpose:** External beta testing with real data
- **Branch:** `deploy-beta-web` (separate from qual and prod branches)

**Why Production Database?**
Beta web uses production database to provide external beta testers with a realistic testing environment. This allows:
- Real-world performance testing
- Actual sync behavior validation
- Production-like user experience
- Meaningful feedback on real data

**Critical Warnings:**
- **Beta web shares data with production!**
- All sync operations write to production database
- Beta testers can affect real production data
- Only trusted external testers should access beta web
- Monitor for data corruption or misuse
- Consider beta testers as "early production users"

**Testing Guidelines:**
- Test with trusted beta tester accounts only
- Monitor beta tester activity
- Have rollback plan for data issues
- Document any data corruption incidents
- Limit beta web access to vetted testers

**Comparison:**
| Environment | URL | Database | Purpose |
|-------------|-----|----------|---------|
| **Qual Web** | qual.stackmap.app | Qual (test data) | Internal dev testing |
| **Stage Web** | qual.stackmap.app | Qual (test data) | Internal validation |
| **Beta Web** | beta.stackmap.app | **Production (real data)** | External beta testing |
| **Prod Web** | stackmap.app | Production (real data) | Public release |

---

## Common Issues & Troubleshooting

### Issue: Uncommitted Changes

**Error:**
```
❌ Uncommitted changes detected
Beta deployment requires a clean working directory.
```

**Solution:**
```bash
# Commit changes first
git add -A
git commit -m "Your commit message"

# Then re-run beta deployment
./scripts/deploy_beta.sh --all
```

### Issue: Critical Tests Failing

**Error:**
```
❌ CRITICAL TESTS FAILED
Critical tests must pass 100% for beta deployment
```

**Solution:**
```bash
# Run tests locally to identify failures
npm run test:critical

# Fix failing tests
# Re-deploy to qual
./scripts/qual_deploy.sh --all

# Then re-try beta
./scripts/deploy_beta.sh --all
```

### Issue: iOS Upload Fails

**Error:**
```
❌ iOS beta deployment failed
```

**Common Causes:**
1. API Key credentials not configured
2. Network connectivity issues
3. Build number conflict

**Solutions:**
```bash
# Check API key is configured
ls ~/.fastlane/AuthKey_*.p8

# Check environment variables
env | grep APP_STORE_CONNECT

# Review fastlane logs
cat ios/fastlane/fastlane.log

# Retry with manual fastlane
cd ios
fastlane beta_ios changelog:"Manual retry"
```

### Issue: Android Upload Fails

**Error:**
```
❌ Android beta deployment failed
```

**Common Causes:**
1. Service account credentials not configured
2. Version code conflict
3. Build signing issues

**Solutions:**
```bash
# Check service account JSON
# Should be stored in macOS Keychain
security find-generic-password -s 'stackmap-play-store-json-path' -w

# Verify signing credentials
cd android
./gradlew signingReport

# Review fastlane logs
cat android/fastlane/fastlane.log

# Retry with manual fastlane
cd android
fastlane beta_android
```

### Issue: Version Already Has Beta Suffix

**Warning:**
```
⚠️  Version already has beta suffix: 2025.10.10.2-beta
```

**This is normal if:**
- Re-deploying beta without qual deployment first
- Version was manually set with beta suffix

**Solution:** No action needed. Deployment will continue with existing beta version.

---

## When to Use BETA

### BETA is for:
- **External beta tester validation** after STAGE internal validation
- Real-world testing with production data
- Gathering feedback from actual users (not internal team)
- Final validation before public release
- Testing with realistic data volumes and usage patterns
- 1-2 times per week cadence

### BETA is NOT for:
- **Internal team testing** (use STAGE instead)
- Initial feature validation (use QUAL)
- Testing with test data (use STAGE with qual DB)
- Multiple deployments per day (use QUAL)
- Experimental features (use QUAL or feature branches)

### Deployment Progression
```
QUAL (many/day) → STAGE (1-2/week) → BETA (1-2/week) → PROD (weekly/bi-weekly)
     ↓                  ↓                  ↓                    ↓
  Test data        Test data          Real data            Real data
  (qual DB)        (qual DB)          (prod DB)            (prod DB)
  Dev testing      Internal team      External beta        Public users
```

## Best Practices

### 1. Regular Beta Cadence

- Deploy to beta 1-2 times per week (after STAGE validation)
- Allow time for external testing before production
- Coordinate with beta tester availability
- Only deploy to BETA after STAGE internal validation passes

### 2. Test Coverage

- Beta must pass all critical tests (100%)
- Important tests should be 95%+ pass rate
- Fix test failures before beta deployment

### 3. Communication

- Notify **external beta testers** of new beta builds
- Provide release notes highlighting what to test
- Set up feedback channel (TestFlight feedback, email, etc.)
- **Important:** Inform beta testers they're using production data
- Establish guidelines for beta tester behavior (no data corruption)
- Monitor beta tester activity for anomalies

### 4. Version Hygiene

- Always follow QUAL → STAGE → BETA → PROD progression
- **Don't skip STAGE** - internal validation with qual DB is critical
- Deploy to STAGE for internal validation before BETA external testing
- Keep versions synchronized across platforms
- STAGE validates with test data, BETA validates with production data

### 5. Rollback Strategy

**If beta has critical issues:**
1. Do NOT promote to production
2. Fix issues in codebase
3. Deploy to qual for initial testing
4. Deploy to STAGE for internal validation
5. After STAGE passes, re-deploy to beta
6. Re-test thoroughly with external beta testers

**Important Database Consideration:**
- Beta web uses **production database**
- If beta causes data corruption, it affects production data
- Have database backup/restore plan ready
- Monitor beta tester activity for anomalies
- Beta mobile apps (TestFlight, Play Internal) also use production DB
- Unlike STAGE, BETA issues can impact production data

---

## Automation Opportunities

### Future Enhancements

1. **Automated Beta on Schedule**
   - GitHub Actions workflow
   - Deploy beta every Friday
   - Requires CI/CD setup

2. **Automated Testing**
   - Run tests in CI pipeline
   - Block deployment if tests fail
   - Generate test reports

3. **Notification System**
   - Slack notifications on deployment
   - Email to beta testers
   - Status dashboard

4. **Feedback Integration**
   - TestFlight feedback collection
   - Play Console crash reports
   - Automated issue creation

---

## Migration from 3-Tier to 4-Tier System

### What Changed (January 2025)

**Previous (3-Tier):**
```
QUAL → BETA → PROD
```

**New (4-Tier):**
```
QUAL → STAGE → BETA → PROD
```

### Why the Change?

1. **STAGE Added for Internal Validation**
   - STAGE provides internal team validation tier
   - Uses qual database (safe test data)
   - Separates internal testing from external testing
   - Reduces risk of beta testers encountering internal validation issues

2. **BETA Now External-Only**
   - BETA moved from "internal + external" to "external only"
   - Uses production database for realistic testing
   - Focuses on external beta tester feedback
   - Provides production-like environment before public release

3. **Better Risk Management**
   - STAGE uses test data (low risk)
   - BETA uses production data (medium risk, limited users)
   - PROD uses production data (full risk, all users)
   - Clear separation of internal vs external validation

### Migration Impact

**For Developers:**
- Add STAGE deployment step before BETA
- Use STAGE for internal team validation
- Reserve BETA for external beta tester group
- Follow new QUAL → STAGE → BETA → PROD flow

**For Beta Testers:**
- Beta testers now use production database
- More realistic testing environment
- Beta tester actions affect real data
- Better feedback on production-like scenarios

**For Operations:**
- Monitor beta tester activity on production DB
- Have rollback plan for data issues
- Vet external beta testers carefully
- Track beta tester feedback more closely

---

## Related Documentation

- **Four-Tier Strategy:** [FOUR_TIER_BUILD_GUIDE.md](./FOUR_TIER_BUILD_GUIDE.md)
- **Stage Deployment:** [STAGE_DEPLOYMENT_SETUP.md](./STAGE_DEPLOYMENT_SETUP.md)
- **Deployment Overview:** [README.md](./README.md)
- **Fastlane iOS:** [ios/fastlane/DEPLOYMENT_GUIDE.md](../../ios/fastlane/DEPLOYMENT_GUIDE.md)
- **Fastlane Android:** [android/fastlane/DEPLOYMENT_GUIDE.md](../../android/fastlane/DEPLOYMENT_GUIDE.md)
- **Testing Guide:** [../testing/simple-testing-guide.md](../testing/simple-testing-guide.md)

---

## Support

### Getting Help

**Deployment Issues:**
- Review this guide's troubleshooting section
- Check fastlane logs in `ios/fastlane/` or `android/fastlane/`
- Review platform-specific deployment guides

**Fastlane Configuration:**
- iOS: See `ios/fastlane/DEPLOYMENT_GUIDE.md`
- Android: See `android/fastlane/DEPLOYMENT_GUIDE.md`

**App Store/Play Store:**
- Apple: https://developer.apple.com/support/
- Google: https://support.google.com/googleplay/android-developer/

---

**Document Version:** 2.0
**Last Updated:** January 13, 2025
**Changes:** Updated for 4-tier system, clarified BETA uses production DB, added STAGE context
**Next Review:** After first 4-tier beta deployment
**Maintainer:** DevOps Team
