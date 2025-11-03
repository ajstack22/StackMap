#!/bin/bash

# Stage Deployment Script for StackMap
# Deploys to TestFlight Internal Testing (iOS) and Play Internal Testing (Android)
# Part of the three-tier deployment strategy: Qual → Stage → Beta → Prod
#
# STAGE TIER:
# - Internal testing ONLY (just the developer)
# - Uses stage/api endpoint (Qual DB)
# - Mobile-only deployment (NO web)
# - Less strict validation (warnings only, no blocking)
# - Ideal for quick internal testing before opening to beta testers
#
# ⚠️  IMPORTANT: This script must be called via deploy.sh for proper validation
#

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure (ensures fastlane errors aren't masked by tee)

# ============================================
# CRITICAL: Prevent Direct Script Execution
# This script must be called via deploy.sh
# ============================================

if [ "$VALIDATED_BY_MASTER" != "true" ]; then
    echo -e "\033[0;31m❌ This script must be called via deploy.sh\033[0m"
    echo ""
    echo "Usage: ./scripts/deploy.sh stage [--ios] [--android] [--all]"
    echo ""
    echo "Direct execution bypasses critical validation checks."
    echo "Use the master deployment script to ensure proper validation."
    exit 1
fi

echo "🚀 Starting STAGE deployment process..."
echo "========================================"
echo "   Internal Testing Only"
echo "========================================"
echo

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get current directory
# Script is now in scripts/deploy/, so go up two levels to reach project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_ROOT="$(dirname "$SCRIPT_DIR")"  # Parent scripts directory
PROJECT_ROOT="$(dirname "$SCRIPTS_ROOT")"
cd "$PROJECT_ROOT"

# Load app configuration
source "$SCRIPT_DIR/app-config.sh"

# Load deployment reporting functions (for status dashboard)
source "$SCRIPT_DIR/lib/reporting.sh"

# Parse command line arguments
DEPLOY_IOS=false
DEPLOY_ANDROID=false
DEPLOY_ALL=false

if [ $# -eq 0 ]; then
    DEPLOY_ALL=true
fi

for arg in "$@"; do
    case $arg in
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
            echo "Unknown option: $arg"
            echo "Usage: $0 [--ios] [--android] [--all]"
            echo ""
            echo "Note: Stage deployment is mobile-only (no web deployment)"
            exit 1
            ;;
    esac
done

# If --all, enable mobile deployments only (no web for stage)
if [ "$DEPLOY_ALL" = true ]; then
    DEPLOY_IOS=true
    DEPLOY_ANDROID=true
fi

# Check for uncommitted changes (warn only for stage - don't block)
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    echo "Stage deployment allows uncommitted changes (internal testing only)"
    echo "Consider committing before deploying to beta/prod."
    echo ""
    git status --short
    echo ""
    echo -e "${YELLOW}Continuing with stage deployment...${NC}"
    echo ""
fi

# Get version from master script (already incremented) or from package.json
if [ -z "$DEPLOYMENT_VERSION" ]; then
    CURRENT_VERSION=$(grep '"version":' "$PROJECT_ROOT/package.json" | head -1 | cut -d'"' -f4)
else
    CURRENT_VERSION="$DEPLOYMENT_VERSION"
fi

# Check if version already has stage suffix
if [[ "$CURRENT_VERSION" == *"-stage"* ]]; then
    STAGE_VERSION="$CURRENT_VERSION"
    echo -e "${YELLOW}⚠️  Version already has stage suffix: $STAGE_VERSION${NC}"
else
    STAGE_VERSION="${CURRENT_VERSION}-stage"
fi

echo ""
echo "========================================="
echo "   🔬 STAGE Deployment (Internal)"
echo "   Version: $STAGE_VERSION"
echo "   (Base: $CURRENT_VERSION)"
echo "   Environment: stage/api (Qual DB)"
echo "========================================="
echo ""

# Note: Deployment confirmation handled by master deploy.sh script
# No additional confirmation needed here

# Initialize deployment start time
DEPLOYMENT_START=$(date +%s)

# Generate deployment status page

# Mark validation as complete

# Web always skipped for stage (mobile-only)

# Run test suite (warn only, don't block)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Running Stage Test Suite (warnings only)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""


TEST_WARNINGS=""

# Tier 0: Smoke Test (warn only)
echo "→ Tier 0: Smoke Test..."
set +e  # Disable exit-on-error for tests (we want warnings, not failures)
npm run test:smoke > /tmp/test-smoke.txt 2>&1
SMOKE_EXIT=$?
set -e  # Re-enable exit-on-error

if [ $SMOKE_EXIT -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Smoke test failed (warning only)${NC}"
    TEST_WARNINGS="$TEST_WARNINGS\n  ⚠️  Tier 0 (Smoke): FAILED"
    SMOKE_PASSED=0
else
    SMOKE_PASSED=$(grep -oE "[0-9]+ passed" /tmp/test-smoke.txt | head -1 | grep -oE "[0-9]+" || echo "0")
    echo -e "${GREEN}✅ Smoke test passed ($SMOKE_PASSED tests)${NC}"
fi

# Tier 1: Critical Tests (warn only)
echo ""
echo "→ Tier 1: Critical Tests..."
set +e  # Disable exit-on-error for tests (we want warnings, not failures)
npm run test:critical > /tmp/test-critical.txt 2>&1
CRITICAL_EXIT=$?
set -e  # Re-enable exit-on-error

if [ $CRITICAL_EXIT -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Critical tests failed (warning only)${NC}"
    echo "   Fix these before deploying to beta"
    TEST_WARNINGS="$TEST_WARNINGS\n  ⚠️  Tier 1 (Critical): FAILED"
    CRITICAL_PASSED=0
else
    CRITICAL_PASSED=$(grep -oE "[0-9]+ passed" /tmp/test-critical.txt | head -1 | grep -oE "[0-9]+" || echo "0")
    echo -e "${GREEN}✅ Critical tests passed ($CRITICAL_PASSED tests)${NC}"
fi

echo ""
if [ -n "$TEST_WARNINGS" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}⚠️  Test Warnings (not blocking):${NC}"
    echo -e "$TEST_WARNINGS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ All tests passed"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
echo ""

# Update mobile versions (iOS and Android) before building
if [ "$DEPLOY_IOS" = true ] || [ "$DEPLOY_ANDROID" = true ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📱 Updating Mobile App Versions"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if "$SCRIPTS_ROOT/update-mobile-versions.sh"; then
        echo -e "${GREEN}✅ Mobile versions updated${NC}"
    else
        echo -e "${RED}❌ Failed to update mobile versions${NC}"
        exit 1
    fi
    echo ""
fi

# Track deployment status
DEPLOYMENT_STATUS=""

# Deploy iOS to TestFlight
if [ "$DEPLOY_IOS" = true ]; then

    echo "🍎 Deploying iOS Stage to TestFlight..."
    echo "This will upload to TestFlight Internal Testing"
    echo "Environment: stage/api (Qual DB)"
    echo ""

    cd ios

    # Create log directory if needed
    mkdir -p /tmp/stackmap-logs

    # Capture fastlane output to log file
    LOG_FILE="/tmp/stackmap-logs/fastlane-stage-ios-$(date +%Y%m%d-%H%M%S).log"

    # Run fastlane stage_ios with changelog (capture output)
    if ! fastlane stage_ios changelog:"Stage release $STAGE_VERSION" skip_increment:true 2>&1 | tee "$LOG_FILE"; then
        echo ""
        echo -e "${RED}❌ iOS stage deployment failed${NC}"
        echo ""
        echo "Last 30 lines of fastlane output:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        tail -30 "$LOG_FILE"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Full log saved to: $LOG_FILE"
        echo ""
        echo "Common issues:"
        echo "  • Network timeout: Check your internet connection"
        echo "  • Authentication: Verify App Store Connect credentials"
        echo "  • Build errors: Check Xcode project configuration"
        echo "  • Certificate issues: Run 'cd ios && fastlane match' to sync certificates"
        cd ..
        exit 1
    fi

    cd ..

    DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ iOS: TestFlight Internal Testing (stage/api)"
    echo -e "${GREEN}✅ iOS stage deployed to TestFlight${NC}"
    echo -e "${GREEN}   Log saved: $LOG_FILE${NC}"
    echo ""
else
    # HTML status page update removed (v2025.11.01)
    :  # No-op placeholder
fi

# Deploy Android to Play Store Internal Testing
if [ "$DEPLOY_ANDROID" = true ]; then

    echo "🤖 Deploying Android Stage to Play Store..."
    echo "This will upload to Google Play Internal Testing"
    echo "Environment: stage/api (Qual DB)"
    echo ""

    cd android

    # Create log directory if needed
    mkdir -p /tmp/stackmap-logs

    # Capture fastlane output to log file
    LOG_FILE="/tmp/stackmap-logs/fastlane-stage-android-$(date +%Y%m%d-%H%M%S).log"

    # Run fastlane stage_android (capture output)
    if ! fastlane stage_android 2>&1 | tee "$LOG_FILE"; then
        echo ""
        echo -e "${RED}❌ Android stage deployment failed${NC}"
        echo ""
        echo "Last 30 lines of fastlane output:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        tail -30 "$LOG_FILE"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Full log saved to: $LOG_FILE"
        echo ""
        echo "Common issues:"
        echo "  • Network timeout: Check your internet connection"
        echo "  • Authentication: Verify Google Play credentials"
        echo "  • Build errors: Run './gradlew clean' and try again"
        echo "  • Service account: Check service account key in macOS Keychain"
        cd ..
        exit 1
    fi

    cd ..

    DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ Android: Play Internal Testing (stage/api)"
    echo -e "${GREEN}✅ Android stage deployed to Play Store${NC}"
    echo -e "${GREEN}   Log saved: $LOG_FILE${NC}"
    echo ""
else
    # HTML status page update removed (v2025.11.01)
    :
fi

# Calculate deployment time
DEPLOYMENT_END=$(date +%s)
DEPLOYMENT_TIME=$((DEPLOYMENT_END - DEPLOYMENT_START))
DEPLOYMENT_MINUTES=$((DEPLOYMENT_TIME / 60))
DEPLOYMENT_SECONDS=$((DEPLOYMENT_TIME % 60))

# Finalize and open status page

# Generate stage deployment report
echo ""
echo "========================================="
echo " 🎉 STAGE Deployment Complete!"
echo "========================================="
echo " Version: $STAGE_VERSION"
echo " Environment: stage/api (Qual DB)"
echo " Time: ${DEPLOYMENT_MINUTES}m ${DEPLOYMENT_SECONDS}s"
echo -e "$DEPLOYMENT_STATUS"
echo "========================================="
echo ""
echo "📱 Next Steps:"
echo ""
echo "1. Test Stage Builds (Internal Testing):"
if [ "$DEPLOY_IOS" = true ]; then
    echo "   • iOS: Install via TestFlight app"
    echo "   • TestFlight: https://appstoreconnect.apple.com/apps"
fi
if [ "$DEPLOY_ANDROID" = true ]; then
    echo "   • Android: Join internal testing track"
    echo "   • Play Console: https://play.google.com/console/"
fi
echo ""
echo "2. Verify Stage Environment:"
echo "   • Using stage/api endpoint"
echo "   • Connected to Qual database"
echo "   • Test all critical user flows"
echo ""
if [ -n "$TEST_WARNINGS" ]; then
    echo -e "${YELLOW}3. Fix Test Warnings Before Beta:${NC}"
    echo -e "$TEST_WARNINGS"
    echo ""
fi
echo "3. When Ready for Beta Testing:"
echo "   • Fix any issues found in stage"
echo "   • Commit all changes (beta requires clean git)"
echo "   • Update PENDING_CHANGES.md"
echo "   • Run: ./scripts/deploy_beta.sh --all"
echo ""
echo "========================================="
