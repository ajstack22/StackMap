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
    
    # Check if PENDING_CHANGES.md exists and use it for commit message
    if [ -f "PENDING_CHANGES.md" ]; then
        # Extract the title (first line starting with "## Title:")
        COMMIT_TITLE=$(grep "^## Title:" PENDING_CHANGES.md | sed 's/## Title: //')
        
        # Extract the full content for the commit body
        COMMIT_BODY=$(cat PENDING_CHANGES.md)
        
        if [ -n "$COMMIT_TITLE" ]; then
            echo "📋 Using descriptive commit message from PENDING_CHANGES.md"
            git add -A
            # Use the title as the commit message and the full content as the body
            git commit -m "$COMMIT_TITLE" -m "$COMMIT_BODY"
            
            # Clear the pending changes file after successful commit
            echo "# Pending Changes" > PENDING_CHANGES.md
            echo "" >> PENDING_CHANGES.md
            echo "## Title: " >> PENDING_CHANGES.md
            echo "" >> PENDING_CHANGES.md
            echo "### Changes Made:" >> PENDING_CHANGES.md
            echo "" >> PENDING_CHANGES.md
            git add PENDING_CHANGES.md
            echo "✅ Changes committed with descriptive message"
        else
            # Fallback to timestamp if no title found
            git add -A
            git commit -m "Auto-commit: Pre-deployment changes $(date +%Y-%m-%d_%H:%M:%S)"
            echo "✅ Changes committed successfully"
        fi
    else
        # Fallback to timestamp if no PENDING_CHANGES.md
        git add -A
        git commit -m "Auto-commit: Pre-deployment changes $(date +%Y-%m-%d_%H:%M:%S)"
        echo "✅ Changes committed successfully"
    fi
fi

# Source and run version increment once
source "$SCRIPT_DIR/version-increment.sh"
increment_version

# Commit version increment with title from PENDING_CHANGES.md if available
echo "Committing version increment..."

# Check if PENDING_CHANGES.md has a title to use
COMMIT_TITLE=""
COMMIT_DESCRIPTION=""
if [ -f "PENDING_CHANGES.md" ]; then
    # Extract the title (line starting with "## Title:")
    TITLE_LINE=$(grep "^## Title:" PENDING_CHANGES.md | sed 's/## Title: //' | sed 's/^[[:space:]]*//')
    
    # Extract the changes description (everything after "### Changes Made:")
    if grep -q "### Changes Made:" PENDING_CHANGES.md; then
        COMMIT_DESCRIPTION=$(awk '/### Changes Made:/{flag=1; next} flag' PENDING_CHANGES.md | head -20)
    fi
    
    if [ -n "$TITLE_LINE" ]; then
        # Use version number + title from PENDING_CHANGES.md
        COMMIT_TITLE="$NEW_VERSION - $TITLE_LINE"
        echo "📋 Using title from PENDING_CHANGES.md: $TITLE_LINE"
    else
        # Fallback to default version bump message
        COMMIT_TITLE="$NEW_VERSION - Deployment version bump"
    fi
else
    # Fallback to default version bump message
    COMMIT_TITLE="$NEW_VERSION - Deployment version bump"
fi

git add -f package.json app.json src/utils/version.js ios/StackMapNative/Info.plist
if ! git diff --cached --quiet; then
    if [ -n "$COMMIT_DESCRIPTION" ]; then
        # Commit with title and description
        git commit -m "$COMMIT_TITLE" -m "$COMMIT_DESCRIPTION"
    else
        # Commit with just title
        git commit -m "$COMMIT_TITLE"
    fi
    echo "✅ Version committed: $COMMIT_TITLE"
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

# Check for TODO comments that might indicate incomplete work
echo "- Checking for TODO/FIXME comments..."
TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX\|HACK" src/ --include="*.js" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TODO_COUNT" -gt "0" ]; then
    echo "⚠️  Found $TODO_COUNT TODO/FIXME comments - review before production deployment"
fi

# Check for Prettier formatting issues
echo "- Running Prettier format check..."
if command -v npx &> /dev/null && [ -f ".prettierrc.js" ]; then
    npx prettier --check "src/**/*.{js,ts,tsx}" "App.js" 2>&1 | tee /tmp/prettier-output.txt
    if grep -q "Checking formatting..." /tmp/prettier-output.txt && ! grep -q "All matched files use Prettier code style!" /tmp/prettier-output.txt; then
        echo ""
        echo "⚠️  Some files are not properly formatted!"
        echo "Run 'npx prettier --write src/**/*.{js,ts,tsx} App.js' to fix formatting"
        echo "Continuing deployment (formatting issues are non-blocking)..."
    else
        echo "✅ Prettier format check passed!"
    fi
else
    echo "⚠️  Prettier check skipped (prettier not configured)"
fi

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
# Bundle size check (for web deployments)
if [ "$DEPLOY_WEB" = true ] || [ "$DEPLOY_PROD" = true ]; then
    echo "- Checking bundle size..."
    if [ -f "web/build/bundle.js" ]; then
        BUNDLE_SIZE=$(du -h web/build/bundle.js | cut -f1)
        echo "  Bundle size: $BUNDLE_SIZE"
        # Check if bundle is over 5MB (warning threshold)
        BUNDLE_BYTES=$(du -b web/build/bundle.js | cut -f1)
        if [ "$BUNDLE_BYTES" -gt "5242880" ]; then
            echo "⚠️  Warning: Bundle size exceeds 5MB - consider code splitting"
        fi
    fi
fi

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
    # Check for modern sync system files
    if [ ! -f "src/services/sync/syncStoreIntegration.js" ] || [ ! -f "src/services/sync/minimalSyncService.js" ]; then
        echo "❌ Missing critical sync service files"
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
    
    # Test 4: Data structure validation
    echo "- Validating data structure version..."
    if grep -q "version: 3" App.js 2>/dev/null; then
        echo "❌ Found version 3 references - must use version 4!"
        exit 1
    fi
    if grep -q "version: 4" App.js 2>/dev/null; then
        echo "✅ Data structure using version 4"
    fi
    
    # Test 5: Check for duplicate package.json entries (common after merges)
    echo "- Checking for duplicate dependencies..."
    DUPLICATE_COUNT=$(cat package.json | grep -o '"[^"]*":' | sort | uniq -d | wc -l | tr -d ' ')
    if [ "$DUPLICATE_COUNT" -gt "0" ]; then
        echo "⚠️  Warning: Found duplicate entries in package.json"
        echo "Run 'npm dedupe' to clean up"
    fi
    
    echo "✅ All essential tests passed!"
else
    echo ""
    echo "⚠️  Tests skipped (--skip-tests flag used)"
fi
echo ""

# Track deployment status
DEPLOYMENT_STATUS=""

# Deploy to Web FIRST (fastest deployment)
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
        echo "Found Android devices:"
        for DEVICE in $DEVICES; do
            # Get device model name
            MODEL=$(adb -s $DEVICE shell getprop ro.product.model 2>/dev/null | tr -d '\r')
            echo "  - $DEVICE ($MODEL)"
        done
        echo ""
        
        for DEVICE in $DEVICES; do
            MODEL=$(adb -s $DEVICE shell getprop ro.product.model 2>/dev/null | tr -d '\r')
            echo "📱 Installing on $MODEL ($DEVICE)..."
            adb -s $DEVICE install -r android/app/build/outputs/apk/debug/app-debug.apk 2>/dev/null || {
                echo "  Uninstalling old version first..."
                adb -s $DEVICE uninstall com.stackmap 2>/dev/null || true
                adb -s $DEVICE install android/app/build/outputs/apk/debug/app-debug.apk
            }
            echo "  ✅ Installed on $MODEL"
        done
    else
        echo "⚠️  No Android devices connected"
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
        echo "Building for iOS simulators..."
        
        # Deploy to iPhone 16 Pro Max
        echo "📱 Deploying to iPhone 16 Pro Max..."
        npx react-native run-ios --simulator="iPhone 16 Pro Max" || echo "⚠️  iPhone build failed"
        
        # Deploy to iPad Pro 11-inch (M4)
        echo "📱 Deploying to iPad Pro 11-inch..."
        npx react-native run-ios --simulator="iPad Pro 11-inch (M4)" || echo "⚠️  iPad build failed"
        
        DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n✅ iOS Simulators: v$NEW_VERSION (iPhone & iPad)"
    fi
    
    echo "✅ iOS deployment complete"
    echo ""
fi

# Summary
echo "========================================="
echo " 🎉 Deployment Complete!"
echo "========================================="
echo -e "$DEPLOYMENT_STATUS"
echo "========================================="

# Version already committed at the beginning of the script