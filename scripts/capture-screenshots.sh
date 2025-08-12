#!/bin/bash

# StackMap Multi-Device Screenshot Capture System
# Captures screenshots from all 6 configurations simultaneously

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCREENSHOT_DIR="./screenshots/$TIMESTAMP"
mkdir -p "$SCREENSHOT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create subdirectories for each platform
mkdir -p "$SCREENSHOT_DIR"/{ios_phone,ios_tablet,android_phone,android_tablet,web_desktop,web_mobile}

# Function to capture from all devices
capture_all() {
    local screen_name=$1
    echo -e "${BLUE}📸 Capturing: $screen_name${NC}"
    
    # iOS Phone
    if xcrun simctl list | grep -q "iPhone 16 Pro Max.*Booted"; then
        xcrun simctl io "iPhone 16 Pro Max" screenshot "$SCREENSHOT_DIR/ios_phone/${screen_name}.png" 2>/dev/null &&
        echo -e "${GREEN}  ✓ iOS Phone${NC}" || echo -e "${RED}  ✗ iOS Phone failed${NC}"
    else
        echo -e "${YELLOW}  ⚠ iOS Phone not running${NC}"
    fi
    
    # iOS Tablet
    if xcrun simctl list | grep -q "iPad Pro.*Booted"; then
        xcrun simctl io "iPad Pro (12.9-inch) (6th generation)" screenshot "$SCREENSHOT_DIR/ios_tablet/${screen_name}.png" 2>/dev/null &&
        echo -e "${GREEN}  ✓ iOS Tablet${NC}" || echo -e "${RED}  ✗ iOS Tablet failed${NC}"
    else
        echo -e "${YELLOW}  ⚠ iOS Tablet not running${NC}"
    fi
    
    # Android devices
    ANDROID_DEVICES=($(adb devices | grep emulator | cut -f1))
    
    if [ ${#ANDROID_DEVICES[@]} -ge 1 ]; then
        # Android Phone (first emulator)
        adb -s ${ANDROID_DEVICES[0]} shell screencap -p /sdcard/screenshot.png 2>/dev/null &&
        adb -s ${ANDROID_DEVICES[0]} pull /sdcard/screenshot.png "$SCREENSHOT_DIR/android_phone/${screen_name}.png" > /dev/null 2>&1 &&
        echo -e "${GREEN}  ✓ Android Phone${NC}" || echo -e "${RED}  ✗ Android Phone failed${NC}"
    else
        echo -e "${YELLOW}  ⚠ Android Phone not running${NC}"
    fi
    
    if [ ${#ANDROID_DEVICES[@]} -ge 2 ]; then
        # Android Tablet (second emulator)
        adb -s ${ANDROID_DEVICES[1]} shell screencap -p /sdcard/screenshot.png 2>/dev/null &&
        adb -s ${ANDROID_DEVICES[1]} pull /sdcard/screenshot.png "$SCREENSHOT_DIR/android_tablet/${screen_name}.png" > /dev/null 2>&1 &&
        echo -e "${GREEN}  ✓ Android Tablet${NC}" || echo -e "${RED}  ✗ Android Tablet failed${NC}"
    else
        echo -e "${YELLOW}  ⚠ Android Tablet not running${NC}"
    fi
    
    # Web screenshots (using Chrome)
    if pgrep -x "Google Chrome" > /dev/null; then
        # Web Desktop
        osascript -e 'tell application "Google Chrome" to tell active tab of window 1 to capture screenshot' \
                  -e "do shell script \"screencapture -x '$SCREENSHOT_DIR/web_desktop/${screen_name}.png'\"" 2>/dev/null &&
        echo -e "${GREEN}  ✓ Web Desktop${NC}" || echo -e "${RED}  ✗ Web Desktop failed${NC}"
        
        # Note: Web mobile would need Chrome DevTools or Puppeteer
        echo -e "${YELLOW}  ⚠ Web Mobile (manual capture needed)${NC}"
    else
        echo -e "${YELLOW}  ⚠ Chrome not running${NC}"
    fi
    
    echo -e "${GREEN}✅ Captured: $screen_name${NC}\n"
}

# Function to show device status
show_status() {
    echo -e "${YELLOW}📱 Device Status:${NC}"
    
    # iOS Status
    echo -e "${BLUE}iOS Devices:${NC}"
    xcrun simctl list devices | grep -E "(iPhone 16 Pro Max|iPad Pro)" | grep -E "(Booted|Shutdown)"
    
    # Android Status
    echo -e "${BLUE}Android Devices:${NC}"
    adb devices
    
    echo ""
}

# Main menu
show_menu() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}StackMap Screenshot Capture System${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo "Commands:"
    echo "  [screen_name] - Capture screenshots with this name"
    echo "  status       - Show device status"
    echo "  list         - List captured screenshots"
    echo "  open         - Open screenshot folder"
    echo "  help         - Show this menu"
    echo "  quit         - Exit"
    echo ""
}

# Predefined screenshot sequence for common testing flow
run_sequence() {
    echo -e "${YELLOW}🎬 Running standard screenshot sequence...${NC}"
    
    # Array of screen names and wait times
    screens=(
        "01_welcome:3"
        "02_user_creation:2"
        "03_pin_setup:2"
        "04_theme_selection:2"
        "05_empty_state:2"
        "06_single_activity:2"
        "07_multiple_activities:2"
        "08_completed_state:2"
        "09_edit_mode:2"
        "10_add_activity:2"
        "11_library_view:2"
        "12_search_active:2"
        "13_category_expanded:2"
        "14_plan_view:2"
        "15_complete_view:2"
        "16_users_list:2"
        "17_pin_change:2"
        "18_sync_setup:2"
        "19_data_export:2"
        "20_sync_active:2"
    )
    
    for screen_data in "${screens[@]}"; do
        IFS=':' read -r screen_name wait_time <<< "$screen_data"
        echo -e "${YELLOW}Ready for: $screen_name${NC}"
        echo "Navigate to this screen on all devices, then press Enter..."
        read -r
        capture_all "$screen_name"
        sleep "$wait_time"
    done
    
    echo -e "${GREEN}✅ Sequence complete!${NC}"
}

# Initialize
clear
show_menu
show_status

echo -e "${GREEN}🎬 Screenshot system ready!${NC}"
echo "Type command or screen name and press Enter:"
echo ""

# Main loop
while true; do
    printf "> "
    read -r input
    
    case "$input" in
        quit|exit)
            echo -e "${YELLOW}👋 Exiting...${NC}"
            break
            ;;
        status)
            show_status
            ;;
        help)
            show_menu
            ;;
        list)
            echo -e "${BLUE}📁 Captured screenshots:${NC}"
            find "$SCREENSHOT_DIR" -name "*.png" -type f | sort
            echo ""
            ;;
        open)
            open "$SCREENSHOT_DIR"
            echo -e "${GREEN}📂 Opened screenshot folder${NC}"
            ;;
        sequence)
            run_sequence
            ;;
        "")
            # Empty input, do nothing
            ;;
        *)
            # Assume it's a screen name
            capture_all "$input"
            ;;
    esac
done

# Final summary
echo ""
echo -e "${GREEN}📊 Session Summary:${NC}"
echo "📁 Screenshots saved to: $SCREENSHOT_DIR"
echo "📷 Total screenshots: $(find "$SCREENSHOT_DIR" -name "*.png" -type f | wc -l)"
echo ""
echo "App Store Preparation:"
echo "  - iOS Phone: $SCREENSHOT_DIR/ios_phone/"
echo "  - iOS Tablet: $SCREENSHOT_DIR/ios_tablet/"
echo "  - Android Phone: $SCREENSHOT_DIR/android_phone/"
echo "  - Android Tablet: $SCREENSHOT_DIR/android_tablet/"