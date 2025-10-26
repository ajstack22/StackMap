# StackMap Deployment Guide
**Last Updated:** January 2025

## 🚀 Four-Tier Deployment Strategy

StackMap uses a four-tier deployment approach for controlled releases:

```
QUAL → STAGE → BETA → PROD
(multiple/day) → (before beta) → (1-2/week) → (weekly/bi-weekly)
```

### Deployment Flow Overview

| Tier | Purpose | API Endpoint | Database | Platforms | Git State | Frequency |
|------|---------|-------------|----------|-----------|-----------|-----------|
| **QUAL** | Development testing | qual-api.stackmap.app | Qual DB | Web + Mobile | Allows uncommitted | Multiple/day |
| **STAGE** | Internal validation | qual-api.stackmap.app | Qual DB | Mobile only | Allows uncommitted | Before beta |
| **BETA** | Closed beta testing | beta-api.stackmap.app | Prod DB | Beta web + Mobile | Requires clean | 1-2/week |
| **PROD** | Public release | api.stackmap.app | Prod DB | Web + Mobile | Requires clean | Weekly/bi-weekly |

### Quick Start

```bash
# Tier 1: QUAL - Local testing (simulators/emulators + qual web)
./scripts/qual_deploy.sh

# Tier 2: STAGE - Internal validation (mobile only, qual DB)
./scripts/deploy_stage.sh --all

# Tier 3: BETA - TestFlight + Play Internal Testing + beta web
./scripts/deploy_beta.sh --all

# Tier 4: PROD - App Store + Play Production + prod web
./scripts/prod_deploy.sh all
```

### Platform-Specific Options

```bash
# QUAL Options
./scripts/qual_deploy.sh --android --ios  # Android + iOS only to qual
./scripts/qual_deploy.sh --web           # Web to qual staging
./scripts/qual_deploy.sh --ios-device    # iOS physical device

# STAGE Options (Mobile only, qual DB)
./scripts/deploy_stage.sh --all      # All mobile platforms (recommended)
./scripts/deploy_stage.sh --ios      # iOS TestFlight only
./scripts/deploy_stage.sh --android  # Android Play Internal Testing only

# BETA Options (Prod DB)
./scripts/deploy_beta.sh --all      # All platforms (recommended)
./scripts/deploy_beta.sh --ios      # iOS TestFlight only
./scripts/deploy_beta.sh --android  # Android Play Internal Testing only
./scripts/deploy_beta.sh --web      # Web beta (qual environment)

# PROD Options
./scripts/prod_deploy.sh all      # Full production deploy
./scripts/prod_deploy.sh web      # Deploy web only
./scripts/prod_deploy.sh android  # Build Android AAB only
./scripts/prod_deploy.sh ios      # Prepare iOS for archive
```

### Deployment Guides

- **[Beta Deployment Guide](./BETA_DEPLOYMENT_GUIDE.md)** - Complete guide for beta deployments
- **[Four-Tier Strategy](./FOUR_TIER_BUILD_GUIDE.md)** - Detailed architecture and implementation plan
- **[Stage Deployment Setup](./STAGE_DEPLOYMENT_SETUP.md)** - Stage tier configuration guide

## 🎯 When to Deploy to Each Tier

### QUAL (Development Testing)
**Deploy when:**
- Testing new features in development
- Debugging issues locally
- Verifying UI changes
- Running multiple tests per day

**Characteristics:**
- Uses qual database (safe for testing)
- Available on web at stackmap.app/qual
- Fast iteration cycle
- No external testers involved
- **Git requirements:** Allows uncommitted changes (rapid development)

### STAGE (Internal Validation)
**Deploy when:**
- Feature is complete and tested in QUAL
- Ready for internal team validation
- Need to verify on real devices before beta
- Want to test with qual database before switching to prod

**Characteristics:**
- Mobile-only (no web deployment)
- Uses qual database (safe sandbox)
- Internal team testing
- Final check before beta release
- **Git requirements:** Allows uncommitted changes (internal testing)

### BETA (Closed Beta Testing)
**Deploy when:**
- Feature passed internal validation in STAGE
- Ready for external beta testers
- Need feedback from real users
- Testing with production database

**Characteristics:**
- Uses production database (real data)
- Available on beta web and TestFlight/Play Internal
- External testers involved
- 1-2 deployments per week
- **Git requirements:** Requires clean git state (traceability)

### PROD (Public Release)
**Deploy when:**
- Feature thoroughly tested in BETA
- All feedback addressed
- Ready for public release
- Stable and production-ready

**Characteristics:**
- Public-facing release
- Full production environment
- Weekly or bi-weekly cadence
- Requires highest quality standards
- **Git requirements:** Requires clean git state (traceability)

## 🔌 API Endpoint Mapping

| Tier | Mobile Build Type | API Endpoint | Database | Web URL |
|------|------------------|--------------|----------|---------|
| **QUAL** | qual | https://qual-api.stackmap.app | Qual DB | stackmap.app/qual |
| **STAGE** | stage | https://qual-api.stackmap.app | Qual DB | N/A (mobile only) |
| **BETA** | beta | https://beta-api.stackmap.app | Prod DB | stackmap.app/qual (beta web) |
| **PROD** | release | https://api.stackmap.app | Prod DB | stackmap.app |

**Key Points:**
- STAGE uses qual DB but is a separate mobile build type
- BETA switches to production database for real-world testing
- Web beta still uses qual environment but connects to beta API

## 📱 Platform Deployment Details

### iOS Deployment
```bash
# QUAL tier (development testing)
./scripts/deploy.sh qual --ios              # Simulator build
./scripts/qual_deploy.sh --ios-device       # Physical device

# STAGE tier (internal validation)
./scripts/deploy.sh stage --ios             # TestFlight internal

# BETA tier (closed beta)
./scripts/deploy.sh beta --ios              # TestFlight beta

# PROD tier (public release)
./scripts/deploy.sh prod --ios              # App Store submission
```

**iOS builds are now fully automated** - no manual Xcode steps required for any tier!

### Android Deployment
```bash
# QUAL tier (development testing)
./scripts/deploy.sh qual --android          # Local device/emulator

# STAGE tier (internal validation)
./scripts/deploy.sh stage --android         # Play Internal Testing

# BETA tier (closed beta)
./scripts/deploy.sh beta --android          # Play Internal Testing (beta)

# PROD tier (public release)
./scripts/deploy.sh prod --android          # Play Store production
```

**Strategy:**
- Physical devices: Standalone APK with bundled JS
- Emulators: Metro development build

**Manual Builds:**
```bash
# Debug APK
cd android && ./gradlew assembleDebug

# Release APK
cd android && ./gradlew assembleRelease

# Play Store Bundle
cd android && ./gradlew bundleRelease
```

**⚠️ Build Time:** Android Gradle builds take 2-3 minutes. When using automated tools, ensure timeout is set to at least 10 minutes (600000ms) to allow builds to complete.

### Web Deployment

#### Stage 1: Deploy to Qual (Staging)
```bash
./scripts/qual_deploy.sh --web  # Builds and deploys to stackmap.app/qual
```

#### Stage 2: Promote Qual to Production
```bash
./scripts/prod_deploy.sh web       # Sync qual to production
./scripts/prod_deploy.sh rollback  # Rollback if needed
```

**Production URL:** https://stackmap.app/
**Staging URL:** https://stackmap.app/qual/

**Manual SSH Access:**
```bash
ssh stackmap-cpanel  # Requires SSH key setup
```

## 🧪 Automated Testing Requirements (Sep 2025)
**IMPORTANT:** All deployments now enforce mandatory Jest testing. Tests cannot be skipped.

### Testing Pipeline
1. **Release Notes** - Prompted for uncommitted changes
2. **Jest Tests** - ALL tests must pass (no exceptions)
3. **Coverage Check** - Minimum 50% coverage required
4. **Deployment** - Only proceeds if tests pass

### Test Commands
```bash
npm test           # Run all tests (automatic in deployment)
npm test:watch     # Development mode
npm test:coverage  # Generate coverage report
```

## 🔄 Version Management
- **Format:** `YYYY.MM.DD.BUILD`
- **Automatic:** All scripts increment version
- **Unified:** Single version across all platforms
- **Files Updated:** `package.json`, `app.json`, iOS `Info.plist`

## 📝 Commit Message Management
The deployment script automatically creates descriptive commit messages using `PENDING_CHANGES.md`:

### How It Works
1. **Before deployment**, update `PENDING_CHANGES.md`:
   ```markdown
   # Pending Changes
   
   ## Title: Fix critical sync bug with timestamp preservation
   
   ### Changes Made:
   - Fixed sync issue where activities reverted state
   - Added preservation of timestamp metadata fields
   - Improved conflict resolution reliability
   ```

2. **During deployment**, the script:
   - Extracts the title from `## Title:` line
   - Extracts description from `### Changes Made:` section
   - Creates commit message: `2025.08.24.1 - Fix critical sync bug with timestamp preservation`
   - Includes the full description in the commit body

3. **After successful commit**, the script clears `PENDING_CHANGES.md` for next deployment

### Benefits
- **Consistent Format:** Version number always at the beginning
- **Descriptive History:** Git log shows meaningful change summaries
- **Auto-cleanup:** File resets after each deployment
- **Fallback:** If no title provided, uses default "Deployment version bump"

## 🧪 Testing Integration
- **Automatic:** Essential tests run before every deployment
- **Skip for Emergency:** Use `--skip-tests` flag
- **What's Tested:**
  - App.js structure and imports
  - Critical services exist (sync, store)
  - Common issues (excessive console.logs)
- **No Complexity:** Simple bash checks, no frameworks

## 📋 Pre-Deployment Checklist
```bash
# 1. Check git status
git status

# 2. Ensure on main branch
git branch --show-current

# 3. Pull latest
git pull origin main

# 4. Check connected devices
adb devices  # Android
xcrun simctl list devices | grep Booted  # iOS
```

## 🔧 Common Issues & Fixes

### Bundle not found on Web
Files must be in root directory, not web/build/

### iOS Build Fails
```bash
cd ios && pod install
# Or in Xcode: Product → Clean Build Folder
```

### Android Build Fails
```bash
cd android && ./gradlew clean
./gradlew --stop  # Stop Gradle daemon
```

### Version Not Incrementing
All scripts handle this automatically via `scripts/version-increment.sh`

## 🆘 Emergency Rollback
```bash
# Web rollback
ssh stackmap-cpanel "cd ~/public_html/qual && git log --oneline -5"
ssh stackmap-cpanel "cd ~/public_html/qual && git checkout <commit-hash>"

# Mobile: Reinstall previous APK/IPA from backups
```

## 🔐 Security Notes
- Never commit API keys or secrets
- Keystore files kept secure
- All deployments use HTTPS
- Certificates managed per platform

## 📝 Environment Configuration

### Platform Identifiers

**iOS Bundle IDs:**
- QUAL: `app.stackmap.qual` (local simulator only)
- STAGE/BETA/PROD: `app.stackmap` (single bundle ID)

**Android Package Names:**
- All environments: `com.stackmapnative` (single package name)

**Strategy Rationale:**
Both platforms use a single identifier for distribution tiers (stage/beta/prod):
- **iOS:** TestFlight requires same bundle ID for Internal/External testing groups
- **Android:** Play Store tracks differentiate same package name builds
- **Benefits:** Simpler app store management, automatic provisioning, matches platform requirements

**Differentiation:**
- iOS: TestFlight groups (Internal vs External) + display names + BUILD_TYPE_ENV
- Android: Gradle flavors + Play Store tracks + display names

### API Endpoints by Tier
- **QUAL:** `https://qual-api.stackmap.app/api/sync/` (Qual DB)
- **STAGE:** `https://qual-api.stackmap.app/api/sync/` (Qual DB)
- **BETA:** `https://beta-api.stackmap.app/api/sync/` (Prod DB)
- **PROD:** `https://api.stackmap.app/api/sync/` (Prod DB)

### Web URLs
- **QUAL Web:** `https://stackmap.app/qual/`
- **BETA Web:** `https://stackmap.app/qual/` (uses beta API endpoint)
- **PROD Web:** `https://stackmap.app/`

### Build Types (Mobile)
Each tier uses a different build configuration:
- **qual:** Development testing with qual database
- **stage:** Internal validation with qual database
- **beta:** External testing with production database
- **release:** Public release with production database

---

**Remember:** Follow the four-tier progression: QUAL → STAGE → BETA → PROD