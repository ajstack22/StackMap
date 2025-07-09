#!/bin/bash
echo "Building Android without reanimated..."

# First, temporarily rename the reanimated folder to exclude it
if [ -d "node_modules/react-native-reanimated" ]; then
    echo "Temporarily disabling reanimated..."
    mv node_modules/react-native-reanimated node_modules/react-native-reanimated.disabled
fi

cd android

# Clean
./gradlew clean

# Build
echo "Building APK..."
./gradlew assembleRelease --no-daemon

# Restore reanimated for iOS
cd ..
if [ -d "node_modules/react-native-reanimated.disabled" ]; then
    echo "Restoring reanimated..."
    mv node_modules/react-native-reanimated.disabled node_modules/react-native-reanimated
fi

# Check result
if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ Build successful!"
    ls -la android/app/build/outputs/apk/release/
else
    echo "❌ Build failed"
fi