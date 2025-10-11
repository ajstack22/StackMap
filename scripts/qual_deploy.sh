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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

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

# Deploy Web (qual uses dedicated qual environment)
if [ "$DEPLOY_WEB" = true ]; then
    echo "🌐 Deploying Web Qual..."
    echo "Deploying to qual environment (stackmap.app/qual)"
    echo "Qual web uses qual/api endpoint (qual database)"
    echo ""

    # Build web for qual
    echo "📦 Building web bundle for qual..."
    NODE_ENV=production npm run build:web

    if [ ! -f "web/build/index.html" ]; then
        echo -e "${RED}❌ Web build failed - no index.html generated${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Web build complete${NC}"
    echo ""

    # Deploy to qual using deployment infrastructure
    if [ -f "$SCRIPT_DIR/deploy-with-tracking.sh" ]; then
        "$SCRIPT_DIR/deploy-with-tracking.sh" qual
    else
        echo -e "${RED}❌ deploy-with-tracking.sh not found${NC}"
        echo "   Cannot deploy web qual without deployment script"
        exit 1
    fi

    DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ Web: stackmap.app/qual (uses qual/api)"
    echo -e "${GREEN}✅ Web qual deployed${NC}"
    echo ""
fi

# Deploy iOS to simulators
if [ "$DEPLOY_IOS" = true ]; then
    echo "🍎 Deploying iOS Qual to Simulators..."
    echo "This will build and deploy to iOS simulators"
    echo "iOS will use qual/api endpoint (qual database)"
    echo ""

    # Build for iPhone 16 Pro Max
    echo "📱 Building for iPhone 16 Pro Max..."
    if npx react-native run-ios --simulator="iPhone 16 Pro Max"; then
        echo -e "${GREEN}✅ iOS deployed to iPhone 16 Pro Max${NC}"
    else
        echo -e "${YELLOW}⚠️  iPhone 16 Pro Max build failed (non-blocking)${NC}"
    fi
    echo ""

    # Build for iPad Pro 11-inch (M4)
    echo "📱 Building for iPad Pro 11-inch (M4)..."
    if npx react-native run-ios --simulator="iPad Pro 11-inch (M4)"; then
        echo -e "${GREEN}✅ iOS deployed to iPad Pro 11-inch${NC}"
    else
        echo -e "${YELLOW}⚠️  iPad Pro build failed (non-blocking)${NC}"
    fi
    echo ""

    DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n  ✅ iOS: Simulators (qual/api)"
    echo -e "${GREEN}✅ iOS qual deployment complete${NC}"
    echo ""
fi

# Deploy Android to emulators/devices
if [ "$DEPLOY_ANDROID" = true ]; then
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
            if adb -s $DEVICE install -r android/app/build/outputs/apk/debug/app-debug.apk 2>/dev/null; then
                echo -e "${GREEN}✅ Installed on $MODEL${NC}"
            else
                echo "  Uninstalling old version first..."
                adb -s $DEVICE uninstall com.stackmapnative 2>/dev/null || true
                if adb -s $DEVICE install android/app/build/outputs/apk/debug/app-debug.apk; then
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
    echo -e "${GREEN}✅ Android qual deployment complete${NC}"
    echo ""
fi

# Calculate deployment time
DEPLOYMENT_END=$(date +%s)
DEPLOYMENT_TIME=$((DEPLOYMENT_END - DEPLOYMENT_START))
DEPLOYMENT_MINUTES=$((DEPLOYMENT_TIME / 60))
DEPLOYMENT_SECONDS=$((DEPLOYMENT_TIME % 60))

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
    echo "   • Web: https://stackmap.app/qual"
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
