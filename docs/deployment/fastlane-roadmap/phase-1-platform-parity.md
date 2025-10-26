# Phase 1: Platform Parity
**Week 1 | 4 Tasks | 3-4 Hours | HIGH Priority**

Goal: Ensure both iOS and Android have equivalent fastlane lanes for all 4 deployment tiers.

---

## 📋 Task Checklist

- [ ] 1.1 - Android qual lane (20 min)
- [ ] 1.2 - Android prod lane (45 min)
- [ ] 1.3 - iOS test lane (60 min)
- [ ] 1.4 - iOS qual lane (20 min)

---

## Task 1.1: Android - Add QUAL Deployment Lane

**Status:** ❌ To Do
**Time:** 15-20 minutes
**Workflow:** 🔵 Iterative
**Files:** `android/fastlane/Fastfile`

### What
Add `qual_android` lane to match iOS qual deployment capability.

### Why
Currently Android qual deployment is manual via gradle. Should match iOS automation level.

### Current Gap
- iOS has fastlane lanes for all tiers
- Android only has stage/beta/prod lanes
- Qual deployment happens via scripts/qual_deploy.sh manually

### Atlas Prompt (Copy This)

```
CONTEXT: Read docs/deployment/fastlane-roadmap/phase-1-platform-parity.md section 1.1 for full context.

TASK: Add qual_android lane to android/fastlane/Fastfile for local QUAL testing.

REQUIREMENTS:
1. Build qualDebug APK (gradle task: assembleQualDebug)
2. Install to running Android emulator via adb
3. Display success message with package ID (com.stackmapnative.qual) and environment
4. Follow pattern from existing stage_android/beta_android lanes (lines 378-403)
5. Reference qual_deploy.sh (lines 270-295) for Android qual build approach

EXPECTED LOCATION: Add after line 403 in android/fastlane/Fastfile

ATLAS WORKFLOW: Use Iterative workflow
- Launch developer agent to implement lane
- Launch peer-reviewer agent to validate
- You (orchestrator) guide deployment test

REFERENCE FILES:
- android/fastlane/Fastfile lines 353-376 (beta_android pattern)
- android/fastlane/Fastfile lines 378-403 (stage_android pattern)
- scripts/deploy/qual_deploy.sh lines 270-295 (current manual approach)
```

### Expected Outcome

```ruby
desc "Build and install QUAL debug APK to emulator (local testing)"
desc "Usage: fastlane qual_android"
lane :qual_android do
  UI.message("🚀 Building qual debug APK for local testing...")

  # Validate signing
  validate_signing

  # Build qual debug APK
  gradle(
    task: "assembleQualDebug",
    project_dir: "./",
    print_command: true,
    flags: "--no-daemon"
  )

  # Install to running emulator
  UI.message("Installing to Android emulator...")
  sh("adb install -r app/build/outputs/apk/qual/debug/app-qual-debug.apk")

  UI.success("✅ Qual APK installed!")
  UI.message("Package: com.stackmapnative.qual")
  UI.message("App Name: StackMap QUAL")
  UI.message("Environment: QUAL (using qual/api endpoint)")
end
```

### Verification

```bash
# 1. Ensure Android emulator is running
emulator -list-avds

# 2. Run the lane
cd android && bundle exec fastlane qual_android

# 3. Verify app appears on emulator with "StackMap QUAL" name
```

---

## Task 1.2: Android - Add Production Deployment Lane

**Status:** ❌ To Do
**Time:** 30-45 minutes
**Workflow:** 🟡 Standard
**Files:** `android/fastlane/Fastfile`

### What
Add `prod_android` lane for direct production builds and uploads.

### Why
Currently Android only promotes from internal→production. Need direct prod deployment like iOS has `prod_ios`.

### Current Gap
- iOS has `prod_ios` lane for direct production uploads
- Android only has `promote_to_production` which promotes existing build
- No way to build fresh prod AAB and upload directly

### Atlas Prompt (Copy This)

```
CONTEXT: Read docs/deployment/fastlane-roadmap/phase-1-platform-parity.md section 1.2 for full context.

TASK: Add prod_android lane to android/fastlane/Fastfile for Play Store production deployment.

REQUIREMENTS:
1. Research Play Store production track deployment best practices
2. Build prod flavor AAB using build_release_flavor(flavor: "prod")
3. Create load_release_notes_from_file helper (similar to iOS Fastfile lines 681-709)
4. Upload to Play Store production track with release notes
5. Use upload_to_play_store_with_retry helper pattern (lines 291-343)
6. Include validation (validate_signing) and version checking (check_and_increment_version)

ATLAS WORKFLOW: Use Standard workflow (5 phases)
1. Research phase → Launch general-purpose agent to research Play Store production track
2. Plan phase → You (orchestrator) design the lane structure
3. Implement phase → Launch developer agent to:
   - Create load_release_notes_from_file helper
   - Create prod_android lane
4. Review phase → Launch peer-reviewer agent (Opus) to check:
   - Error handling
   - Release notes parsing
   - Track configuration
5. Deploy phase → Guide user to test with qual first

REFERENCE FILES:
- android/fastlane/Fastfile lines 353-376 (beta_android pattern to follow)
- android/fastlane/Fastfile lines 428-466 (promote_to_production for track reference)
- ios/fastlane/Fastfile lines 729-814 (prod_ios for direct upload pattern)
- ios/fastlane/Fastfile lines 681-709 (load_release_notes_from_file to port)
- PENDING_CHANGES.md (source for release notes)
```

### Expected Outcome

```ruby
desc "Load release notes from PENDING_CHANGES.md"
private_lane :load_release_notes_from_file do
  pending_changes_path = "../../PENDING_CHANGES.md"

  if File.exist?(pending_changes_path)
    content = File.read(pending_changes_path)

    # Extract title
    title_match = content.match(/^## Title:\s*(.+)$/i)
    title = title_match ? title_match[1].strip : nil

    # Extract changes
    changes_section = content.match(/^### Changes Made:\s*\n([\s\S]+?)(?=\n###|\n##|$)/i)
    changes = changes_section ? changes_section[1].strip : nil

    # Build release notes
    if title && changes
      release_notes = "#{title}\n\n#{changes}"
      UI.message("📝 Loaded release notes from PENDING_CHANGES.md")
      release_notes
    else
      UI.message("⚠️  PENDING_CHANGES.md exists but missing title or changes")
      "Bug fixes and improvements"
    end
  else
    UI.message("⚠️  PENDING_CHANGES.md not found, using default release notes")
    "Bug fixes and improvements"
  end
end

desc "Build and deploy to Google Play Production (full release)"
desc "Usage: fastlane prod_android"
lane :prod_android do
  UI.message("🚀 Starting production deployment pipeline...")

  # Step 1: Validate environment
  validate_signing

  # Step 2: Check and increment version if needed
  check_and_increment_version

  # Step 3: Build release AAB using PROD flavor
  UI.message("Building prod release AAB...")
  build_release_flavor(flavor: "prod")

  # Step 4: Load release notes
  release_notes = load_release_notes_from_file

  # Step 5: Upload to Play Store Production using shared helper
  upload_to_play_store_with_retry(
    track: 'production',
    aab_path: 'app/build/outputs/bundle/prodRelease/app-prod-release.aab',
    build_type: 'prod',
    release_notes: release_notes
  )

  UI.success("🎉 Production deployment complete!")
  UI.message("")
  UI.message("Environment: PROD")
  UI.message("Bundle ID: com.stackmapnative")
  UI.message("App Name: StackMap")
  UI.message("")
  UI.message("Next steps:")
  UI.message("1. Check Google Play Console: https://play.google.com/console/")
  UI.message("2. Review and publish the release")
end
```

### Verification

```bash
# Test in stage first (safer than prod)
cd android && bundle exec fastlane stage_android

# Verify release notes loaded correctly
# Then test prod (or just use in real prod deployment)
```

---

## Task 1.3: iOS - Add Automated Testing Lane

**Status:** ❌ To Do
**Time:** 45-60 minutes
**Workflow:** 🟡 Standard
**Files:** `ios/fastlane/Fastfile`, `ios/StackMapNative.xcodeproj`

### What
Add `test` lane using `scan`/`run_tests` for iOS unit and UI tests.

### Why
Android has testing lanes, iOS doesn't. Need parity for quality gates integration.

### Current Gap
- Android has `test` and `test_critical` lanes
- iOS has no automated testing lanes
- Quality gates can't run iOS tests

### Atlas Prompt (Copy This)

```
CONTEXT: Read docs/deployment/fastlane-roadmap/phase-1-platform-parity.md section 1.3 for full context.

TASK: Add iOS automated testing lanes to ios/fastlane/Fastfile to match Android testing capability.

REQUIREMENTS:
1. Research: Check ios/StackMapNative.xcodeproj for existing test targets
2. If test targets exist:
   - Add 'test' lane using run_tests action (scan)
   - Target iPhone 16 Pro simulator
   - Output coverage to ./test_output/
   - Add 'test_ui' lane if UI test target exists
3. If no test targets exist:
   - Document what's needed (see Phase 2.1 for creating test targets)
   - Create placeholder lane that warns tests not configured yet
   - Provide setup instructions in output
4. Follow pattern from android/fastlane/Fastfile lines 177-204

ATLAS WORKFLOW: Use Standard workflow (5 phases)
1. Research phase → Launch general-purpose agent to:
   - Search ios/StackMapNative.xcodeproj/project.pbxproj for test targets
   - Check for existing test files in ios/StackMapNativeTests/
2. Plan phase → You (orchestrator) decide:
   - If tests exist: plan full implementation
   - If not: plan placeholder with setup docs
3. Implement phase → Launch developer agent to create lane(s)
4. Review phase → Launch peer-reviewer agent to validate
5. Deploy phase → Guide user on testing

REFERENCE FILES:
- ios/StackMapNative.xcodeproj/project.pbxproj (search for "test" or "Test")
- ios/fastlane/Fastfile (add after line 427, before deployment lanes)
- android/fastlane/Fastfile lines 177-204 (test lane patterns)
```

### Expected Outcome (if tests exist)

```ruby
desc "Run iOS unit tests"
desc "Usage: fastlane test"
lane :test do
  run_tests(
    workspace: "StackMapNative.xcworkspace",
    scheme: "StackMapNative",
    devices: ["iPhone 16 Pro"],
    code_coverage: true,
    output_directory: "./test_output",
    fail_build: false,  # Don't block qual on test failures initially
    clean: false  # Faster builds
  )

  UI.success("✅ Tests complete!")
end

desc "Run iOS UI tests"
desc "Usage: fastlane test_ui"
lane :test_ui do
  run_tests(
    workspace: "StackMapNative.xcworkspace",
    scheme: "StackMapNative",
    devices: ["iPhone 16 Pro"],
    only_testing: ["StackMapNativeUITests"],
    output_directory: "./test_output/ui",
    fail_build: false
  )

  UI.success("✅ UI tests complete!")
end
```

### Expected Outcome (if tests don't exist)

```ruby
desc "Run iOS unit tests (placeholder - tests not configured yet)"
desc "Usage: fastlane test"
lane :test do
  UI.important("⚠️  iOS test targets not configured yet")
  UI.message("")
  UI.message("To enable iOS testing:")
  UI.message("1. Open ios/StackMapNative.xcodeproj in Xcode")
  UI.message("2. File → New → Target → iOS Unit Testing Bundle")
  UI.message("3. Name it: StackMapNativeTests")
  UI.message("4. Add tests to ios/StackMapNativeTests/")
  UI.message("5. Re-run this lane")
  UI.message("")
  UI.message("See: docs/deployment/fastlane-roadmap/phase-2-testing.md for details")
end
```

### Verification

```bash
# If tests exist
cd ios && bundle exec fastlane test

# If placeholder created
# Follow instructions to set up test targets (or skip to Phase 2.1)
```

---

## Task 1.4: iOS - Add QUAL Deployment Lane

**Status:** ❌ To Do
**Time:** 15-20 minutes
**Workflow:** 🔵 Iterative
**Files:** `ios/fastlane/Fastfile`

### What
Add `qual_ios` lane for local iOS simulator deployment.

### Why
Consistency with Android `qual_android`, better automation than react-native CLI.

### Current Gap
- Android has `qual_android` lane (after Task 1.1)
- iOS qual deployment is manual via `npx react-native run-ios --mode Qual`
- Should have fastlane lane for consistency

### Atlas Prompt (Copy This)

```
CONTEXT: Read docs/deployment/fastlane-roadmap/phase-1-platform-parity.md section 1.4 for full context.

TASK: Add qual_ios lane to ios/fastlane/Fastfile for local simulator deployment.

REQUIREMENTS:
1. Build with Qual configuration (uses ios/Qual.xcconfig for bundle ID app.stackmap.qual)
2. Target "iPhone 16 Pro" simulator (matches APP_IOS_TEST_PHONE in scripts/deploy/app-config.sh line 112)
3. Skip IPA packaging (simulator doesn't need it)
4. Skip code signing for simulator
5. Display success with bundle ID, app name, and environment
6. Follow pattern from build_debug lane (lines 400-427) but with Qual configuration

ATLAS WORKFLOW: Use Iterative workflow
- Launch developer agent to implement lane
- Launch peer-reviewer agent to validate
- You (orchestrator) guide testing

REFERENCE FILES:
- ios/fastlane/Fastfile lines 400-427 (build_debug pattern)
- ios/Qual.xcconfig (defines PRODUCT_BUNDLE_IDENTIFIER=app.stackmap.qual and PRODUCT_NAME=StackMap QUAL)
- scripts/deploy/qual_deploy.sh lines 226-246 (current manual approach)

EXPECTED LOCATION: Add after line 466 in ios/fastlane/Fastfile (after build_release)
```

### Expected Outcome

```ruby
desc "Build and install QUAL debug to simulator (local testing)"
desc "Usage: fastlane qual_ios"
lane :qual_ios do
  UI.message("🚀 Building qual for simulator...")

  # Validate environment
  validate_environment

  # Clear Metro cache
  UI.message("🧹 Clearing Metro bundler cache...")
  sh("rm -rf $TMPDIR/metro-* || true")
  sh("rm -rf $TMPDIR/haste-* || true")

  # Build for simulator with Qual configuration
  build_app(
    workspace: "StackMapNative.xcworkspace",
    scheme: "StackMapNative",
    configuration: "Qual",
    destination: "platform=iOS Simulator,name=iPhone 16 Pro",
    skip_package_ipa: true,
    skip_archive: true,
    clean: false  # Faster builds
  )

  UI.success("✅ Qual build installed on iPhone 16 Pro!")
  UI.message("")
  UI.message("Bundle ID: app.stackmap.qual")
  UI.message("App Name: StackMap QUAL")
  UI.message("Environment: QUAL (using qual/api endpoint)")
end
```

### Verification

```bash
# 1. Ensure iPhone 16 Pro simulator is running
xcrun simctl list devices | grep "iPhone 16 Pro"

# 2. Run the lane
cd ios && bundle exec fastlane qual_ios

# 3. Verify app appears on simulator with "StackMap QUAL" name
xcrun simctl listapps "iPhone 16 Pro" | grep stackmap
```

---

## ✅ Phase 1 Complete When

- [ ] All 4 lanes implemented (qual_android, prod_android, test, qual_ios)
- [ ] All lanes tested and working
- [ ] Documentation updated (this file marked complete)
- [ ] Both platforms have equivalent automation

---

## 📝 Notes

Add your notes, gotchas, or deviations here as you complete tasks.

---

**Next Phase:** [Phase 4: Enhanced Visibility](phase-4-visibility.md) (do this before Phase 2 - quick wins!)
