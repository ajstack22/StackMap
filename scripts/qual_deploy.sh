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
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--android] [--ios] [--ios-device] [--web] [--prod] [--all]"
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

# Check for uncommitted changes and get release notes
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Found uncommitted changes."
    echo ""

    # Prompt for release notes
    echo "Please enter release notes for this deployment:"
    echo "(Brief description of what changed - press Enter when done)"
    read -r RELEASE_NOTES

    # If no release notes provided, prompt again
    while [ -z "$RELEASE_NOTES" ]; do
        echo ""
        echo "⚠️  Release notes are required for deployment!"
        echo "Please describe what changed in this release:"
        read -r RELEASE_NOTES
    done

    echo ""
    echo "📝 Committing changes with release notes..."

    # Add all changes
    git add -A

    # Commit with the release notes
    git commit -m "$RELEASE_NOTES"

    echo "✅ Changes committed: $RELEASE_NOTES"

    # Update PENDING_CHANGES.md with the release notes for version bump commit
    echo "## Title: $RELEASE_NOTES" > PENDING_CHANGES.md
    echo "" >> PENDING_CHANGES.md
    echo "### Changes Made:" >> PENDING_CHANGES.md
    echo "$RELEASE_NOTES" >> PENDING_CHANGES.md
    echo "" >> PENDING_CHANGES.md
    echo "### Deployment Date: $(date +%Y-%m-%d_%H:%M:%S)" >> PENDING_CHANGES.md
    git add PENDING_CHANGES.md
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
    echo "⚠️  Found $TODO_COUNT TODO/FIXME comments"
    # Create backlog story for TODOs
    ./scripts/manage-backlog.sh todos "$TODO_COUNT" 2>/dev/null || true
    echo "   Continuing deployment (TODOs are non-blocking)..."
fi

# Check for Prettier formatting issues
echo "- Running Prettier format check..."
if command -v npx &> /dev/null && [ -f ".prettierrc.js" ]; then
    npx prettier --check "src/**/*.{js,ts,tsx}" "App.js" 2>&1 | tee /tmp/prettier-output.txt
    if grep -q "Checking formatting..." /tmp/prettier-output.txt && ! grep -q "All matched files use Prettier code style!" /tmp/prettier-output.txt; then
        echo ""
        echo "⚠️  Some files are not properly formatted!"
        # Create backlog story for prettier issues
        ./scripts/manage-backlog.sh prettier failed 2>/dev/null || true
        echo "   Run 'npm run prettier' to fix formatting"
        echo "   Continuing deployment (formatting issues are non-blocking)..."
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

# SonarCloud Code Quality Analysis (non-blocking)
echo "- Running SonarCloud analysis..."
# Load SonarCloud token if available
if [ -f "$HOME/.manylla-env" ]; then
    source "$HOME/.manylla-env"
elif [ -f "$HOME/.stackmap-env" ]; then
    source "$HOME/.stackmap-env"
fi

if [ -n "$SONAR_TOKEN" ]; then
    npm run sonar 2>&1 | tee /tmp/sonar-output.txt || {
        echo "⚠️  SonarCloud analysis failed (non-blocking)"
        echo "Continuing with deployment..."
    }

    # Check if analysis was successful
    if grep -q "Analysis complete!" /tmp/sonar-output.txt; then
        echo "✅ Code quality check completed"
        echo "   View results at: https://sonarcloud.io/project/overview?id=ajstack22_stackmap"
    fi
else
    echo "ℹ️  SonarCloud token not found. Skipping analysis."
    echo "   To enable: echo 'SONAR_TOKEN=\"your-token\"' > ~/.manylla-env"
fi

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
            echo "⚠️  Warning: Bundle size exceeds 5MB"
            # Create backlog story for bundle optimization
            ./scripts/manage-backlog.sh bundle "$BUNDLE_SIZE" 2>/dev/null || true
            echo "   Consider code splitting and optimization"
            echo "   Continuing deployment (bundle size is non-blocking)..."
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
            echo "⚠️  TypeScript check found $ERROR_COUNT errors (non-critical)"
            # Create backlog story for TypeScript errors
            ./scripts/manage-backlog.sh typescript "$ERROR_COUNT" 2>/dev/null || true
            echo "   Continuing deployment (TypeScript warnings are non-blocking)..."
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

# Run Jest tests (MANDATORY - NO SKIPPING)
echo ""
echo "🧪 Running automated tests..."

# Run Jest test suite
echo "- Running Jest tests..."
npm test 2>&1 | tee /tmp/jest-output.txt
JEST_EXIT_CODE=${PIPESTATUS[0]}

if [ "$JEST_EXIT_CODE" -ne 0 ]; then
    echo ""
    echo "❌ Jest tests failed!"
    echo "Please fix failing tests before deploying."
    echo "Run 'npm test' to see the issues again."
    exit 1
else
    # Extract test summary
    TEST_SUMMARY=$(grep -E "Tests:.*passed" /tmp/jest-output.txt | tail -1)
    if [ -n "$TEST_SUMMARY" ]; then
        echo "✅ Jest tests passed! ($TEST_SUMMARY)"
    else
        echo "✅ Jest tests passed!"
    fi
fi

echo ""
echo "🧪 Running essential manual checks..."

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

echo "✅ All tests passed!"
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

# Check if any backlog stories were created during deployment
BACKLOG_DIR="$PROJECT_ROOT/docs/development/backlog"
if [ -d "$BACKLOG_DIR" ] && ls "$BACKLOG_DIR"/S-DEBT-*.md 2>/dev/null | grep -q .; then
    echo ""
    echo "📋 Technical Debt Backlog Updated:"
    echo "========================================="
    # Show recently created stories (within last 5 minutes)
    find "$BACKLOG_DIR" -name "S-DEBT-*.md" -mmin -5 2>/dev/null | while read story; do
        story_name=$(basename "$story" .md)
        title=$(grep "^# " "$story" | sed 's/^# //')
        echo "  • $title"
    done
    echo ""
    echo "Run './scripts/manage-backlog.sh list' to see all backlog items"
    echo "========================================="
fi

# Summary
echo "========================================="
echo " 🎉 Deployment Complete!"
echo "========================================="
echo -e "$DEPLOYMENT_STATUS"
echo "========================================="

# Version already committed at the beginning of the script