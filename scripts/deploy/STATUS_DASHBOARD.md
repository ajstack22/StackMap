# Deployment Status Dashboard

A real-time HTML-based deployment status page that tracks deployment progress and provides deep links to all platforms.

## Features

✅ **Real-time progress tracking** - Watch deployment progress as it happens
✅ **Deep links to all platforms** - One-click access to App Store Connect, Play Console, and web environments
✅ **Auto-refresh** - Page updates every 5 seconds during deployment
✅ **Auto-open** - Opens in browser automatically when deployment starts
✅ **Color-coded status** - Visual indicators for success/failure/in-progress
✅ **Mobile responsive** - Check status from your phone
✅ **Historical archive** - Every deployment saved with timestamp

## Quick Start

### 1. Test the Status Page

Run the test script to see the status page in action:

```bash
./scripts/test-status-page.sh
```

This will simulate a deployment and open the status page in your browser.

### 2. Configure Play Console ID

To get deep links to Google Play Console working:

1. Go to https://play.google.com/console/
2. Look at the URL: `developers/{DEVELOPER_ID}/...`
3. Copy the Developer ID
4. Edit `scripts/app-config.sh`:
   ```bash
   export PLAY_CONSOLE_DEVELOPER_ID="YOUR_DEVELOPER_ID_HERE"
   ```

### 3. Configure Auto-Open Behavior

In `scripts/app-config.sh`:

```bash
export AUTO_OPEN_STATUS_PAGE=true   # Auto-open browser (default: true)
export STATUS_PAGE_AUTO_REFRESH=true # Enable auto-refresh (default: true)
export STATUS_PAGE_REFRESH_INTERVAL=5 # Refresh every 5 seconds
```

## Integration Guide

### Basic Integration

Add these calls to your deployment scripts:

```bash
# At start of deployment
source "$SCRIPT_DIR/lib/reporting.sh"
generate_status_page "$tier" "$version"

# During validation
update_status_page "validation" "in_progress"
# ... validation code ...
update_status_page "validation" "success"

# During tests
update_status_page "tests" "in_progress"
# ... test code ...
update_status_page "tests" "success"

# During web deployment
update_status_page "web" "in_progress"
# ... web deploy code ...
update_status_page "web" "success"

# During iOS deployment
update_status_page "ios" "in_progress"
# ... iOS deploy code ...
update_status_page "ios" "success"

# During Android deployment
update_status_page "android" "in_progress"
# ... Android deploy code ...
update_status_page "android" "success"

# At end of deployment
finalize_status_page
open_status_page
```

### Status Values

Available status values:
- `pending` - Not started yet (⏳)
- `in_progress` - Currently running (🔄)
- `success` - Completed successfully (✅)
- `failed` - Failed with errors (❌)
- `skipped` - Skipped/not applicable (⏭️)

### Skipping Platforms

If a platform is not being deployed:

```bash
update_status_page "web" "skipped"
update_status_page "ios" "skipped"
update_status_page "android" "skipped"
```

## Deep Links Provided

### Web Environments
- Production: `https://stackmap.app`
- Beta: `https://stackmap.app/beta`
- Stage: `https://stackmap.app/stage`
- Qual: `https://stackmap.app/qual`

### iOS App Store Connect
- App Dashboard
- TestFlight (Internal & External Testing)
- Latest Builds
- App Store Production

### Google Play Console
- Play Console Dashboard
- Internal Testing Track
- Closed Testing Track (Beta)
- Production Track
- Release Overview

## File Locations

```
deployments/
├── current-status.html          # Live tracking (auto-updates)
└── YYYYMMDD-HHMMSS-{tier}-status.html  # Archived after deployment
```

The `current-status.html` file is excluded from git (added to .gitignore).

## Example: Full Deployment Integration

```bash
#!/bin/bash
set -e

# Load libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/reporting.sh"

TIER="beta"
VERSION=$(get_current_version)

# Generate status page
generate_status_page "$TIER" "$VERSION"

# Validation
update_status_page "validation" "in_progress"
if run_validation; then
    update_status_page "validation" "success"
else
    update_status_page "validation" "failed"
    exit 1
fi

# Tests
update_status_page "tests" "in_progress"
if npm test; then
    update_status_page "tests" "success"
else
    update_status_page "tests" "failed"
    exit 1
fi

# Web
update_status_page "web" "in_progress"
if deploy_web; then
    update_status_page "web" "success"
else
    update_status_page "web" "failed"
    exit 1
fi

# iOS
update_status_page "ios" "in_progress"
if deploy_ios; then
    update_status_page "ios" "success"
else
    update_status_page "ios" "failed"
    exit 1
fi

# Android
update_status_page "android" "in_progress"
if deploy_android; then
    update_status_page "android" "success"
else
    update_status_page "android" "failed"
    exit 1
fi

# Finalize
finalize_status_page
open_status_page
```

## Troubleshooting

### Status page doesn't open

- Check `AUTO_OPEN_STATUS_PAGE` is set to `true`
- Manually open: `open deployments/current-status.html`

### Play Console links don't work

- Update `PLAY_CONSOLE_DEVELOPER_ID` in `scripts/app-config.sh`
- Get your Developer ID from the Play Console URL

### Status page not updating

- Check that functions are being called: `update_status_page "step" "status"`
- Verify `reporting.sh` is sourced: `source "$SCRIPT_DIR/lib/reporting.sh"`

### Auto-refresh not working

- Check `STATUS_PAGE_AUTO_REFRESH=true` in `app-config.sh`
- Check `STATUS_PAGE_REFRESH_INTERVAL` is set (default: 5)

## Next Steps

1. Run the test: `./scripts/test-status-page.sh`
2. Configure your Play Console Developer ID
3. Integrate into your deployment scripts
4. Deploy and watch the magic happen!
