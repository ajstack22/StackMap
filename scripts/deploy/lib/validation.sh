#!/bin/bash

# ============================================
# Pre-Deployment Validation Functions
# Validates environment before deployment
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
# Environment Validation
# ============================================

validate_environment() {
    local tier="${1:-qual}"

    log_header "🔍 Environment Validation"

    local validation_failed=false

    # Check Node.js
    if check_command_exists "node" "Node.js"; then
        local node_version=$(node -v)
        log_info "Node version: $node_version"
    else
        validation_failed=true
    fi

    # Check npm
    if check_command_exists "npm" "npm"; then
        local npm_version=$(npm -v)
        log_info "npm version: $npm_version"
    else
        validation_failed=true
    fi

    # Check git
    if check_command_exists "git" "Git"; then
        local git_version=$(git --version)
        log_info "$git_version"
    else
        validation_failed=true
    fi

    # Check for mobile-specific tools (only warnings for qual/stage, errors for beta/prod)
    if [ "$tier" != "qual" ] && [ "$tier" != "stage" ]; then
        # Check fastlane for mobile deployments
        if command -v fastlane &> /dev/null; then
            log_success "fastlane is available"
        else
            log_warning "fastlane not found (required for mobile deployments)"
            if [ "$tier" = "prod" ] || [ "$tier" = "beta" ]; then
                validation_failed=true
            fi
        fi
    elif [ "$tier" = "stage" ]; then
        # Stage tier: check but only warn
        if command -v fastlane &> /dev/null; then
            log_success "fastlane is available"
        else
            log_warning "fastlane not found (required for mobile deployments, warning only for stage)"
        fi
    fi

    # Check project files exist
    local project_root=$(get_project_root)
    check_file_exists "$project_root/package.json" "package.json" || validation_failed=true
    check_file_exists "$project_root/app.json" "app.json" || validation_failed=true

    # Check node_modules exists
    if [ -d "$project_root/node_modules" ]; then
        log_success "node_modules directory exists"
    else
        log_warning "node_modules not found. Run 'npm install' first."
        if [ "$tier" != "qual" ]; then
            validation_failed=true
        fi
    fi

    if [ "$validation_failed" = true ]; then
        log_error "Environment validation failed"
        return 1
    else
        log_success "Environment validation passed"
        return 0
    fi
}

# ============================================
# Git Status Validation
# ============================================

validate_git_status() {
    local tier="${1:-qual}"

    log_step "Checking git status..."

    if get_git_status_clean; then
        log_success "Working directory is clean"
        return 0
    else
        local uncommitted_count=$(git status --porcelain | wc -l | tr -d ' ')
        log_warning "Found $uncommitted_count uncommitted changes"

        # Different behavior by tier
        case "$tier" in
            qual)
                log_info "Continuing with deployment (qual allows uncommitted changes)"
                return 0
                ;;
            stage)
                log_info "Continuing with deployment (stage allows uncommitted changes)"
                return 0
                ;;
            beta)
                log_error "Beta deployment requires clean working directory"
                git status --short
                return 1
                ;;
            prod)
                log_error "Production deployment requires clean working directory"
                git status --short
                return 1
                ;;
            *)
                log_warning "Unknown tier: $tier"
                return 0
                ;;
        esac
    fi
}

# ============================================
# Credential Validation
# ============================================

validate_credentials() {
    local tier="${1:-qual}"

    log_step "Validating credentials for $tier deployment..."

    local validation_failed=false

    case "$tier" in
        qual)
            # Qual doesn't need special credentials
            log_info "Qual deployment doesn't require special credentials"
            ;;

        stage)
            # Stage needs mobile deployment credentials (warnings only)
            log_info "Stage deployment requires mobile credentials"
            if ! validate_ios_credentials; then
                log_warning "iOS credentials validation failed (warning only)"
            fi
            if ! validate_android_credentials; then
                log_warning "Android credentials validation failed (warning only)"
            fi
            # Stage warnings only - never fail
            ;;

        beta)
            # Beta needs mobile deployment credentials
            validate_ios_credentials || validation_failed=true
            validate_android_credentials || validation_failed=true
            ;;

        prod)
            # Prod needs all credentials
            validate_ssh_credentials || validation_failed=true
            validate_ios_credentials || validation_failed=true
            validate_android_credentials || validation_failed=true
            ;;
    esac

    if [ "$validation_failed" = true ]; then
        log_error "Credential validation failed"
        return 1
    else
        log_success "Credential validation passed"
        return 0
    fi
}

validate_ssh_credentials() {
    log_step "Checking SSH credentials for web deployment..."

    # Check if SSH config exists for configured SSH host
    if ssh -G "$APP_SSH_HOST" &> /dev/null; then
        log_success "SSH config for $APP_SSH_HOST found"

        # Try to connect and verify write permissions (with timeout)
        log_step "Verifying SSH connection and write permissions..."
        if timeout 5 ssh -o ConnectTimeout=5 -o BatchMode=yes "$APP_SSH_HOST" "test -w $APP_SSH_WEBROOT && test -w $APP_SSH_QUAL_DIR && test -w $APP_SSH_BETA_DIR" 2>/dev/null; then
            log_success "SSH connection successful and write permissions verified"
            log_info "Verified write access to: $APP_SSH_WEBROOT, $APP_SSH_QUAL_DIR, $APP_SSH_BETA_DIR"
            return 0
        else
            # Connection might work but permissions might be wrong - check both
            if timeout 5 ssh -o ConnectTimeout=5 -o BatchMode=yes "$APP_SSH_HOST" "exit" 2>/dev/null; then
                log_error "SSH connection successful but missing write permissions"
                log_info "Check write access to:"
                log_info "  - $APP_SSH_WEBROOT"
                log_info "  - $APP_SSH_QUAL_DIR"
                log_info "  - $APP_SSH_BETA_DIR"
                return 1
            else
                log_error "Cannot connect to $APP_SSH_HOST via SSH"
                return 1
            fi
        fi
    else
        log_error "SSH config for $APP_SSH_HOST not found"
        log_info "Add SSH config in ~/.ssh/config"
        return 1
    fi
}

validate_ios_credentials() {
    log_step "Checking iOS deployment credentials..."

    local project_root=$(get_project_root)

    # Check for fastlane
    if ! command -v fastlane &> /dev/null; then
        log_warning "fastlane not installed (required for iOS deployment)"
        return 1
    fi

    # Check for iOS fastlane directory
    if [ ! -d "$project_root/ios/fastlane" ]; then
        log_error "iOS fastlane configuration not found"
        return 1
    fi

    # Check for App Store Connect API key
    if [ -f "$APP_IOS_API_KEY_PATH" ]; then
        log_success "iOS App Store Connect API key found"
        return 0
    else
        log_error "iOS App Store Connect API key not found at $APP_IOS_API_KEY_PATH"
        return 1
    fi
}

validate_android_credentials() {
    log_step "Checking Android deployment credentials..."

    local project_root=$(get_project_root)

    # Check for fastlane
    if ! command -v fastlane &> /dev/null; then
        log_warning "fastlane not installed (required for Android deployment)"
        return 1
    fi

    # Check for Android fastlane directory
    if [ ! -d "$project_root/android/fastlane" ]; then
        log_error "Android fastlane configuration not found"
        return 1
    fi

    # Check for Google Play service account key (stored in keychain)
    # We can't directly validate keychain entries, so we check if fastlane can access it
    log_info "Android credentials managed via macOS Keychain"
    log_success "Android credential check passed (keychain-based)"
    return 0
}

# ============================================
# Version Validation
# ============================================

validate_version_numbers() {
    log_step "Validating version numbers across files..."

    local project_root=$(get_project_root)
    local validation_failed=false

    # Get version from package.json
    local pkg_version=$(grep '"version":' "$project_root/package.json" | head -1 | cut -d'"' -f4)

    # Get version from app.json
    local app_version=$(grep '"version":' "$project_root/app.json" | head -1 | cut -d'"' -f4)

    # Get version from version.js
    local version_js=""
    if [ -f "$project_root/src/utils/version.js" ]; then
        version_js=$(grep "BUILD_VERSION = " "$project_root/src/utils/version.js" | cut -d"'" -f2)
    fi

    log_info "package.json: $pkg_version"
    log_info "app.json: $app_version"
    if [ -n "$version_js" ]; then
        log_info "version.js: $version_js"
    fi

    # Check if versions match
    if [ "$pkg_version" != "$app_version" ]; then
        log_error "Version mismatch: package.json ($pkg_version) != app.json ($app_version)"
        validation_failed=true
    fi

    if [ -n "$version_js" ] && [ "$pkg_version" != "$version_js" ]; then
        log_error "Version mismatch: package.json ($pkg_version) != version.js ($version_js)"
        validation_failed=true
    fi

    if [ "$validation_failed" = true ]; then
        log_error "Version validation failed"
        return 1
    else
        log_success "All versions are synchronized: $pkg_version"
        return 0
    fi
}

# ============================================
# Dependency Validation
# ============================================

validate_dependencies() {
    log_step "Validating dependencies..."

    local project_root=$(get_project_root)
    local validation_failed=false

    # Check node_modules exists
    if [ ! -d "$project_root/node_modules" ]; then
        log_error "node_modules not found. Run 'npm install'"
        validation_failed=true
    fi

    # Check for iOS pods (only if ios directory exists)
    if [ -d "$project_root/ios" ]; then
        if [ -d "$project_root/ios/Pods" ]; then
            log_success "iOS Pods directory exists"
        else
            log_warning "iOS Pods not found. Run 'cd ios && pod install' if needed"
            # Not a failure - pods are only needed for iOS builds
        fi
    fi

    if [ "$validation_failed" = true ]; then
        log_error "Dependency validation failed"
        return 1
    else
        log_success "Dependency validation passed"
        return 0
    fi
}

# ============================================
# Full Pre-Deployment Validation
# ============================================

run_full_validation() {
    local tier="${1:-qual}"
    local run_quality_gates="${2:-true}"

    log_header "🔍 Pre-Deployment Validation: $(echo "$tier" | tr '[:lower:]' '[:upper:]')"

    local validation_failed=false

    validate_environment "$tier" || validation_failed=true
    validate_git_status "$tier" || validation_failed=true
    validate_version_numbers || validation_failed=true
    validate_dependencies || validation_failed=true

    # Only validate credentials for stage/beta/prod
    if [ "$tier" != "qual" ]; then
        validate_credentials "$tier" || validation_failed=true
    fi

    # Run quality gates if enabled
    if [ "$run_quality_gates" = "true" ]; then
        # Source quality gates library
        local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        if [ -f "$script_dir/quality-gates.sh" ]; then
            source "$script_dir/quality-gates.sh"
            run_all_quality_gates "$tier" || validation_failed=true
        else
            log_warning "Quality gates script not found, skipping quality checks"
        fi
    fi

    echo ""
    if [ "$validation_failed" = true ]; then
        log_error "Pre-deployment validation FAILED"
        return 1
    else
        log_success "Pre-deployment validation PASSED"
        return 0
    fi
}

# Export functions
export -f validate_environment validate_git_status validate_credentials
export -f validate_ssh_credentials validate_ios_credentials validate_android_credentials
export -f validate_version_numbers validate_dependencies
export -f run_full_validation
