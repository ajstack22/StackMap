#!/bin/bash

# Quick device verification and app update script
# Ensures all devices are running the latest version with swipe-to-dismiss fix

echo "🔍 StackMap Device Verification"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check current version
echo "📦 Current StackMap Version:"
grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/  Version: \1/'
echo ""

# iOS Devices
echo "📱 iOS Simulators:"
if xcrun simctl list | grep -q "iPhone 16 Pro Max.*Booted"; then
    echo -e "${GREEN}✅ iPhone 16 Pro Max - Running${NC}"
    # Get app version if installed
    APP_PATH=$(xcrun simctl get_app_container "iPhone 16 Pro Max" app.stackmap.StackMapNative 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "   App installed at: $APP_PATH"
    else
        echo -e "${YELLOW}   App not installed - will install${NC}"
    fi
else
    echo -e "${RED}❌ iPhone 16 Pro Max - Not running${NC}"
    echo "   Run: xcrun simctl boot 'iPhone 16 Pro Max'"
fi

if xcrun simctl list | grep -q "iPad Air 11-inch (M3).*Booted"; then
    echo -e "${GREEN}✅ iPad Air 11-inch (M3) - Running${NC}"
    APP_PATH=$(xcrun simctl get_app_container "iPad Air 11-inch (M3)" app.stackmap.StackMapNative 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "   App installed at: $APP_PATH"
    else
        echo -e "${YELLOW}   App not installed - will install${NC}"
    fi
else
    echo -e "${RED}❌ iPad Air 11-inch (M3) - Not running${NC}"
    echo "   Run: xcrun simctl boot 'iPad Air 11-inch (M3)'"
fi
echo ""

# Android Devices
echo "🤖 Android Emulators:"
DEVICES=($(adb devices | grep -v "List" | cut -f1))
if [ ${#DEVICES[@]} -eq 0 ]; then
    echo -e "${RED}❌ No Android devices connected${NC}"
    echo "   Start your Pixel 9 and Pixel Tablet emulators"
elif [ ${#DEVICES[@]} -eq 1 ]; then
    echo -e "${YELLOW}⚠️  Only 1 Android device connected: ${DEVICES[0]}${NC}"
    echo "   Start your second emulator (Pixel 9 or Pixel Tablet)"
elif [ ${#DEVICES[@]} -ge 2 ]; then
    echo -e "${GREEN}✅ Pixel 9 - Connected as ${DEVICES[0]}${NC}"
    echo -e "${GREEN}✅ Pixel Tablet - Connected as ${DEVICES[1]}${NC}"
fi
echo ""

# Web Status
echo "🌐 Web Browser:"
if pgrep -x "Brave Browser" > /dev/null; then
    echo -e "${GREEN}✅ Brave Browser - Running${NC}"
    echo "   Open http://localhost:3000 for desktop view"
    echo "   Use DevTools (Cmd+Opt+I) > Toggle device toolbar for mobile view"
elif pgrep -x "Safari" > /dev/null; then
    echo -e "${GREEN}✅ Safari - Running${NC}"
    echo "   Open http://localhost:3000 for desktop view"
    echo "   Use Develop > Enter Responsive Design Mode for mobile view"
else
    echo -e "${YELLOW}⚠️  No supported browser running${NC}"
    echo "   Open Brave or Safari"
fi
echo ""

# Check if Metro is running
echo "🚇 Metro Bundler:"
if lsof -i:8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Metro running on port 8081${NC}"
else
    echo -e "${YELLOW}⚠️  Metro not running${NC}"
    echo "   Run: npx react-native start"
fi
echo ""

# Check if web server is running
echo "🌐 Web Server:"
if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Web server running on port 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Web server not running${NC}"
    echo "   Run: npm run web"
fi
echo ""

# Update prompt
echo "================================"
echo ""
read -p "Do you want to update/install StackMap on all devices? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📲 Updating all devices..."
    
    # iOS
    echo "  Updating iPhone 16 Pro Max..."
    npx react-native run-ios --simulator="iPhone 16 Pro Max" --no-packager &
    
    echo "  Updating iPad Air 11-inch..."
    npx react-native run-ios --simulator="iPad Air 11-inch (M3)" --no-packager &
    
    # Android (will install on all connected)
    echo "  Updating Android devices..."
    npx react-native run-android --no-packager &
    
    wait
    echo ""
    echo -e "${GREEN}✅ All devices updated!${NC}"
else
    echo "Skipping updates."
fi

echo ""
echo "================================"
echo "Ready to test? Run: ./scripts/capture-screenshots.sh"