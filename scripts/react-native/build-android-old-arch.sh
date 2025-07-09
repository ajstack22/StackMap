#!/bin/bash
echo "Building Android with old architecture..."
cd android

# Clean everything first
echo "Cleaning build directories..."
./gradlew clean
rm -rf ~/.gradle/caches/
rm -rf build/
rm -rf app/build/

# Build release APK with old architecture
echo "Building release APK..."
./gradlew assembleRelease --no-daemon

# Check if APK was created
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ APK built successfully!"
    echo "Location: android/app/build/outputs/apk/release/app-release.apk"
    ls -la app/build/outputs/apk/release/
else
    echo "❌ Build failed - no APK found"
    exit 1
fi