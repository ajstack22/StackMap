#!/bin/bash

echo "Building StackMap TWA Debug APK..."

# Check if gradle wrapper exists, if not create it
if [ ! -f "gradlew" ]; then
    echo "Creating Gradle wrapper..."
    gradle wrapper --gradle-version=8.2
fi

# Clean previous builds
./gradlew clean

# Build debug APK
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo ""
    echo "Build successful!"
    echo "Debug APK location: app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "To install on a connected device:"
    echo "./gradlew installDebug"
else
    echo "Build failed!"
    exit 1
fi