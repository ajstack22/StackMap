#!/bin/bash

# Deploy iOS Script - Handles version increment and deployment to iOS devices
# Usage: ./scripts/deploy-ios.sh

set -e  # Exit on error

echo "🍎 Starting iOS deployment process..."

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Source version increment function from shared script
source "$SCRIPT_DIR/version-increment.sh"

# Function to deploy to iOS
deploy_ios() {
    echo "📱 Building and deploying to iOS..."
    
    # Check if we should deploy to simulator or device
    if [ "$1" == "device" ]; then
        echo "📱 Building for physical iOS device..."
        npx react-native run-ios --device
    else
        # Default to simulator
        echo "📱 Building for iOS simulator..."
        
        # Check for running simulators
        RUNNING_SIM=$(xcrun simctl list devices | grep "Booted" | head -1 | grep -o '".*"' | tr -d '"' || echo "")
        
        if [ -z "$RUNNING_SIM" ]; then
            echo "Starting iPhone 16 Pro Max simulator..."
            npx react-native run-ios --simulator="iPhone 16 Pro Max"
        else
            echo "Using running simulator: $RUNNING_SIM"
            npx react-native run-ios --simulator="$RUNNING_SIM"
        fi
    fi
    
    echo "✅ iOS deployment complete"
}

# Main execution
echo "========================================="
echo "   iOS Deployment Script"
echo "========================================="

# Step 1: Increment version
increment_version

# Step 2: Update iOS version in Info.plist
echo "📝 Updating iOS Info.plist versions..."

# Update CFBundleShortVersionString (display version)
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $NEW_VERSION" ios/StackMapNative/Info.plist

# Generate build number (remove dots for iOS)
BUILD_NUMBER=$(echo $NEW_VERSION | tr -d '.')
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" ios/StackMapNative/Info.plist

echo "✅ iOS version updated"

# Step 3: Pod install if needed
echo "📦 Checking CocoaPods..."
cd ios
if [ -f "Podfile.lock" ]; then
    pod install
fi
cd ..

# Step 4: Deploy to iOS
# Check for command line argument
if [ "$1" == "device" ]; then
    deploy_ios device
else
    deploy_ios simulator
fi

echo ""
echo "========================================="
echo "✅ iOS Deployment complete!"
echo "✅ Version: $NEW_VERSION"
echo "========================================="