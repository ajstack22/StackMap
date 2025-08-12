#!/bin/bash

echo "🚀 Launching all test devices for StackMap testing..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# iOS Devices
echo -e "${YELLOW}📱 Starting iOS devices...${NC}"

# iPhone
echo "Starting iPhone 16 Pro Max..."
xcrun simctl boot "iPhone 16 Pro Max" 2>/dev/null || echo "iPhone already booted"

# iPad
echo "Starting iPad Pro..."
xcrun simctl boot "iPad Pro (12.9-inch) (6th generation)" 2>/dev/null || echo "iPad already booted"

# Open Simulator app
open -a Simulator

# Android Devices
echo -e "${YELLOW}🤖 Starting Android devices...${NC}"

# Check if emulators exist
if emulator -list-avds | grep -q "Pixel_8_Pro"; then
    echo "Starting Pixel 8 Pro..."
    emulator -avd Pixel_8_Pro_API_34 > /dev/null 2>&1 &
else
    echo -e "${RED}Warning: Pixel_8_Pro_API_34 not found${NC}"
fi

if emulator -list-avds | grep -q "Pixel_Tablet"; then
    echo "Starting Pixel Tablet..."
    emulator -avd Pixel_Tablet_API_34 > /dev/null 2>&1 &
else
    echo -e "${RED}Warning: Pixel_Tablet_API_34 not found${NC}"
fi

# Wait for devices to boot
echo -e "${YELLOW}⏳ Waiting for devices to boot...${NC}"
sleep 15

# Install apps
echo -e "${YELLOW}📦 Installing apps on devices...${NC}"

# iOS installations
echo "Installing on iPhone..."
npx react-native run-ios --simulator="iPhone 16 Pro Max" --no-packager > /dev/null 2>&1 &

echo "Installing on iPad..."
npx react-native run-ios --simulator="iPad Pro (12.9-inch) (6th generation)" --no-packager > /dev/null 2>&1 &

# Android installation (will install on all running emulators)
echo "Installing on Android devices..."
npx react-native run-android --no-packager > /dev/null 2>&1 &

# Wait for installations
wait

echo -e "${GREEN}✅ All devices ready for testing!${NC}"
echo ""
echo "Next steps:"
echo "1. Start Metro bundler: npx react-native start"
echo "2. Start web server: npm run web"
echo "3. Run screenshot capture: ./scripts/capture-screenshots.sh"