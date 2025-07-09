#!/bin/bash

# Native Development Setup Script
# Ensures iOS and Android projects work correctly after restructuring

set -e

echo "📱 StackMap Native Development Setup"
echo "===================================="
echo

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to show success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to show warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "ios" ] || [ ! -d "android" ]; then
    echo "❌ Must run from StackMap root directory"
    exit 1
fi

echo "🔧 Setting up iOS project..."
echo

# Update iOS Pods if needed
if command -v pod &> /dev/null; then
    echo "📦 Installing iOS dependencies..."
    cd ios
    pod install || warning "Pod install failed - you may need to run 'pod install' manually"
    cd ..
    success "iOS dependencies installed"
else
    warning "CocoaPods not installed - skipping iOS pod installation"
fi

echo
echo "🔧 Setting up Android project..."
echo

# Clean Android build
if [ -d "android" ]; then
    echo "🧹 Cleaning Android build..."
    cd android
    ./gradlew clean || warning "Gradle clean failed"
    cd ..
    success "Android build cleaned"
fi

echo
echo "📝 Important Notes for Native Development:"
echo "========================================="
echo
echo "iOS (Xcode):"
echo "  1. Open ios/StackMapNative.xcworkspace (not .xcodeproj)"
echo "  2. The app name is 'StackMap' but the project is 'StackMapNative'"
echo "  3. Build and run as normal"
echo
echo "Android (Android Studio):"
echo "  1. Open the 'android' folder in Android Studio"
echo "  2. Sync project with Gradle files if prompted"
echo "  3. Build and run as normal"
echo
echo "React Native Commands:"
echo "  - iOS:     npm run ios"
echo "  - Android: npm run android"
echo "  - Web:     npm run web"
echo
echo "If you encounter issues:"
echo "  - iOS: Try 'cd ios && pod install'"
echo "  - Android: Try 'cd android && ./gradlew clean'"
echo "  - Both: Try 'npm start -- --reset-cache'"
echo
success "Setup complete!"