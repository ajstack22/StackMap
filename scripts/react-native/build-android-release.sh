#!/bin/bash

echo "🏗️  Building Android Release APK..."

# Set environment to production for console.log stripping
export NODE_ENV=production
echo "Building in production mode (NODE_ENV=$NODE_ENV)"

# Find and use Java 17
if [[ -x "/opt/homebrew/opt/openjdk@17/bin/java" ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
elif [[ -x "/usr/local/opt/openjdk@17/bin/java" ]]; then
    export JAVA_HOME="/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
else
    # Try to find Java 17 using java_home
    export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || echo "")
    if [[ -z "$JAVA_HOME" ]]; then
        echo "❌ Error: Java 17 is required but not found"
        echo "Please install Java 17: brew install openjdk@17"
        exit 1
    fi
fi

echo "Using Java from: $JAVA_HOME"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean

# Build release APK
echo "📦 Building release APK..."
./gradlew assembleRelease

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📱 APK location:"
    echo "   android/app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo "📝 Next steps for distribution:"
    echo "1. Upload to Google Play Console for internal testing"
    echo "2. Share APK directly via:"
    echo "   - Email"
    echo "   - Google Drive"
    echo "   - Firebase App Distribution"
    echo "   - Dropbox"
    echo ""
    echo "🔐 Note: This APK is unsigned. For production:"
    echo "   - Create a keystore: keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000"
    echo "   - Configure signing in android/app/build.gradle"
else
    echo "❌ Build failed!"
    exit 1
fi