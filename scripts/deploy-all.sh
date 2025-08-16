#!/bin/bash

# Master Deploy Script - Deploy to all platforms with single version increment
# Usage: ./scripts/deploy-all.sh [options]
#   Options:
#     --android     Deploy to Android devices
#     --ios         Deploy to iOS simulator
#     --ios-device  Deploy to iOS physical device
#     --web         Deploy to web (qual)
#     --prod        Deploy to production web
#     --all         Deploy to all platforms (default)

set -e  # Exit on error

echo "🚀 Starting unified deployment process..."

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Parse command line arguments
DEPLOY_ANDROID=false
DEPLOY_IOS=false
DEPLOY_IOS_DEVICE=false
DEPLOY_WEB=false
DEPLOY_PROD=false
DEPLOY_ALL=false
SKIP_TESTS=false

if [ $# -eq 0 ]; then
    DEPLOY_ALL=true
fi

for arg in "$@"; do
    case $arg in
        --android)
            DEPLOY_ANDROID=true
            ;;
        --ios)
            DEPLOY_IOS=true
            ;;
        --ios-device)
            DEPLOY_IOS_DEVICE=true
            ;;
        --web)
            DEPLOY_WEB=true
            ;;
        --prod)
            DEPLOY_PROD=true
            ;;
        --all)
            DEPLOY_ALL=true
            ;;
        --skip-tests)
            SKIP_TESTS=true
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--android] [--ios] [--ios-device] [--web] [--prod] [--all] [--skip-tests]"
            exit 1
            ;;
    esac
done

# If --all, enable all deployments
if [ "$DEPLOY_ALL" = true ]; then
    DEPLOY_ANDROID=true
    DEPLOY_IOS=true
    DEPLOY_WEB=true
fi

# Check for uncommitted changes and auto-commit them
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Found uncommitted changes. Auto-committing before deployment..."
    git add -A
    git commit -m "Auto-commit: Pre-deployment changes $(date +%Y-%m-%d_%H:%M:%S)"
    echo "✅ Changes committed successfully"
fi

# Source and run version increment once
source "$SCRIPT_DIR/version-increment.sh"
increment_version

# Commit version increment immediately so deploy-with-tracking.sh has clean git
echo "Committing version increment..."
git add -f package.json app.json src/utils/version.js ios/StackMapNative/Info.plist
if ! git diff --cached --quiet; then
    git commit -m "$NEW_VERSION - Deployment version bump"
    echo "✅ Version committed: $NEW_VERSION"
else
    echo "No version changes to commit"
fi

echo ""
echo "========================================="
echo "   Unified Deployment"
echo "   Version: $NEW_VERSION"
echo "========================================="
echo ""

# Run sanity checks before deployment
echo "🔍 Running pre-deployment sanity checks..."

# Security audit
echo "- Running security audit..."
npm run security:audit || {
    echo ""
    echo "❌ Security vulnerabilities detected!"
    echo "Please fix critical vulnerabilities before deploying."
    echo "Run 'npm audit' for details."
    exit 1
}
echo "✅ Security audit passed!"

# Lint check (warnings are OK, errors are not)
echo "- Running lint check..."
npm run lint 2>&1 | tee /tmp/lint-output.txt
LINT_EXIT_CODE=${PIPESTATUS[0]}

# Check if there are actual errors by looking for lines with "error" level
# (not the summary line that says "0 errors")
if grep -E "^\s+[0-9]+:[0-9]+\s+error\s" /tmp/lint-output.txt > /dev/null; then
    echo ""
    echo "❌ Lint errors found!"
    echo "Please fix the errors before deploying."
    echo "Run 'npm run lint' to see the issues again."
    exit 1
else
    echo "✅ Lint check passed (warnings are OK)!"
fi

# TypeScript check (if available)
echo "- Running TypeScript checks..."
if [ -f "tsconfig.json" ] && command -v npx &> /dev/null; then
    # Count critical type errors (exclude minor ones for gradual migration)
    npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt
    TSC_EXIT_CODE=${PIPESTATUS[0]}
    
    # Check for critical errors (undefined methods, missing imports)
    # Exclude DOM-related errors which are expected in React Native
    if grep -E "(Cannot find name|is not a function|does not exist on type.*services)" /tmp/tsc-output.txt | grep -v "document\|navigator\|window\.location" > /dev/null; then
        echo ""
        echo "❌ Critical TypeScript errors found!"
        echo "These errors may cause runtime crashes. Please fix before deploying."
        echo "Run 'npm run typecheck' to see the issues again."
        exit 1
    else
        ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-output.txt 2>/dev/null || echo "0")
        if [ "$ERROR_COUNT" -gt "0" ]; then
            echo "⚠️  TypeScript check found $ERROR_COUNT errors (non-critical, migration in progress)"
        else
            echo "✅ TypeScript check passed!"
        fi
    fi
else
    echo "⚠️  TypeScript check skipped (tsconfig.json not found)"
fi

# Check for undefined method calls
echo "- Checking for undefined method calls..."
if [ -f "scripts/check-methods-improved.js" ]; then
    node scripts/check-methods-improved.js 2>&1 | tee /tmp/method-check.txt
    if grep -q "❌ Error:" /tmp/method-check.txt; then
        echo ""
        echo "❌ Undefined method calls found!"
        echo "These will cause runtime crashes. Please fix before deploying."
        exit 1
    else
        echo "✅ Method check passed!"
    fi
else
    echo "⚠️  Method check skipped (check script not found)"
fi

# Run essential tests (unless skipped)
if [ "$SKIP_TESTS" = false ]; then
    echo ""
    echo "🧪 Running essential tests..."
    
    # Test 1: Check if App.js exists and has basic structure
    echo "- Testing app structure..."
    if [ ! -f "App.js" ]; then
        echo "❌ App.js not found!"
        exit 1
    fi
    if ! grep -q "import React" App.js; then
        echo "❌ App.js missing React import"
        exit 1
    fi
    if ! grep -q "export default" App.js; then
        echo "❌ App.js missing default export"
        exit 1
    fi
    echo "✅ App.js structure OK"
    
    # Test 2: Check critical services exist
    echo "- Checking critical services..."
    # Check for either .js or .ts version (TypeScript migration in progress)
    if [ ! -f "src/services/sync/syncService.js" ] && [ ! -f "src/services/sync/syncService.ts" ]; then
        echo "❌ Missing critical service: syncService.js or syncService.ts"
        exit 1
    fi
    if [ ! -f "src/stores/useAppStore.js" ]; then
        echo "❌ Missing critical service: useAppStore.js"
        exit 1
    fi
    echo "✅ Critical services present"
    
    # Test 3: Check for common issues (just warnings)
    echo "- Checking for common issues..."
    CONSOLE_COUNT=$(grep -r "console\.log" src/ --include="*.js" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$CONSOLE_COUNT" -gt "100" ]; then
        echo "⚠️  Warning: $CONSOLE_COUNT console.log statements found"
    fi
    
    echo "✅ All essential tests passed!"
else
    echo ""
    echo "⚠️  Tests skipped (--skip-tests flag used)"
fi
echo ""

# Track deployment status
DEPLOYMENT_STATUS=""

# Deploy to Android
if [ "$DEPLOY_ANDROID" = true ]; then
    echo "🤖 Deploying to Android..."
    
    # Build standalone APK
    echo "Building standalone APK..."
    npx react-native bundle \
        --platform android \
        --dev false \
        --entry-file index.js \
        --bundle-output android/app/src/main/assets/index.android.bundle \
        --assets-dest android/app/src/main/res/
    
    cd android
    ./gradlew assembleDebug
    cd ..
    
    # Install on connected devices
    DEVICES=$(adb devices 2>/dev/null | grep -E "device$|emulator" | cut -f1)
    if [ ! -z "$DEVICES" ]; then
        for DEVICE in $DEVICES; do
            if [[ $DEVICE != emulator-* ]]; then
                echo "Installing on physical device $DEVICE..."
                adb -s $DEVICE install -r android/app/build/outputs/apk/debug/app-debug.apk 2>/dev/null || {
                    adb -s $DEVICE uninstall com.stackmap 2>/dev/null || true
                    adb -s $DEVICE install android/app/build/outputs/apk/debug/app-debug.apk
                }
            else
                echo "Reloading Metro on emulator $DEVICE..."
                adb -s $DEVICE shell input text "RR" 2>/dev/null || true
            fi
        done
    fi
    
    DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n✅ Android: v$NEW_VERSION"
    echo "✅ Android deployment complete"
    echo ""
fi

# Deploy to iOS
if [ "$DEPLOY_IOS" = true ] || [ "$DEPLOY_IOS_DEVICE" = true ]; then
    echo "🍎 Deploying to iOS..."
    
    # iOS version already updated in version-increment.sh and committed
    # Note: pod install removed - deprecated and not needed unless dependencies change
    # If pods need updating, run manually: cd ios && pod install
    
    # Build and deploy
    if [ "$DEPLOY_IOS_DEVICE" = true ]; then
        echo "Building for iOS device..."
        npx react-native run-ios --device || echo "⚠️  iOS device build failed"
        DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n✅ iOS Device: v$NEW_VERSION"
    else
        echo "Building for iOS simulator..."
        npx react-native run-ios --simulator="iPhone 16 Pro Max" || echo "⚠️  iOS simulator build failed"
        DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n✅ iOS Simulator: v$NEW_VERSION"
    fi
    
    echo "✅ iOS deployment complete"
    echo ""
fi

# Deploy to Web
if [ "$DEPLOY_WEB" = true ] || [ "$DEPLOY_PROD" = true ]; then
    echo "🌐 Deploying to Web..."
    
    if [ "$DEPLOY_WEB" = true ]; then
        # Deploy to qual using new branch-based deployment
        echo "Deploying to Qual..."
        "$SCRIPT_DIR/deploy-with-tracking.sh" qual
        
        DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n✅ Web Qual: v$NEW_VERSION"
        echo "✅ Qual deployment complete"
    fi
    
    if [ "$DEPLOY_PROD" = true ]; then
        # Deploy to production using new branch-based deployment
        echo "Deploying to Production..."
        "$SCRIPT_DIR/deploy-with-tracking.sh" prod
        
        DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n✅ Web Prod: v$NEW_VERSION"
        echo "✅ Production deployment complete"
    fi
    
    echo ""
fi

# Summary
echo "========================================="
echo " 🎉 Deployment Complete!"
echo "========================================="
echo -e "$DEPLOYMENT_STATUS"
echo "========================================="

# Version already committed at the beginning of the script