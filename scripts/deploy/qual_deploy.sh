#!/bin/bash

# Qual Deployment Script for StackMap
# Deploys to local development environment (simulators/emulators + qual web)
# Part of the four-tier deployment strategy: Qual → Stage → Beta → Prod
#
# QUAL TIER:
# - Development testing (multiple times per day)
# - Uses qual/api endpoint (Qual DB)
# - Web + Mobile deployment
# - Warnings only (no blocking validation)
# - Ideal for rapid iteration and testing
#
# ⚠️  IMPORTANT: This script must be called via deploy.sh for proper validation
#

set -e  # Exit on error

# ============================================
# CRITICAL: Prevent Direct Script Execution
# This script must be called via deploy.sh
# ============================================

if [ "$VALIDATED_BY_MASTER" != "true" ]; then
    echo -e "\033[0;31m❌ This script must be called via deploy.sh\033[0m"
    echo ""
    echo "Usage: ./scripts/deploy.sh qual [--web] [--ios] [--android] [--all]"
    echo ""
    echo "Direct execution bypasses critical validation checks."
    echo "Use the master deployment script to ensure proper validation."
    exit 1
fi

echo "🚀 Starting QUAL deployment process..."
echo "========================================"
echo "   Development Testing"
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

# Get current version
CURRENT_VERSION=$(grep '"version":' "$PROJECT_ROOT/package.json" | head -1 | cut -d'"' -f4)

echo ""
echo "========================================="
echo "   🔬 QUAL Deployment (Development)"
echo "   Version: $CURRENT_VERSION"
echo "   Environment: qual/api (Qual DB)"
echo "========================================="
echo ""

# Track deployment status
DEPLOYMENT_STATUS=""
DEPLOYMENT_START=$(date +%s)

# Generate deployment status page
generate_status_page "qual" "$CURRENT_VERSION"

# Validation complete (qual doesn't have strict validation)
update_status_page "validation" "success"

# Mark tests as skipped (qual doesn't run test suite)
update_status_page "tests" "skipped"

# Run health scan (qual-specific)
echo ""
echo "🔍 Running Health Scan..."
if [ -f "$SCRIPTS_ROOT/testing/test-health-report.sh" ]; then
    # Run health scan and capture results
    "$SCRIPTS_ROOT/testing/test-health-report.sh" > /tmp/qual-health-scan.txt 2>&1 || true

    # Parse results
    SMOKE_PASSED=$(grep -oE "[0-9]+ passed" /tmp/qual-health-scan.txt | head -1 | grep -oE "[0-9]+" || echo "0")
    SMOKE_FAILED=$(grep -oE "[0-9]+ failed" /tmp/qual-health-scan.txt | head -1 | grep -oE "[0-9]+" || echo "0")

    CRITICAL_PASSED=$(grep -oE "[0-9]+ passed" /tmp/qual-health-scan.txt | sed -n '2p' | grep -oE "[0-9]+" || echo "0")
    CRITICAL_FAILED=$(grep -oE "[0-9]+ failed" /tmp/qual-health-scan.txt | sed -n '2p' | grep -oE "[0-9]+" || echo "0")

    IMPORTANT_PASSED=$(grep -oE "[0-9]+/[0-9]+ passed" /tmp/qual-health-scan.txt | head -1 | cut -d'/' -f1 || echo "0")
    IMPORTANT_TOTAL=$(grep -oE "[0-9]+/[0-9]+ passed" /tmp/qual-health-scan.txt | head -1 | cut -d'/' -f2 | grep -oE "[0-9]+" || echo "0")

    UI_PASSED=$(grep -oE "[0-9]+ passed" /tmp/qual-health-scan.txt | tail -1 | grep -oE "[0-9]+" || echo "0")
    UI_FAILED=$(grep -oE "[0-9]+ failed" /tmp/qual-health-scan.txt | tail -1 | grep -oE "[0-9]+" || echo "0")

    # Determine overall status
    if grep -q "HEALTHY" /tmp/qual-health-scan.txt; then
        OVERALL_STATUS="HEALTHY"
    elif grep -q "CAUTION" /tmp/qual-health-scan.txt; then
        OVERALL_STATUS="CAUTION"
    elif grep -q "WARNING" /tmp/qual-health-scan.txt; then
        OVERALL_STATUS="WARNING"
    elif grep -q "FAILING" /tmp/qual-health-scan.txt; then
        OVERALL_STATUS="FAILING"
    else
        OVERALL_STATUS="UNKNOWN"
    fi

    # Update scan results in status page
    update_scan_results "$SMOKE_PASSED" "$SMOKE_FAILED" "$CRITICAL_PASSED" "$CRITICAL_FAILED" "$IMPORTANT_PASSED" "$IMPORTANT_TOTAL" "$UI_PASSED" "$UI_FAILED" "$OVERALL_STATUS"

    echo "✅ Health scan complete: $OVERALL_STATUS"
    echo ""
else
    echo "⚠️  testing/test-health-report.sh not found, skipping health scan"
    echo ""
fi

# Deploy Web (qual uses dedicated qual environment)
if [ "$DEPLOY_WEB" = true ]; then
    update_status_page "web" "in_progress"

    echo "🌐 Deploying Web Qual..."
    echo "Deploying to qual environment ($APP_URL_QUAL)"
    echo "Qual web uses qual/api endpoint (qual database)"
    echo ""

    # Build web for qual
    echo "📦 Building web bundle for qual..."
    NODE_ENV=production npm run build:web

    if [ ! -f "$APP_WEB_INDEX_FILE" ]; then
        echo -e "${RED}❌ Web build failed - no index.html generated${NC}"
        update_status_page "web" "failed"
        exit 1
    fi

    echo -e "${GREEN}✅ Web build complete${NC}"
    echo ""

    # Deploy to qual using deployment infrastructure (in parent scripts directory)
    if [ -f "$SCRIPTS_ROOT/deploy-with-tracking.sh" ]; then
        "$SCRIPTS_ROOT/deploy-with-tracking.sh" qual
    else
        echo -e "${RED}❌ deploy-with-tracking.sh not found${NC}"
        echo "   Cannot deploy web qual without deployment script"
        update_status_page "web" "failed"
        exit 1
    fi

    DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ Web: $APP_URL_QUAL (uses qual/api)"
    update_status_page "web" "success"
    echo -e "${GREEN}✅ Web qual deployed${NC}"
    echo ""
else
    update_status_page "web" "skipped"
fi

# Deploy iOS to simulators
if [ "$DEPLOY_IOS" = true ]; then
    update_status_page "ios" "in_progress"

    echo "🍎 Deploying iOS Qual to Simulators..."
    echo "This will build and deploy to iOS simulators"
    echo "iOS will use qual/api endpoint (qual database)"
    echo ""

    # Build for iPhone (using configured test device)
    echo "📱 Building for $APP_IOS_TEST_PHONE..."
    if npx react-native run-ios --simulator="$APP_IOS_TEST_PHONE"; then
        echo -e "${GREEN}✅ iOS deployed to $APP_IOS_TEST_PHONE${NC}"
    else
        echo -e "${YELLOW}⚠️  $APP_IOS_TEST_PHONE build failed (non-blocking)${NC}"
    fi
    echo ""

    # Build for iPad (using configured test device)
    echo "📱 Building for $APP_IOS_TEST_TABLET..."
    if npx react-native run-ios --simulator="$APP_IOS_TEST_TABLET"; then
        echo -e "${GREEN}✅ iOS deployed to $APP_IOS_TEST_TABLET${NC}"
    else
        echo -e "${YELLOW}⚠️  $APP_IOS_TEST_TABLET build failed (non-blocking)${NC}"
    fi
    echo ""

    DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ iOS: Simulators (qual/api)"
    update_status_page "ios" "success"
    echo -e "${GREEN}✅ iOS qual deployment complete${NC}"
    echo ""
else
    update_status_page "ios" "skipped"
fi

# Deploy Android to emulators/devices
if [ "$DEPLOY_ANDROID" = true ]; then
    update_status_page "android" "in_progress"

    echo "🤖 Deploying Android Qual to Devices..."
    echo "This will build and deploy to connected Android devices/emulators"
    echo "Android will use qual/api endpoint (qual database)"
    echo ""

    # Build Android bundle
    echo "📦 Building Android bundle..."
    npx react-native bundle \
        --platform android \
        --dev false \
        --entry-file index.js \
        --bundle-output android/app/src/main/assets/index.android.bundle \
        --assets-dest android/app/src/main/res/

    # Build APK
    echo "🔨 Building debug APK..."
    cd android
    if ./gradlew assembleDebug --console=plain 2>&1 | grep -v "WARNING:"; then
        cd ..
        echo -e "${GREEN}✅ Android build complete${NC}"
    else
        cd ..
        echo -e "${RED}❌ Android build failed${NC}"
        update_status_page "android" "failed"
        exit 1
    fi
    echo ""

    # Install on connected devices
    echo "📱 Installing on connected devices..."
    DEVICES=$(adb devices 2>/dev/null | grep -E "device$|emulator" | cut -f1)
    if [ ! -z "$DEVICES" ]; then
        echo "Found Android devices:"
        for DEVICE in $DEVICES; do
            MODEL=$(adb -s $DEVICE shell getprop ro.product.model 2>/dev/null | tr -d '\r')
            echo "  - $DEVICE ($MODEL)"
        done
        echo ""

        for DEVICE in $DEVICES; do
            MODEL=$(adb -s $DEVICE shell getprop ro.product.model 2>/dev/null | tr -d '\r')
            echo "📱 Installing on $MODEL ($DEVICE)..."
            if adb -s $DEVICE install -r "$APP_ANDROID_APK_DEBUG_PATH" 2>/dev/null; then
                echo -e "${GREEN}✅ Installed on $MODEL${NC}"
            else
                echo "  Uninstalling old version first..."
                adb -s $DEVICE uninstall "$APP_ANDROID_PACKAGE" 2>/dev/null || true
                if adb -s $DEVICE install "$APP_ANDROID_APK_DEBUG_PATH"; then
                    echo -e "${GREEN}✅ Installed on $MODEL${NC}"
                else
                    echo -e "${YELLOW}⚠️  Failed to install on $MODEL (non-blocking)${NC}"
                fi
            fi
        done
    else
        echo -e "${YELLOW}⚠️  No Android devices connected${NC}"
        echo "   Connect a device or start an emulator to test"
    fi

    DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ Android: Devices/Emulators (qual/api)"
    update_status_page "android" "success"
    echo -e "${GREEN}✅ Android qual deployment complete${NC}"
    echo ""
else
    update_status_page "android" "skipped"
fi

# Calculate deployment time
DEPLOYMENT_END=$(date +%s)
DEPLOYMENT_TIME=$((DEPLOYMENT_END - DEPLOYMENT_START))
DEPLOYMENT_MINUTES=$((DEPLOYMENT_TIME / 60))
DEPLOYMENT_SECONDS=$((DEPLOYMENT_TIME % 60))

# Finalize and open status page
finalize_status_page
open_status_page

# Generate qual deployment report
echo ""
echo "========================================="
echo " 🎉 QUAL Deployment Complete!"
echo "========================================="
echo " Version: $CURRENT_VERSION"
echo " Environment: qual/api (Qual DB)"
echo " Time: ${DEPLOYMENT_MINUTES}m ${DEPLOYMENT_SECONDS}s"
echo -e "$DEPLOYMENT_STATUS"
echo "========================================="
echo ""
echo "📱 Next Steps:"
echo ""
echo "1. Test Qual Builds (Development Testing):"
if [ "$DEPLOY_WEB" = true ]; then
    echo "   • Web: $APP_URL_QUAL"
    echo "   • Uses qual/api endpoint (qual database)"
fi
if [ "$DEPLOY_IOS" = true ]; then
    echo "   • iOS: Check simulators (iPhone & iPad)"
    echo "   • Uses qual/api endpoint (qual database)"
fi
if [ "$DEPLOY_ANDROID" = true ]; then
    echo "   • Android: Check connected devices"
    echo "   • Uses qual/api endpoint (qual database)"
fi
echo ""
echo "2. Verify Qual Environment:"
echo "   • Test all new features"
echo "   • Check for regressions"
echo "   • Verify sync functionality"
echo ""
echo "3. When Ready for Internal Testing:"
echo "   • Fix any issues found in qual"
echo "   • Run: ./scripts/deploy.sh stage --all"
echo ""
echo "4. When Ready for Beta Testing:"
echo "   • Skip stage if not needed"
echo "   • Commit all changes (beta requires clean git)"
echo "   • Update PENDING_CHANGES.md"
echo "   • Run: ./scripts/deploy.sh beta --all"
echo ""
echo "========================================="
