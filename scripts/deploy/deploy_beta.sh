#!/bin/bash

# Beta Deployment Script for StackMap
# Deploys to TestFlight Internal Testing (iOS) and Play Internal Testing (Android)
# Part of the three-tier deployment strategy: Qual → Beta → Prod
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
    echo "Usage: ./scripts/deploy.sh beta [--web] [--ios] [--android] [--all]"
    echo ""
    echo "Direct execution bypasses critical validation checks."
    echo "Use the master deployment script to ensure proper validation."
    exit 1
fi

echo "🚀 Starting BETA deployment process..."
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
source "$SCRIPT_DIR/lib/reporting.sh"

# Parse command line arguments
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
            echo "Unknown option: $arg"
            echo "Usage: $0 [--web] [--ios] [--android] [--all]"
            exit 1
            ;;
    esac
done

# If --all, enable all deployments
if [ "$DEPLOY_ALL" = true ]; then
    DEPLOY_WEB=true
    DEPLOY_IOS=true
    DEPLOY_ANDROID=true
fi

# Check for uncommitted changes (beta requires clean working directory)
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}❌ Uncommitted changes detected${NC}"
    echo "Beta deployment requires a clean working directory."
    echo "Please commit or stash your changes before deploying to beta."
    echo ""
    git status --short
    exit 1
fi

# Get version from master script (already incremented) or from package.json
if [ -z "$DEPLOYMENT_VERSION" ]; then
    CURRENT_VERSION=$(grep '"version":' "$PROJECT_ROOT/package.json" | head -1 | cut -d'"' -f4)
else
    CURRENT_VERSION="$DEPLOYMENT_VERSION"
fi

# Check if version already has beta suffix
if [[ "$CURRENT_VERSION" == *"-beta"* ]]; then
    BETA_VERSION="$CURRENT_VERSION"
    echo -e "${YELLOW}⚠️  Version already has beta suffix: $BETA_VERSION${NC}"
else
    BETA_VERSION="${CURRENT_VERSION}-beta"
fi

echo ""
echo "========================================="
echo "   Beta Deployment"
echo "   Version: $BETA_VERSION"
echo "   (Base: $CURRENT_VERSION)"
echo "========================================="
echo ""

# Note: Deployment confirmation handled by master deploy.sh script
# No additional confirmation needed here

# Run full test suite (beta must pass all critical tests)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Running Beta Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Tier 0: Smoke Test
echo "→ Tier 0: Smoke Test..."
npm run test:smoke > /tmp/test-smoke.txt 2>&1
SMOKE_EXIT=$?

if [ $SMOKE_EXIT -ne 0 ]; then
    cat /tmp/test-smoke.txt
    echo ""
    echo -e "${RED}❌ SMOKE TEST FAILED${NC}"
    echo "Fix critical issues before beta deployment: npm run test:smoke"
    exit 1
fi

SMOKE_PASSED=$(grep -oE "[0-9]+ passed" /tmp/test-smoke.txt | head -1 | grep -oE "[0-9]+" || echo "0")
echo -e "${GREEN}✅ Smoke test passed ($SMOKE_PASSED tests)${NC}"

# Tier 1: Critical Tests (MUST PASS for beta)
echo ""
echo "→ Tier 1: Critical Tests..."
npm run test:critical > /tmp/test-critical.txt 2>&1
CRITICAL_EXIT=$?

if [ $CRITICAL_EXIT -ne 0 ]; then
    cat /tmp/test-critical.txt
    echo ""
    echo -e "${RED}❌ CRITICAL TESTS FAILED${NC}"
    echo "Critical tests must pass 100% for beta deployment: npm run test:critical"
    exit 1
fi

CRITICAL_PASSED=$(grep -oE "[0-9]+ passed" /tmp/test-critical.txt | head -1 | grep -oE "[0-9]+" || echo "0")
echo -e "${GREEN}✅ Critical tests passed ($CRITICAL_PASSED tests)${NC}"

# Tier 2: Important Tests (warning only, but logged)
echo ""
echo "→ Tier 2: Important Tests..."
npm run test:important > /tmp/test-important.txt 2>&1
IMPORTANT_EXIT=$?

IMPORTANT_TOTAL=$(grep -oE "[0-9]+ total" /tmp/test-important.txt | head -1 | grep -oE "[0-9]+" || echo "0")
IMPORTANT_PASSED=$(grep -oE "[0-9]+ passed" /tmp/test-important.txt | head -1 | grep -oE "[0-9]+" || echo "0")
IMPORTANT_FAILED=$(grep -oE "[0-9]+ failed" /tmp/test-important.txt | head -1 | grep -oE "[0-9]+" || echo "0")

if [ $IMPORTANT_TOTAL -gt 0 ]; then
    IMPORTANT_PASS_RATE=$(( IMPORTANT_PASSED * 100 / IMPORTANT_TOTAL ))

    if [ $IMPORTANT_PASS_RATE -lt 95 ]; then
        echo -e "${YELLOW}⚠️  Important test pass rate: ${IMPORTANT_PASS_RATE}% (below 95% threshold)${NC}"
        echo "   $IMPORTANT_PASSED passed, $IMPORTANT_FAILED failed"
        echo "   Continuing with beta deployment (logged for review)"
    else
        echo -e "${GREEN}✅ Important tests: ${IMPORTANT_PASS_RATE}% pass rate ($IMPORTANT_PASSED/$IMPORTANT_TOTAL)${NC}"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Beta Test Suite Summary:"
echo "  Tier 0 (Smoke):     $SMOKE_PASSED passed ✅"
echo "  Tier 1 (Critical):  $CRITICAL_PASSED passed ✅"
if [ $IMPORTANT_TOTAL -gt 0 ]; then
    echo "  Tier 2 (Important): $IMPORTANT_PASSED/$IMPORTANT_TOTAL (${IMPORTANT_PASS_RATE}%)"
else
    echo "  Tier 2 (Important): $IMPORTANT_PASSED passed"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Track deployment status
DEPLOYMENT_STATUS=""
DEPLOYMENT_START=$(date +%s)

# Generate status dashboard

# Update mobile versions (iOS and Android) before building
if [ "$DEPLOY_IOS" = true ] || [ "$DEPLOY_ANDROID" = true ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📱 Updating Mobile App Versions"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if "$SCRIPTS_ROOT/update-mobile-versions.sh"; then
        echo -e "${GREEN}✅ Mobile versions updated${NC}"

        # Commit mobile version changes to maintain clean git state
        if ! git diff --quiet android/app/build.gradle ios/StackMapNative/Info.plist 2>/dev/null; then
            echo "📝 Committing mobile version updates..."
            git add android/app/build.gradle ios/StackMapNative/Info.plist
            git commit -m "Build: Update mobile version codes for beta deployment" -m "🤖 Generated with [Claude Code](https://claude.com/claude-code)" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
            echo -e "${GREEN}✅ Mobile version changes committed${NC}"
        fi
    else
        echo -e "${RED}❌ Failed to update mobile versions${NC}"
        exit 1
    fi
    echo ""
fi

# Deploy Web (beta uses dedicated beta environment)
if [ "$DEPLOY_WEB" = true ]; then
    echo "🌐 Deploying Web Beta..."
    echo "Deploying to beta environment ($APP_URL_BETA)"
    echo "Beta web uses beta/api endpoint (production database)"
    echo ""

    # Deploy to beta using deployment infrastructure (in parent scripts directory)
    if [ -f "$SCRIPTS_ROOT/deploy-with-tracking.sh" ]; then
        if "$SCRIPTS_ROOT/deploy-with-tracking.sh" beta; then
            DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ Web: $APP_URL_BETA (uses beta/api)"
            echo -e "${GREEN}✅ Web beta deployed${NC}"
        else
            echo -e "${RED}❌ Web beta deployment failed${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ deploy-with-tracking.sh not found${NC}"
        echo "   Cannot deploy web beta without deployment script"
        exit 1
    fi
    echo ""
else
    # HTML status page update removed (v2025.11.01)
    :
fi

# Deploy iOS to TestFlight
if [ "$DEPLOY_IOS" = true ]; then
    echo "🍎 Deploying iOS Beta to TestFlight..."
    echo "This will upload to TestFlight Internal Testing"
    echo "iOS will use beta/api endpoint (production database)"
    echo ""

    cd ios

    # Create log directory if needed
    mkdir -p /tmp/stackmap-logs

    # Capture fastlane output to log file
    LOG_FILE="/tmp/stackmap-logs/fastlane-beta-ios-$(date +%Y%m%d-%H%M%S).log"

    # Run fastlane beta_ios with changelog (capture output)
    # BUILD_TYPE=beta is set in Fastfile to configure API endpoint
    if ! fastlane beta_ios changelog:"Beta release $BETA_VERSION" skip_increment:true 2>&1 | tee "$LOG_FILE"; then
        echo ""
        echo -e "${RED}❌ iOS beta deployment failed${NC}"
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

    DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ iOS: TestFlight Internal Testing (beta/api)"
    echo -e "${GREEN}✅ iOS beta deployed to TestFlight${NC}"
    echo -e "${GREEN}   Log saved: $LOG_FILE${NC}"
    echo ""
else
    # HTML status page update removed (v2025.11.01)
    :
fi

# Deploy Android to Play Store Internal Testing
if [ "$DEPLOY_ANDROID" = true ]; then
    echo "🤖 Deploying Android Beta to Play Store..."
    echo "This will upload to Google Play Internal Testing"
    echo "Android will use beta/api endpoint (production database)"
    echo ""

    cd android

    # Create log directory if needed
    mkdir -p /tmp/stackmap-logs

    # Capture fastlane output to log file
    LOG_FILE="/tmp/stackmap-logs/fastlane-beta-android-$(date +%Y%m%d-%H%M%S).log"

    # Run fastlane beta_android (capture output)
    # BUILD_TYPE=beta is set in Fastfile to configure API endpoint
    if ! fastlane beta_android 2>&1 | tee "$LOG_FILE"; then
        echo ""
        echo -e "${RED}❌ Android beta deployment failed${NC}"
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

    DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ Android: Play Internal Testing (beta/api)"
    echo -e "${GREEN}✅ Android beta deployed to Play Store${NC}"
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

# Finalize and open status dashboard

# Generate beta deployment report
echo ""
echo "========================================="
echo " 🎉 BETA Deployment Complete!"
echo "========================================="
echo " Version: $BETA_VERSION"
echo " Time: ${DEPLOYMENT_MINUTES}m ${DEPLOYMENT_SECONDS}s"
echo -e "$DEPLOYMENT_STATUS"
echo "========================================="
echo ""
echo "📱 Next Steps:"
echo ""
echo "1. Test Beta Builds:"
if [ "$DEPLOY_WEB" = true ]; then
    echo "   • Web: $APP_URL_BETA"
    echo "   • Uses beta/api endpoint (production database)"
fi
if [ "$DEPLOY_IOS" = true ]; then
    echo "   • iOS: Install via TestFlight app"
    echo "   • TestFlight: https://appstoreconnect.apple.com/apps"
    echo "   • Uses beta/api endpoint (production database)"
fi
if [ "$DEPLOY_ANDROID" = true ]; then
    echo "   • Android: Join internal testing track"
    echo "   • Play Console: https://play.google.com/console/"
    echo "   • Uses beta/api endpoint (production database)"
fi
echo ""
echo "2. Gather Beta Tester Feedback:"
echo "   • Internal team testing"
echo "   • Stakeholder review"
echo "   • Bug reports and feature requests"
echo ""
echo "3. When Ready for Production:"
echo "   • Fix any issues found in beta"
echo "   • Update PENDING_CHANGES.md"
echo "   • Run: ./scripts/prod_deploy.sh all"
echo ""
echo "⚠️  IMPORTANT: Beta tier uses production database (beta/api)"
echo "   All sync data is shared with production!"
echo ""
echo "========================================="
