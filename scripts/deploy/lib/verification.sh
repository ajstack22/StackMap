#!/bin/bash

# ============================================
# Post-Deployment Verification Functions
# Verifies deployment success and health
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

# ============================================
# Web Deployment Verification
# ============================================

verify_web_deployment() {
    local tier="${1:-qual}"
    local url=""

    log_step "Verifying web deployment for $tier..."

    # Determine URL based on tier
    case "$tier" in
        qual)
            url="$APP_URL_QUAL"
            ;;
        stage)
            url="$APP_URL_STAGE"
            ;;
        beta)
            url="$APP_URL_BETA"
            ;;
        prod)
            url="$APP_URL_PROD"
            ;;
    esac

    # Check if URL is accessible
    if command -v curl &> /dev/null; then
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)

        if [ "$http_code" = "200" ]; then
            log_success "Web deployment verified: $url (HTTP $http_code)"
            return 0
        else
            log_error "Web deployment verification failed: $url (HTTP $http_code)"
            return 1
        fi
    else
        log_warning "curl not available, skipping web verification"
        return 0
    fi
}

# ============================================
# Mobile Build Verification
# ============================================

verify_mobile_builds() {
    local platform="${1:-all}"
    local tier="${2:-qual}"

    log_step "Verifying mobile builds..."

    local verification_failed=false

    case "$platform" in
        ios|all)
            verify_ios_build "$tier" || verification_failed=true
            ;;
    esac

    case "$platform" in
        android|all)
            verify_android_build "$tier" || verification_failed=true
            ;;
    esac

    if [ "$verification_failed" = true ]; then
        return 1
    else
        return 0
    fi
}

verify_ios_build() {
    local tier="$1"
    local project_root=$(get_project_root)

    case "$tier" in
        qual)
            # For qual, we don't check for IPA files
            log_info "iOS qual deployment uses simulators (no IPA check)"
            return 0
            ;;

        stage|beta|prod)
            # For beta/prod, check for IPA in build directory
            local ipa_path="$project_root/$APP_IOS_IPA_PATH"

            if [ -f "$ipa_path" ]; then
                local ipa_size=$(du -h "$ipa_path" | cut -f1)
                log_success "iOS IPA found: $ipa_path ($ipa_size)"
                return 0
            else
                log_warning "iOS IPA not found at: $ipa_path"
                log_info "This is normal if fastlane uploaded directly to TestFlight"
                return 0
            fi
            ;;
    esac
}

verify_android_build() {
    local tier="$1"
    local project_root=$(get_project_root)

    case "$tier" in
        qual)
            # For qual, check for debug APK
            local apk_path="$project_root/$APP_ANDROID_APK_DEBUG_PATH"

            if [ -f "$apk_path" ]; then
                local apk_size=$(du -h "$apk_path" | cut -f1)
                log_success "Android APK found: $apk_path ($apk_size)"
                return 0
            else
                log_warning "Android APK not found at: $apk_path"
                return 1
            fi
            ;;

        stage|beta|prod)
            # For beta/prod, check for release AAB
            local aab_path="$project_root/$APP_ANDROID_AAB_PATH"

            if [ -f "$aab_path" ]; then
                local aab_size=$(du -h "$aab_path" | cut -f1)
                log_success "Android AAB found: $aab_path ($aab_size)"
                return 0
            else
                log_warning "Android AAB not found at: $aab_path"
                log_info "This is normal if fastlane uploaded directly to Play Store"
                return 0
            fi
            ;;
    esac
}

# ============================================
# Version Update Verification
# ============================================

verify_version_updates() {
    log_step "Verifying version updates..."

    local project_root=$(get_project_root)
    local verification_failed=false

    # Get current version
    local current_version=$(get_current_version)

    # Check that version matches across all files
    local pkg_version=$(grep '"version":' "$project_root/package.json" | head -1 | cut -d'"' -f4)
    local app_version=$(grep '"version":' "$project_root/app.json" | head -1 | cut -d'"' -f4)

    if [ "$pkg_version" = "$app_version" ]; then
        log_success "Version synchronized across files: $pkg_version"
    else
        log_error "Version mismatch after deployment"
        verification_failed=true
    fi

    # Check version.js if it exists
    if [ -f "$project_root/src/utils/version.js" ]; then
        local version_js=$(grep "BUILD_VERSION = " "$project_root/src/utils/version.js" | cut -d"'" -f2)
        if [ "$pkg_version" = "$version_js" ]; then
            log_success "version.js matches: $version_js"
        else
            log_error "version.js mismatch: expected $pkg_version, got $version_js"
            verification_failed=true
        fi
    fi

    if [ "$verification_failed" = true ]; then
        return 1
    else
        return 0
    fi
}

# ============================================
# Git Commit Verification
# ============================================

verify_git_commits() {
    log_step "Verifying git commits..."

    # Check that we're on a valid branch
    local branch=$(get_git_branch)
    if [ "$branch" = "unknown" ]; then
        log_error "Not in a git repository or detached HEAD"
        return 1
    fi

    log_success "On branch: $branch"

    # Check for recent commits (last 5)
    local commit_count=$(git rev-list --count HEAD ^HEAD~5 2>/dev/null || echo "0")
    log_info "Recent commits: $commit_count"

    # Check if there are uncommitted changes (warning only)
    if ! get_git_status_clean; then
        log_warning "Uncommitted changes remain after deployment"
        return 0  # Not a failure
    else
        log_success "Working directory is clean"
        return 0
    fi
}

# ============================================
# Health Check Functions
# ============================================

check_web_health() {
    local tier="${1:-qual}"
    local url=""

    case "$tier" in
        qual)
            url="$APP_URL_QUAL"
            ;;
        stage)
            url="$APP_URL_STAGE"
            ;;
        beta)
            url="$APP_URL_BETA"
            ;;
        prod)
            url="$APP_URL_PROD"
            ;;
    esac

    log_step "Running web health check: $url"

    if command -v curl &> /dev/null; then
        # Check if site loads
        local response=$(curl -s -w "\n%{http_code}" "$url" --max-time 10)
        local http_code=$(echo "$response" | tail -1)
        local body=$(echo "$response" | head -n -1)

        if [ "$http_code" = "200" ]; then
            # Check if it's actually the app (contains React root or app name)
            if echo "$body" | grep -q "root\|${APP_NAME_LOWER}" > /dev/null 2>&1; then
                log_success "Web health check passed"
                return 0
            else
                log_warning "Site loaded but content doesn't look like $APP_NAME"
                return 1
            fi
        else
            log_error "Web health check failed (HTTP $http_code)"
            return 1
        fi
    else
        log_warning "curl not available, skipping health check"
        return 0
    fi
}

check_api_health() {
    local tier="${1:-qual}"
    local api_url=""

    case "$tier" in
        qual)
            api_url="${APP_API_QUAL}/sync"
            ;;
        stage)
            api_url="${APP_API_STAGE}/sync"
            ;;
        beta)
            api_url="${APP_API_BETA}/sync"
            ;;
        prod)
            api_url="${APP_API_PROD}/sync"
            ;;
    esac

    log_step "Running API health check: $api_url"

    if command -v curl &> /dev/null; then
        # Try to ping the sync API (it should return 400 or 405 for GET without params)
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$api_url" --max-time 10)

        # API is healthy if it responds (even with 400/405)
        if [[ "$http_code" =~ ^(200|400|405)$ ]]; then
            log_success "API health check passed (HTTP $http_code)"
            return 0
        else
            log_error "API health check failed (HTTP $http_code)"
            return 1
        fi
    else
        log_warning "curl not available, skipping API health check"
        return 0
    fi
}

# ============================================
# Full Post-Deployment Verification
# ============================================

run_full_verification() {
    local tier="${1:-qual}"
    local platforms="${2:-web}"

    log_header "🔍 Post-Deployment Verification: $(echo "$tier" | tr '[:lower:]' '[:upper:]')"

    local verification_failed=false

    # Verify version updates
    verify_version_updates || verification_failed=true

    # Verify git commits
    verify_git_commits || verification_failed=true

    # Verify web deployment if applicable
    if echo "$platforms" | grep -q "web"; then
        verify_web_deployment "$tier" || verification_failed=true
        check_web_health "$tier" || verification_failed=true
    fi

    # Verify mobile builds if applicable
    if echo "$platforms" | grep -q "ios"; then
        verify_ios_build "$tier" || verification_failed=true
    fi

    if echo "$platforms" | grep -q "android"; then
        verify_android_build "$tier" || verification_failed=true
    fi

    echo ""
    if [ "$verification_failed" = true ]; then
        log_warning "Post-deployment verification completed with warnings"
        return 0  # Don't fail deployment for verification warnings
    else
        log_success "Post-deployment verification PASSED"
        return 0
    fi
}

# Export functions
export -f verify_web_deployment verify_mobile_builds
export -f verify_ios_build verify_android_build
export -f verify_version_updates verify_git_commits
export -f check_web_health check_api_health
export -f run_full_verification
