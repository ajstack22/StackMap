#!/bin/bash
echo "Building Android APK (excluding reanimated tasks)..."

cd android

# Clean first
echo "Cleaning..."
./gradlew clean

# Build with excluded tasks
echo "Building release APK..."
./gradlew assembleRelease \
  -x :react-native-reanimated:configureCMakeDebug \
  -x :react-native-reanimated:configureCMakeRelWithDebInfo \
  -x :react-native-reanimated:buildCMakeDebug \
  -x :react-native-reanimated:buildCMakeRelWithDebInfo \
  -x :react-native-reanimated:configureCMakeRelease \
  -x :react-native-reanimated:buildCMakeRelease

# Check if APK was created
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ APK built successfully!"
    echo "Location: android/app/build/outputs/apk/release/app-release.apk"
    ls -la app/build/outputs/apk/release/
else
    echo "❌ Build failed - no APK found"
fi