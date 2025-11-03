# Fastlane Integration Roadmap
**StackMap 4-Tier Deployment Enhancement**

Last Updated: 2025-10-12

---

## 🎯 Overview

This roadmap outlines fastlane enhancements to improve automation, testing, and deployment consistency across all 4 tiers (QUAL/STAGE/BETA/PROD) on both iOS and Android platforms.

**Current Status:**
- ✅ iOS: Comprehensive Fastfile (29KB, 15 lanes)
- ✅ Android: Good Fastfile (18KB, 12 lanes)
- ✅ 4-tier deployment system operational
- ✅ iOS build variants configured (xcconfig-based)
- ✅ Android product flavors configured

**Goal:** Achieve parity, add automated testing, improve code signing, and enhance visibility.

---

## 🚀 Quick Start - How to Use This Roadmap

Each task includes a **complete Atlas prompt** that you can copy-paste directly. The prompts are designed to:

1. ✅ **Load the roadmap** - Every prompt starts with "CONTEXT: Read docs/deployment/FASTLANE_INTEGRATION_ROADMAP.md, section X.X"
2. ✅ **Reference specific files and line numbers** - So the LLM knows exactly where to look and what to modify
3. ✅ **Include expected outcomes** - So you know what "done" looks like
4. ✅ **Specify Atlas workflow tier** - Iterative for simple tasks, Standard for complex ones

### Example: Starting Task 1.1

Simply copy this entire block and paste as your prompt:

```
CONTEXT: Read docs/deployment/FASTLANE_INTEGRATION_ROADMAP.md, section 1.1 for full context.

TASK: Add qual_android lane to android/fastlane/Fastfile for local QUAL testing.

REQUIREMENTS:
1. Build qualDebug APK (gradle task: assembleQualDebug)
2. Install to running Android emulator via adb
3. Display success message with package ID (com.stackmapnative.qual) and environment
4. Follow pattern from existing stage_android/beta_android lanes (lines 378-403)
5. Reference qual_deploy.sh (lines 270-295) for Android qual build approach

EXPECTED LOCATION: Add after line 403 in android/fastlane/Fastfile

Use Atlas Iterative workflow.
```

The LLM will:
- Read the roadmap for context
- Look at the referenced files and line numbers
- Implement following the existing patterns
- Use the appropriate workflow tier

### ⚠️ Important: Context is Key

Each prompt explicitly tells the LLM to read this roadmap file for full context. This ensures:
- The LLM understands the "why" behind each task
- It can see how tasks connect to the overall plan
- It has all the architectural context needed

---

## 📊 Roadmap Phases

### Phase 1: Platform Parity (Week 1)
**Priority:** HIGH | **Effort:** 2-4 hours | **Risk:** LOW

Fill gaps between iOS and Android fastlane implementations.

### Phase 2: Automated Testing (Week 1-2)
**Priority:** HIGH | **Effort:** 4-6 hours | **Risk:** MEDIUM

Integrate unit and UI tests into quality gates.

### Phase 3: Code Signing Automation (Week 2)
**Priority:** MEDIUM | **Effort:** 3-4 hours | **Risk:** MEDIUM

Automate certificate/keystore management with `match`.

### Phase 4: Enhanced Visibility (Week 2-3)
**Priority:** MEDIUM | **Effort:** 2-3 hours | **Risk:** LOW

Add notifications and better deployment tracking.

### Phase 5: Metadata Management (Week 3)
**Priority:** LOW | **Effort:** 2-3 hours | **Risk:** LOW

Version control App Store/Play Store metadata.

### Phase 6: Advanced Automation (Week 4+)
**Priority:** LOW | **Effort:** 6-8 hours | **Risk:** MEDIUM

Screenshot automation, symbol uploads, and artifact management.

---

## 🚀 Phase 1: Platform Parity

### 1.1 Android - Add QUAL Deployment Lane
**Files:** `android/fastlane/Fastfile`
**Status:** ❌ Missing
**Workflow:** 🔵 **Iterative** (simple addition, needs validation)

**What:** Add `qual_android` lane to match iOS qual deployment.

**Why:** Currently Android qual deployment is manual via gradle. Should match iOS automation level.

**Scope:**
- New lane `qual_android` that builds qual flavor
- Installs to running emulator (like iOS does to simulator)
- No Play Store upload (local testing only)

**Atlas Prompt:**
```
CONTEXT: Read docs/deployment/FASTLANE_INTEGRATION_ROADMAP.md, section 1.1 for full context.

TASK: Add qual_android lane to android/fastlane/Fastfile for local QUAL testing.

REQUIREMENTS:
1. Build qualDebug APK (gradle task: assembleQualDebug)
2. Install to running Android emulator via adb
3. Display success message with package ID (com.stackmapnative.qual) and environment
4. Follow pattern from existing stage_android/beta_android lanes (lines 378-403)
5. Reference qual_deploy.sh (lines 270-295) for Android qual build approach

EXPECTED LOCATION: Add after line 403 in android/fastlane/Fastfile

Use Atlas Iterative workflow.
```

**Expected Outcome:**
```ruby
lane :qual_android do
  UI.message("🚀 Building qual debug APK for local testing...")
  gradle(task: "assembleQualDebug", project_dir: "./")

  # Install to emulator
  sh("adb install -r app/build/outputs/apk/qual/debug/app-qual-debug.apk")

  UI.success("✅ Qual APK installed!")
  UI.message("Package: com.stackmapnative.qual")
  UI.message("Environment: QUAL (using qual/api endpoint)")
end
```

---

### 1.2 Android - Add Production Deployment Lane
**Files:** `android/fastlane/Fastfile`
**Status:** ❌ Missing (only has `promote_to_production`)
**Workflow:** 🟡 **Standard** (needs research on Play Store production deployment)

**What:** Add `prod_android` lane for direct production builds and uploads.

**Why:** Currently Android only promotes from internal→production. Need direct prod deployment like iOS has.

**Scope:**
- New lane `prod_android`
- Builds prod flavor AAB
- Uploads to Play Store production track
- Includes release notes from PENDING_CHANGES.md

**Atlas Prompt:**
```
CONTEXT: Read docs/deployment/FASTLANE_INTEGRATION_ROADMAP.md, section 1.2 for full context.

TASK: Add prod_android lane to android/fastlane/Fastfile for Play Store production deployment.

REQUIREMENTS:
1. Research Play Store production track deployment (currently only promote_to_production exists at line 428)
2. Build prod flavor AAB using build_release_flavor(flavor: "prod")
3. Create load_release_notes_from_file helper (similar to iOS Fastfile lines 681-709)
4. Upload to Play Store production track with release notes
5. Use upload_to_play_store_with_retry helper pattern (lines 291-343)
6. Include validation (validate_signing) and version checking (check_and_increment_version)

REFERENCE FILES:
- android/fastlane/Fastfile lines 353-376 (beta_android pattern to follow)
- ios/fastlane/Fastfile lines 729-814 (prod_ios for reference)
- PENDING_CHANGES.md (source for release notes)

Use Atlas Standard workflow.
```

**Expected Outcome:**
- Ability to deploy prod builds directly (not just promote)
- Consistent with iOS prod_ios lane behavior
- Integrated with PENDING_CHANGES.md workflow

---

### 1.3 iOS - Add Automated Testing Lane
**Files:** `ios/fastlane/Fastfile`, iOS test target configuration
**Status:** ❌ Missing
**Workflow:** 🟡 **Standard** (needs test target setup + lane implementation)

**What:** Add `test` lane using `scan`/`run_tests` for iOS unit and UI tests.

**Why:** Android has testing lanes, iOS doesn't. Need parity for quality gates.

**Scope:**
- New lane `test` for unit tests
- New lane `test_ui` for UI tests (optional)
- Integration with quality gates in qual_deploy.sh
- Code coverage reporting

**Atlas Prompt:**
```
CONTEXT: Read docs/deployment/FASTLANE_INTEGRATION_ROADMAP.md, section 1.3 for full context.

TASK: Add iOS automated testing lanes to ios/fastlane/Fastfile to match Android testing capability.

REQUIREMENTS:
1. Research: Check ios/StackMapNative.xcodeproj for existing test targets
2. If test targets exist:
   - Add 'test' lane using run_tests action (scan)
   - Target iPhone 16 Pro simulator
   - Output coverage to ./test_output/
   - Add 'test_ui' lane if UI test target exists
3. If no test targets exist:
   - Document what's needed (reference Phase 2.1 in roadmap)
   - Create placeholder lane that warns tests not configured
4. Follow pattern from android/fastlane/Fastfile lines 177-204 (test lanes)

REFERENCE FILES:
- ios/StackMapNative.xcodeproj/project.pbxproj (search for test targets)
- ios/fastlane/Fastfile (add after line 427, before deployment lanes)
- Android equivalent: android/fastlane/Fastfile lines 177-204

Use Atlas Standard workflow.
```

**Expected Outcome:**
```ruby
lane :test do
  run_tests(
    scheme: "StackMapNative",
    devices: ["iPhone 16 Pro"],
    code_coverage: true,
    output_directory: "./test_output",
    fail_build: false  # Don't block qual on test failures initially
  )
end
```

---

### 1.4 iOS - Add QUAL Deployment Lane
**Files:** `ios/fastlane/Fastfile`
**Status:** ❌ Missing (manual via react-native run-ios)
**Workflow:** 🔵 **Iterative** (simple addition, matches existing patterns)

**What:** Add `qual_ios` lane for local iOS simulator deployment.

**Why:** Consistency with Android qual_android, better automation than react-native CLI.

**Scope:**
- New lane `qual_ios` that builds Qual configuration
- Installs to iPhone 16 Pro simulator
- No TestFlight upload (local testing only)

**Atlas Prompt:**
```
CONTEXT: Read docs/deployment/FASTLANE_INTEGRATION_ROADMAP.md, section 1.4 for full context.

TASK: Add qual_ios lane to ios/fastlane/Fastfile for local simulator deployment.

REQUIREMENTS:
1. Build with Qual configuration (uses ios/Qual.xcconfig for bundle ID app.stackmap.qual)
2. Target "iPhone 16 Pro" simulator (matches APP_IOS_TEST_PHONE in scripts/deploy/app-config.sh line 112)
3. Skip IPA packaging (simulator doesn't need it)
4. Display success with bundle ID, app name, and environment
5. Follow pattern from build_debug lane (lines 400-427) but with Qual configuration

REFERENCE FILES:
- ios/fastlane/Fastfile lines 400-427 (build_debug pattern)
- ios/Qual.xcconfig (defines PRODUCT_BUNDLE_IDENTIFIER and PRODUCT_NAME)
- qual_deploy.sh lines 226-246 (current manual approach using npx react-native run-ios)

EXPECTED LOCATION: Add after line 427 in ios/fastlane/Fastfile

Use Atlas Iterative workflow.
```

**Expected Outcome:**
```ruby
lane :qual_ios do
  UI.message("🚀 Building qual for simulator...")

  build_app(
    workspace: "StackMapNative.xcworkspace",
    scheme: "StackMapNative",
    configuration: "Qual",
    destination: "platform=iOS Simulator,name=iPhone 16 Pro",
    skip_package_ipa: true,
    skip_archive: true
  )

  UI.success("✅ Qual build installed on iPhone 16 Pro!")
  UI.message("Bundle ID: app.stackmap.qual")
  UI.message("App Name: StackMap QUAL")
end
```

---

## 🧪 Phase 2: Automated Testing

### 2.1 iOS Test Target Setup
**Files:** `ios/StackMapNative.xcodeproj`, test files
**Status:** ❌ Unknown (need to verify)
**Workflow:** 🟡 **Standard** (requires research + implementation)

**What:** Create iOS test targets for unit and UI tests.

**Why:** Required before automated testing lane can work.

**Scope:**
- Create StackMapNativeTests target (unit tests)
- Create StackMapNativeUITests target (UI tests)
- Add sample tests for critical paths (sync, auth, data normalization)
- Configure test schemes

**Atlas Prompt:**
```
Research and set up iOS test targets for StackMap.
1. Check if StackMapNative.xcodeproj has test targets
2. If not, create StackMapNativeTests and StackMapNativeUITests targets
3. Add 3 critical unit tests:
   - Sync service basic functionality
   - Data normalizer field handling
   - Store updates working correctly
4. Configure test schemes for fastlane

Document setup process for future reference.
Use Atlas Standard workflow.
```

**Expected Outcome:**
- Working iOS test targets
- Basic test coverage for critical paths
- Documentation of test setup process

---

### 2.2 Android Test Enhancement
**Files:** `android/app/src/test/`, `android/fastlane/Fastfile`
**Status:** ⚠️ Partial (test lane exists but commented out)
**Workflow:** 🟡 **Standard** (needs test implementation + quality gate integration)

**What:** Enhance Android tests and integrate with quality gates.

**Why:** Test lane exists but `test_critical` is commented out. Need working tests.

**Scope:**
- Implement unit tests for critical Android-specific code
- Create test suite that runs in CI/qual deployment
- Integrate with quality gates system
- Uncomment and activate `test_critical` in beta_android/stage_android lanes

**Atlas Prompt:**
```
Enhance Android testing for StackMap:
1. Review existing test infrastructure in android/app/src/test/
2. Create 3 critical unit tests if missing:
   - BuildConfig flavor handling
   - Native module integration
   - Basic app launch test
3. Update android/fastlane/Fastfile to uncomment test_critical
4. Integrate Android tests with quality gates in scripts/deploy/lib/quality-gates.sh

Use Atlas Standard workflow.
```

**Expected Outcome:**
- Working Android unit tests
- Tests run during qual/stage/beta deployments
- Integrated with quality gate reporting

---

### 2.3 Quality Gate Integration
**Files:** `scripts/deploy/lib/quality-gates.sh`, deployment scripts
**Status:** ❌ Missing mobile test integration
**Workflow:** 🔵 **Iterative** (adding to existing system)

**What:** Add iOS and Android test results to quality gate dashboard.

**Why:** Currently quality gates only run JS/web tests. Need native test coverage.

**Scope:**
- Add `run_ios_tests()` function to quality-gates.sh
- Add `run_android_tests()` function to quality-gates.sh
- Update status page template to show native test results
- Add to qual_deploy.sh and deploy.sh

**Atlas Prompt:**
```
Integrate iOS and Android tests into quality gates system:
1. Add run_ios_tests() and run_android_tests() functions to scripts/deploy/lib/quality-gates.sh
2. Call fastlane test lanes and parse results
3. Export results to /tmp/stackmap-ios-tests and /tmp/stackmap-android-tests
4. (HTML status page removed in v2025.11.01 - display results in console instead)
5. Integrate into scripts/deploy/qual_deploy.sh when --ios or --android flags used

Use Atlas Iterative workflow.
```

**Expected Outcome:**
- Native tests visible in deployment status page
- Test results included in quality gate pass/fail logic
- Consistent testing across all platforms

---

## 🔐 Phase 3: Code Signing Automation

### 3.1 iOS Match Setup
**Files:** `ios/fastlane/Matchfile`, `ios/fastlane/Fastfile`
**Status:** ❌ Missing
**Workflow:** 🟡 **Standard** (requires careful planning + secrets management)

**What:** Implement `match` for iOS certificate and provisioning profile management.

**Why:** Currently using manual certificate management. Match enables team collaboration and CI/CD.

**Scope:**
- Set up private git repo for certificates (or use encrypted storage)
- Create Matchfile configuration
- Add `setup_match` lane
- Update beta_ios/stage_ios/prod_ios to use match
- Document encryption password management

**Atlas Prompt:**
```
Implement fastlane match for iOS code signing:
1. Research match setup options (git vs encrypted storage)
2. Create Matchfile for StackMap with 4 bundle IDs (qual/stage/beta/prod)
3. Add setup_match lane to handle certificate sync
4. Update existing deployment lanes to call match before building
5. Document password/encryption key management for team

Consider security implications - certificates are sensitive.
Use Atlas Standard workflow.
```

**Expected Outcome:**
```ruby
# Matchfile
git_url("git@github.com:stackmap/certificates.git")
storage_mode("git")
type("appstore")

# StackMap uses single bundle ID for stage/beta/prod
app_identifier([
  "app.stackmap",        # Used by stage, beta, and prod
  "app.stackmap.qual"    # Used by qual only (local testing)
])

# Fastfile addition
lane :setup_match do
  match(type: "appstore", readonly: true)
end
```

**Note:** StackMap uses a single bundle ID (`app.stackmap`) for all TestFlight and App Store distributions (stage/beta/prod), differentiated by TestFlight groups and display names.

---

### 3.2 Android Keystore Management
**Files:** `android/fastlane/Fastfile`, keystore storage
**Status:** ⚠️ Manual (keystore in repo)
**Workflow:** 🔵 **Iterative** (improving existing setup)

**What:** Document and improve Android keystore management.

**Why:** Currently keystore is in repo with passwords in ENV. Should document best practices.

**Scope:**
- Document current keystore setup
- Verify keystore is in .gitignore (or encrypted if in repo)
- Add validation that keystore passwords are in environment
- Create setup documentation for new team members

**Atlas Prompt:**
```
Improve Android keystore management documentation:
1. Verify android/app/stackmap-release.keystore is secure (.gitignore or encrypted)
2. Document password management (ENV vars vs Keychain)
3. Add setup_keystore lane that validates configuration
4. Create docs/deployment/ANDROID_KEYSTORE_SETUP.md with onboarding instructions
5. Update validate_signing lane with better error messages

Use Atlas Iterative workflow.
```

**Expected Outcome:**
- Clear documentation of keystore management
- Validation that prevents deployment with missing credentials
- Onboarding guide for new developers

---

## 📢 Phase 4: Enhanced Visibility

### 4.1 Slack Notifications
**Files:** `ios/fastlane/Fastfile`, `android/fastlane/Fastfile`
**Status:** ❌ Missing
**Workflow:** 🔵 **Iterative** (straightforward integration)

**What:** Add Slack notifications for deployment events.

**Why:** Team visibility into deployments, especially for stage/beta/prod.

**Scope:**
- Add `notify_deployment` helper lane (both platforms)
- Send notifications on successful deployments
- Include version, environment, platform info
- Configure webhook URL via environment variable

**Atlas Prompt:**
```
CONTEXT: Read docs/deployment/FASTLANE_INTEGRATION_ROADMAP.md, section 4.1 for full context.

TASK: Add Slack deployment notifications to both iOS and Android Fastfiles for team visibility.

REQUIREMENTS:
1. Create private_lane :notify_deployment in both Fastfiles
2. Use fastlane 'slack' action (https://docs.fastlane.tools/actions/slack/)
3. Read SLACK_WEBHOOK_URL from ENV, gracefully skip if not set
4. Include in message:
   - Platform (iOS/Android)
   - Environment (qual/stage/beta/prod)
   - Version number
   - Build number
   - Deployment status (success/failure)
5. Call from existing deployment lanes (beta/stage/prod) after successful uploads
6. Add example SLACK_WEBHOOK_URL to both ios/fastlane/.env.default and android/fastlane/.env.default

REFERENCE FILES:
- ios/fastlane/Fastfile - add helper around line 320 (near other helpers)
- android/fastlane/Fastfile - add helper around line 290 (near other helpers)
- Call from: ios lines 622-629 (beta), 681-693 (stage), 802-814 (prod)
- Call from: android lines 320-329 (beta), 401-403 (stage)

Use Atlas Iterative workflow.
```

**Expected Outcome:**
```ruby
private_lane :notify_deployment do |options|
  return unless ENV["SLACK_WEBHOOK_URL"]

  slack(
    message: "#{options[:platform]} #{options[:env]} deployment complete!",
    success: true,
    slack_url: ENV["SLACK_WEBHOOK_URL"],
    attachment_properties: {
      fields: [
        { title: "Version", value: get_version_number },
        { title: "Environment", value: options[:env] },
        { title: "Platform", value: options[:platform] }
      ]
    }
  )
end
```

---

### 4.2 Deployment Summary Report
**Files:** `ios/fastlane/Fastfile`, `android/fastlane/Fastfile`
**Status:** ❌ Missing
**Workflow:** 🔵 **Iterative** (output formatting improvement)

**What:** Generate deployment summary markdown file after each deployment.

**Why:** Better tracking and historical record of deployments.

**Scope:**
- Create `generate_deployment_summary` helper lane
- Output markdown summary to `deployments/[timestamp]-[env]-[platform].md`
- Include: version, build, changes from PENDING_CHANGES.md, test results
- Committed to repo as deployment history

**Atlas Prompt:**
```
Add deployment summary generation to fastlane:
1. Create generate_deployment_summary helper lane (both platforms)
2. Generate markdown file in deployments/ directory with:
   - Timestamp and environment
   - Version and build number
   - Changes from PENDING_CHANGES.md
   - Quality gate results (if available)
   - Success/failure status
3. Call from all deployment lanes (beta/stage/prod)
4. Format as clean markdown for easy reading

Use Atlas Iterative workflow.
```

**Expected Outcome:**
```markdown
# iOS Beta Deployment - 2025-10-12 16:30

**Version:** 25.10.12.004
**Environment:** Beta
**Status:** ✅ Success

## Changes
- Fixed sync race condition with empty activity list
- Improved error handling in data normalizer
- Updated quality gates to include iOS tests

## Quality Gates
- ✅ Security Audit: No vulnerabilities
- ✅ TypeScript: No errors
- ✅ iOS Tests: 45/45 passed
```

---

## 📝 Phase 5: Metadata Management

### 5.1 iOS Metadata in Version Control
**Files:** `ios/fastlane/metadata/`, `ios/fastlane/Fastfile`
**Status:** ❌ Missing
**Workflow:** 🟡 **Standard** (requires setup + initial metadata download)

**What:** Version control App Store metadata using fastlane `deliver`.

**Why:** App descriptions, screenshots, keywords should be versioned like code.

**Scope:**
- Run `fastlane deliver init` to download current metadata
- Create metadata/ directory structure
- Add `update_metadata` lane for metadata-only deploys
- Update prod_ios to include metadata by default

**Atlas Prompt:**
```
Set up iOS metadata management with fastlane deliver:
1. Research current App Store metadata structure
2. Run deliver init to download existing metadata to ios/fastlane/metadata/
3. Create update_metadata lane that uploads metadata without binary
4. Update prod_ios lane to upload metadata along with binary
5. Document metadata structure and workflow in docs/deployment/

Use Atlas Standard workflow.
```

**Expected Outcome:**
```
ios/fastlane/metadata/
├── en-US/
│   ├── description.txt
│   ├── keywords.txt
│   ├── marketing_url.txt
│   ├── privacy_url.txt
│   └── release_notes.txt
└── primary_category.txt
```

---

### 5.2 Android Metadata in Version Control
**Files:** `android/fastlane/metadata/`, `android/fastlane/Fastfile`
**Status:** ❌ Missing
**Workflow:** 🟡 **Standard** (similar to iOS, different structure)

**What:** Version control Play Store metadata using fastlane `supply`.

**Why:** Consistency with iOS metadata management.

**Scope:**
- Run `fastlane supply init` to download current metadata
- Create metadata/ directory structure
- Add `update_metadata` lane for metadata-only deploys
- Update prod_android to include metadata by default

**Atlas Prompt:**
```
Set up Android metadata management with fastlane supply:
1. Research current Play Store metadata structure
2. Run supply init to download existing metadata to android/fastlane/metadata/
3. Create update_metadata lane that uploads metadata without binary
4. Update prod_android lane to upload metadata along with AAB
5. Document metadata structure and workflow in docs/deployment/

Use Atlas Standard workflow.
```

**Expected Outcome:**
```
android/fastlane/metadata/
├── en-US/
│   ├── full_description.txt
│   ├── short_description.txt
│   ├── title.txt
│   └── changelogs/
│       └── default.txt
└── images/
    └── phoneScreenshots/
```

---

## 🚀 Phase 6: Advanced Automation

### 6.1 Automated Screenshot Generation
**Files:** `ios/fastlane/Fastfile`, `android/fastlane/Fastfile`, screenshot specs
**Status:** ⚠️ Partial (lanes exist, not used regularly)
**Workflow:** 🟡 **Standard** (requires UI test setup + automation)

**What:** Automate screenshot generation for all environments and locales.

**Why:** App Store/Play Store screenshots should stay current with UI changes.

**Scope:**
- Enhance existing `screenshots` lanes
- Create snapshot tests for key screens
- Generate screenshots for all 4 environments (qual/stage/beta/prod)
- Automate generation before metadata updates

**Atlas Prompt:**
```
Enhance automated screenshot generation:
1. Review existing ios/fastlane/Fastfile screenshots lane (lines 44-73)
2. Review existing android/fastlane/Fastfile screenshots lane (lines 499-530)
3. Create UI test specs for 5 key screens:
   - Onboarding
   - Main activity view
   - Library view
   - Settings
   - Sync setup
4. Update screenshots lanes to capture all key screens
5. Add screenshots_all_envs lane that generates for qual/stage/beta/prod

Use Atlas Standard workflow.
```

**Expected Outcome:**
- Automated screenshot generation on demand
- Screenshots for all environments (helps verify UI consistency)
- Ready to upload to App Store/Play Store

---

### 6.2 Crashlytics Symbol Upload
**Files:** `ios/fastlane/Fastfile`, `android/fastlane/Fastfile`
**Status:** ❌ Missing (if using Crashlytics)
**Workflow:** 🔵 **Iterative** (if Crashlytics already configured)

**What:** Automatically upload dSYMs (iOS) and mappings (Android) to Crashlytics.

**Why:** Better crash reporting with symbolicated stack traces.

**Scope:**
- Add `upload_symbols` lane (both platforms)
- Call automatically after release builds
- Verify Crashlytics is configured in project

**Atlas Prompt:**
```
Add Crashlytics symbol upload to fastlane (if Crashlytics is in use):
1. Check if Firebase Crashlytics is configured in StackMap
2. If yes, add upload_symbols_to_crashlytics action to both Fastfiles
3. Call from beta/stage/prod lanes after successful build
4. If not using Crashlytics, document this and skip

Use Atlas Iterative workflow.
```

**Expected Outcome:**
```ruby
lane :upload_symbols do
  upload_symbols_to_crashlytics(
    gsp_path: "./GoogleService-Info.plist",
    binary_path: "./Pods/FirebaseCrashlytics/upload-symbols"
  )
end
```

---

### 6.3 Build Artifact Archiving
**Files:** `ios/fastlane/Fastfile`, `android/fastlane/Fastfile`, artifact storage
**Status:** ❌ Missing
**Workflow:** 🔵 **Iterative** (depends on storage solution)

**What:** Archive release builds to cloud storage (S3/GCS) for rollback capability.

**Why:** Ability to re-deploy previous versions if issues arise.

**Scope:**
- Add `archive_build` lane (both platforms)
- Upload IPA/AAB to cloud storage with version tagging
- Create `list_archived_builds` helper for version history
- Document artifact retention policy

**Atlas Prompt:**
```
Add build artifact archiving to fastlane:
1. Determine if AWS S3 or Google Cloud Storage is preferred
2. Create archive_build lane that uploads IPA/AAB to cloud storage
3. Naming convention: [platform]/[env]/[version]/[timestamp]/[artifact]
4. Add list_archived_builds lane to show available versions
5. Document retention policy (keep last 10 versions per env?)

Use Atlas Iterative workflow.
```

**Expected Outcome:**
```ruby
lane :archive_build do |options|
  sh("aws s3 cp #{options[:ipa_path]} s3://stackmap-builds/ios/#{options[:env]}/#{get_version_number}/")
  UI.success("Archived to: s3://stackmap-builds/ios/#{options[:env]}/#{get_version_number}/")
end
```

---

## 📋 Workflow Decision Matrix

| Task | Complexity | Files | Atlas Tier | Estimated Time |
|------|-----------|-------|------------|----------------|
| 1.1 qual_android | Simple | 1 | 🔵 Iterative | 15-20 min |
| 1.2 prod_android | Medium | 1 | 🟡 Standard | 30-45 min |
| 1.3 iOS test lane | Medium | 2 | 🟡 Standard | 45-60 min |
| 1.4 qual_ios | Simple | 1 | 🔵 Iterative | 15-20 min |
| 2.1 iOS tests | Complex | 5+ | 🟡 Standard | 2-3 hours |
| 2.2 Android tests | Medium | 3-5 | 🟡 Standard | 1-2 hours |
| 2.3 Quality gates | Simple | 2 | 🔵 Iterative | 30-45 min |
| 3.1 iOS match | Complex | 3 | 🟡 Standard | 2-3 hours |
| 3.2 Keystore docs | Simple | 2 | 🔵 Iterative | 30-45 min |
| 4.1 Slack notify | Simple | 2 | 🔵 Iterative | 30-45 min |
| 4.2 Deploy summary | Simple | 2 | 🔵 Iterative | 30-45 min |
| 5.1 iOS metadata | Medium | 5+ | 🟡 Standard | 1-2 hours |
| 5.2 Android metadata | Medium | 5+ | 🟡 Standard | 1-2 hours |
| 6.1 Screenshots | Complex | 5+ | 🟡 Standard | 2-3 hours |
| 6.2 Symbol upload | Simple | 2 | 🔵 Iterative | 20-30 min |
| 6.3 Archiving | Simple | 2 | 🔵 Iterative | 30-45 min |

**Total Estimated Time:** ~16-24 hours across 6 weeks

---

## 🎯 Recommended Execution Order

### Week 1 Focus: Platform Parity + Quick Wins
```
Day 1-2: Phase 1 (Platform Parity)
  ├─ 1.1 qual_android (20 min)
  ├─ 1.4 qual_ios (20 min)
  ├─ 1.2 prod_android (45 min)
  └─ 1.3 iOS test lane (1 hour)

Day 3-4: Phase 4.1-4.2 (Visibility)
  ├─ 4.1 Slack notifications (45 min)
  └─ 4.2 Deployment summaries (45 min)
```

### Week 2 Focus: Testing
```
Day 1-3: Phase 2 (Automated Testing)
  ├─ 2.1 iOS test target (3 hours)
  ├─ 2.2 Android tests (2 hours)
  └─ 2.3 Quality gate integration (45 min)

Day 4-5: Phase 3.2 (Documentation)
  └─ 3.2 Keystore docs (45 min)
```

### Week 3 Focus: Code Signing + Metadata
```
Day 1-2: Phase 3.1 (iOS Match)
  └─ 3.1 iOS match setup (3 hours)

Day 3-5: Phase 5 (Metadata)
  ├─ 5.1 iOS metadata (2 hours)
  └─ 5.2 Android metadata (2 hours)
```

### Week 4+ Focus: Advanced Features (Optional)
```
As needed: Phase 6 (Advanced)
  ├─ 6.1 Screenshot automation (3 hours)
  ├─ 6.2 Symbol upload (30 min)
  └─ 6.3 Build archiving (45 min)
```

---

## ✅ Success Criteria

### Phase 1 Complete When:
- [ ] All 4 deployment lanes exist on both platforms (qual/stage/beta/prod)
- [ ] Both platforms have test lanes
- [ ] Documentation updated for new lanes

### Phase 2 Complete When:
- [ ] iOS and Android tests run automatically during qual deployment
- [ ] Test results appear in quality gate status page
- [ ] At least 3 critical tests exist per platform

### Phase 3 Complete When:
- [ ] iOS uses match for all certificate management
- [ ] Android keystore setup fully documented
- [ ] New team members can deploy without certificate issues

### Phase 4 Complete When:
- [ ] Slack notifications sent for stage/beta/prod deployments
- [ ] Deployment summaries generated and committed for all deployments
- [ ] Team has visibility into deployment history

### Phase 5 Complete When:
- [ ] App Store metadata in version control
- [ ] Play Store metadata in version control
- [ ] Metadata updates happen via fastlane, not manually

### Phase 6 Complete When:
- [ ] Screenshots generate automatically for all environments
- [ ] Crash symbols upload automatically
- [ ] Build artifacts archived for rollback capability

---

## 📚 Resources

**Fastlane Documentation:**
- Actions: https://docs.fastlane.tools/actions/
- Match: https://docs.fastlane.tools/actions/match/
- Deliver: https://docs.fastlane.tools/actions/deliver/
- Supply: https://docs.fastlane.tools/actions/supply/
- Scan: https://docs.fastlane.tools/actions/scan/

**StackMap Documentation:**
- Current Fastfiles:
  - iOS: `ios/fastlane/Fastfile`
  - Android: `android/fastlane/Fastfile`
- Deployment: `docs/deployment/README.md`
- Atlas Workflows: `docs/ATLAS_QUICK_REFERENCE.md`

---

## 🚨 Important Notes

1. **Test in QUAL first** - All new fastlane features should be tested in qual environment before stage/beta/prod
2. **One phase at a time** - Don't mix phases, complete one before starting next
3. **Document as you go** - Update this roadmap with actual results and gotchas
4. **Use Atlas workflows** - Follow recommended workflow tier for each task
5. **Keep it reversible** - All changes should be easy to rollback if issues arise

---

## 📝 Change Log

| Date | Phase | Change | By |
|------|-------|--------|-----|
| 2025-10-12 | Initial | Created roadmap with 6 phases | Claude |

---

**Next Action:** Start with Phase 1.1 (qual_android lane) using the provided Atlas prompt.
