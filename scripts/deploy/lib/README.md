# StackMap Deployment Library Functions

This directory contains shared library functions for the three-tier deployment system.

## Library Files

### `common.sh` - Common Utilities
Provides shared functions used across all deployment scripts:

**Functions:**
- `log_info()`, `log_success()`, `log_warning()`, `log_error()` - Colored logging
- `log_step()`, `log_header()`, `log_section()` - Formatted output
- `get_project_root()`, `get_scripts_dir()` - Path helpers
- `get_current_version()`, `get_version_date()`, `get_version_build()` - Version management
- `get_timestamp()`, `get_timestamp_compact()` - Timestamp utilities
- `confirm_deployment()`, `confirm_action()` - User prompts
- `check_file_exists()`, `check_dir_exists()`, `check_command_exists()` - Validation helpers
- `get_git_branch()`, `get_git_commit()`, `get_git_status_clean()` - Git utilities
- `is_macos()`, `is_linux()` - Platform detection
- `format_duration()` - Time formatting

**Usage:**
```bash
source "$SCRIPT_DIR/lib/common.sh"

log_success "Operation completed!"
CURRENT_VERSION=$(get_current_version)
```

### `validation.sh` - Pre-Deployment Validation
Validates environment and requirements before deployment:

**Functions:**
- `validate_environment(tier)` - Check required tools (node, npm, git, fastlane)
- `validate_git_status(tier)` - Check for uncommitted changes (tier-specific)
- `validate_credentials(tier)` - Validate tier-specific credentials
- `validate_version_numbers()` - Ensure version consistency across files
- `validate_dependencies()` - Check node_modules and pods
- `run_full_validation(tier)` - Execute all validation checks

**Validation Levels by Tier:**
- **QUAL**: Warnings only (don't block deployment)
- **BETA**: Block on uncommitted changes, missing credentials
- **PROD**: Block on any validation failures

**Usage:**
```bash
source "$SCRIPT_DIR/lib/validation.sh"

if ! run_full_validation "beta"; then
    log_error "Validation failed"
    exit 1
fi
```

### `verification.sh` - Post-Deployment Verification
Verifies deployment success and health:

**Functions:**
- `verify_web_deployment(tier)` - HTTP health check for web deployments
- `verify_mobile_builds(platform, tier)` - Check IPA/AAB existence
- `verify_ios_build(tier)`, `verify_android_build(tier)` - Platform-specific checks
- `verify_version_updates()` - Confirm version was updated correctly
- `verify_git_commits()` - Check git commit status
- `check_web_health(tier)`, `check_api_health(tier)` - Health endpoints
- `run_full_verification(tier, platforms)` - Execute all verification checks

**Usage:**
```bash
source "$SCRIPT_DIR/lib/verification.sh"

run_full_verification "prod" "web ios android"
```

### `reporting.sh` - Deployment Reports
Generates deployment reports and summaries:

**Functions:**
- `add_platform_deployed(platform, status, details)` - Track deployed platforms
- `add_status_item(item)`, `add_validation_item(item)`, `add_verification_item(item)` - Report tracking
- `generate_deployment_report(tier, version)` - Create deployment report file
- `display_deployment_summary(tier, version)` - Show summary to console
- `display_next_steps(tier)` - Show tier-specific next steps
- `generate_error_report(tier, error_message)` - Create error report
- `list_deployment_history()`, `show_latest_deployment()` - View deployment history

**Report Location:**
Reports are saved to: `deployments/YYYYMMDD-HHMMSS-{tier}-report.txt`

**Usage:**
```bash
source "$SCRIPT_DIR/lib/reporting.sh"

add_platform_deployed "Web (prod)" "success" "https://stackmap.app"
add_platform_deployed "iOS (prod)" "success" "TestFlight"
generate_deployment_report "prod" "$VERSION"
display_next_steps "prod"
```

## Using the Libraries

### In a New Deployment Script

```bash
#!/bin/bash
set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load libraries
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/validation.sh"
source "$SCRIPT_DIR/lib/verification.sh"
source "$SCRIPT_DIR/lib/reporting.sh"

# Use library functions
log_header "🚀 My Deployment Script"

if ! run_full_validation "beta"; then
    log_error "Validation failed"
    exit 1
fi

# ... perform deployment ...

add_platform_deployed "Web" "success"
generate_deployment_report "beta" "$(get_current_version)"
```

### Standalone Usage

Libraries can also be sourced in other scripts or used interactively:

```bash
# Source a library
source /path/to/scripts/lib/common.sh

# Use functions
log_info "Starting process..."
CURRENT_VERSION=$(get_current_version)
log_success "Version: $CURRENT_VERSION"
```

## Environment Variables

Libraries use and set these environment variables:

- `SCRIPT_DIR` - Directory containing the calling script
- `PROJECT_ROOT` - Project root directory
- `DEPLOYMENT_START_TIME` - Unix timestamp when deployment started
- `DEPLOYMENT_PLATFORMS` - List of platforms deployed (for reports)
- `DEPLOYMENT_STATUS_ITEMS` - Status items for report
- `DEPLOYMENT_VALIDATION_ITEMS` - Validation results for report
- `DEPLOYMENT_VERIFICATION_ITEMS` - Verification results for report

## Color Output

Libraries use ANSI color codes for better readability:

- 🔴 **RED** - Errors
- 🟢 **GREEN** - Success messages
- 🟡 **YELLOW** - Warnings
- 🔵 **BLUE** - Info messages
- 🟣 **MAGENTA** - Step indicators

Colors are defined in `common.sh` and used consistently across all libraries.

## Testing

Test library syntax:
```bash
bash -n scripts/lib/common.sh
bash -n scripts/lib/validation.sh
bash -n scripts/lib/verification.sh
bash -n scripts/lib/reporting.sh
```

## See Also

- [Three-Tier Deployment Plan](../../docs/deployment/THREE_TIER_DEPLOYMENT_PLAN.md)
- [Master Deployment Script](../deploy.sh)
- [Deployment README](../../docs/deployment/README.md)
