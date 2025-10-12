#!/bin/bash

# ============================================
# Rollback Functions for Deployment
# Transaction-like deployment with rollback capability
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

# Deployment state directory - stored in project for persistence
# Not in /tmp to survive system restarts and temp directory cleanup
# Only set PROJECT_ROOT if not already set (may be inherited from deploy.sh)
if [ -z "$PROJECT_ROOT" ]; then
    PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi
DEPLOYMENT_STATE_DIR="$PROJECT_ROOT/$APP_DEPLOYMENT_STATE_DIR"
mkdir -p "$DEPLOYMENT_STATE_DIR"

# Add to .gitignore if not already there
GITIGNORE_PATH="$PROJECT_ROOT/.gitignore"
if [ -f "$GITIGNORE_PATH" ] && ! grep -q "^\.deployment/" "$GITIGNORE_PATH" 2>/dev/null; then
    echo "" >> "$GITIGNORE_PATH"
    echo "# Deployment state files" >> "$GITIGNORE_PATH"
    echo ".deployment/" >> "$GITIGNORE_PATH"
fi

# ============================================
# Save Deployment State
# ============================================

save_deployment_state() {
    local tier="$1"
    local platform="$2"
    local project_root=$(get_project_root)

    log_step "Saving deployment state for $tier/$platform..."

    local state_file="$DEPLOYMENT_STATE_DIR/${tier}-${platform}-$(date +%Y%m%d-%H%M%S).json"

    # Get current state
    local current_version=$(get_current_version)
    local git_commit=$(get_git_commit)
    local git_branch=$(get_git_branch)
    local timestamp=$(get_timestamp)

    # Create state file
    cat > "$state_file" << EOF
{
  "tier": "$tier",
  "platform": "$platform",
  "version": "$current_version",
  "git_commit": "$git_commit",
  "git_branch": "$git_branch",
  "timestamp": "$timestamp",
  "project_root": "$project_root"
}
EOF

    # Save platform-specific artifacts
    case "$platform" in
        ios)
            # Save IPA location if it exists
            local ipa_path="$project_root/$APP_IOS_IPA_PATH"
            if [ -f "$ipa_path" ]; then
                echo "  \"ipa_path\": \"$ipa_path\"," >> "$state_file.tmp"
                cat "$state_file" >> "$state_file.tmp"
                mv "$state_file.tmp" "$state_file"
            fi
            ;;
        android)
            # Save AAB location if it exists
            local aab_path="$project_root/$APP_ANDROID_AAB_PATH"
            if [ -f "$aab_path" ]; then
                echo "  \"aab_path\": \"$aab_path\"," >> "$state_file.tmp"
                cat "$state_file" >> "$state_file.tmp"
                mv "$state_file.tmp" "$state_file"
            fi
            ;;
        web)
            # Save web build info
            echo "  \"web_deployed\": true," >> "$state_file.tmp"
            cat "$state_file" >> "$state_file.tmp"
            mv "$state_file.tmp" "$state_file"
            ;;
    esac

    log_success "Deployment state saved: $state_file"
    echo "$state_file"
}

# ============================================
# Get Last Deployment State
# ============================================

get_last_deployment_state() {
    local tier="$1"
    local platform="$2"

    # Find most recent state file for this tier/platform
    local state_file=$(ls -t "$DEPLOYMENT_STATE_DIR/${tier}-${platform}-"*.json 2>/dev/null | head -1)

    if [ -z "$state_file" ]; then
        log_warning "No previous deployment state found for $tier/$platform"
        return 1
    fi

    echo "$state_file"
}

# ============================================
# Rollback Deployment
# ============================================

rollback_deployment() {
    local tier="$1"
    local platform="${2:-all}"

    log_header "🔄 Rolling Back Deployment: $tier"

    local rollback_failed=false

    case "$platform" in
        all)
            # Rollback all platforms
            rollback_platform_deployment "$tier" "web" || rollback_failed=true
            rollback_platform_deployment "$tier" "ios" || rollback_failed=true
            rollback_platform_deployment "$tier" "android" || rollback_failed=true
            ;;
        web|ios|android)
            rollback_platform_deployment "$tier" "$platform" || rollback_failed=true
            ;;
        *)
            log_error "Unknown platform: $platform"
            return 1
            ;;
    esac

    if [ "$rollback_failed" = true ]; then
        log_error "Rollback completed with errors"
        return 1
    else
        log_success "Rollback completed successfully"
        return 0
    fi
}

# ============================================
# Rollback Platform-Specific Deployment
# ============================================

rollback_platform_deployment() {
    local tier="$1"
    local platform="$2"

    log_step "Rolling back $platform deployment for $tier..."

    # Get last known good state
    local state_file=$(get_last_deployment_state "$tier" "$platform")

    if [ -z "$state_file" ]; then
        log_warning "No rollback state available for $tier/$platform"
        return 0  # Not a failure, just nothing to rollback
    fi

    log_info "Using state file: $state_file"

    # Read state information
    local version=$(grep '"version"' "$state_file" | cut -d'"' -f4)
    local git_commit=$(grep '"git_commit"' "$state_file" | cut -d'"' -f4)

    log_info "Previous version: $version"
    log_info "Previous commit: $git_commit"

    # Platform-specific rollback instructions
    case "$platform" in
        web)
            log_warning "Web rollback not fully automated"
            log_info "To rollback web deployment:"
            log_info "  1. Checkout previous commit: git checkout $git_commit"
            log_info "  2. Re-deploy web: ./scripts/deploy-with-tracking.sh $tier"
            ;;
        ios)
            log_warning "iOS rollback not fully automated"
            log_info "To rollback iOS deployment:"
            log_info "  1. App Store Connect: https://appstoreconnect.apple.com/apps"
            log_info "  2. Navigate to TestFlight or App Store section"
            log_info "  3. Select previous build (version $version)"
            ;;
        android)
            log_warning "Android rollback not fully automated"
            log_info "To rollback Android deployment:"
            log_info "  1. Play Console: https://play.google.com/console/"
            log_info "  2. Navigate to Testing or Production track"
            log_info "  3. Select previous release (version $version)"
            ;;
    esac

    return 0
}

# ============================================
# List Available Rollback States
# ============================================

list_deployment_states() {
    local tier="${1:-all}"

    log_header "📋 Available Deployment States"

    if [ "$tier" = "all" ]; then
        # List all states
        local states=$(ls -t "$DEPLOYMENT_STATE_DIR"/*.json 2>/dev/null)
    else
        # List states for specific tier
        local states=$(ls -t "$DEPLOYMENT_STATE_DIR/${tier}-"*.json 2>/dev/null)
    fi

    if [ -z "$states" ]; then
        log_info "No deployment states found"
        return 0
    fi

    echo ""
    echo "Recent deployments:"
    echo ""

    local count=0
    for state_file in $states; do
        count=$((count + 1))
        if [ $count -gt 10 ]; then
            break  # Only show last 10
        fi

        local filename=$(basename "$state_file")
        local tier=$(grep '"tier"' "$state_file" | cut -d'"' -f4)
        local platform=$(grep '"platform"' "$state_file" | cut -d'"' -f4)
        local version=$(grep '"version"' "$state_file" | cut -d'"' -f4)
        local timestamp=$(grep '"timestamp"' "$state_file" | cut -d'"' -f4)

        echo "  [$count] $timestamp - $tier/$platform (v$version)"
    done

    echo ""
}

# ============================================
# Clean Old Deployment States
# ============================================

cleanup_old_states() {
    local days_to_keep="${1:-7}"

    log_step "Cleaning deployment states older than $days_to_keep days..."

    # Find and delete states older than specified days
    find "$DEPLOYMENT_STATE_DIR" -name "*.json" -mtime +"$days_to_keep" -delete

    local remaining=$(ls "$DEPLOYMENT_STATE_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
    log_success "Cleanup complete. $remaining states remaining."
}

# ============================================
# Create Deployment Manifest
# ============================================

create_deployment_manifest() {
    local tier="$1"
    local platforms="$2"  # Space-separated list: "web ios android"
    local project_root=$(get_project_root)

    log_step "Creating deployment manifest for $tier..."

    local manifest_file="$DEPLOYMENT_STATE_DIR/${tier}-manifest-$(date +%Y%m%d-%H%M%S).json"
    local current_version=$(get_current_version)
    local git_commit=$(get_git_commit)
    local timestamp=$(get_timestamp)

    cat > "$manifest_file" << EOF
{
  "tier": "$tier",
  "version": "$current_version",
  "git_commit": "$git_commit",
  "timestamp": "$timestamp",
  "platforms": {
EOF

    # Add platform deployment status
    local first=true
    for platform in $platforms; do
        if [ "$first" = false ]; then
            echo "," >> "$manifest_file"
        fi
        first=false

        local state_file=$(save_deployment_state "$tier" "$platform")
        echo "    \"$platform\": {" >> "$manifest_file"
        echo "      \"deployed\": true," >> "$manifest_file"
        echo "      \"state_file\": \"$state_file\"" >> "$manifest_file"
        echo -n "    }" >> "$manifest_file"
    done

    cat >> "$manifest_file" << EOF

  }
}
EOF

    log_success "Deployment manifest created: $manifest_file"
    echo "$manifest_file"
}

# Export functions
export -f save_deployment_state get_last_deployment_state
export -f rollback_deployment rollback_platform_deployment
export -f list_deployment_states cleanup_old_states
export -f create_deployment_manifest
