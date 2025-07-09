#!/bin/bash
echo "Cleaning and building Android..."

cd android

# Clean everything
echo "Cleaning build directories..."
rm -rf app/build
rm -rf build
rm -rf ~/.gradle/caches/
./gradlew clean

# Try to exclude reanimated tasks
echo "Building release APK (excluding reanimated)..."
./gradlew assembleRelease \
  -x :react-native-reanimated:configureCMakeDebug \
  -x :react-native-reanimated:configureCMakeRelWithDebInfo \
  -x :react-native-reanimated:buildCMakeDebug \
  -x :react-native-reanimated:buildCMakeRelWithDebInfo \
  -x :react-native-reanimated:generateJsonModelDebug \
  -x :react-native-reanimated:generateJsonModelRelease \
  --no-daemon

# Check if APK was created
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ APK built successfully!"
    echo "Location: android/app/build/outputs/apk/release/app-release.apk"
    ls -la app/build/outputs/apk/release/
else
    echo "❌ Build failed - no APK found"
fi