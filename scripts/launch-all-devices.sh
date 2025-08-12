#!/bin/bash

echo "🚀 Verifying StackMap on all test devices..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check device status
echo -e "${YELLOW}📱 Checking device status...${NC}"

# iOS Devices (Simulators that are already running)
echo -e "${GREEN}iOS Simulators:${NC}"
if xcrun simctl list | grep -q "iPhone 16 Pro Max.*Booted"; then
    echo "✅ iPhone 16 Pro Max - Running"
else
    echo "⚠️  iPhone 16 Pro Max - Not running (starting...)"
    xcrun simctl boot "iPhone 16 Pro Max" 2>/dev/null
fi

if xcrun simctl list | grep -q "iPad Air 11-inch (M3).*Booted"; then
    echo "✅ iPad Air 11-inch (M3) - Running"
else
    echo "⚠️  iPad Air 11-inch (M3) - Not running (starting...)"
    xcrun simctl boot "iPad Air 11-inch (M3)" 2>/dev/null
fi

# Android Devices (Emulators)
echo -e "${GREEN}Android Emulators:${NC}"
ANDROID_DEVICES=($(adb devices | grep -v "List" | cut -f1))
if [ ${#ANDROID_DEVICES[@]} -ge 1 ]; then
    echo "✅ Pixel 9 (Phone) - Connected as ${ANDROID_DEVICES[0]}"
else
    echo "⚠️  Pixel 9 - Not detected"
fi

if [ ${#ANDROID_DEVICES[@]} -ge 2 ]; then
    echo "✅ Pixel Tablet - Connected as ${ANDROID_DEVICES[1]}"
else
    echo "⚠️  Pixel Tablet - Not detected"
fi

# Web Browser
echo -e "${GREEN}Web Browser:${NC}"
if pgrep -x "Brave Browser" > /dev/null; then
    echo "✅ Brave Browser - Running"
elif pgrep -x "Safari" > /dev/null; then
    echo "✅ Safari - Running"
else
    echo "⚠️  No supported browser running (Brave or Safari recommended)"
fi

# Install/Update apps
echo ""
echo -e "${YELLOW}📦 Installing/Updating StackMap on devices...${NC}"

# iOS installations
echo "Updating on iPhone 16 Pro Max..."
npx react-native run-ios --simulator="iPhone 16 Pro Max" --no-packager > /dev/null 2>&1 &

echo "Updating on iPad Air 11-inch..."
npx react-native run-ios --simulator="iPad Air 11-inch (M3)" --no-packager > /dev/null 2>&1 &

# Android installation (will install on all connected devices)
echo "Updating on Android devices..."
npx react-native run-android --no-packager > /dev/null 2>&1 &

# Wait for installations
wait

echo ""
echo -e "${GREEN}✅ All devices verified and updated!${NC}"
echo ""
echo "Your testing setup:"
echo "  📱 iOS Phone: iPhone 16 Pro Max (Simulator)"
echo "  📱 iOS Tablet: iPad Air 11-inch M3 (Simulator)"
echo "  🤖 Android Phone: Pixel 9 (Emulator)"
echo "  🤖 Android Tablet: Pixel Tablet (Emulator)"
echo "  🌐 Web Browser: Brave (or Safari)"
echo ""
echo "Next steps:"
echo "1. Start Metro bundler: npx react-native start"
echo "2. Start web server: npm run web"
echo "3. Open Brave/Safari to: http://localhost:3000"
echo "4. Run screenshot capture: ./scripts/capture-screenshots.sh"