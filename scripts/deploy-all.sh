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

# Source and run version increment once
source "$SCRIPT_DIR/version-increment.sh"
increment_version

echo ""
echo "========================================="
echo "   Unified Deployment"
echo "   Version: $NEW_VERSION"
echo "========================================="
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
    
    # Update iOS version
    /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $NEW_VERSION" ios/StackMap/Info.plist 2>/dev/null || true
    BUILD_NUMBER=$(echo $NEW_VERSION | tr -d '.')
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" ios/StackMap/Info.plist 2>/dev/null || true
    
    # Pod install
    cd ios
    pod install --silent
    cd ..
    
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
    
    # Build web
    NODE_ENV=production npm run build:web
    
    if [ "$DEPLOY_WEB" = true ]; then
        # Deploy to qual
        echo "Deploying to Qual..."
        cp web/build/*.* .
        cp -r web/build/fonts . 2>/dev/null || true
        cp -r web/build/icons . 2>/dev/null || true
        
        git add -A
        git commit -m "Deploy v$NEW_VERSION to qual" || true
        git push origin main
        
        ssh stackmap-cpanel "cd ~/public_html/qual && git pull" 2>/dev/null || {
            echo "⚠️  SSH deployment failed. Manual pull required on server."
        }
        
        DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n✅ Web Qual: v$NEW_VERSION"
        echo "✅ Qual deployment complete"
    fi
    
    if [ "$DEPLOY_PROD" = true ]; then
        # Deploy to production
        echo "Deploying to Production..."
        if [ -f "./scripts/simple-deploy.sh" ]; then
            ./scripts/simple-deploy.sh
            DEPLOYMENT_STATUS="$DEPLOYMENT_STATUS\n✅ Web Prod: v$NEW_VERSION"
        else
            echo "⚠️  Production deployment script not found"
        fi
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

# Commit version increment if not already committed
if git diff --quiet package.json app.json; then
    echo "Version files already committed"
else
    echo "Committing version increment..."
    git add package.json app.json ios/StackMap/Info.plist 2>/dev/null || true
    git commit -m "Increment version to v$NEW_VERSION" || true
fi