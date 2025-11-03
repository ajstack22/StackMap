#!/bin/bash

# ============================================
# Deployment Reporting Functions
# Generates deployment reports and summaries
# ============================================

# Source common functions if not already loaded
if [ -z "$(type -t log_info)" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    source "$SCRIPT_DIR/lib/common.sh"
fi

# App config is loaded via common.sh, ensure it's available
if [ -z "$APP_NAME" ]; then
    echo "ERROR: App configuration not loaded" >&2
    exit 1
fi

# Global variables for report tracking
export DEPLOYMENT_PLATFORMS=""
export DEPLOYMENT_STATUS_ITEMS=""
export DEPLOYMENT_VALIDATION_ITEMS=""
export DEPLOYMENT_VERIFICATION_ITEMS=""

# ============================================
# Report Data Collection
# ============================================

add_platform_deployed() {
    local platform="$1"
    local status="$2"  # "success" or "failed"
    local details="${3:-}"

    if [ "$status" = "success" ]; then
        DEPLOYMENT_PLATFORMS="${DEPLOYMENT_PLATFORMS}  ✅ $platform"
    else
        DEPLOYMENT_PLATFORMS="${DEPLOYMENT_PLATFORMS}  ❌ $platform (FAILED)"
    fi

    if [ -n "$details" ]; then
        DEPLOYMENT_PLATFORMS="${DEPLOYMENT_PLATFORMS}: $details"
    fi

    DEPLOYMENT_PLATFORMS="${DEPLOYMENT_PLATFORMS}\n"
}

add_status_item() {
    local item="$1"
    DEPLOYMENT_STATUS_ITEMS="${DEPLOYMENT_STATUS_ITEMS}  $item\n"
}

add_validation_item() {
    local item="$1"
    DEPLOYMENT_VALIDATION_ITEMS="${DEPLOYMENT_VALIDATION_ITEMS}  $item\n"
}

add_verification_item() {
    local item="$1"
    DEPLOYMENT_VERIFICATION_ITEMS="${DEPLOYMENT_VERIFICATION_ITEMS}  $item\n"
}

# ============================================
# Report Generation
# ============================================

generate_deployment_report() {
    local tier="${1:-qual}"
    local version="${2:-$(get_current_version)}"
    local project_root=$(get_project_root)

    # Calculate deployment time
    local deployment_end=$(date +%s)
    local deployment_time=$((deployment_end - DEPLOYMENT_START_TIME))
    local duration=$(format_duration $deployment_time)

    # Create report filename
    local timestamp=$(get_timestamp_compact)
    local report_file="$project_root/deployments/${timestamp}-${tier}-report.txt"

    # Generate report content
    cat > "$report_file" << EOF
========================================
 🎉 Deployment Report
========================================
Tier:           $(echo "$tier" | tr '[:lower:]' '[:upper:]')
Version:        $version
Time:           $duration
Date:           $(get_timestamp)
Branch:         $(get_git_branch)
Commit:         $(get_git_commit)

Platforms Deployed:
$(echo -e "$DEPLOYMENT_PLATFORMS")
EOF

    # Add validation section if available
    if [ -n "$DEPLOYMENT_VALIDATION_ITEMS" ]; then
        cat >> "$report_file" << EOF

Validation:
$(echo -e "$DEPLOYMENT_VALIDATION_ITEMS")
EOF
    fi

    # Add verification section if available
    if [ -n "$DEPLOYMENT_VERIFICATION_ITEMS" ]; then
        cat >> "$report_file" << EOF

Verification:
$(echo -e "$DEPLOYMENT_VERIFICATION_ITEMS")
EOF
    fi

    # Add next steps based on tier
    cat >> "$report_file" << EOF

Next Steps:
EOF

    case "$tier" in
        qual)
            cat >> "$report_file" << EOF
  - Test changes on qual environment: $APP_URL_QUAL
  - Run manual QA checks
  - When ready: ./scripts/deploy.sh stage --all
EOF
            ;;

        stage)
            cat >> "$report_file" << EOF
  - Test stage builds (internal testing only): $APP_URL_STAGE
  - Verify all critical flows work
  - Fix any issues found
  - When ready: ./scripts/deploy.sh beta --all
EOF
            ;;

        beta)
            cat >> "$report_file" << EOF
  - Test beta builds on devices: $APP_URL_BETA
  - Gather tester feedback
  - Monitor for issues
  - When ready: ./scripts/deploy.sh prod --all
EOF
            ;;

        prod)
            cat >> "$report_file" << EOF
  - Monitor production health: $APP_URL_PROD
  - Check error logs
  - Verify user feedback
  - Document release in changelog
EOF
            ;;
    esac

    cat >> "$report_file" << EOF
========================================
EOF

    # Display report to console
    echo ""
    cat "$report_file"

    log_success "Deployment report saved: $report_file"
}

# ============================================
# Summary Display Functions
# ============================================

display_deployment_summary() {
    local tier="${1:-qual}"
    local version="${2:-$(get_current_version)}"

    # Calculate deployment time
    local deployment_end=$(date +%s)
    local deployment_time=$((deployment_end - DEPLOYMENT_START_TIME))
    local duration=$(format_duration $deployment_time)

    log_section "🎉 Deployment Complete!"

    echo "Tier:           $(echo "$tier" | tr '[:lower:]' '[:upper:]')"
    echo "Version:        $version"
    echo "Time:           $duration"
    echo "Date:           $(get_timestamp)"

    if [ -n "$DEPLOYMENT_PLATFORMS" ]; then
        echo ""
        echo "Platforms Deployed:"
        echo -e "$DEPLOYMENT_PLATFORMS"
    fi

    echo "========================================="
}

display_next_steps() {
    local tier="$1"

    echo ""
    echo "📋 Next Steps:"
    echo ""

    case "$tier" in
        qual)
            echo "1. Test Changes:"
            echo "   • Web: $APP_URL_QUAL"
            echo "   • iOS: Check simulators"
            echo "   • Android: Check connected devices"
            echo ""
            echo "2. Manual QA Checks:"
            echo "   • Verify new features work"
            echo "   • Test critical user flows"
            echo "   • Check for regressions"
            echo ""
            echo "3. When Ready for Stage:"
            echo "   • Run: ./scripts/deploy.sh stage --all"
            ;;

        stage)
            echo "1. Test Stage Builds (Internal Only):"
            echo "   • iOS: Install via TestFlight Internal"
            echo "   • Android: Google Play Internal Testing"
            echo "   • Environment: $APP_URL_STAGE"
            echo ""
            echo "2. Internal QA:"
            echo "   • Test all critical user flows"
            echo "   • Verify sync functionality"
            echo "   • Check performance on real devices"
            echo ""
            echo "3. When Ready for Beta:"
            echo "   • Fix any issues found in stage"
            echo "   • Commit all changes (beta requires clean git)"
            echo "   • Run: ./scripts/deploy.sh beta --all"
            ;;

        beta)
            echo "1. Test Beta Builds:"
            echo "   • iOS: Install via TestFlight External"
            echo "   • Android: Join closed testing track"
            echo "   • Web: $APP_URL_BETA"
            echo ""
            echo "2. Gather Feedback:"
            echo "   • Beta tester feedback"
            echo "   • Stakeholder review"
            echo "   • Bug reports"
            echo ""
            echo "3. When Ready for Production:"
            echo "   • Fix any issues found"
            echo "   • Update PENDING_CHANGES.md"
            echo "   • Run: ./scripts/deploy.sh prod --all"
            ;;

        prod)
            echo "1. Monitor Production:"
            echo "   • Check $APP_URL_PROD"
            echo "   • Monitor error logs"
            echo "   • Watch user feedback"
            echo ""
            echo "2. Post-Deployment:"
            echo "   • Update changelog"
            echo "   • Notify stakeholders"
            echo "   • Close related issues"
            echo ""
            echo "3. Rollback if Needed:"
            echo "   • Web: ./scripts/prod_deploy.sh rollback"
            echo "   • Mobile: Use app store version rollback"
            ;;
    esac

    echo ""
}

# ============================================
# Error Report Generation
# ============================================

generate_error_report() {
    local tier="$1"
    local error_message="$2"
    local project_root=$(get_project_root)

    local timestamp=$(get_timestamp_compact)
    local report_file="$project_root/deployments/${timestamp}-${tier}-error.txt"

    cat > "$report_file" << EOF
========================================
 ❌ Deployment Error Report
========================================
Tier:           $(echo "$tier" | tr '[:lower:]' '[:upper:]')
Date:           $(get_timestamp)
Branch:         $(get_git_branch)
Commit:         $(get_git_commit)

Error:
$error_message

Recent Git Changes:
$(git log -3 --oneline 2>/dev/null || echo "Unable to retrieve git log")

Environment:
  Node: $(node -v 2>/dev/null || echo "Not found")
  npm: $(npm -v 2>/dev/null || echo "Not found")
  OS: $OSTYPE

========================================
EOF

    log_error "Deployment failed. Error report saved: $report_file"
    cat "$report_file"
}

# ============================================
# Deployment History
# ============================================

list_deployment_history() {
    local project_root=$(get_project_root)
    local deployments_dir="$project_root/deployments"

    if [ ! -d "$deployments_dir" ]; then
        log_warning "No deployment history found"
        return
    fi

    log_section "📜 Recent Deployments"

    # List last 10 deployment reports
    local reports=$(ls -t "$deployments_dir"/*-report.txt 2>/dev/null | head -10)

    if [ -z "$reports" ]; then
        log_info "No deployment reports found"
        return
    fi

    echo ""
    for report in $reports; do
        local filename=$(basename "$report")
        local tier=$(echo "$filename" | cut -d'-' -f3)
        local date=$(echo "$filename" | cut -d'-' -f1-2)

        # Format date: YYYYMMDD-HHMMSS -> YYYY-MM-DD HH:MM:SS
        local formatted_date=$(echo "$date" | sed 's/\(....\)\(..\)\(..\)-\(..\)\(..\)\(..\)/\1-\2-\3 \4:\5:\6/')

        # Get version from report
        local version=$(grep "^Version:" "$report" | awk '{print $2}')

        echo "  • $formatted_date - $tier - $version"
    done

    echo ""
}

show_latest_deployment() {
    local tier="${1:-}"
    local project_root=$(get_project_root)
    local deployments_dir="$project_root/deployments"

    if [ ! -d "$deployments_dir" ]; then
        log_warning "No deployment history found"
        return
    fi

    local latest_report=""

    if [ -n "$tier" ]; then
        # Find latest for specific tier
        latest_report=$(ls -t "$deployments_dir"/*-${tier}-report.txt 2>/dev/null | head -1)
    else
        # Find latest overall
        latest_report=$(ls -t "$deployments_dir"/*-report.txt 2>/dev/null | head -1)
    fi

    if [ -z "$latest_report" ]; then
        log_warning "No deployment report found"
        return
    fi

    log_section "📄 Latest Deployment Report"
    cat "$latest_report"
}

# ============================================
# Deployment Status Dashboard Functions
# ============================================

# Global status tracking variables
export STATUS_PAGE_CURRENT=""
# HTML status reporting removed in v2025.11.01
# Reason: Unused feature adding complexity without value
# Original STATUS_* variables removed (used only for HTML generation)
# If needed in future, see git history at commit [archive/html-status-reporting branch]
export SCAN_DISPLAY="hidden"
export SCAN_SMOKE_RESULT="--"
export SCAN_SMOKE_DETAILS="Not run"
export SCAN_SMOKE_COLOR="text-gray-500"
export SCAN_CRITICAL_RESULT="--"
export SCAN_CRITICAL_DETAILS="Not run"
export SCAN_CRITICAL_COLOR="text-gray-500"
export SCAN_IMPORTANT_RESULT="--"
export SCAN_IMPORTANT_DETAILS="Not run"
export SCAN_IMPORTANT_COLOR="text-gray-500"
export SCAN_UI_RESULT="--"
export SCAN_UI_DETAILS="Not run"
export SCAN_UI_COLOR="text-blue-400"
export SCAN_OVERALL_STATUS="Not Run"
export SCAN_OVERALL_MESSAGE="Scan not performed"
export SCAN_OVERALL_ICON="⏳"
export SCAN_OVERALL_COLOR="text-gray-400"
export SCAN_OVERALL_BG="bg-gray-900"
export SCAN_OVERALL_BORDER="border-gray-700"

# HTML status reporting function get_status_icon() removed here (v2025.11.01)
# HTML status reporting function update_scan_results() removed here (v2025.11.01)

# HTML status page functions removed below (v2025.11.01)
# Original functions: generate_status_page, update_status_page, finalize_status_page, open_status_page
# Also removed: _update_status_page_html (internal helper)
# If needed in future, see git history at commit [archive/html-status-reporting branch]

# ============================================
# Initialization
# ============================================

# Initialize report tracking variables if not set
if [ -z "$DEPLOYMENT_START_TIME" ]; then
    export DEPLOYMENT_START_TIME=$(date +%s)
fi

# HTML status page configuration variables removed (v2025.11.01)
# Original variables: STATUS_PAGE_AUTO_REFRESH, STATUS_PAGE_REFRESH_INTERVAL, AUTO_OPEN_STATUS_PAGE

# Export functions (HTML status functions removed v2025.11.01)
export -f add_platform_deployed add_status_item add_validation_item add_verification_item
export -f generate_deployment_report display_deployment_summary display_next_steps
export -f generate_error_report list_deployment_history show_latest_deployment
