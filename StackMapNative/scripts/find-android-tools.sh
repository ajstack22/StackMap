#!/bin/bash
echo "Searching for Android SDK tools..."

# Common locations
ANDROID_HOME=$HOME/Library/Android/sdk

echo "Checking Android SDK at: $ANDROID_HOME"
echo ""

# Find all Android tools
echo "Finding avdmanager..."
find $ANDROID_HOME -name "avdmanager" -type f 2>/dev/null

echo ""
echo "Finding sdkmanager..."
find $ANDROID_HOME -name "sdkmanager" -type f 2>/dev/null

echo ""
echo "Checking cmdline-tools versions..."
ls -la $ANDROID_HOME/cmdline-tools/ 2>/dev/null

echo ""
echo "Checking if Android Studio has tools..."
find /Applications/Android\ Studio.app -name "avdmanager" -type f 2>/dev/null | head -5

echo ""
echo "Your current PATH:"
echo $PATH | tr ':' '\n' | grep -i android