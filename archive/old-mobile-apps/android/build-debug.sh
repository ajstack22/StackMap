#!/bin/bash

# Script to build debug APK for StackMap Android app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}StackMap Android Debug Build${NC}"
echo "=============================="

# Check if we're in the android directory
if [ ! -f "build.gradle" ] || [ ! -d "app" ]; then
    echo -e "${RED}Error: This script must be run from the android directory${NC}"
    exit 1
fi

# Sync Capacitor
echo -e "\n${YELLOW}Syncing Capacitor...${NC}"
cd .. && npx cap sync android && cd android

# Clean previous builds
echo -e "\n${YELLOW}Cleaning previous builds...${NC}"
./gradlew clean

# Build debug APK
echo -e "\n${YELLOW}Building debug APK...${NC}"
./gradlew assembleDebug

# Check if build was successful
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo -e "\n${GREEN}Build successful!${NC}"
    echo -e "Debug APK location: ${GREEN}app/build/outputs/apk/debug/app-debug.apk${NC}"
    
    # Get APK size
    size=$(ls -lh app/build/outputs/apk/debug/app-debug.apk | awk '{print $5}')
    echo -e "APK size: ${YELLOW}$size${NC}"
    
    # Copy to convenient location
    cp app/build/outputs/apk/debug/app-debug.apk stackmap-debug.apk
    echo -e "\nCopied to: ${GREEN}stackmap-debug.apk${NC}"
else
    echo -e "\n${RED}Error: Build failed!${NC}"
    exit 1
fi