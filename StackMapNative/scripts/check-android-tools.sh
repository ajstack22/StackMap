#!/bin/bash
echo "Checking Android build tools..."

ANDROID_HOME=$HOME/Library/Android/sdk

echo "Looking for NDK..."
find $ANDROID_HOME -name "ndk" -type d 2>/dev/null | grep -v "\.d"

echo -e "\nLooking for CMake..."
find $ANDROID_HOME -name "cmake" -type d 2>/dev/null | grep -v "\.d"

echo -e "\nChecking local.properties..."
cat android/local.properties 2>/dev/null || echo "No local.properties found"

echo -e "\nNDK versions installed:"
ls -la $ANDROID_HOME/ndk/ 2>/dev/null || echo "No NDK directory found"

echo -e "\nCMake versions installed:"
ls -la $ANDROID_HOME/cmake/ 2>/dev/null || echo "No CMake directory found"