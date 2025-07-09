#!/bin/bash

# Script to build and install debug APK on connected device

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}StackMap Android Debug Install${NC}"
echo "================================"

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo -e "${RED}Error: adb not found. Please install Android SDK Platform Tools.${NC}"
    exit 1
fi

# Check for connected devices
echo -e "\n${YELLOW}Checking for connected devices...${NC}"
devices=$(adb devices | grep -v "List of devices" | grep -v "^$" | wc -l)

if [ $devices -eq 0 ]; then
    echo -e "${RED}Error: No devices connected${NC}"
    echo "Please connect a device and enable USB debugging"
    exit 1
fi

echo -e "${GREEN}Found $devices device(s)${NC}"
adb devices

# Build debug APK
echo -e "\n${YELLOW}Building debug APK...${NC}"
./build-debug.sh

# Install on all connected devices
echo -e "\n${YELLOW}Installing on connected device(s)...${NC}"
adb install -r stackmap-debug.apk

# Launch the app
echo -e "\n${YELLOW}Launching StackMap...${NC}"
adb shell monkey -p com.stackmap.app.debug -c android.intent.category.LAUNCHER 1

echo -e "\n${GREEN}Installation complete!${NC}"