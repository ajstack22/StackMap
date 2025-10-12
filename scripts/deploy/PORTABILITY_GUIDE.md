# StackMap Deployment System Portability Guide

This guide explains how to port the StackMap 4-tier deployment system to other apps (Manylla, SmilePile, etc.) in minutes instead of hours.

## Overview

The deployment system has been refactored to use **centralized configuration**, eliminating 88+ hardcoded references to "stackmap.app", "stackmap-cpanel", and "com.stackmapnative".

**Before:** Every script hardcoded app-specific values
**After:** One config file (`app-config.sh`) contains all app-specific values

## Quick Start: Port to a New App (15-30 minutes)

### Step 1: Copy the Scripts Directory

```bash
# From your new app's root directory
cp -r /path/to/StackMap/scripts ./scripts

# Verify the copy includes:
ls scripts/
# Should see: app-config.sh, deploy.sh, qual_deploy.sh, deploy_beta.sh,
#             prod_deploy.sh, lib/, deploy-with-tracking.sh, etc.
```

### Step 2: Modify app-config.sh

This is the **ONLY** file you need to modify. Open `scripts/app-config.sh` and update:

```bash
# ============================================
# App Identity
# ============================================

# For Manylla:
export APP_NAME="Manylla"
export APP_NAME_LOWER="manylla"
export APP_DISPLAY_NAME="Manylla"

# ============================================
# Domain and Web Configuration
# ============================================

# Update your domain
export APP_DOMAIN="manylla.com"  # NO protocol (http/https)

# URLs are auto-generated from domain:
# - Production: https://manylla.com
# - Beta: https://manylla.com/beta
# - Stage: https://manylla.com/stage
# - Qual: https://manylla.com/qual

# SSH configuration for web deployment
export APP_SSH_HOST="manylla-cpanel"  # Must match ~/.ssh/config entry
export APP_SSH_WEBROOT="~/public_html"
export APP_SSH_QUAL_DIR="${APP_SSH_WEBROOT}/qual"
export APP_SSH_BETA_DIR="${APP_SSH_WEBROOT}/beta"
export APP_SSH_STAGE_DIR="${APP_SSH_WEBROOT}/stage"

# ============================================
# Mobile App Configuration
# ============================================

# iOS Bundle ID
export APP_IOS_BUNDLE_ID="com.manylla"

# Android Package Name
export APP_ANDROID_PACKAGE="com.manylla"

# iOS App Store Connect Configuration
export APP_IOS_APP_ID="YOUR_APP_ID"
export APP_IOS_TEAM_ID="YOUR_TEAM_ID"
export APP_IOS_API_KEY_ID="YOUR_API_KEY_ID"
export APP_IOS_ISSUER_ID="YOUR_ISSUER_ID"

# iOS Build Configuration
export APP_IOS_SCHEME="ManyllaApp"  # Your Xcode scheme name
export APP_IOS_WORKSPACE="ManyllaApp.xcworkspace"
export APP_IOS_PROJECT="ManyllaApp.xcodeproj"

# Android Play Store Configuration
export APP_ANDROID_APP_ID="com.manylla"
export APP_ANDROID_SERVICE_ACCOUNT_KEYCHAIN_NAME="manylla-play-store-service-account"

# ============================================
# Test Configuration
# ============================================

# Update simulator/device names as needed
export APP_IOS_TEST_PHONE="iPhone 16 Pro Max"
export APP_IOS_TEST_TABLET="iPad Pro 11-inch (M4)"
```

### Step 3: Update SSH Configuration

Add SSH host to `~/.ssh/config`:

```
Host manylla-cpanel
    HostName your-server.com
    User your-username
    IdentityFile ~/.ssh/id_rsa
```

Test SSH connection:
```bash
ssh manylla-cpanel "pwd"
```

### Step 4: Update iOS/Android Fastfiles (Optional)

If you're using Fastlane, update the Fastfiles to read from environment variables set by the deployment scripts.

**iOS Fastfile Example:**
```ruby
# Instead of hardcoded values, use ENV vars
app_identifier(ENV['APP_IOS_BUNDLE_ID'] || "com.manylla")
```

**Android Fastfile Example:**
```ruby
# Use package name from environment
package_name(ENV['APP_ANDROID_PACKAGE'] || "com.manylla")
```

### Step 5: Verify Configuration

Run the config validation:
```bash
source ./scripts/app-config.sh
show_app_config
```

You should see:
```
=========================================
App Configuration Summary
=========================================
App Name:           Manylla
Domain:             manylla.com
iOS Bundle ID:      com.manylla
Android Package:    com.manylla
SSH Host:           manylla-cpanel

URLs:
  Production:       https://manylla.com
  Beta:             https://manylla.com/beta
  Stage:            https://manylla.com/stage
  Qual:             https://manylla.com/qual
=========================================
```

### Step 6: Test Deployment

Test with QUAL tier (safest):
```bash
./scripts/deploy.sh qual --web
```

This will:
1. Validate your configuration
2. Build the web bundle
3. Deploy to your qual environment
4. Verify the deployment

## What Values Need Customization?

### Required Changes (App Won't Work Without These)

1. **APP_NAME** - Your app's name
2. **APP_DOMAIN** - Your domain (no http/https)
3. **APP_IOS_BUNDLE_ID** - iOS bundle identifier
4. **APP_ANDROID_PACKAGE** - Android package name
5. **APP_SSH_HOST** - SSH host for web deployment

### App Store Connect (Required for Mobile Deployment)

6. **APP_IOS_APP_ID** - Your App Store Connect app ID
7. **APP_IOS_TEAM_ID** - Your Apple Developer team ID
8. **APP_IOS_API_KEY_ID** - App Store Connect API key
9. **APP_IOS_ISSUER_ID** - API key issuer ID
10. **APP_IOS_SCHEME** - Xcode scheme name

### Optional Changes (Can Keep Defaults)

- **APP_IOS_TEST_PHONE** - Simulator for testing (default: iPhone 16 Pro Max)
- **APP_IOS_TEST_TABLET** - Tablet simulator (default: iPad Pro 11-inch M4)
- **Build artifact paths** - Only change if your project structure differs

## Example: Manylla Configuration

Here's a complete example for Manylla:

```bash
# App Identity
export APP_NAME="Manylla"
export APP_NAME_LOWER="manylla"
export APP_DISPLAY_NAME="Manylla"

# Domain
export APP_DOMAIN="manylla.com"

# Mobile
export APP_IOS_BUNDLE_ID="com.manylla"
export APP_ANDROID_PACKAGE="com.manylla"

# iOS App Store
export APP_IOS_APP_ID="1234567890"
export APP_IOS_TEAM_ID="ABCD1234EF"
export APP_IOS_API_KEY_ID="GHIJ5678KL"
export APP_IOS_ISSUER_ID="12345678-1234-1234-1234-123456789012"
export APP_IOS_SCHEME="ManyllaApp"
export APP_IOS_WORKSPACE="ManyllaApp.xcworkspace"

# SSH
export APP_SSH_HOST="manylla-cpanel"

# Android
export APP_ANDROID_SERVICE_ACCOUNT_KEYCHAIN_NAME="manylla-play-service-account"

# Test devices (using defaults)
export APP_IOS_TEST_PHONE="iPhone 16 Pro Max"
export APP_IOS_TEST_TABLET="iPad Pro 11-inch (M4)"
```

## Verification Checklist

Before deploying, verify:

- [ ] `app-config.sh` updated with your values
- [ ] SSH host configured in `~/.ssh/config`
- [ ] SSH connectivity tested: `ssh YOUR_HOST pwd`
- [ ] Config validation passes: `source scripts/app-config.sh && validate_app_config`
- [ ] QUAL deployment tested: `./scripts/deploy.sh qual --web`
- [ ] No hardcoded references to old app name in config

## Estimated Time to Port

| Step | Time | Difficulty |
|------|------|------------|
| Copy scripts directory | 1 min | Easy |
| Update app-config.sh | 10-15 min | Easy |
| Set up SSH config | 2-5 min | Easy |
| Test configuration | 2-3 min | Easy |
| Test QUAL deployment | 5-10 min | Medium |
| **Total** | **20-35 min** | **Easy-Medium** |

## Benefits of This Approach

1. **Zero Hardcoding**: All app-specific values in one file
2. **Self-Documenting**: Config file explains each variable
3. **Fail-Fast**: Validates configuration on load
4. **Backward Compatible**: StackMap deployment works exactly as before
5. **Future-Proof**: Adding new apps requires only config changes

## Troubleshooting

### "App configuration not loaded" error

**Cause:** `app-config.sh` not sourced
**Fix:** Scripts auto-load it. If manually running functions, source it first:
```bash
source ./scripts/app-config.sh
```

### "Cannot connect to SSH host" warning

**Cause:** SSH host not configured or unreachable
**Fix:**
1. Add host to `~/.ssh/config`
2. Test: `ssh YOUR_HOST pwd`
3. Verify network connectivity

### URLs show wrong domain

**Cause:** `APP_DOMAIN` includes protocol (http/https)
**Fix:** Use domain only: `manylla.com` not `https://manylla.com`

### Mobile builds fail

**Cause:** iOS/Android config not updated
**Fix:** Update bundle IDs, API keys, and credentials in `app-config.sh`

## Advanced: Multi-App Deployment

To manage multiple apps from one machine:

```bash
# Create app-specific configs
scripts/configs/
  ├── stackmap.config.sh
  ├── manylla.config.sh
  └── smilepile.config.sh

# Deploy script wrapper
deploy_app.sh:
  source "./scripts/configs/$APP_NAME.config.sh"
  ./scripts/deploy.sh $@
```

## Support

If you encounter issues:

1. Check config validation: `validate_app_config`
2. Test SSH separately: `ssh YOUR_HOST`
3. Review error messages in deployment logs
4. Compare your config to the StackMap reference config

## Summary

**Porting the deployment system is now trivial:**

1. Copy `scripts/` directory
2. Edit ONE file (`app-config.sh`)
3. Test with `./scripts/deploy.sh qual --web`
4. Done!

**No more hunting through 40+ files to update hardcoded values.**
