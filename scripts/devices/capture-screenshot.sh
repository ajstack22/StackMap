#!/bin/bash

# StackMap Individual Screenshot Capture Script
# Captures a screenshot from any running iOS simulator or Android emulator

echo "📸 StackMap Screenshot Capture"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create screenshots directory if it doesn't exist
SCREENSHOT_BASE_DIR="screenshots"
mkdir -p "$SCREENSHOT_BASE_DIR"

# Function to list iOS simulators
list_ios_devices() {
    echo -e "${BLUE}iOS Simulators (Booted):${NC}"
    xcrun simctl list devices | grep "Booted" | nl -s ') ' | sed 's/^[[:space:]]*//'
}

# Function to list Android emulators
list_android_devices() {
    echo -e "${BLUE}Android Emulators:${NC}"
    adb devices | grep -E "emulator-[0-9]+" | nl -s ') ' | awk '{print $1" "$2}'
}

# Function to capture iOS screenshot
capture_ios_screenshot() {
    local device_id=$1
    local filename=$2
    
    echo -e "${YELLOW}Capturing iOS screenshot...${NC}"
    xcrun simctl io "$device_id" screenshot "$filename"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Screenshot saved to: $filename${NC}"
        # Open in Preview on macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "$filename"
        fi
    else
        echo -e "${RED}❌ Failed to capture screenshot${NC}"
        return 1
    fi
}

# Function to capture Android screenshot
capture_android_screenshot() {
    local device_id=$1
    local filename=$2
    
    echo -e "${YELLOW}Capturing Android screenshot...${NC}"
    adb -s "$device_id" shell screencap -p /sdcard/screenshot.png
    adb -s "$device_id" pull /sdcard/screenshot.png "$filename" 2>/dev/null
    adb -s "$device_id" shell rm /sdcard/screenshot.png
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Screenshot saved to: $filename${NC}"
        # Open in Preview on macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "$filename"
        fi
    else
        echo -e "${RED}❌ Failed to capture screenshot${NC}"
        return 1
    fi
}

# Main script logic
echo "Select device type:"
echo "1) iOS Simulator"
echo "2) Android Emulator"
echo ""
read -p "Enter choice (1 or 2): " device_type

echo ""

case $device_type in
    1)
        # iOS Simulator
        echo "Available iOS Simulators:"
        echo "------------------------"
        
        # Get list of booted simulators
        SIMULATORS=$(xcrun simctl list devices | grep "Booted")
        
        if [ -z "$SIMULATORS" ]; then
            echo -e "${RED}No iOS simulators are currently running${NC}"
            echo "Please boot a simulator first using Xcode or 'xcrun simctl boot <device_id>'"
            exit 1
        fi
        
        # Store simulators in array
        IFS=$'\n'
        SIM_ARRAY=($SIMULATORS)
        unset IFS
        
        # Display numbered list
        for i in "${!SIM_ARRAY[@]}"; do
            echo "$((i+1))) ${SIM_ARRAY[$i]}"
        done
        
        echo ""
        read -p "Select simulator number: " sim_num
        
        # Validate selection
        if [[ $sim_num -lt 1 || $sim_num -gt ${#SIM_ARRAY[@]} ]]; then
            echo -e "${RED}Invalid selection${NC}"
            exit 1
        fi
        
        # Extract device ID
        SELECTED_SIM="${SIM_ARRAY[$((sim_num-1))]}"
        DEVICE_ID=$(echo "$SELECTED_SIM" | grep -oE "[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}")
        DEVICE_NAME=$(echo "$SELECTED_SIM" | sed 's/.*(//' | sed 's/).*//' | tr ' ' '_')
        
        # Generate filename with timestamp
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        FILENAME="$SCREENSHOT_BASE_DIR/iOS_${DEVICE_NAME}_${TIMESTAMP}.png"
        
        # Custom filename option
        echo ""
        echo "Default filename: $FILENAME"
        read -p "Enter custom filename (or press Enter to use default): " custom_name
        
        if [ ! -z "$custom_name" ]; then
            # Add .png extension if not present
            if [[ "$custom_name" != *.png ]]; then
                custom_name="${custom_name}.png"
            fi
            # Add screenshots directory if not specified
            if [[ "$custom_name" != */* ]]; then
                custom_name="$SCREENSHOT_BASE_DIR/$custom_name"
            fi
            FILENAME="$custom_name"
        fi
        
        # Capture screenshot
        capture_ios_screenshot "$DEVICE_ID" "$FILENAME"
        
        # Loop for multiple screenshots
        while true; do
            echo ""
            read -p "Take another screenshot from the same device? (y/n): " another
            if [[ "$another" != "y" && "$another" != "Y" ]]; then
                break
            fi
            
            echo ""
            echo "Setting up next screenshot..."
            echo "Current device: $DEVICE_NAME"
            
            # Generate new default filename
            TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
            NEW_FILENAME="$SCREENSHOT_BASE_DIR/iOS_${DEVICE_NAME}_${TIMESTAMP}.png"
            
            echo "Default filename: $NEW_FILENAME"
            read -p "Enter custom filename (or press Enter to use default): " custom_name
            
            if [ ! -z "$custom_name" ]; then
                # Add .png extension if not present
                if [[ "$custom_name" != *.png ]]; then
                    custom_name="${custom_name}.png"
                fi
                # Add screenshots directory if not specified
                if [[ "$custom_name" != */* ]]; then
                    custom_name="$SCREENSHOT_BASE_DIR/$custom_name"
                fi
                NEW_FILENAME="$custom_name"
            fi
            
            # Capture screenshot
            capture_ios_screenshot "$DEVICE_ID" "$NEW_FILENAME"
        done
        ;;
        
    2)
        # Android Emulator
        echo "Available Android Emulators:"
        echo "---------------------------"
        
        # Get list of connected emulators
        EMULATORS=$(adb devices | grep -E "emulator-[0-9]+")
        
        if [ -z "$EMULATORS" ]; then
            echo -e "${RED}No Android emulators are currently running${NC}"
            echo "Please start an emulator first using Android Studio or emulator command"
            exit 1
        fi
        
        # Store emulators in array
        IFS=$'\n'
        EMU_ARRAY=($EMULATORS)
        unset IFS
        
        # Display numbered list
        for i in "${!EMU_ARRAY[@]}"; do
            echo "$((i+1))) ${EMU_ARRAY[$i]}"
        done
        
        echo ""
        read -p "Select emulator number: " emu_num
        
        # Validate selection
        if [[ $emu_num -lt 1 || $emu_num -gt ${#EMU_ARRAY[@]} ]]; then
            echo -e "${RED}Invalid selection${NC}"
            exit 1
        fi
        
        # Extract device ID
        SELECTED_EMU="${EMU_ARRAY[$((emu_num-1))]}"
        DEVICE_ID=$(echo "$SELECTED_EMU" | awk '{print $1}')
        
        # Try to get device model name
        DEVICE_MODEL=$(adb -s "$DEVICE_ID" shell getprop ro.product.model 2>/dev/null | tr -d '\r' | tr ' ' '_')
        if [ -z "$DEVICE_MODEL" ]; then
            DEVICE_MODEL="Android"
        fi
        
        # Generate filename with timestamp
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        FILENAME="$SCREENSHOT_BASE_DIR/Android_${DEVICE_MODEL}_${TIMESTAMP}.png"
        
        # Custom filename option
        echo ""
        echo "Default filename: $FILENAME"
        read -p "Enter custom filename (or press Enter to use default): " custom_name
        
        if [ ! -z "$custom_name" ]; then
            # Add .png extension if not present
            if [[ "$custom_name" != *.png ]]; then
                custom_name="${custom_name}.png"
            fi
            # Add screenshots directory if not specified
            if [[ "$custom_name" != */* ]]; then
                custom_name="$SCREENSHOT_BASE_DIR/$custom_name"
            fi
            FILENAME="$custom_name"
        fi
        
        # Capture screenshot
        capture_android_screenshot "$DEVICE_ID" "$FILENAME"
        
        # Loop for multiple screenshots
        while true; do
            echo ""
            read -p "Take another screenshot from the same device? (y/n): " another
            if [[ "$another" != "y" && "$another" != "Y" ]]; then
                break
            fi
            
            echo ""
            echo "Setting up next screenshot..."
            echo "Current device: $DEVICE_MODEL ($DEVICE_ID)"
            
            # Generate new default filename
            TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
            NEW_FILENAME="$SCREENSHOT_BASE_DIR/Android_${DEVICE_MODEL}_${TIMESTAMP}.png"
            
            echo "Default filename: $NEW_FILENAME"
            read -p "Enter custom filename (or press Enter to use default): " custom_name
            
            if [ ! -z "$custom_name" ]; then
                # Add .png extension if not present
                if [[ "$custom_name" != *.png ]]; then
                    custom_name="${custom_name}.png"
                fi
                # Add screenshots directory if not specified
                if [[ "$custom_name" != */* ]]; then
                    custom_name="$SCREENSHOT_BASE_DIR/$custom_name"
                fi
                NEW_FILENAME="$custom_name"
            fi
            
            # Capture screenshot
            capture_android_screenshot "$DEVICE_ID" "$NEW_FILENAME"
        done
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "Quick capture commands for next time:"
echo "-------------------------------------"
if [ "$device_type" == "1" ]; then
    echo "xcrun simctl io $DEVICE_ID screenshot <filename>.png"
else
    echo "adb -s $DEVICE_ID shell screencap -p | sed 's/\r$//' > <filename>.png"
fi
echo ""