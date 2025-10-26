# Phase 4: Enhanced Visibility
**Week 1-2 | 2 Tasks | 1.5 Hours | HIGH Priority**

Goal: Add deployment notifications and tracking for better team visibility.

---

## 📋 Task Checklist

- [ ] 4.1 - Slack notifications (45 min)
- [ ] 4.2 - Deployment summaries (45 min)

---

## Task 4.1: Slack Notifications

**Status:** ❌ To Do
**Time:** 30-45 minutes
**Workflow:** 🔵 Iterative
**Files:** `ios/fastlane/Fastfile`, `android/fastlane/Fastfile`

### What
Add Slack notifications for deployment events on both platforms.

### Why
Team needs visibility into stage/beta/prod deployments without constantly checking Play Console/App Store Connect.

### Current Gap
- No automated notifications when deployments complete
- Team members don't know when new builds are available
- Hard to track deployment history

### Atlas Prompt (Copy This)

```
CONTEXT: Read docs/deployment/fastlane-roadmap/phase-4-visibility.md section 4.1 for full context.

TASK: Add Slack deployment notifications to both iOS and Android Fastfiles.

REQUIREMENTS:
1. Create private_lane :notify_deployment in both Fastfiles
2. Use fastlane 'slack' action (https://docs.fastlane.tools/actions/slack/)
3. Read SLACK_WEBHOOK_URL from ENV, gracefully skip if not set
4. Include in notification message:
   - Platform (iOS/Android)
   - Environment (qual/stage/beta/prod)
   - Version number
   - Build number
   - Deployment status (success/failure)
   - Clickable link to App Store Connect / Play Console
5. Call from existing deployment lanes (beta/stage/prod) after successful uploads
6. Add example SLACK_WEBHOOK_URL to both .env.default files

ATLAS WORKFLOW: Use Iterative workflow
- Launch developer agent to implement in both Fastfiles
- Launch peer-reviewer agent to validate error handling
- You (orchestrator) guide setup and testing

REFERENCE FILES:
iOS:
- ios/fastlane/Fastfile - add helper around line 320 (near upload_to_testflight_with_retry)
- Call from: lines 622-636 (beta_ios), lines 682-693 (stage_ios), lines 802-814 (prod_ios)
- ios/fastlane/.env.default (add SLACK_WEBHOOK_URL example)

Android:
- android/fastlane/Fastfile - add helper around line 290 (near upload_to_play_store_with_retry)
- Call from: lines 320-329 (beta_android success), lines 401-403 (stage_android success)
- android/fastlane/.env.default (add SLACK_WEBHOOK_URL example)
```

### Expected Outcome (iOS)

```ruby
# Add near line 320 in ios/fastlane/Fastfile
desc "Send Slack notification for deployment"
private_lane :notify_deployment do |options|
  # Skip if no webhook configured
  return unless ENV["SLACK_WEBHOOK_URL"]

  platform = "iOS"
  env = options[:env] || "unknown"
  status = options[:success] ? "success" : "failure"
  emoji = options[:success] ? ":rocket:" : ":x:"

  begin
    slack(
      message: "#{emoji} #{platform} #{env.upcase} deployment #{status}!",
      success: options[:success],
      slack_url: ENV["SLACK_WEBHOOK_URL"],
      attachment_properties: {
        fields: [
          { title: "Platform", value: platform, short: true },
          { title: "Environment", value: env.upcase, short: true },
          { title: "Version", value: get_version_number, short: true },
          { title: "Build", value: get_build_number, short: true },
          { title: "App Store Connect", value: "https://appstoreconnect.apple.com/apps", short: false }
        ]
      },
      default_payloads: [:git_branch, :git_author]
    )
  rescue => ex
    UI.error("Failed to send Slack notification: #{ex.message}")
    # Don't fail deployment if Slack fails
  end
end

# Then in beta_ios lane (after line 635):
notify_deployment(env: "beta", success: true)

# In stage_ios lane (after line 693):
notify_deployment(env: "stage", success: true)

# In prod_ios lane (after line 814):
notify_deployment(env: "prod", success: true)
```

### Expected Outcome (Android)

```ruby
# Add near line 290 in android/fastlane/Fastfile
desc "Send Slack notification for deployment"
private_lane :notify_deployment do |options|
  # Skip if no webhook configured
  return unless ENV["SLACK_WEBHOOK_URL"]

  platform = "Android"
  env = options[:env] || "unknown"
  status = options[:success] ? "success" : "failure"
  emoji = options[:success] ? ":rocket:" : ":x:"

  begin
    # Read version from build.gradle
    android_dir = Dir.pwd.end_with?('/fastlane') ? File.expand_path('..', Dir.pwd) : Dir.pwd
    gradle_file = File.read(File.join(android_dir, "app/build.gradle"))
    version_name = gradle_file.match(/versionName "(.+)"/)[1]
    version_code = gradle_file.match(/versionCode (\d+)/)[1]

    slack(
      message: "#{emoji} #{platform} #{env.upcase} deployment #{status}!",
      success: options[:success],
      slack_url: ENV["SLACK_WEBHOOK_URL"],
      attachment_properties: {
        fields: [
          { title: "Platform", value: platform, short: true },
          { title: "Environment", value: env.upcase, short: true },
          { title: "Version", value: version_name, short: true },
          { title: "Build", value: version_code, short: true },
          { title: "Play Console", value: "https://play.google.com/console/", short: false }
        ]
      },
      default_payloads: [:git_branch, :git_author]
    )
  rescue => ex
    UI.error("Failed to send Slack notification: #{ex.message}")
    # Don't fail deployment if Slack fails
  end
end

# Then in beta_android lane (after line 376, inside upload_to_play_store_with_retry success):
# Note: This should be added inside the upload_to_play_store_with_retry helper at line 320
# After UI.success("🎉 #{build_type.capitalize} deployment completed!")
notify_deployment(env: build_type, success: true)
```

### .env.default additions

```bash
# ios/fastlane/.env.default
# Slack webhook for deployment notifications (optional)
# Get from: https://api.slack.com/messaging/webhooks
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# android/fastlane/.env.default
# Slack webhook for deployment notifications (optional)
# Get from: https://api.slack.com/messaging/webhooks
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Setup Instructions

```bash
# 1. Create Slack webhook
# - Go to https://api.slack.com/messaging/webhooks
# - Create incoming webhook for your #deployments channel
# - Copy webhook URL

# 2. Add to environment (choose one):
# Option A: Add to .env file (not committed)
echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL" >> ios/fastlane/.env
echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL" >> android/fastlane/.env

# Option B: Export in shell
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# 3. Test notification
cd ios && bundle exec fastlane beta_ios
# Check Slack channel for notification
```

---

## Task 4.2: Deployment Summary Reports

**Status:** ❌ To Do
**Time:** 30-45 minutes
**Workflow:** 🔵 Iterative
**Files:** `ios/fastlane/Fastfile`, `android/fastlane/Fastfile`

### What
Generate markdown deployment summary after each deployment for historical tracking.

### Why
- Track what was deployed when
- Easy rollback reference (know which version had which features)
- Version control deployment history
- Audit trail for compliance

### Current Gap
- No deployment history except git log
- Hard to remember what was in which version
- No easy way to compare deployments

### Atlas Prompt (Copy This)

```
CONTEXT: Read docs/deployment/fastlane-roadmap/phase-4-visibility.md section 4.2 for full context.

TASK: Add deployment summary generation to both iOS and Android Fastfiles.

REQUIREMENTS:
1. Create private_lane :generate_deployment_summary in both Fastfiles
2. Generate markdown file in deployments/[platform]/[timestamp]-[env]-[version].md
3. Include in summary:
   - Deployment timestamp
   - Platform and environment
   - Version and build number
   - Changes from PENDING_CHANGES.md (if readable)
   - Git commit SHA and branch
   - Deployment status (success/failure)
4. Call from all deployment lanes (beta/stage/prod) after successful completion
5. Create deployments/ directory structure if missing

ATLAS WORKFLOW: Use Iterative workflow
- Launch developer agent to implement in both Fastfiles
- Launch peer-reviewer agent to validate markdown formatting
- You (orchestrator) guide testing

REFERENCE FILES:
iOS:
- ios/fastlane/Fastfile - add helper around line 340
- Call from: beta_ios (after line 636), stage_ios (after line 693), prod_ios (after line 814)

Android:
- android/fastlane/Fastfile - add helper around line 310
- Call from: beta_android (after line 376), stage_android (after line 403)

Common:
- PENDING_CHANGES.md (source for changes)
- Create: deployments/ios/ and deployments/android/ directories
```

### Expected Outcome

```ruby
# Add to both Fastfiles
desc "Generate deployment summary markdown file"
private_lane :generate_deployment_summary do |options|
  platform = options[:platform] || "unknown"
  env = options[:env] || "unknown"
  version = options[:version] || "unknown"
  build = options[:build] || "unknown"
  success = options[:success] || true

  # Create deployments directory if needed
  deployments_dir = "../../deployments/#{platform.downcase}"
  sh("mkdir -p #{deployments_dir}")

  # Generate filename with timestamp
  timestamp = Time.now.strftime("%Y-%m-%d_%H-%M-%S")
  filename = "#{deployments_dir}/#{timestamp}-#{env}-#{version}.md"

  # Read PENDING_CHANGES.md if available
  changes = "No changes documented"
  pending_changes_path = "../../PENDING_CHANGES.md"
  if File.exist?(pending_changes_path)
    content = File.read(pending_changes_path)

    # Extract title and changes
    title_match = content.match(/^## Title:\s*(.+)$/i)
    changes_match = content.match(/^### Changes Made:\s*\n([\s\S]+?)(?=\n###|\n##|$)/i)

    if title_match && changes_match
      changes = "**#{title_match[1].strip}**\n\n#{changes_match[1].strip}"
    end
  end

  # Get git info
  git_branch = sh("git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown'").strip
  git_sha = sh("git rev-parse --short HEAD 2>/dev/null || echo 'unknown'").strip

  # Generate markdown content
  status_emoji = success ? "✅" : "❌"
  markdown = <<~MARKDOWN
    # #{platform} #{env.upcase} Deployment - #{Time.now.strftime("%Y-%m-%d %H:%M:%S")}

    **Status:** #{status_emoji} #{success ? 'Success' : 'Failed'}

    ## Version Info
    - **Version:** #{version}
    - **Build:** #{build}
    - **Platform:** #{platform}
    - **Environment:** #{env}

    ## Git Info
    - **Branch:** #{git_branch}
    - **Commit:** #{git_sha}

    ## Changes

    #{changes}

    ---
    *Generated by fastlane #{platform.downcase}_#{env}*
  MARKDOWN

  # Write file
  File.write(filename, markdown)
  UI.success("📝 Deployment summary: #{filename}")

  filename
end

# Then call from deployment lanes:
# iOS beta_ios (after line 636):
generate_deployment_summary(
  platform: "iOS",
  env: "beta",
  version: get_version_number,
  build: get_build_number,
  success: true
)

# Android beta_android (after line 376):
android_dir = Dir.pwd.end_with?('/fastlane') ? File.expand_path('..', Dir.pwd) : Dir.pwd
gradle_file = File.read(File.join(android_dir, "app/build.gradle"))
version_name = gradle_file.match(/versionName "(.+)"/)[1]
version_code = gradle_file.match(/versionCode (\d+)/)[1]

generate_deployment_summary(
  platform: "Android",
  env: "beta",
  version: version_name,
  build: version_code,
  success: true
)
```

### Example Output

File: `deployments/ios/2025-10-12_16-30-45-beta-25.10.12.004.md`

```markdown
# iOS BETA Deployment - 2025-10-12 16:30:45

**Status:** ✅ Success

## Version Info
- **Version:** 25.10.12
- **Build:** 004
- **Platform:** iOS
- **Environment:** beta

## Git Info
- **Branch:** main
- **Commit:** a3f2c1b

## Changes

**Add Slack notifications to fastlane**

- Added notify_deployment helper lane to both iOS and Android
- Integrated Slack webhooks for stage/beta/prod deployments
- Updated .env.default files with webhook examples

---
*Generated by fastlane ios_beta*
```

### Verification

```bash
# After running deployment
ls -la deployments/ios/
cat deployments/ios/*.md  # View latest summary

# Commit deployment summaries
git add deployments/
git commit -m "Add deployment summaries for tracking"
```

---

## ✅ Phase 4 Complete When

- [ ] Slack notifications work for stage/beta/prod on both platforms
- [ ] Deployment summaries generated and committed
- [ ] Team receives notifications in Slack
- [ ] Historical deployment tracking visible in deployments/ directory

---

## 📝 Notes

Add your notes, gotchas, or deviations here as you complete tasks.

---

**Next Phase:** [Phase 2: Automated Testing](phase-2-testing.md) (after completing Phase 1 and 4)
