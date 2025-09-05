#!/bin/bash

# StackMap Quick Screenshot Commands
# Shows available devices and commands to capture screenshots

echo "📸 StackMap Quick Screenshot Helper"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create screenshots directory
mkdir -p screenshots

echo -e "${BLUE}📱 iOS Simulators (Running):${NC}"
echo "----------------------------"
xcrun simctl list devices | grep "Booted" | while IFS= read -r line; do
    DEVICE_NAME=$(echo "$line" | sed 's/ (.*//g' | xargs)
    DEVICE_ID=$(echo "$line" | grep -oE "[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}")
    if [ ! -z "$DEVICE_ID" ]; then
        echo -e "${GREEN}$DEVICE_NAME${NC}"
        echo "  xcrun simctl io $DEVICE_ID screenshot screenshots/${DEVICE_NAME// /_}.png"
        echo ""
    fi
done

echo -e "${BLUE}🤖 Android Emulators (Running):${NC}"
echo "-------------------------------"
adb devices 2>/dev/null | grep -E "emulator-[0-9]+" | while IFS= read -r line; do
    DEVICE_ID=$(echo "$line" | awk '{print $1}')
    DEVICE_MODEL=$(adb -s "$DEVICE_ID" shell getprop ro.product.model 2>/dev/null | tr -d '\r' | tr ' ' '_')
    if [ -z "$DEVICE_MODEL" ]; then
        DEVICE_MODEL="Android_Device"
    fi
    echo -e "${GREEN}$DEVICE_MODEL ($DEVICE_ID)${NC}"
    echo "  adb -s $DEVICE_ID shell screencap -p /sdcard/screenshot.png && adb -s $DEVICE_ID pull /sdcard/screenshot.png screenshots/${DEVICE_MODEL}.png"
    echo ""
done

echo -e "${YELLOW}📋 How to use:${NC}"
echo "1. Copy any command above"
echo "2. Paste it in terminal"
echo "3. Screenshot will be saved to screenshots/ folder"
echo ""
echo "💡 Tip: Add a timestamp to filename:"
echo "   screenshots/MyScreenshot_\$(date +%Y%m%d_%H%M%S).png"
echo ""