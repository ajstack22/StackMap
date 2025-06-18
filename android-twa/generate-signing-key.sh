#!/bin/bash

echo "Generate signing key for StackMap TWA"
echo "======================================="
echo ""
echo "This will create a keystore for signing your app."
echo "Keep this file safe - you'll need it for all future updates!"
echo ""

read -p "Enter keystore filename (default: stackmap-release.keystore): " KEYSTORE_NAME
KEYSTORE_NAME=${KEYSTORE_NAME:-stackmap-release.keystore}

read -p "Enter key alias (default: stackmap): " KEY_ALIAS
KEY_ALIAS=${KEY_ALIAS:-stackmap}

echo ""
echo "Generating keystore..."

keytool -genkey -v -keystore "$KEYSTORE_NAME" -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000

if [ $? -eq 0 ]; then
    echo ""
    echo "Keystore created successfully!"
    echo ""
    echo "Getting SHA256 fingerprint for Digital Asset Links..."
    keytool -list -v -keystore "$KEYSTORE_NAME" -alias "$KEY_ALIAS" | grep SHA256
    echo ""
    echo "IMPORTANT:"
    echo "1. Keep $KEYSTORE_NAME in a safe place"
    echo "2. Add the SHA256 fingerprint to .well-known/assetlinks.json"
    echo "3. Never commit the keystore to version control"
    echo ""
    echo "To sign your release build:"
    echo "./gradlew bundleRelease"
    echo "jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore $KEYSTORE_NAME app/build/outputs/bundle/release/app-release.aab $KEY_ALIAS"
else
    echo "Failed to create keystore!"
    exit 1
fi