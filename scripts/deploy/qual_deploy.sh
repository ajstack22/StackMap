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
PARALLEL_BUILDS=true  # Default to parallel builds for speed

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
        --no-parallel)
            PARALLEL_BUILDS=false
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--web] [--ios] [--android] [--all] [--no-parallel]"
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

# Get version from master script (already incremented) or from package.json
if [ -z "$DEPLOYMENT_VERSION" ]; then
    CURRENT_VERSION=$(grep '"version":' "$PROJECT_ROOT/package.json" | head -1 | cut -d'"' -f4)
else
    CURRENT_VERSION="$DEPLOYMENT_VERSION"
fi

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

# HTML status page generation removed (v2025.11.01)

# Validation complete (qual doesn't have strict validation)
# HTML status page update removed (v2025.11.01)

# Update quality gate results (they ran in master script)
if [ -f "$SCRIPT_DIR/lib/quality-status.sh" ]; then
    source "$SCRIPT_DIR/lib/quality-status.sh"
    update_quality_status_from_results "qual"
    # HTML status page regeneration removed (v2025.11.01)
fi

# Mark tests as skipped (qual doesn't run test suite)
# HTML status page update removed (v2025.11.01)

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

    # HTML status page scan results update removed (v2025.11.01)

    echo "✅ Health scan complete: $OVERALL_STATUS"
    echo ""
else
    echo "⚠️  testing/test-health-report.sh not found, skipping health scan"
    echo ""
fi

# ============================================
# Build Functions for Parallel Execution
# ============================================

build_ios_qual() {
    echo "🍎 Deploying iOS Qual to Simulators..."
    echo "This will build and deploy to iOS simulators"
    echo "iOS will use qual/api endpoint (qual database)"
    echo ""

    # Build for iPhone (using configured test device with Qual configuration)
    echo "📱 Building for $APP_IOS_TEST_PHONE (Qual configuration)..."
    if npx react-native run-ios --simulator="$APP_IOS_TEST_PHONE" --mode Qual; then
        echo -e "${GREEN}✅ iOS deployed to $APP_IOS_TEST_PHONE${NC}"
        echo -e "${GREEN}   App name: StackMap QUAL${NC}"
        echo -e "${GREEN}   Bundle ID: app.stackmap.qual${NC}"
    else
        echo -e "${YELLOW}⚠️  $APP_IOS_TEST_PHONE build failed (non-blocking)${NC}"
    fi
    echo ""

    # Build for iPad (using configured test device with Qual configuration)
    echo "📱 Building for $APP_IOS_TEST_TABLET (Qual configuration)..."
    if npx react-native run-ios --simulator="$APP_IOS_TEST_TABLET" --mode Qual; then
        echo -e "${GREEN}✅ iOS deployed to $APP_IOS_TEST_TABLET${NC}"
        echo -e "${GREEN}   App name: StackMap QUAL${NC}"
        echo -e "${GREEN}   Bundle ID: app.stackmap.qual${NC}"
    else
        echo -e "${YELLOW}⚠️  $APP_IOS_TEST_TABLET build failed (non-blocking)${NC}"
    fi
    echo ""

    echo -e "${GREEN}✅ iOS qual deployment complete${NC}"
    return 0
}

build_android_qual() {
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

    # Build qual variant APK
    echo "🔨 Building qual debug APK..."
    cd android
    if ./gradlew assembleQualDebug --console=plain 2>&1 | grep -v "WARNING:"; then
        cd ..
        echo -e "${GREEN}✅ Android qual build complete${NC}"
    else
        cd ..
        echo -e "${RED}❌ Android qual build failed${NC}"
        exit 1
    fi
    echo ""

    # Set qual APK path
    QUAL_APK_PATH="android/app/build/outputs/apk/qual/debug/app-qual-debug.apk"
    QUAL_PACKAGE="com.stackmapnative.qual"

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
            echo "📱 Installing qual variant on $MODEL ($DEVICE)..."
            # Try installation with better error visibility
            INSTALL_OUTPUT=$(adb -s $DEVICE install -r "$QUAL_APK_PATH" 2>&1)
            if echo "$INSTALL_OUTPUT" | grep -q "Success"; then
                echo -e "${GREEN}✅ Installed on $MODEL${NC}"
            else
                echo "  Installation failed, trying uninstall first..."
                echo "  Error: $(echo "$INSTALL_OUTPUT" | grep -i "error\|fail" | head -1)"
                adb -s $DEVICE uninstall "$QUAL_PACKAGE" 2>/dev/null || true
                INSTALL_OUTPUT=$(adb -s $DEVICE install "$QUAL_APK_PATH" 2>&1)
                if echo "$INSTALL_OUTPUT" | grep -q "Success"; then
                    echo -e "${GREEN}✅ Installed on $MODEL${NC}"
                else
                    echo -e "${YELLOW}⚠️  Failed to install on $MODEL (non-blocking)${NC}"
                    echo "     Error: $(echo "$INSTALL_OUTPUT" | grep -i "error\|fail" | head -1)"
                fi
            fi
        done
    else
        echo -e "${YELLOW}⚠️  No Android devices connected${NC}"
        echo "   Connect a device or start an emulator to test"
    fi
    echo ""

    echo -e "${GREEN}✅ Android qual deployment complete${NC}"
    return 0
}

# ============================================
# Deploy Web
# ============================================

# Deploy Web (qual uses dedicated qual environment)
if [ "$DEPLOY_WEB" = true ]; then
    echo "🌐 Deploying Web Qual..."
    echo "Deploying to qual environment ($APP_URL_QUAL)"
    echo "Qual web uses qual/api endpoint (qual database)"
    echo ""

    # Build web for qual
    echo "📦 Building web bundle for qual..."
    NODE_ENV=production npm run build:web

    if [ ! -f "$APP_WEB_INDEX_FILE" ]; then
        echo -e "${RED}❌ Web build failed - no index.html generated${NC}"
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
        exit 1
    fi

    DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ Web: $APP_URL_QUAL (uses qual/api)"
    echo -e "${GREEN}✅ Web qual deployed${NC}"
    echo ""
fi

# ============================================
# Deploy Mobile (iOS and Android)
# ============================================

# Run parallel builds if both platforms requested and parallel mode enabled
if [ "$DEPLOY_IOS" = true ] && [ "$DEPLOY_ANDROID" = true ] && [ "$PARALLEL_BUILDS" = true ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚡ Running iOS and Android builds in PARALLEL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Create temp files for build outputs
    IOS_LOG="/tmp/stackmap-ios-qual-$(date +%s).log"
    ANDROID_LOG="/tmp/stackmap-android-qual-$(date +%s).log"

    # Start timestamp
    PARALLEL_START=$(date +%s)

    # Run iOS build in background
    echo "🍎 Starting iOS build (background)..."
    ( build_ios_qual > "$IOS_LOG" 2>&1; exit $? ) &
    IOS_PID=$!

    # Run Android build in background
    echo "🤖 Starting Android build (background)..."
    ( build_android_qual > "$ANDROID_LOG" 2>&1; exit $? ) &
    ANDROID_PID=$!

    echo ""
    echo "⏳ Waiting for parallel builds to complete..."
    echo "   iOS PID: $IOS_PID"
    echo "   Android PID: $ANDROID_PID"
    echo ""

    # Wait for both builds
    IOS_EXIT=0
    ANDROID_EXIT=0

    wait $IOS_PID || IOS_EXIT=$?
    wait $ANDROID_PID || ANDROID_EXIT=$?

    # Calculate time
    PARALLEL_END=$(date +%s)
    PARALLEL_TIME=$((PARALLEL_END - PARALLEL_START))

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Parallel Build Results (Total: ${PARALLEL_TIME}s)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ $IOS_EXIT -eq 0 ]; then
        echo -e "  ${GREEN}✅ iOS: SUCCESS${NC}"
        DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ iOS: Simulators (qual/api)"
    else
        echo -e "  ${RED}❌ iOS: FAILED${NC}"
        echo "     Log: $IOS_LOG"
    fi

    if [ $ANDROID_EXIT -eq 0 ]; then
        echo -e "  ${GREEN}✅ Android: SUCCESS${NC}"
        DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ Android: Devices/Emulators (qual/api)"
    else
        echo -e "  ${RED}❌ Android: FAILED${NC}"
        echo "     Log: $ANDROID_LOG"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Show logs if either failed
    if [ $IOS_EXIT -ne 0 ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🍎 iOS Build Output (last 50 lines):"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        tail -50 "$IOS_LOG"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi

    if [ $ANDROID_EXIT -ne 0 ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🤖 Android Build Output (last 50 lines):"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        tail -50 "$ANDROID_LOG"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi

    # Fail if either build failed
    if [ $IOS_EXIT -ne 0 ] || [ $ANDROID_EXIT -ne 0 ]; then
        echo -e "${RED}❌ Some parallel builds failed${NC}"
        exit 1
    fi

# Run sequential builds (fallback or single platform)
else
    # Deploy iOS to simulators
    if [ "$DEPLOY_IOS" = true ]; then
        build_ios_qual
        DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ iOS: Simulators (qual/api)"
    fi

    # Deploy Android to emulators/devices
    if [ "$DEPLOY_ANDROID" = true ]; then
        build_android_qual
        DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ Android: Devices/Emulators (qual/api)"
    fi
fi

# Calculate deployment time
DEPLOYMENT_END=$(date +%s)
DEPLOYMENT_TIME=$((DEPLOYMENT_END - DEPLOYMENT_START))
DEPLOYMENT_MINUTES=$((DEPLOYMENT_TIME / 60))
DEPLOYMENT_SECONDS=$((DEPLOYMENT_TIME % 60))

# HTML status page finalization removed (v2025.11.01)

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
