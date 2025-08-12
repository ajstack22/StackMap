#!/bin/bash

# StackMap Store Screenshot Capture Script
# Captures screenshots for App Store and Google Play Store submissions
# Focuses on the 4 required mobile device categories

echo "📸 StackMap Store Screenshot Capture"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create screenshots directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SCREENSHOT_DIR="screenshots/store_submission_${TIMESTAMP}"
mkdir -p "$SCREENSHOT_DIR"

echo "📁 Screenshots will be saved to: $SCREENSHOT_DIR"
echo ""

# Function to capture iOS screenshots
capture_ios_screenshot() {
    local device_id=$1
    local device_name=$2
    local filename=$3
    local description=$4
    
    echo "  📱 Capturing: $description"
    xcrun simctl io $device_id screenshot "$SCREENSHOT_DIR/${device_name}_${filename}.png" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "    ✅ Saved: ${device_name}_${filename}.png"
    else
        echo "    ❌ Failed to capture screenshot"
    fi
}

# Function to capture Android screenshots
capture_android_screenshot() {
    local device_id=$1
    local device_name=$2
    local filename=$3
    local description=$4
    
    echo "  📱 Capturing: $description"
    adb -s $device_id shell screencap -p /sdcard/screenshot.png
    adb -s $device_id pull /sdcard/screenshot.png "$SCREENSHOT_DIR/${device_name}_${filename}.png" 2>/dev/null
    adb -s $device_id shell rm /sdcard/screenshot.png
    
    if [ $? -eq 0 ]; then
        echo "    ✅ Saved: ${device_name}_${filename}.png"
    else
        echo "    ❌ Failed to capture screenshot"
    fi
}

# Function to wait for user setup
wait_for_setup() {
    echo ""
    echo -e "${YELLOW}📋 Please set up the screen as described, then press Enter to capture...${NC}"
    read -r
}

# iPhone 16 Pro Max Screenshots (6.9" Display)
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📱 iPhone 16 Pro Max (6.9\" Display)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Get iPhone device ID
IPHONE_ID=$(xcrun simctl list devices | grep "iPhone 16 Pro Max" | grep -E "Booted" | head -1 | grep -oE "[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}")

if [ -z "$IPHONE_ID" ]; then
    echo "❌ iPhone 16 Pro Max not found or not booted"
    echo "Please ensure the simulator is running"
else
    echo "Found iPhone 16 Pro Max: $IPHONE_ID"
    echo ""
    
    echo "Screenshot 1: Home Screen - Emma's Day"
    echo "  • Show Emma's 12 activities"
    echo "  • Ensure 3 completed (green checks)"
    echo "  • 2 pinned items visible"
    echo "  • Pink theme active"
    wait_for_setup
    capture_ios_screenshot "$IPHONE_ID" "iPhone16ProMax" "01_home_screen" "Home Screen with Activities"
    
    echo ""
    echo "Screenshot 2: Activity Library"
    echo "  • Open Activity Library modal"
    echo "  • Expand 'Morning Routine' category"
    echo "  • Show multiple categories"
    wait_for_setup
    capture_ios_screenshot "$IPHONE_ID" "iPhone16ProMax" "02_activity_library" "Activity Library"
    
    echo ""
    echo "Screenshot 3: User Management"
    echo "  • Open Users & Security modal"
    echo "  • Show all 3 children (Emma, Liam, Sofia)"
    echo "  • Different colored themes visible"
    wait_for_setup
    capture_ios_screenshot "$IPHONE_ID" "iPhone16ProMax" "03_user_switching" "Multi-User Support"
    
    echo ""
    echo "Screenshot 4: Edit Mode"
    echo "  • Enable edit mode"
    echo "  • Show drag handles and delete buttons"
    echo "  • Optionally show one card mid-drag"
    wait_for_setup
    capture_ios_screenshot "$IPHONE_ID" "iPhone16ProMax" "04_edit_mode" "Edit Mode"
    
    echo ""
    echo "Screenshot 5: Settings"
    echo "  • Open Settings modal"
    echo "  • Show theme colors"
    echo "  • Display options visible"
    wait_for_setup
    capture_ios_screenshot "$IPHONE_ID" "iPhone16ProMax" "05_settings" "Settings & Customization"
fi

# iPad Air Screenshots (11" Display)
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📱 iPad Air 11\" (Tablet Layout)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

IPAD_ID=$(xcrun simctl list devices | grep -E "iPad Air.*11.*inch" | grep -E "Booted" | head -1 | grep -oE "[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}")

if [ -z "$IPAD_ID" ]; then
    echo "❌ iPad Air 11-inch not found or not booted"
    echo "Please ensure the simulator is running"
else
    echo "Found iPad Air: $IPAD_ID"
    echo ""
    
    echo "Screenshot 1: Two-Column Layout"
    echo "  • Portrait orientation"
    echo "  • Show 2-column card layout"
    echo "  • All activities visible"
    wait_for_setup
    capture_ios_screenshot "$IPAD_ID" "iPadAir11" "01_two_column" "Tablet Two-Column Layout"
    
    echo ""
    echo "Screenshot 2: Activity Library Expanded"
    echo "  • Open Activity Library"
    echo "  • Show 'School Activities' expanded"
    echo "  • Multiple categories visible"
    wait_for_setup
    capture_ios_screenshot "$IPAD_ID" "iPadAir11" "02_library_expanded" "Expanded Activity Library"
    
    echo ""
    echo "Screenshot 3: Landscape Three-Column"
    echo "  • Rotate to landscape"
    echo "  • Show 3-column layout"
    echo "  • Maximum visibility mode"
    wait_for_setup
    capture_ios_screenshot "$IPAD_ID" "iPadAir11" "03_landscape" "Landscape Three-Column"
    
    echo ""
    echo "Screenshot 4: Data Management"
    echo "  • Open Data modal"
    echo "  • Show Export/Import options"
    echo "  • Backup features visible"
    wait_for_setup
    capture_ios_screenshot "$IPAD_ID" "iPadAir11" "04_data_management" "Data Management"
fi

# Pixel 9 Screenshots (Android Phone)
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📱 Pixel 9 (Android Phone)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Get Pixel 9 device ID
PIXEL9_ID=$(adb devices | grep -E "emulator-[0-9]+" | head -1 | awk '{print $1}')

if [ -z "$PIXEL9_ID" ]; then
    echo "❌ Pixel 9 emulator not found"
    echo "Please ensure the emulator is running"
else
    echo "Found Pixel 9: $PIXEL9_ID"
    echo ""
    
    echo "Screenshot 1: Liam's Profile"
    echo "  • Switch to Liam (dinosaur 🦖)"
    echo "  • Blue theme"
    echo "  • Show some activities"
    wait_for_setup
    capture_android_screenshot "$PIXEL9_ID" "Pixel9" "01_liam_profile" "Liam's Profile"
    
    echo ""
    echo "Screenshot 2: Therapy Activities"
    echo "  • Open Activity Library"
    echo "  • Show 'Therapy & Support' category"
    echo "  • Speech therapy, OT exercises visible"
    wait_for_setup
    capture_android_screenshot "$PIXEL9_ID" "Pixel9" "02_therapy_activities" "Therapy Activities"
    
    echo ""
    echo "Screenshot 3: Progress View"
    echo "  • Back to Emma's profile"
    echo "  • Show completed activities with checkmarks"
    echo "  • Visual accomplishment feedback"
    wait_for_setup
    capture_android_screenshot "$PIXEL9_ID" "Pixel9" "03_progress_view" "Progress Tracking"
    
    echo ""
    echo "Screenshot 4: Fun Activities"
    echo "  • Open Activity Library"
    echo "  • Show 'Fun Activities' category"
    echo "  • Play games, Draw/Color visible"
    wait_for_setup
    capture_android_screenshot "$PIXEL9_ID" "Pixel9" "04_fun_activities" "Fun Activities"
fi

# Pixel Tablet Screenshots (Android Tablet)
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📱 Pixel Tablet (Android Tablet)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Try to find Pixel Tablet (usually second emulator)
PIXEL_TABLET_ID=$(adb devices | grep -E "emulator-[0-9]+" | sed -n '2p' | awk '{print $1}')

if [ -z "$PIXEL_TABLET_ID" ]; then
    echo "❌ Pixel Tablet emulator not found"
    echo "Please ensure the emulator is running"
else
    echo "Found Pixel Tablet: $PIXEL_TABLET_ID"
    echo ""
    
    echo "Screenshot 1: Three-Column Landscape"
    echo "  • Rotate to landscape if needed"
    echo "  • Show 3-column layout"
    echo "  • Maximum activities visible"
    wait_for_setup
    capture_android_screenshot "$PIXEL_TABLET_ID" "PixelTablet" "01_three_column" "Three-Column Layout"
    
    echo ""
    echo "Screenshot 2: Sofia's Profile"
    echo "  • Switch to Sofia (rainbow 🌈)"
    echo "  • Purple theme"
    echo "  • Different activity set"
    wait_for_setup
    capture_android_screenshot "$PIXEL_TABLET_ID" "PixelTablet" "02_sofia_profile" "Sofia's Profile"
    
    echo ""
    echo "Screenshot 3: Quick Add"
    echo "  • Click + button"
    echo "  • Show custom activity creation"
    echo "  • Emoji picker if possible"
    wait_for_setup
    capture_android_screenshot "$PIXEL_TABLET_ID" "PixelTablet" "03_quick_add" "Quick Add Activity"
    
    echo ""
    echo "Screenshot 4: Portrait Two-Column"
    echo "  • Rotate to portrait"
    echo "  • Show 2-column layout"
    echo "  • Clean tablet view"
    wait_for_setup
    capture_android_screenshot "$PIXEL_TABLET_ID" "PixelTablet" "04_portrait_mode" "Portrait Two-Column"
fi

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}📊 Screenshot Capture Summary${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# Count captured screenshots
SCREENSHOT_COUNT=$(ls -1 "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l)
echo "Total screenshots captured: $SCREENSHOT_COUNT"
echo ""

if [ $SCREENSHOT_COUNT -gt 0 ]; then
    echo "Screenshots saved to: $SCREENSHOT_DIR"
    echo ""
    echo "Store Submission Requirements:"
    echo "  • App Store (iOS): 5 screenshots per device type"
    echo "  • Google Play: 2-8 screenshots per device type"
    echo ""
    echo "Next steps:"
    echo "  1. Review screenshots for quality"
    echo "  2. Ensure no personal data visible"
    echo "  3. Check for proper theme colors"
    echo "  4. Verify all UI elements are visible"
    echo "  5. Upload to respective stores"
fi

echo ""
echo "✅ Screenshot capture complete!"