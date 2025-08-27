#!/bin/bash

# Fix Metro connection issues on Android devices

echo "🔧 Fixing Metro connection for Android devices..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get all connected devices
DEVICES=($(adb devices | grep -v "List" | cut -f1))

if [ ${#DEVICES[@]} -eq 0 ]; then
    echo "❌ No Android devices connected"
    exit 1
fi

echo "Found ${#DEVICES[@]} device(s)"
echo ""

# Fix port forwarding for each device
for device in "${DEVICES[@]}"; do
    echo "📱 Fixing $device..."
    
    # Clear existing reverse
    adb -s $device reverse --remove-all 2>/dev/null
    
    # Set up port forwarding for Metro
    adb -s $device reverse tcp:8081 tcp:8081
    echo "  ✅ Metro port forwarded (8081)"
    
    # Set up port forwarding for React DevTools
    adb -s $device reverse tcp:8097 tcp:8097
    echo "  ✅ DevTools port forwarded (8097)"
    
    # Optional: Reload the app
    echo -n "  Reload app on $device? (y/n) "
    read -n 1 reload
    echo ""
    if [[ $reload =~ ^[Yy]$ ]]; then
        adb -s $device shell input keyevent 82  # Open dev menu
        sleep 1
        adb -s $device shell input text "RR"    # Double R to reload
        echo "  ✅ App reloaded"
    fi
    echo ""
done

echo -e "${GREEN}✅ Metro connections fixed!${NC}"
echo ""
echo "If still having issues:"
echo "1. Make sure Metro is running: npx react-native start"
echo "2. Try shaking device or Cmd+M to open dev menu"
echo "3. Select 'Reload' from dev menu"