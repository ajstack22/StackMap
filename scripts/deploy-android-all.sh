#!/bin/bash

# Deploy Android Script - Handles version increment and deployment to all devices
# Usage: ./scripts/deploy-android-all.sh

set -e  # Exit on error

echo "🚀 Starting Android deployment process..."

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Source version increment function from shared script
source "$SCRIPT_DIR/version-increment.sh"

# Function to build standalone APK
build_standalone() {
    echo "📦 Building standalone APK..."
    
    # Bundle JavaScript
    npx react-native bundle \
        --platform android \
        --dev false \
        --entry-file index.js \
        --bundle-output android/app/src/main/assets/index.android.bundle \
        --assets-dest android/app/src/main/res/
    
    # Build APK
    cd android
    ./gradlew assembleDebug
    cd ..
    
    echo "✅ Standalone APK built successfully"
}

# Function to deploy to devices
deploy_to_devices() {
    echo "📱 Detecting connected devices..."
    
    # Get list of devices
    DEVICES=$(adb devices | grep -E "device$|emulator" | cut -f1)
    
    if [ -z "$DEVICES" ]; then
        echo "❌ No devices found. Please connect devices and try again."
        exit 1
    fi
    
    echo "Found devices:"
    echo "$DEVICES"
    
    # Identify physical vs emulator devices
    for DEVICE in $DEVICES; do
        if [[ $DEVICE == emulator-* ]]; then
            echo "📱 $DEVICE: Emulator (will use Metro)"
        else
            # Check if it's the Samsung or other physical device
            MODEL=$(adb -s $DEVICE shell getprop ro.product.model | tr -d '\r')
            echo "📱 $DEVICE: Physical device ($MODEL) - installing standalone"
            
            # Install standalone APK on physical devices
            echo "Installing standalone APK on $DEVICE..."
            adb -s $DEVICE install -r android/app/build/outputs/apk/debug/app-debug.apk || {
                echo "⚠️  Failed to install on $DEVICE, trying uninstall first..."
                adb -s $DEVICE uninstall com.stackmap 2>/dev/null || true
                adb -s $DEVICE install android/app/build/outputs/apk/debug/app-debug.apk
            }
            echo "✅ Installed on $DEVICE"
        fi
    done
    
    # Start Metro for emulators if any exist
    if echo "$DEVICES" | grep -q "emulator-"; then
        echo "🔄 Starting Metro bundler for emulators..."
        
        # Check if Metro is already running
        if ! curl -s http://localhost:8081/status | grep -q "packager-status:running"; then
            # Start Metro in background
            npx react-native start --reset-cache > /dev/null 2>&1 &
            METRO_PID=$!
            echo "Metro started with PID: $METRO_PID"
            
            # Wait for Metro to be ready
            echo "Waiting for Metro to start..."
            sleep 5
        else
            echo "Metro is already running"
        fi
        
        # Deploy to emulators
        for DEVICE in $DEVICES; do
            if [[ $DEVICE == emulator-* ]]; then
                echo "📱 Running on emulator $DEVICE with Metro..."
                npx react-native run-android --deviceId="$DEVICE" --no-packager || {
                    echo "⚠️  Failed to run on $DEVICE, trying reload..."
                    adb -s $DEVICE shell input text "RR"
                }
            fi
        done
    fi
}

# Main execution
echo "========================================="
echo "   Android Deployment Script"
echo "========================================="

# Step 1: Increment version
increment_version

# Step 2: Build standalone APK
build_standalone

# Step 3: Deploy to all devices
deploy_to_devices

echo ""
echo "========================================="
echo "✅ Deployment complete!"
echo "✅ Version: $NEW_VERSION"
echo "✅ Physical devices: Standalone APK"
echo "✅ Emulators: Metro development build"
echo "========================================="