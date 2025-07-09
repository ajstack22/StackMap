#!/bin/bash

echo "🔐 Signing APK for Google Play..."

# Check if keystore exists
if [ ! -f "app/stackmap-release.keystore" ]; then
    echo "📝 Creating keystore..."
    echo "Please enter the following information for your keystore:"
    
    keytool -genkey -v -keystore app/stackmap-release.keystore \
        -alias stackmap -keyalg RSA -keysize 2048 -validity 10000
    
    echo "⚠️  IMPORTANT: Save your keystore password somewhere safe!"
    echo "You'll need it for all future releases."
fi

# Add signing config to build.gradle if not already present
if ! grep -q "signingConfigs" app/build.gradle; then
    echo "📝 Adding signing configuration to build.gradle..."
    echo "Please add the following to android/app/build.gradle manually:"
    echo ""
    echo "android {"
    echo "    signingConfigs {"
    echo "        release {"
    echo "            storeFile file('stackmap-release.keystore')"
    echo "            storePassword 'YOUR_PASSWORD'"
    echo "            keyAlias 'stackmap'"
    echo "            keyPassword 'YOUR_PASSWORD'"
    echo "        }"
    echo "    }"
    echo "    buildTypes {"
    echo "        release {"
    echo "            signingConfig signingConfigs.release"
    echo "            // ... other settings"
    echo "        }"
    echo "    }"
    echo "}"
    echo ""
    echo "Then run: ./build-android-release.sh"
else
    echo "✅ Signing config already present"
fi