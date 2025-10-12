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
export STATUS_PAGE_ARCHIVE=""
export STATUS_VALIDATION="pending"
export STATUS_TESTS="pending"
export STATUS_WEB="pending"
export STATUS_IOS="pending"
export STATUS_ANDROID="pending"
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

# Status icon mappings
get_status_icon() {
    case "$1" in
        pending) echo "⏳" ;;
        in_progress) echo "🔄" ;;
        success) echo "✅" ;;
        failed) echo "❌" ;;
        skipped) echo "⏭️" ;;
        *) echo "❓" ;;
    esac
}

# Update scan results from test-health-report output
update_scan_results() {
    local smoke_passed="$1"
    local smoke_failed="$2"
    local critical_passed="$3"
    local critical_failed="$4"
    local important_passed="$5"
    local important_total="$6"
    local ui_passed="$7"
    local ui_failed="$8"
    local overall_status="$9"

    # Show scan section
    SCAN_DISPLAY=""

    # Smoke test
    if [ "$smoke_failed" = "0" ]; then
        SCAN_SMOKE_RESULT="✅ Pass"
        SCAN_SMOKE_COLOR="text-green-400"
    else
        SCAN_SMOKE_RESULT="❌ Fail"
        SCAN_SMOKE_COLOR="text-red-400"
    fi
    SCAN_SMOKE_DETAILS="${smoke_passed} passed, ${smoke_failed} failed"

    # Critical test
    if [ "$critical_failed" = "0" ]; then
        SCAN_CRITICAL_RESULT="✅ Pass"
        SCAN_CRITICAL_COLOR="text-green-400"
    else
        SCAN_CRITICAL_RESULT="❌ Fail"
        SCAN_CRITICAL_COLOR="text-red-400"
    fi
    SCAN_CRITICAL_DETAILS="${critical_passed} passed, ${critical_failed} failed"

    # Important test
    if [ "$important_total" -gt "0" ]; then
        local pass_rate=$((important_passed * 100 / important_total))
        if [ "$pass_rate" -ge "95" ]; then
            SCAN_IMPORTANT_RESULT="✅ ${pass_rate}%"
            SCAN_IMPORTANT_COLOR="text-green-400"
        elif [ "$pass_rate" -ge "90" ]; then
            SCAN_IMPORTANT_RESULT="⚠️  ${pass_rate}%"
            SCAN_IMPORTANT_COLOR="text-yellow-400"
        else
            SCAN_IMPORTANT_RESULT="❌ ${pass_rate}%"
            SCAN_IMPORTANT_COLOR="text-red-400"
        fi
        SCAN_IMPORTANT_DETAILS="${important_passed}/${important_total} passed"
    else
        SCAN_IMPORTANT_RESULT="✅ Pass"
        SCAN_IMPORTANT_COLOR="text-green-400"
        SCAN_IMPORTANT_DETAILS="${important_passed} passed"
    fi

    # UI test (informational)
    SCAN_UI_RESULT="ℹ️  ${ui_passed}"
    SCAN_UI_COLOR="text-blue-400"
    SCAN_UI_DETAILS="${ui_passed} passed, ${ui_failed} failed"

    # Overall status
    case "$overall_status" in
        "HEALTHY")
            SCAN_OVERALL_STATUS="✅ HEALTHY"
            SCAN_OVERALL_MESSAGE="Safe to deploy"
            SCAN_OVERALL_ICON="✅"
            SCAN_OVERALL_COLOR="text-green-400"
            SCAN_OVERALL_BG="bg-green-900/20"
            SCAN_OVERALL_BORDER="border-green-700"
            ;;
        "CAUTION")
            SCAN_OVERALL_STATUS="⚠️  CAUTION"
            SCAN_OVERALL_MESSAGE="Consider fixing important tests"
            SCAN_OVERALL_ICON="⚠️"
            SCAN_OVERALL_COLOR="text-yellow-400"
            SCAN_OVERALL_BG="bg-yellow-900/20"
            SCAN_OVERALL_BORDER="border-yellow-700"
            ;;
        "WARNING")
            SCAN_OVERALL_STATUS="⚠️  WARNING"
            SCAN_OVERALL_MESSAGE="Important test health degraded"
            SCAN_OVERALL_ICON="⚠️"
            SCAN_OVERALL_COLOR="text-orange-400"
            SCAN_OVERALL_BG="bg-orange-900/20"
            SCAN_OVERALL_BORDER="border-orange-700"
            ;;
        "FAILING")
            SCAN_OVERALL_STATUS="❌ FAILING"
            SCAN_OVERALL_MESSAGE="Critical tests must pass before deploy"
            SCAN_OVERALL_ICON="❌"
            SCAN_OVERALL_COLOR="text-red-400"
            SCAN_OVERALL_BG="bg-red-900/20"
            SCAN_OVERALL_BORDER="border-red-700"
            ;;
    esac
}

# Generate initial status page
generate_status_page() {
    local tier="${1:-qual}"
    local version="${2:-$(get_current_version)}"
    local project_root=$(get_project_root)

    # Create deployments directory
    mkdir -p "$project_root/deployments"

    # Set status page paths
    local timestamp=$(get_timestamp_compact)
    STATUS_PAGE_CURRENT="$project_root/deployments/current-status.html"
    STATUS_PAGE_ARCHIVE="$project_root/deployments/${timestamp}-${tier}-status.html"

    # Tier color mapping
    local tier_color="blue"
    case "$tier" in
        qual) tier_color="yellow" ;;
        stage) tier_color="purple" ;;
        beta) tier_color="blue" ;;
        prod) tier_color="green" ;;
    esac

    # Initial status: all pending
    STATUS_VALIDATION="pending"
    STATUS_TESTS="pending"
    STATUS_WEB="pending"
    STATUS_IOS="pending"
    STATUS_ANDROID="pending"

    # Generate initial page
    _update_status_page_html "$tier" "$version" "$tier_color"

    log_info "Status page generated: $STATUS_PAGE_CURRENT"
}

# Update status for a specific step
update_status_page() {
    local step="$1"      # validation, tests, web, ios, android
    local status="$2"    # pending, in_progress, success, failed, skipped
    local message="${3:-}"

    # Update status variable
    case "$step" in
        validation) STATUS_VALIDATION="$status" ;;
        tests) STATUS_TESTS="$status" ;;
        web) STATUS_WEB="$status" ;;
        ios) STATUS_IOS="$status" ;;
        android) STATUS_ANDROID="$status" ;;
    esac

    # Regenerate HTML with new status
    local tier=$(basename "$STATUS_PAGE_ARCHIVE" | cut -d'-' -f3)
    local version=$(get_current_version)
    local tier_color="blue"
    case "$tier" in
        qual) tier_color="yellow" ;;
        stage) tier_color="purple" ;;
        beta) tier_color="blue" ;;
        prod) tier_color="green" ;;
    esac

    _update_status_page_html "$tier" "$version" "$tier_color"
}

# Internal function to regenerate HTML
_update_status_page_html() {
    local tier="$1"
    local version="$2"
    local tier_color="$3"

    if [ -z "$STATUS_PAGE_CURRENT" ]; then
        return  # Not initialized
    fi

    local project_root=$(get_project_root)
    local template="$project_root/scripts/deploy/lib/status-page-template.html"

    if [ ! -f "$template" ]; then
        log_error "Status page template not found: $template"
        return
    fi

    # Calculate duration
    local current_time=$(date +%s)
    local duration_seconds=$((current_time - DEPLOYMENT_START_TIME))
    local duration=$(format_duration $duration_seconds)

    # Determine refresh interval
    local refresh_interval=""
    if [ "$STATUS_PAGE_AUTO_REFRESH" = "true" ]; then
        refresh_interval="$STATUS_PAGE_REFRESH_INTERVAL"
    else
        refresh_interval="999999"  # Effectively disable
    fi

    # Generate status messages
    local validation_msg="Checking environment, git status, and credentials..."
    local tests_msg="Running test suite..."
    local web_msg="Building and deploying web application..."
    local ios_msg="Building and uploading to TestFlight..."
    local android_msg="Building and uploading to Play Store..."

    [ "$STATUS_VALIDATION" = "success" ] && validation_msg="Environment validated successfully"
    [ "$STATUS_VALIDATION" = "failed" ] && validation_msg="Validation failed - check logs"

    [ "$STATUS_TESTS" = "success" ] && tests_msg="All tests passed"
    [ "$STATUS_TESTS" = "failed" ] && tests_msg="Some tests failed - check logs"

    [ "$STATUS_WEB" = "success" ] && web_msg="Deployed to $APP_URL_QUAL"
    [ "$STATUS_WEB" = "failed" ] && web_msg="Web deployment failed"
    [ "$STATUS_WEB" = "skipped" ] && web_msg="Web deployment skipped"

    [ "$STATUS_IOS" = "success" ] && ios_msg="Uploaded to TestFlight successfully"
    [ "$STATUS_IOS" = "failed" ] && ios_msg="iOS deployment failed"
    [ "$STATUS_IOS" = "skipped" ] && ios_msg="iOS deployment skipped"

    [ "$STATUS_ANDROID" = "success" ] && android_msg="Uploaded to Play Store successfully"
    [ "$STATUS_ANDROID" = "failed" ] && android_msg="Android deployment failed"
    [ "$STATUS_ANDROID" = "skipped" ] && android_msg="Android deployment skipped"

    # Generate auto-refresh message
    local auto_refresh_msg="Page will auto-refresh every ${STATUS_PAGE_REFRESH_INTERVAL}s"
    if [ "$STATUS_PAGE_AUTO_REFRESH" != "true" ]; then
        auto_refresh_msg="Auto-refresh disabled"
    fi

    # Replace all placeholders in template
    sed -e "s|{{APP_NAME}}|${APP_NAME}|g" \
        -e "s|{{TIER}}|$(echo "$tier" | tr '[:lower:]' '[:upper:]')|g" \
        -e "s|{{TIER_COLOR}}|${tier_color}|g" \
        -e "s|{{VERSION}}|${version}|g" \
        -e "s|{{START_TIME}}|$(date -r $DEPLOYMENT_START_TIME '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d @$DEPLOYMENT_START_TIME '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "N/A")|g" \
        -e "s|{{DURATION}}|${duration}|g" \
        -e "s|{{REFRESH_INTERVAL}}|${refresh_interval}|g" \
        -e "s|{{VALIDATION_STATUS}}|${STATUS_VALIDATION}|g" \
        -e "s|{{VALIDATION_ICON}}|$(get_status_icon $STATUS_VALIDATION)|g" \
        -e "s|{{VALIDATION_MESSAGE}}|${validation_msg}|g" \
        -e "s|{{TESTS_STATUS}}|${STATUS_TESTS}|g" \
        -e "s|{{TESTS_ICON}}|$(get_status_icon $STATUS_TESTS)|g" \
        -e "s|{{TESTS_MESSAGE}}|${tests_msg}|g" \
        -e "s|{{WEB_STATUS}}|${STATUS_WEB}|g" \
        -e "s|{{WEB_ICON}}|$(get_status_icon $STATUS_WEB)|g" \
        -e "s|{{WEB_MESSAGE}}|${web_msg}|g" \
        -e "s|{{IOS_STATUS}}|${STATUS_IOS}|g" \
        -e "s|{{IOS_ICON}}|$(get_status_icon $STATUS_IOS)|g" \
        -e "s|{{IOS_MESSAGE}}|${ios_msg}|g" \
        -e "s|{{ANDROID_STATUS}}|${STATUS_ANDROID}|g" \
        -e "s|{{ANDROID_ICON}}|$(get_status_icon $STATUS_ANDROID)|g" \
        -e "s|{{ANDROID_MESSAGE}}|${android_msg}|g" \
        -e "s|{{APP_URL_PROD}}|${APP_URL_PROD}|g" \
        -e "s|{{APP_URL_BETA}}|${APP_URL_BETA}|g" \
        -e "s|{{APP_URL_STAGE}}|${APP_URL_STAGE}|g" \
        -e "s|{{APP_URL_QUAL}}|${APP_URL_QUAL}|g" \
        -e "s|{{APP_STORE_CONNECT_APP_ID}}|${APP_STORE_CONNECT_APP_ID}|g" \
        -e "s|{{PLAY_CONSOLE_DEVELOPER_ID}}|${PLAY_CONSOLE_DEVELOPER_ID}|g" \
        -e "s|{{PLAY_CONSOLE_APP_ID}}|${PLAY_CONSOLE_APP_ID}|g" \
        -e "s|{{LAST_UPDATE}}|$(date '+%Y-%m-%d %H:%M:%S')|g" \
        -e "s|{{AUTO_REFRESH_MESSAGE}}|${auto_refresh_msg}|g" \
        -e "s|{{SCAN_DISPLAY}}|${SCAN_DISPLAY}|g" \
        -e "s|{{SCAN_SMOKE_RESULT}}|${SCAN_SMOKE_RESULT}|g" \
        -e "s|{{SCAN_SMOKE_DETAILS}}|${SCAN_SMOKE_DETAILS}|g" \
        -e "s|{{SCAN_SMOKE_COLOR}}|${SCAN_SMOKE_COLOR}|g" \
        -e "s|{{SCAN_CRITICAL_RESULT}}|${SCAN_CRITICAL_RESULT}|g" \
        -e "s|{{SCAN_CRITICAL_DETAILS}}|${SCAN_CRITICAL_DETAILS}|g" \
        -e "s|{{SCAN_CRITICAL_COLOR}}|${SCAN_CRITICAL_COLOR}|g" \
        -e "s|{{SCAN_IMPORTANT_RESULT}}|${SCAN_IMPORTANT_RESULT}|g" \
        -e "s|{{SCAN_IMPORTANT_DETAILS}}|${SCAN_IMPORTANT_DETAILS}|g" \
        -e "s|{{SCAN_IMPORTANT_COLOR}}|${SCAN_IMPORTANT_COLOR}|g" \
        -e "s|{{SCAN_UI_RESULT}}|${SCAN_UI_RESULT}|g" \
        -e "s|{{SCAN_UI_DETAILS}}|${SCAN_UI_DETAILS}|g" \
        -e "s|{{SCAN_UI_COLOR}}|${SCAN_UI_COLOR}|g" \
        -e "s|{{SCAN_OVERALL_STATUS}}|${SCAN_OVERALL_STATUS}|g" \
        -e "s|{{SCAN_OVERALL_MESSAGE}}|${SCAN_OVERALL_MESSAGE}|g" \
        -e "s|{{SCAN_OVERALL_ICON}}|${SCAN_OVERALL_ICON}|g" \
        -e "s|{{SCAN_OVERALL_COLOR}}|${SCAN_OVERALL_COLOR}|g" \
        -e "s|{{SCAN_OVERALL_BG}}|${SCAN_OVERALL_BG}|g" \
        -e "s|{{SCAN_OVERALL_BORDER}}|${SCAN_OVERALL_BORDER}|g" \
        "$template" > "$STATUS_PAGE_CURRENT"

    # Also update archive copy
    cp "$STATUS_PAGE_CURRENT" "$STATUS_PAGE_ARCHIVE"
}

# Finalize status page (disable auto-refresh)
finalize_status_page() {
    # Disable auto-refresh
    STATUS_PAGE_AUTO_REFRESH=false

    # Regenerate page one last time
    local tier=$(basename "$STATUS_PAGE_ARCHIVE" | cut -d'-' -f3)
    local version=$(get_current_version)
    local tier_color="blue"
    case "$tier" in
        qual) tier_color="yellow" ;;
        stage) tier_color="purple" ;;
        beta) tier_color="blue" ;;
        prod) tier_color="green" ;;
    esac

    _update_status_page_html "$tier" "$version" "$tier_color"

    log_success "Deployment status finalized: $STATUS_PAGE_ARCHIVE"
}

# Open status page in browser
open_status_page() {
    if [ "$AUTO_OPEN_STATUS_PAGE" != "true" ]; then
        log_info "Status page auto-open disabled"
        log_info "View manually: $STATUS_PAGE_CURRENT"
        return
    fi

    if [ -z "$STATUS_PAGE_CURRENT" ] || [ ! -f "$STATUS_PAGE_CURRENT" ]; then
        log_warning "Status page not found, skipping auto-open"
        return
    fi

    log_info "Opening status page in browser..."

    # Try to open in default browser (cross-platform)
    if command -v open &> /dev/null; then
        # macOS
        open "$STATUS_PAGE_CURRENT"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "$STATUS_PAGE_CURRENT" &> /dev/null &
    elif command -v start &> /dev/null; then
        # Windows
        start "$STATUS_PAGE_CURRENT"
    else
        log_warning "Could not auto-open browser"
        log_info "View manually: $STATUS_PAGE_CURRENT"
    fi
}

# ============================================
# Initialization
# ============================================

# Initialize report tracking variables if not set
if [ -z "$DEPLOYMENT_START_TIME" ]; then
    export DEPLOYMENT_START_TIME=$(date +%s)
fi

# Export functions
export -f add_platform_deployed add_status_item add_validation_item add_verification_item
export -f generate_deployment_report display_deployment_summary display_next_steps
export -f generate_error_report list_deployment_history show_latest_deployment
export -f generate_status_page update_status_page finalize_status_page open_status_page get_status_icon update_scan_results
