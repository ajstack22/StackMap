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
    
    # iOS Phone (iPhone 16 Pro Max)
    if xcrun simctl list | grep -q "iPhone 16 Pro Max.*Booted"; then
        xcrun simctl io "iPhone 16 Pro Max" screenshot "$SCREENSHOT_DIR/ios_phone/${screen_name}.png" 2>/dev/null &&
        echo -e "${GREEN}  ✓ iOS Phone (iPhone 16 Pro Max)${NC}" || echo -e "${RED}  ✗ iOS Phone failed${NC}"
    else
        echo -e "${YELLOW}  ⚠ iPhone 16 Pro Max not running${NC}"
    fi
    
    # iOS Tablet (iPad Air 11-inch M3)
    if xcrun simctl list | grep -q "iPad Air 11-inch (M3).*Booted"; then
        xcrun simctl io "iPad Air 11-inch (M3)" screenshot "$SCREENSHOT_DIR/ios_tablet/${screen_name}.png" 2>/dev/null &&
        echo -e "${GREEN}  ✓ iOS Tablet (iPad Air 11-inch)${NC}" || echo -e "${RED}  ✗ iOS Tablet failed${NC}"
    else
        echo -e "${YELLOW}  ⚠ iPad Air 11-inch not running${NC}"
    fi
    
    # Android devices
    ANDROID_DEVICES=($(adb devices | grep emulator | cut -f1))
    
    if [ ${#ANDROID_DEVICES[@]} -ge 1 ]; then
        # Android Phone (Pixel 9 - first emulator)
        adb -s ${ANDROID_DEVICES[0]} shell screencap -p /sdcard/screenshot.png 2>/dev/null &&
        adb -s ${ANDROID_DEVICES[0]} pull /sdcard/screenshot.png "$SCREENSHOT_DIR/android_phone/${screen_name}.png" > /dev/null 2>&1 &&
        echo -e "${GREEN}  ✓ Android Phone (Pixel 9)${NC}" || echo -e "${RED}  ✗ Android Phone failed${NC}"
    else
        echo -e "${YELLOW}  ⚠ Pixel 9 not running${NC}"
    fi
    
    if [ ${#ANDROID_DEVICES[@]} -ge 2 ]; then
        # Android Tablet (Pixel Tablet - second emulator)
        adb -s ${ANDROID_DEVICES[1]} shell screencap -p /sdcard/screenshot.png 2>/dev/null &&
        adb -s ${ANDROID_DEVICES[1]} pull /sdcard/screenshot.png "$SCREENSHOT_DIR/android_tablet/${screen_name}.png" > /dev/null 2>&1 &&
        echo -e "${GREEN}  ✓ Android Tablet (Pixel Tablet)${NC}" || echo -e "${RED}  ✗ Android Tablet failed${NC}"
    else
        echo -e "${YELLOW}  ⚠ Pixel Tablet not running${NC}"
    fi
    
    # Web screenshots (using Brave or Safari)
    if pgrep -x "Brave Browser" > /dev/null; then
        # Web Desktop (Brave)
        screencapture -x -o -l$(osascript -e 'tell app "Brave Browser" to id of window 1') "$SCREENSHOT_DIR/web_desktop/${screen_name}.png" 2>/dev/null &&
        echo -e "${GREEN}  ✓ Web Desktop (Brave)${NC}" || echo -e "${RED}  ✗ Web Desktop failed${NC}"
        
        # Web Mobile - Brave DevTools
        echo -e "${YELLOW}  ⚠ Web Mobile (Open DevTools > Toggle device toolbar > Capture manually)${NC}"
    elif pgrep -x "Safari" > /dev/null; then
        # Web Desktop (Safari)
        screencapture -x -o -l$(osascript -e 'tell app "Safari" to id of window 1') "$SCREENSHOT_DIR/web_desktop/${screen_name}.png" 2>/dev/null &&
        echo -e "${GREEN}  ✓ Web Desktop (Safari)${NC}" || echo -e "${RED}  ✗ Web Desktop failed${NC}"
        
        # Web Mobile - Safari Responsive Design Mode
        echo -e "${YELLOW}  ⚠ Web Mobile (Develop > Enter Responsive Design Mode > Capture manually)${NC}"
    else
        echo -e "${YELLOW}  ⚠ No browser running (Brave or Safari)${NC}"
    fi
    
    echo -e "${GREEN}✅ Captured: $screen_name${NC}\n"
}

# Function to show device status
show_status() {
    echo -e "${YELLOW}📱 Device Status:${NC}"
    
    # iOS Status
    echo -e "${BLUE}iOS Devices:${NC}"
    xcrun simctl list devices | grep -E "(iPhone 16 Pro Max|iPad Air 11-inch)" | grep -E "(Booted|Shutdown)"
    
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