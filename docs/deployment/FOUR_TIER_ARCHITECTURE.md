# Four-Tier Deployment Architecture

**Status:** Active
**Version:** 1.0
**Last Updated:** October 11, 2025
**Related Documents:** [README.md](./README.md) | [FOUR_TIER_BUILD_GUIDE.md](./FOUR_TIER_BUILD_GUIDE.md) | [BETA_DEPLOYMENT_GUIDE.md](./BETA_DEPLOYMENT_GUIDE.md)

---

## Executive Summary

StackMap uses a **four-tier deployment architecture** that provides comprehensive testing and validation stages before production release. This architecture ensures code quality, reduces production incidents, and allows for controlled rollouts.

### Why Four Tiers Instead of Three?

The evolution from three to four tiers addresses a critical gap: **internal validation before external beta testing**. While the original three-tier system (QUAL → BETA → PROD) worked well, it lacked a dedicated stage for internal team validation using production-like conditions but with safe test data.

**Key Benefits:**

1. **Risk Mitigation** - Multiple validation gates before production
2. **Data Safety** - Separate databases for testing vs. real user data
3. **Testing Flexibility** - Different tiers for different testing needs
4. **Controlled Rollout** - Progressive expansion of test audience
5. **Rollback Safety** - Issues caught early with minimal user impact

---

## Architecture Overview

### System Diagram

```
Development Environment
        ↓
    ┌───────┐
    │ QUAL  │ ← Multiple deploys per day
    └───┬───┘
        │   Database: qual_database
        │   Web: stackmap.app/qual/
        │   Mobile: Debug builds (simulator/emulator)
        │   API: stackmap.app/qual/api/sync
        ↓
    ┌───────┐
    │ STAGE │ ← Before each beta (internal only)
    └───┬───┘
        │   Database: qual_database (same as QUAL)
        │   Web: None (mobile-only tier)
        │   Mobile: Release builds (TestFlight Internal/Play Internal)
        │   API: stackmap.app/qual/api/sync (no separate endpoint)
        ↓
    ┌───────┐
    │ BETA  │ ← 1-2 times per week
    └───┬───┘
        │   Database: prod_database (real user data)
        │   Web: stackmap.app/beta/
        │   Mobile: TestFlight External/Play Internal
        │   API: stackmap.app/beta/api/sync
        ↓
    ┌───────┐
    │ PROD  │ ← Weekly or bi-weekly
    └───────┘
        Database: prod_database (real user data)
        Web: stackmap.app/
        Mobile: App Store/Play Store Production
        API: stackmap.app/api/sync
```

### Progressive Expansion

| Tier | Audience | Frequency | Data Risk | Purpose |
|------|----------|-----------|-----------|---------|
| QUAL | Developers only | Multiple/day | None | Rapid development iteration |
| STAGE | Internal team | Before beta | None | Production-like validation |
| BETA | Beta testers | 1-2/week | Low | External validation |
| PROD | All users | Weekly/bi-weekly | High | Public release |

---

## Tier Details

### QUAL (Quality Assurance / Development)

**Purpose:** Rapid development and testing with immediate feedback

**Characteristics:**
- **Database:** qual_database (test data only)
- **Web Deployment:** stackmap.app/qual/
- **Mobile Deployment:** Debug builds to simulator/emulator
- **API Endpoint:** qual-api.stackmap.app → stackmap.app/qual/api/sync
- **Deploy Frequency:** Multiple times per day
- **Audience:** Developers only
- **Build Type:** Debug builds with Metro bundler
- **Testing Level:** Basic smoke testing

**Use Cases:**
- Feature development
- Bug fixes
- UI/UX experiments
- API integration testing
- Performance profiling

**Deployment Command:**
```bash
./scripts/qual_deploy.sh [--web] [--android] [--ios] [--ios-device]
```

**Data Safety:** Complete isolation - qual database is disposable and frequently reset

---

### STAGE (Staging / Internal Validation)

**Purpose:** Internal validation using release builds before external beta

**Characteristics:**
- **Database:** qual_database (same as QUAL - safe test data)
- **Web Deployment:** None (mobile-only tier)
- **Mobile Deployment:** Release builds to TestFlight Internal/Play Internal Testing
- **API Endpoint:** stackmap.app/qual/api/sync (shares with QUAL)
- **Deploy Frequency:** Before each beta deployment (1-2/week)
- **Audience:** Internal team only (developers, QA, stakeholders)
- **Build Type:** Release builds (production-like)
- **Testing Level:** Comprehensive functional and integration testing

**Use Cases:**
- Release build validation
- Performance testing on real devices
- Integration testing with production configuration
- Internal team approval before external beta
- Platform-specific testing (iOS/Android differences)

**Deployment Command:**
```bash
./scripts/deploy_stage.sh [--ios] [--android] [--all]
```

**Why No Separate API Endpoint?**
STAGE uses the qual API endpoint because:
1. It needs safe test data (not production data)
2. No need for separate infrastructure for internal testing
3. Simplifies configuration management
4. Allows testing with same data as QUAL for consistency

**Key Distinction from QUAL:**
- Uses **release builds** (not debug) to catch release-specific issues
- Tests on **real devices** via TestFlight/Play Console
- Requires **manual distribution** to internal testers
- Full **production configuration** (code signing, release optimizations)

---

### BETA (Beta Testing / External Validation)

**Purpose:** External testing with real users on production database

**Characteristics:**
- **Database:** prod_database (real user data - SHARED WITH PROD)
- **Web Deployment:** stackmap.app/beta/
- **Mobile Deployment:** TestFlight External Testing/Play Internal Testing
- **API Endpoint:** beta-api.stackmap.app → stackmap.app/beta/api/sync
- **Deploy Frequency:** 1-2 times per week
- **Audience:** Beta testers (up to 10,000 external + internal)
- **Build Type:** Release builds with `-beta` version suffix
- **Testing Level:** Real-world usage testing

**Use Cases:**
- External user feedback
- Real-world usage patterns
- Platform compatibility testing
- Performance under load
- Final validation before production

**Deployment Command:**
```bash
./scripts/deploy_beta.sh [--web] [--ios] [--android] [--all]
```

**CRITICAL: Database Considerations**
- BETA uses **production database** (same as PROD)
- All beta actions affect real user data
- Beta testers may interact with production users
- Changes are permanent - no rollback at data level
- Requires careful testing in STAGE first

**Version Format:**
- Version suffix: `2025.10.11.3-beta`
- Inherits version from qual (no increment)
- Suffix removed when promoted to prod

---

### PROD (Production / Public Release)

**Purpose:** Public release to all users

**Characteristics:**
- **Database:** prod_database (real user data)
- **Web Deployment:** stackmap.app/
- **Mobile Deployment:** App Store/Play Store Production
- **API Endpoint:** api.stackmap.app → stackmap.app/api/sync
- **Deploy Frequency:** Weekly or bi-weekly
- **Audience:** All users (unlimited)
- **Build Type:** Release builds (final)
- **Testing Level:** Fully validated through all previous tiers

**Use Cases:**
- Stable feature releases
- Critical bug fixes
- Performance improvements
- Security updates

**Deployment Command:**
```bash
./scripts/prod_deploy.sh [web|ios|android|all]
```

**Version Format:**
- Clean version: `2025.10.11.3`
- Beta suffix removed
- Incremented from beta version

**Rollback Procedures:**
- **Web:** Quick rollback via git checkout
- **Mobile:** Requires new build submission (24-48 hour delay)
- **Database:** No automatic rollback - requires manual data recovery

---

## API Endpoint Mapping

### Endpoint Architecture

StackMap uses **subdirectory-based API routing** (not subdomains) for simplicity and shared SSL certificates:

```
stackmap.app/
├── api/sync/              → PROD API
├── beta/api/sync/         → BETA API
├── qual/api/sync/         → QUAL API (also used by STAGE)
└── stage/                 → Not deployed (no separate web tier)
```

### Endpoint Details

| Build Type | API URL | Database | Purpose |
|------------|---------|----------|---------|
| QUAL | `https://stackmap.app/qual/api/sync` | qual_database | Development testing |
| STAGE | `https://stackmap.app/qual/api/sync` | qual_database | Release build validation |
| BETA | `https://stackmap.app/beta/api/sync` | prod_database | External beta testing |
| PROD | `https://stackmap.app/api/sync` | prod_database | Production release |

### Why STAGE Shares QUAL's Endpoint

**Rationale:**
1. **Data Safety** - STAGE needs test data, not production data
2. **Infrastructure Efficiency** - No need for duplicate test infrastructure
3. **Consistency** - Same test data across debug and release builds
4. **Simplicity** - Fewer endpoints to maintain and monitor

**Alternative Considered (Rejected):**
Creating a separate `stackmap.app/stage/api/sync` endpoint was considered but rejected because:
- Would require duplicate backend infrastructure
- No benefit over reusing qual endpoint
- Additional maintenance burden
- STAGE is internal-only (doesn't need isolation from QUAL)

### Build Type Detection

The app automatically determines which API endpoint to use via `/src/config/buildConfig.js`:

**Priority Order:**
1. **Android:** Reads from Gradle build flavor (most reliable)
2. **iOS:** Reads from native module (Info.plist)
3. **Web:** Detects from URL hostname/path
4. **Fallback:** Uses `__DEV__` flag (debug=qual, release=prod)

**Example:**
```javascript
// Android debug build
BUILD_TYPE = 'qual'  // From Gradle flavor
API_URL = 'https://stackmap.app/qual/api/sync'

// Android stage release
BUILD_TYPE = 'stage'  // From Gradle flavor
API_URL = 'https://stackmap.app/qual/api/sync'

// iOS beta build
BUILD_TYPE = 'beta'  // From native module
API_URL = 'https://stackmap.app/beta/api/sync'

// Web production
BUILD_TYPE = 'prod'  // From window.location
API_URL = 'https://stackmap.app/api/sync'
```

---

## Database Assignments

### Database Architecture

StackMap uses **two databases** across four tiers:

```
qual_database (Test Data)
├── QUAL  ← Development testing
└── STAGE ← Release validation

prod_database (Real User Data)
├── BETA  ← Beta testing
└── PROD  ← Production
```

### Qual Database (qual_database)

**Purpose:** Safe testing environment with disposable data

**Used By:**
- QUAL tier (debug builds)
- STAGE tier (release builds)

**Characteristics:**
- Contains test accounts and sample data
- Can be reset/cleared at any time
- No real user information
- Shared by developers and internal testers
- Performance testing doesn't affect production

**Management:**
- Regular backups (optional - data is disposable)
- Periodic resets to clean state
- Can be populated with test fixtures
- Isolated from production data

### Production Database (prod_database)

**Purpose:** Real user data for beta and production

**Used By:**
- BETA tier (external testing)
- PROD tier (public release)

**Characteristics:**
- Contains all real user accounts
- Must be handled with care
- Regular backups essential
- Beta testers interact with production users
- Changes are permanent

**CRITICAL CONSIDERATIONS:**
- **No separation** between beta and prod data
- Beta bugs can affect production users
- Database migrations must be tested in STAGE first
- Rollback requires careful data recovery planning

**Management:**
- Automated daily backups
- Point-in-time recovery capability
- Monitoring and alerting
- Access controls and audit logs

### Why This Split?

**Design Decision:**
The 2-database architecture provides optimal balance:

1. **Safety:** Test data (qual) completely isolated from real data (prod)
2. **Realism:** BETA tests with actual production data
3. **Simplicity:** Only two databases to maintain
4. **Cost:** Minimal infrastructure duplication

**Alternative Considered (4 databases):**
A four-database architecture (one per tier) was considered but rejected:
- **Rejected Reason:** Unnecessary complexity
- **Issue:** STAGE would need yet another copy of test data
- **Issue:** Database migrations would need 4x testing
- **Benefit:** None - STAGE is internal only

---

## Testing Group Configurations

### iOS (TestFlight)

**Bundle ID Strategy:**
StackMap uses a **single bundle ID** (`app.stackmap`) for all TestFlight and App Store distributions:

| Tier | Bundle ID | TestFlight Group | Display Name | Max Testers | Review Required |
|------|-----------|------------------|--------------|-------------|-----------------|
| QUAL | `app.stackmap.qual` | None (simulator only) | StackMap QUAL | N/A | No |
| STAGE | `app.stackmap` | Internal Testing | StackMap STAGE | 100 | No |
| BETA | `app.stackmap` | External Testing | StackMap | 10,000 | Yes (Beta Review) |
| PROD | `app.stackmap` | App Store | StackMap | Unlimited | Yes (Full Review) |

**Why Single Bundle ID?**
- TestFlight requires same bundle ID for Internal and External testing groups
- No need for separate App Store Connect listings
- Simpler provisioning profile management
- Automatic signing with on-the-fly profile generation
- Matches Android's single package name approach

**Differentiation Method:**
- **TestFlight Groups:** Internal (stage) vs External (beta) testing
- **Display Names:** Different app names on device home screen
- **BUILD_TYPE_ENV:** Runtime variable for API endpoint selection
- **Automatic Provisioning:** Xcode generates profiles dynamically

**Side-by-Side Installation:**
- QUAL (`app.stackmap.qual`) can coexist with other builds
- STAGE/BETA/PROD cannot coexist (same bundle ID)
- This is intentional - user is the only tester, no need for parallel installs

**Internal Testing (STAGE):**
- Up to 100 Apple IDs
- No review process
- Instant distribution
- Access via TestFlight app
- Fully automated

**External Testing (BETA):**
- Up to 10,000 testers
- Beta App Review required (1-2 days)
- Public link invitation
- Access via TestFlight app
- Requires manual submission for review

**Production:**
- Full App Store review (24-48 hours)
- Public availability
- App Store distribution
- Can be phased rollout

### Android (Play Console)

**Package Name Strategy:**
StackMap uses a **single package name** (`com.stackmapnative`) for all environments, similar to iOS:

| Tier | Package Name | Play Track | Max Testers | Review Required | Access |
|------|--------------|------------|-------------|-----------------|--------|
| QUAL | `com.stackmapnative` | None (emulator only) | N/A | No | Emulator/device |
| STAGE | `com.stackmapnative` | Internal Testing | 100 | No | Play Store opt-in |
| BETA | `com.stackmapnative` | Internal Testing | 100 | No | Play Store opt-in |
| PROD | `com.stackmapnative` | Production | Unlimited | Yes (if sensitive) | Play Store |

**Why Single Package Name?**
- Consistent with iOS single bundle ID approach
- Differentiated via Gradle build flavors (qual/stage/beta/prod)
- Play Store tracks handle distribution differentiation
- No need for multiple package names

**Internal Testing (STAGE & BETA):**
- Up to 100 email addresses
- No review process
- Instant distribution
- Access via Play Store (must join test program)
- Same package name, different builds

**Production:**
- No size limit
- Review if adding sensitive permissions
- Staged rollout available (5%, 10%, 25%, 50%, 100%)
- Public availability

**Note:** Unlike iOS, Android STAGE and BETA can potentially coexist via Play Store tracks, but this is not necessary for single-tester workflow.

### Web

| Tier | URL | Deployment Target | Access |
|------|-----|-------------------|--------|
| QUAL | stackmap.app/qual/ | /qual/ directory | Public |
| STAGE | None | Not deployed | N/A |
| BETA | stackmap.app/beta/ | /beta/ directory | Public |
| PROD | stackmap.app/ | Root directory | Public |

**Deployment Method:**
- Git-based deployment via SSH
- Files copied to specific directories
- Apache serves from respective paths
- Shared SSL certificate

**Access Control:**
- Web tiers are publicly accessible
- Authentication handled at app level
- No need for TestFlight/Play Store distribution
- Beta endpoint uses production database

---

## Deployment Matrix

### What Gets Deployed Where

| Tier | Web | iOS | Android | API Endpoint | Database |
|------|-----|-----|---------|--------------|----------|
| **QUAL** | ✓ stackmap.app/qual/ | ✓ Simulator | ✓ Emulator | qual/api | qual_database |
| **STAGE** | ✗ No web tier | ✓ TestFlight Internal | ✓ Play Internal | qual/api | qual_database |
| **BETA** | ✓ stackmap.app/beta/ | ✓ TestFlight External | ✓ Play Internal | beta/api | prod_database |
| **PROD** | ✓ stackmap.app/ | ✓ App Store | ✓ Play Production | api | prod_database |

### Platform Build Matrix

#### iOS Build Variants

```bash
# QUAL - Debug builds
npm run ios              # Simulator (qual environment)
npm run ios:qual         # Simulator (qual environment)

# STAGE - Release builds
cd ios && fastlane stage_ios    # TestFlight Internal

# BETA - Release builds
cd ios && fastlane beta_ios     # TestFlight External

# PROD - Release builds
cd ios && fastlane prod_ios     # App Store
```

#### Android Build Variants

```bash
# QUAL - Debug builds
npm run android          # Emulator (qual environment)
npm run android:qual     # Emulator (qual environment)

# STAGE - Release builds
cd android && fastlane stage_android    # Play Internal

# BETA - Release builds
cd android && fastlane beta_android     # Play Internal

# PROD - Release builds
cd android && fastlane prod_android     # Play Production
```

#### Web Build Variants

```bash
# QUAL
npm run build:web:qual
# Deploy to: stackmap.app/qual/

# STAGE
# Not deployed (mobile-only tier)

# BETA
npm run build:web:beta
# Deploy to: stackmap.app/beta/

# PROD
npm run build:web:prod
# Deploy to: stackmap.app/
```

---

## Decision Rationale

### Why Four Tiers?

**Historical Context:**
StackMap originally used a three-tier system (QUAL → BETA → PROD). This worked well but had a critical gap: no way to validate **release builds** with **safe test data** before exposing beta testers to potential issues.

**Problem with Three Tiers:**
1. QUAL used debug builds (not representative of production)
2. BETA jumped straight to production database (risky)
3. No release build validation stage
4. Internal team had no way to test release builds safely

**Solution: Add STAGE Tier:**
STAGE fills the gap by providing:
- Release builds (production-like)
- Test data (safe to break)
- Internal distribution (controlled audience)
- Real device testing (not simulators)

### Why STAGE Uses Qual Database

**Decision:** STAGE shares the qual database instead of having its own.

**Rationale:**
1. **Data Safety:** STAGE needs test data (like QUAL), not production data (like BETA)
2. **Consistency:** Same test data across debug and release builds
3. **Simplicity:** No need to maintain duplicate test infrastructure
4. **Cost:** Minimize infrastructure overhead
5. **Purpose:** STAGE validates build process, not data layer

**Trade-offs Accepted:**
- STAGE and QUAL share database (potential for data conflicts)
- No separate STAGE web deployment
- STAGE requires manual internal distribution

**Benefits Gained:**
- Safe testing environment for release builds
- No risk to production data
- Simplified infrastructure
- Clear progression path (test data → prod data)

### Why BETA Uses Prod Database

**Decision:** BETA uses production database (same as PROD).

**Rationale:**
1. **Realism:** Beta testers need real-world conditions
2. **Integration:** Beta users can interact with production users
3. **Validation:** Final validation before public release
4. **Sync Testing:** Cross-platform sync with actual data structures

**Risks Accepted:**
- Beta bugs can affect production users
- Bad deployments can corrupt real data
- No sandbox for beta testing

**Mitigations:**
- Mandatory STAGE validation first
- Comprehensive test suite (Tier 0/1/2)
- Progressive rollout (internal → external)
- Monitoring and alerting
- Quick rollback procedures

### Why No Separate STAGE Web Deployment

**Decision:** STAGE is mobile-only (no web deployment).

**Rationale:**
1. **Scope:** STAGE validates mobile release builds specifically
2. **Web Difference:** Web has simpler deployment (no app store review)
3. **Resource Efficiency:** Web can iterate faster in QUAL
4. **Test Coverage:** Mobile is the bottleneck (review process)

**Alternative Considered:**
Adding `stackmap.app/stage/` was considered but rejected:
- Web doesn't need release build validation (no compilation)
- Web deploys to QUAL for testing
- Mobile is the critical path (app store review)
- Infrastructure cost not justified

---

## Migration from Three-Tier System

### What Changed

**Old System (Three-Tier):**
```
QUAL → BETA → PROD
```
- QUAL: Debug builds, qual database
- BETA: Release builds, production database
- PROD: Release builds, production database

**New System (Four-Tier):**
```
QUAL → STAGE → BETA → PROD
```
- QUAL: Debug builds, qual database (unchanged)
- **STAGE: Release builds, qual database (NEW)**
- BETA: Release builds, production database (unchanged)
- PROD: Release builds, production database (unchanged)

### Why STAGE Was Added

**Gap Identified:**
No way to validate release builds before exposing beta testers to issues.

**STAGE Benefits:**
1. Release build validation with safe data
2. Internal team approval gate
3. Platform-specific testing
4. Performance testing on real devices
5. Integration testing with production config

**Impact on Workflow:**
- **Before:** QUAL → BETA (risky jump)
- **After:** QUAL → STAGE → BETA (controlled progression)

### Backward Compatibility

**Design Principle:** The four-tier system maintains full backward compatibility.

**Compatibility Measures:**
1. **Build Detection:** `__DEV__` flag still works (debug=qual, release=prod)
2. **API Endpoints:** Existing endpoints unchanged
3. **Database Structure:** No schema changes required
4. **Scripts:** Old scripts continue to work
5. **Optional STAGE:** Can skip STAGE and go straight to BETA if needed

**Migration Path:**
- No code changes required for existing deployments
- STAGE tier is additive (doesn't break existing flow)
- Teams can adopt STAGE gradually
- Fallback to three-tier still possible

---

## Best Practices

### When to Use Each Tier

#### Use QUAL When:
- Developing new features
- Fixing bugs
- Experimenting with UI/UX
- Testing API integrations
- Performance profiling
- Multiple deploys per day

#### Use STAGE When:
- Validating release builds
- Testing on real devices
- Internal team approval needed
- Before each beta deployment
- Platform-specific testing
- Integration testing

#### Use BETA When:
- Getting external feedback
- Real-world usage testing
- Load testing
- Final validation before production
- 1-2 times per week

#### Use PROD When:
- Stable release ready
- All testing complete
- Weekly or bi-weekly cadence
- Critical bug fixes only

### Testing Checklist for Each Tier

#### QUAL Testing
- [ ] App builds successfully
- [ ] UI renders correctly
- [ ] Navigation works
- [ ] Sync connects to qual API
- [ ] No console errors
- [ ] Metro bundler running

#### STAGE Testing
- [ ] Release build installs
- [ ] App performance acceptable
- [ ] No debug symbols
- [ ] Code signing valid
- [ ] Sync works with qual API
- [ ] All platforms tested (iOS/Android)
- [ ] Internal team approval

#### BETA Testing
- [ ] TestFlight/Play build available
- [ ] Beta testers can install
- [ ] Sync works with beta API
- [ ] Production database accessible
- [ ] No critical bugs
- [ ] Feedback collected
- [ ] External validation complete

#### PROD Testing
- [ ] Beta testing complete
- [ ] All critical bugs fixed
- [ ] Release notes prepared
- [ ] Support team notified
- [ ] Monitoring configured
- [ ] Rollback plan ready

### Rollback Procedures

#### QUAL Rollback
```bash
# QUAL uses local builds - just rebuild previous version
git checkout <previous-commit>
./scripts/qual_deploy.sh --all
```

#### STAGE Rollback
```bash
# STAGE is internal only - rebuild previous release
git checkout <previous-commit>
./scripts/deploy_stage.sh --all
```

#### BETA Rollback
```bash
# Option 1: Deploy previous version to beta
git checkout <previous-commit>
./scripts/deploy_beta.sh --all

# Option 2: Wait for automatic expiration (30 days TestFlight)
# Option 3: Remove build from TestFlight/Play Console
```

**Warning:** BETA uses production database - rolling back app doesn't rollback data!

#### PROD Rollback

**Web (Fast):**
```bash
ssh stackmap-cpanel "cd ~/public_html && git checkout <commit-hash>"
# Takes effect immediately
```

**Mobile (Slow):**
```bash
# 1. Submit previous version as new release
git checkout <previous-commit>
./scripts/prod_deploy.sh ios
./scripts/prod_deploy.sh android

# 2. Wait for review (24-48 hours)
# 3. Users must update to get rollback
```

**Database (Manual):**
```bash
# Database rollback requires manual intervention
# Contact DBA or restore from backup
# Point-in-time recovery may be required
```

### Deployment Frequency Guidelines

| Tier | Recommended Frequency | Maximum Frequency | Notes |
|------|----------------------|-------------------|-------|
| QUAL | Multiple per day | Unlimited | As often as needed |
| STAGE | Before each beta | 1-2 times per week | Always before beta |
| BETA | 1-2 times per week | 2-3 times per week | Allow time for testing |
| PROD | Weekly or bi-weekly | Once per week | Avoid frequent changes |

### Version Management Best Practices

**Version Format:**
```
YYYY.MM.DD.BUILD[-suffix]

Examples:
- QUAL:  2025.10.11.1
- STAGE: 2025.10.11.1-stage
- BETA:  2025.10.11.1-beta
- PROD:  2025.10.11.1
```

**Version Flow:**
1. QUAL increments version automatically
2. STAGE adds `-stage` suffix (no increment)
3. BETA removes stage suffix, adds `-beta` (no increment)
4. PROD removes beta suffix (no increment)

**Key Rules:**
- Only QUAL increments version number
- STAGE/BETA/PROD inherit version from previous tier
- Suffixes indicate deployment tier
- Production has clean version (no suffix)

### Communication Strategy

**QUAL Deployments:**
- No announcement needed
- Developers notify each other informally
- Check commit messages for changes

**STAGE Deployments:**
- Notify internal team via Slack/email
- Share TestFlight/Play Console link
- Request feedback within 24 hours

**BETA Deployments:**
- Announce to beta testers
- Include release notes
- Highlight areas needing testing
- Set feedback deadline

**PROD Deployments:**
- Public announcement (blog/social media)
- Send push notifications
- Update App Store/Play Store descriptions
- Monitor support channels

---

## Future Enhancements

### Potential Improvements

1. **Automated STAGE Validation**
   - Run automated test suite on STAGE builds
   - Block beta deployment if tests fail
   - Generate test reports

2. **Separate STAGE Database**
   - Create dedicated stage database
   - Populate with realistic test data
   - Test data migrations safely

3. **STAGE Web Deployment**
   - Add `stackmap.app/stage/` for web testing
   - Validate release builds for web
   - Consistent testing across all platforms

4. **Phased Rollout for PROD**
   - iOS: Staged rollout in App Store
   - Android: Percentage-based rollout
   - Monitor error rates before full release

5. **Monitoring and Alerts**
   - Tier-specific monitoring dashboards
   - Error rate alerts per tier
   - Performance metrics tracking

6. **CI/CD Integration**
   - Automated deployment pipelines
   - GitHub Actions workflows
   - Automated testing on pull requests

7. **Feature Flags**
   - Enable/disable features per tier
   - Gradual feature rollout
   - Quick feature kill switch

8. **Environment Indicators**
   - Visual indicator in app (dev menu)
   - Tier badge in settings screen
   - Debug info overlay

---

## Troubleshooting

### Wrong API Endpoint

**Symptoms:**
- App connects to wrong database
- Sync fails with 404 errors
- Data doesn't match expected tier

**Diagnosis:**
```bash
# Check build logs for BUILD_TYPE
# Look for [BuildConfig] messages

# Android
adb logcat | grep BuildConfig

# iOS
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "StackMap"' | grep BuildConfig
```

**Solutions:**
1. Verify build flavor (Android) or scheme (iOS)
2. Rebuild app (environment set at build time)
3. Clear Metro cache: `npx react-native start --reset-cache`
4. Check `/src/config/buildConfig.js` imports

### Database Connection Issues

**Symptoms:**
- Sync returns errors
- Data not saving
- Authentication fails

**Diagnosis:**
1. Check API endpoint is accessible: `curl <API_URL>`
2. Verify database credentials on server
3. Check network connectivity
4. Review server logs

**Solutions:**
1. Verify API endpoint configuration
2. Check server-side database connection
3. Confirm firewall rules allow connections
4. Test with curl/Postman first

### TestFlight/Play Console Issues

**Symptoms:**
- Build not appearing in TestFlight
- Play Console shows error
- Testers can't install

**Common Issues:**

**iOS:**
- Build stuck in processing (wait 15 minutes)
- Certificate/provisioning profile issues
- Bundle ID mismatch
- Version conflict

**Android:**
- Package name mismatch
- Signing key mismatch
- Version code conflict
- Missing permissions declaration

**Solutions:**
1. Check App Store Connect / Play Console status
2. Review fastlane logs
3. Verify signing configuration
4. Ensure version incremented properly

### STAGE Not Using Qual Database

**Symptoms:**
- STAGE appears to use production data
- Data doesn't match QUAL

**Diagnosis:**
```bash
# Check BUILD_TYPE in logs
# Verify API endpoint

# Expected for STAGE:
BUILD_TYPE = 'stage'
API_URL = 'https://stackmap.app/qual/api/sync'
```

**Solutions:**
1. Verify STAGE build uses correct flavor/scheme
2. Check buildConfig.js mapping: stage → qual API
3. Rebuild STAGE (environment set at build time)
4. Confirm server routes `/qual/api/` to qual database

---

## Related Documentation

### Core Deployment Guides
- **[Deployment README](./README.md)** - Main deployment guide and quick reference
- **[Four-Tier Build Guide](./FOUR_TIER_BUILD_GUIDE.md)** - Detailed build commands and configuration
- **[Beta Deployment Guide](./BETA_DEPLOYMENT_GUIDE.md)** - Complete beta deployment workflow
- **[Stage Deployment Setup](./STAGE_DEPLOYMENT_SETUP.md)** - STAGE tier configuration details

### Platform-Specific
- **[iOS Fastlane Guide](../../ios/fastlane/DEPLOYMENT_GUIDE.md)** - iOS deployment automation
- **[Android Fastlane Guide](../../android/fastlane/DEPLOYMENT_GUIDE.md)** - Android deployment automation

### Development
- **[Testing Guide](../testing/simple-testing-guide.md)** - Testing requirements per tier
- **[CLAUDE.md](../../CLAUDE.md)** - Development workflow and deployment commands

### Technical Reference
- **[Build Configuration](../../src/config/buildConfig.js)** - API endpoint mapping logic
- **[Sync Service](../../src/services/sync/minimalSyncService.js)** - API endpoint usage

---

## Appendix: Command Reference

### Quick Command Reference

```bash
# QUAL - Development testing
./scripts/qual_deploy.sh [--web] [--android] [--ios] [--ios-device]

# STAGE - Internal validation (mobile only)
./scripts/deploy_stage.sh [--ios] [--android] [--all]

# BETA - External testing
./scripts/deploy_beta.sh [--web] [--ios] [--android] [--all]

# PROD - Production release
./scripts/prod_deploy.sh [web|ios|android|all]
```

### Direct Fastlane Commands

```bash
# iOS
cd ios
fastlane stage_ios      # STAGE
fastlane beta_ios       # BETA
fastlane prod_ios       # PROD

# Android
cd android
fastlane stage_android  # STAGE
fastlane beta_android   # BETA
fastlane prod_android   # PROD
```

### Verification Commands

```bash
# Check current version
grep '"version":' package.json

# Check git status
git status

# Check connected devices
adb devices             # Android
xcrun simctl list devices | grep Booted  # iOS

# Check API endpoint (in app logs)
# Look for: [BuildConfig] API URL: https://...
```

---

**Document Version:** 1.0
**Last Updated:** October 11, 2025
**Next Review:** After first production deployment using four-tier system
**Maintainer:** DevOps Team
