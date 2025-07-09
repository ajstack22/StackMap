#!/bin/bash

echo "🏗️  Building Android App Bundle (AAB)..."

# Set Java to version 17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
echo "Using Java from: $JAVA_HOME"

# Navigate to Android directory
cd android || exit

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build the AAB
echo "📦 Building release AAB..."
./gradlew bundleRelease

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📍 Your AAB is located at:"
    echo "   android/app/build/outputs/bundle/release/app-release.aab"
    
    # Also show APK location if it was generated
    if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
        echo "📍 APK also available at:"
        echo "   android/app/build/outputs/apk/release/app-release.apk"
    fi
else
    echo "❌ Build failed!"
    exit 1
fi