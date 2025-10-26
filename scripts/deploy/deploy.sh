#!/bin/bash

# ============================================
# Master Deployment Script for StackMap
# Four-Tier Deployment: Qual → Stage → Beta → Prod
# ============================================
#
# Usage: ./scripts/deploy.sh [tier] [options]
#
# Tiers:
#   qual   - Local testing (simulators/emulators + qual web) [DEFAULT]
#   stage  - Internal testing (just me, TestFlight Internal)
#   beta   - Closed testing (beta testers, External/Closed)
#   prod   - Production (everyone, App/Play Store)
#
# Options:
#   --web      Deploy web only
#   --ios      Deploy iOS only
#   --android  Deploy Android only
#   --all      Deploy all platforms (default)
#
# Examples:
#   ./scripts/deploy.sh qual           # Deploy qual (all platforms)
#   ./scripts/deploy.sh stage --ios    # Deploy stage iOS only
#   ./scripts/deploy.sh beta --all     # Deploy beta (all platforms)
#   ./scripts/deploy.sh prod --all     # Deploy production (all platforms)
#
# Validation Levels:
#   QUAL:  Warnings only (allow deployment with issues)
#   STAGE: Warnings only (allow deployment with issues)
#   BETA:  Block on uncommitted changes
#   PROD:  Block on any issues (strictest validation)
#
# ============================================

set -e  # Exit on error

# Get script directory and project root
# Script is now in scripts/deploy/, so go up two levels to reach project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
export PROJECT_ROOT  # Export so libraries can use it
export SCRIPT_DIR    # Export so libraries can use it
cd "$PROJECT_ROOT"

# Load app configuration first
source "$SCRIPT_DIR/app-config.sh"

# Load library functions (which also load app-config.sh)
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/validation.sh"
source "$SCRIPT_DIR/lib/verification.sh"
source "$SCRIPT_DIR/lib/reporting.sh"
source "$SCRIPT_DIR/lib/rollback.sh"

# ============================================
# Parse Arguments
# ============================================

TIER="${1:-qual}"
shift || true  # Remove tier from args, continue if no more args

# Validate tier
case "$TIER" in
    qual|stage|beta|prod)
        log_success "Deployment tier: $(echo "$TIER" | tr '[:lower:]' '[:upper:]')"
        ;;
    *)
        log_error "Invalid tier: $TIER"
        echo ""
        echo "Usage: $0 [qual|stage|beta|prod] [--web] [--ios] [--android] [--all]"
        echo ""
        echo "Tiers:"
        echo "  qual   - Local testing (simulators/emulators + qual web)"
        echo "  stage  - Internal testing (just me, TestFlight Internal)"
        echo "  beta   - Closed testing (beta testers, External/Closed)"
        echo "  prod   - Production (everyone, App/Play Store)"
        echo ""
        echo "Options:"
        echo "  --web      Deploy web only"
        echo "  --ios      Deploy iOS only"
        echo "  --android  Deploy Android only"
        echo "  --all      Deploy all platforms (default)"
        echo ""
        echo "Validation Levels:"
        echo "  QUAL:  Warnings only (allow deployment with issues)"
        echo "  STAGE: Warnings only (allow deployment with issues)"
        echo "  BETA:  Block on uncommitted changes"
        echo "  PROD:  Block on any issues (strictest validation)"
        echo ""
        exit 1
        ;;
esac

# Parse platform options
DEPLOY_WEB=false
DEPLOY_IOS=false
DEPLOY_ANDROID=false
DEPLOY_ALL=false

if [ $# -eq 0 ]; then
    DEPLOY_ALL=true
fi

for arg in "$@"; do
    case $arg in
        --web)
            DEPLOY_WEB=true
            ;;
        --ios)
            DEPLOY_IOS=true
            ;;
        --android)
            DEPLOY_ANDROID=true
            ;;
        --all)
            DEPLOY_ALL=true
            ;;
        *)
            log_warning "Unknown option: $arg"
            ;;
    esac
done

# If --all, enable all platforms
if [ "$DEPLOY_ALL" = true ]; then
    DEPLOY_WEB=true
    DEPLOY_IOS=true
    DEPLOY_ANDROID=true
fi

# ============================================
# Acquire Deployment Lock
# ============================================

# Acquire exclusive deployment lock to prevent concurrent deployments
acquire_deployment_lock "$TIER"

# Release lock on exit (success or failure)
trap release_deployment_lock EXIT

# ============================================
# Version Increment (BEFORE displaying plan)
# ============================================

# Increment version before deployment (for all tiers)
log_step "Incrementing version number..."
if [ -f "$SCRIPT_DIR/version-increment.sh" ]; then
    source "$SCRIPT_DIR/version-increment.sh"
    increment_version
    DEPLOYMENT_VERSION="$NEW_VERSION"
    log_success "Version incremented to: $NEW_VERSION"
else
    log_warning "Version increment script not found, using current version"
    DEPLOYMENT_VERSION=$(get_current_version)
fi

# Export version for use throughout deployment
export DEPLOYMENT_VERSION

# ============================================
# Display Deployment Plan
# ============================================

log_header "🚀 ${APP_NAME} Deployment System"

# Convert tier to uppercase (bash 3.2 compatible)
TIER_UPPER=$(echo "$TIER" | tr '[:lower:]' '[:upper:]')

echo "Tier:           $TIER_UPPER"
echo "Branch:         $(get_git_branch)"
echo "Commit:         $(get_git_commit)"
echo "Version:        $DEPLOYMENT_VERSION"
echo ""
echo "Platforms:"
[ "$DEPLOY_WEB" = true ] && echo "  ✓ Web"
[ "$DEPLOY_IOS" = true ] && echo "  ✓ iOS"
[ "$DEPLOY_ANDROID" = true ] && echo "  ✓ Android"
echo ""

# ============================================
# Pre-Deployment Validation
# ============================================

log_header "🔍 Pre-Deployment Validation"

# Run full validation for the tier
if ! run_full_validation "$TIER"; then
    log_error "Pre-deployment validation failed"
    log_info "Fix the issues above and try again"
    exit 1
fi

# Add validation results to report
add_validation_item "✅ Environment validated"
add_validation_item "✅ Git status checked"
add_validation_item "✅ Version numbers verified"
add_validation_item "✅ Dependencies validated"

if [ "$TIER" != "qual" ]; then
    add_validation_item "✅ Credentials validated"
fi

# ============================================
# Deployment Confirmation
# ============================================

# Build platform list for confirmation
PLATFORM_LIST=""
[ "$DEPLOY_WEB" = true ] && PLATFORM_LIST="${PLATFORM_LIST}  🌐 Web\n"
[ "$DEPLOY_IOS" = true ] && PLATFORM_LIST="${PLATFORM_LIST}  🍎 iOS\n"
[ "$DEPLOY_ANDROID" = true ] && PLATFORM_LIST="${PLATFORM_LIST}  🤖 Android\n"

# Only ask for confirmation for stage/beta/prod
if [ "$TIER" != "qual" ]; then
    confirm_deployment "$TIER" "$PLATFORM_LIST"
fi

# ============================================
# Delegate to Tier-Specific Script
# ============================================

log_header "📦 Running Deployment"

# Export validation token to allow tier scripts to execute
# This prevents direct execution of tier scripts bypassing validation
export VALIDATED_BY_MASTER="true"

DEPLOYMENT_SUCCESS=false

case "$TIER" in
    qual)
        # Build arguments for qual_deploy.sh
        QUAL_ARGS=""
        [ "$DEPLOY_WEB" = true ] && QUAL_ARGS="$QUAL_ARGS --web"
        [ "$DEPLOY_IOS" = true ] && QUAL_ARGS="$QUAL_ARGS --ios"
        [ "$DEPLOY_ANDROID" = true ] && QUAL_ARGS="$QUAL_ARGS --android"

        # If no specific platforms, pass --all
        if [ "$DEPLOY_ALL" = true ]; then
            QUAL_ARGS="--all"
        fi

        log_info "Delegating to qual_deploy.sh $QUAL_ARGS"
        if "$SCRIPT_DIR/qual_deploy.sh" $QUAL_ARGS; then
            DEPLOYMENT_SUCCESS=true
        fi
        ;;

    stage)
        # Build arguments for deploy_stage.sh
        STAGE_ARGS=""
        [ "$DEPLOY_IOS" = true ] && STAGE_ARGS="$STAGE_ARGS --ios"
        [ "$DEPLOY_ANDROID" = true ] && STAGE_ARGS="$STAGE_ARGS --android"

        # Note: Stage does not support web deployment (internal testing only)
        if [ "$DEPLOY_WEB" = true ] && [ "$DEPLOY_IOS" = false ] && [ "$DEPLOY_ANDROID" = false ]; then
            log_warning "Stage tier does not support web-only deployment"
            log_info "Stage is for internal mobile testing only"
            exit 1
        fi

        # If no specific platforms or --all, deploy mobile only
        if [ "$DEPLOY_ALL" = true ] || [ -z "$STAGE_ARGS" ]; then
            STAGE_ARGS="--all"
        fi

        log_info "Delegating to deploy_stage.sh $STAGE_ARGS"
        if "$SCRIPT_DIR/deploy_stage.sh" $STAGE_ARGS; then
            DEPLOYMENT_SUCCESS=true
        fi
        ;;

    beta)
        # Build arguments for deploy_beta.sh
        BETA_ARGS=""
        [ "$DEPLOY_WEB" = true ] && BETA_ARGS="$BETA_ARGS --web"
        [ "$DEPLOY_IOS" = true ] && BETA_ARGS="$BETA_ARGS --ios"
        [ "$DEPLOY_ANDROID" = true ] && BETA_ARGS="$BETA_ARGS --android"

        # If no specific platforms, pass --all
        if [ "$DEPLOY_ALL" = true ]; then
            BETA_ARGS="--all"
        fi

        log_info "Delegating to deploy_beta.sh $BETA_ARGS"
        if "$SCRIPT_DIR/deploy_beta.sh" $BETA_ARGS; then
            DEPLOYMENT_SUCCESS=true
        fi
        ;;

    prod)
        # Build arguments for prod_deploy.sh
        PROD_ARGS=""

        # prod_deploy.sh uses different argument format
        if [ "$DEPLOY_ALL" = true ]; then
            PROD_ARGS="all"
        elif [ "$DEPLOY_WEB" = true ] && [ "$DEPLOY_IOS" = false ] && [ "$DEPLOY_ANDROID" = false ]; then
            PROD_ARGS="web"
        elif [ "$DEPLOY_IOS" = true ] && [ "$DEPLOY_WEB" = false ] && [ "$DEPLOY_ANDROID" = false ]; then
            PROD_ARGS="ios"
        elif [ "$DEPLOY_ANDROID" = true ] && [ "$DEPLOY_WEB" = false ] && [ "$DEPLOY_IOS" = false ]; then
            PROD_ARGS="android"
        else
            PROD_ARGS="all"  # Default to all if multiple platforms
        fi

        log_info "Delegating to prod_deploy.sh $PROD_ARGS"
        if "$SCRIPT_DIR/prod_deploy.sh" "$PROD_ARGS"; then
            DEPLOYMENT_SUCCESS=true
        fi
        ;;
esac

if [ "$DEPLOYMENT_SUCCESS" = false ]; then
    log_error "Deployment failed"
    generate_error_report "$TIER" "Tier-specific deployment script failed"
    exit 1
fi

# ============================================
# Post-Deployment Verification
# ============================================

log_header "🔍 Post-Deployment Verification"

# Build platform list for verification
VERIFY_PLATFORMS=""
[ "$DEPLOY_WEB" = true ] && VERIFY_PLATFORMS="${VERIFY_PLATFORMS}web "
[ "$DEPLOY_IOS" = true ] && VERIFY_PLATFORMS="${VERIFY_PLATFORMS}ios "
[ "$DEPLOY_ANDROID" = true ] && VERIFY_PLATFORMS="${VERIFY_PLATFORMS}android "

# Run verification
if run_full_verification "$TIER" "$VERIFY_PLATFORMS"; then
    add_verification_item "✅ Deployment verified"
else
    add_verification_item "⚠️  Some verification checks failed"
fi

# Track deployed platforms for report
[ "$DEPLOY_WEB" = true ] && add_platform_deployed "Web ($TIER)" "success"
[ "$DEPLOY_IOS" = true ] && add_platform_deployed "iOS ($TIER)" "success"
[ "$DEPLOY_ANDROID" = true ] && add_platform_deployed "Android ($TIER)" "success"

# ============================================
# Generate Deployment Report
# ============================================

generate_deployment_report "$TIER" "$DEPLOYMENT_VERSION"

# ============================================
# Display Next Steps
# ============================================

display_next_steps "$TIER"

# ============================================
# Success Summary
# ============================================

log_header "✅ Deployment Complete!"

# Convert to uppercase (bash 3.2 compatible)
TIER_UPPER=$(echo "$TIER" | tr '[:lower:]' '[:upper:]')
PLATFORMS_UPPER=$(echo "$VERIFY_PLATFORMS" | tr '[:lower:]' '[:upper:]')

echo "Tier:           $TIER_UPPER"
echo "Version:        $DEPLOYMENT_VERSION"
echo "Platforms:      $PLATFORMS_UPPER"
echo ""

# Calculate total time
DEPLOYMENT_END=$(date +%s)
DEPLOYMENT_TIME=$((DEPLOYMENT_END - DEPLOYMENT_START_TIME))
DURATION=$(format_duration $DEPLOYMENT_TIME)

echo "Total time:     $DURATION"
echo ""

log_success "Deployment successful!"
echo ""
