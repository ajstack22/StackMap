#!/bin/bash

echo "Building StackMap TWA Release Bundle..."

# Check if gradle wrapper exists
if [ ! -f "gradlew" ]; then
    echo "Creating Gradle wrapper..."
    gradle wrapper --gradle-version=8.2
fi

# Clean previous builds
./gradlew clean

# Build release bundle (AAB)
./gradlew bundleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "Build successful!"
    echo "Release AAB location: app/build/outputs/bundle/release/app-release.aab"
    echo ""
    echo "Next steps:"
    echo "1. Sign the AAB with your release key"
    echo "2. Upload to Google Play Console"
    echo ""
    echo "To sign the AAB:"
    echo "jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore your-release-key.keystore app/build/outputs/bundle/release/app-release.aab your-key-alias"
else
    echo "Build failed!"
    exit 1
fi