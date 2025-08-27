#!/bin/bash

# Quick Deploy Android Script - For fast updates when code changes are minimal
# Usage: ./scripts/deploy-android-quick.sh

set -e  # Exit on error

echo "⚡ Starting quick Android deployment..."

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Source version increment function from shared script
source "$SCRIPT_DIR/version-increment.sh"

# Function to reload on emulators
reload_emulators() {
    echo "🔄 Reloading Metro bundle on emulators..."
    
    # Get emulator devices only
    EMULATORS=$(adb devices | grep "emulator-" | cut -f1)
    
    if [ -z "$EMULATORS" ]; then
        echo "No emulators found"
        return
    fi
    
    for DEVICE in $EMULATORS; do
        echo "Reloading on $DEVICE..."
        adb -s $DEVICE shell input text "RR"
    done
    
    echo "✅ Emulators reloaded"
}

# Main execution
echo "========================================="
echo "   Quick Android Deployment"
echo "========================================="

# Step 1: Increment version
increment_version

# Step 2: Check for physical devices that need standalone build
PHYSICAL_DEVICES=$(adb devices | grep -E "device$" | grep -v "emulator" | cut -f1)

if [ ! -z "$PHYSICAL_DEVICES" ]; then
    echo "📱 Physical devices detected. Building standalone APK..."
    
    # Bundle and build
    npx react-native bundle \
        --platform android \
        --dev false \
        --entry-file index.js \
        --bundle-output android/app/src/main/assets/index.android.bundle \
        --assets-dest android/app/src/main/res/
    
    cd android
    ./gradlew assembleDebug
    cd ..
    
    # Install on physical devices
    for DEVICE in $PHYSICAL_DEVICES; do
        MODEL=$(adb -s $DEVICE shell getprop ro.product.model | tr -d '\r')
        echo "Installing on $DEVICE ($MODEL)..."
        adb -s $DEVICE install -r android/app/build/outputs/apk/debug/app-debug.apk || {
            echo "Retrying with uninstall..."
            adb -s $DEVICE uninstall com.stackmap 2>/dev/null || true
            adb -s $DEVICE install android/app/build/outputs/apk/debug/app-debug.apk
        }
    done
fi

# Step 3: Reload emulators
reload_emulators

echo ""
echo "========================================="
echo "✅ Quick deployment complete!"
echo "✅ Version: $NEW_VERSION"
echo "========================================="