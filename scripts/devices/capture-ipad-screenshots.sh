#!/bin/bash

# StackMap iPad 13" Screenshot Capture Script
# Captures screenshots for App Store submission from iPad Air 13" (M3)

# Configuration
DEVICE_NAME="iPad Air 13-inch (M3)"
DEVICE_ID="" # Will be auto-detected
BASE_DIR="./screenshots"
OUTPUT_DIR=""
SCREENSHOT_NUMBER=1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Function to show header
show_header() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${MAGENTA}📸 iPad Air 13\" Screenshot Capture${NC}          ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    echo
}

# Function to check device status
check_device() {
    echo -e "${YELLOW}🔍 Checking for iPad Air 13-inch...${NC}"
    
    # Try to find the device (handling different naming variations)
    DEVICE_INFO=$(xcrun simctl list devices | grep -E "iPad Air.*13.*inch|iPad Air 13-inch" | grep "Booted" | head -1)
    
    if [ -z "$DEVICE_INFO" ]; then
        echo -e "${RED}❌ iPad Air 13-inch is not running!${NC}"
        echo
        echo -e "${YELLOW}Available iPad devices:${NC}"
        xcrun simctl list devices | grep iPad | grep -v "unavailable"
        echo
        echo -e "${YELLOW}To start the iPad Air 13-inch:${NC}"
        echo "  1. Open Simulator"
        echo "  2. File > Open Simulator > iOS [version] > iPad Air 13-inch (M3)"
        echo
        echo -e "${YELLOW}Or run: ${NC}xcrun simctl boot \"iPad Air 13-inch (M3)\""
        exit 1
    fi
    
    # Extract device ID if needed
    DEVICE_ID=$(echo "$DEVICE_INFO" | grep -o "[A-F0-9]\{8\}-[A-F0-9]\{4\}-[A-F0-9]\{4\}-[A-F0-9]\{4\}-[A-F0-9]\{12\}")
    DEVICE_NAME=$(echo "$DEVICE_INFO" | sed 's/.*(\(.*\)).*/\1/' | head -1)
    
    echo -e "${GREEN}✅ Found device: ${DEVICE_NAME}${NC}"
    echo
}

# Function to setup output directory
setup_directory() {
    echo -e "${YELLOW}📁 Setting up output directory...${NC}"
    
    # Ask for folder name
    echo -e "${BLUE}Enter folder name for screenshots (e.g., 'app-store-submission', 'v2.0-release'):${NC}"
    read -r folder_name
    
    if [ -z "$folder_name" ]; then
        folder_name="ipad-13-$(date +%Y%m%d-%H%M%S)"
        echo -e "${YELLOW}Using default: $folder_name${NC}"
    fi
    
    OUTPUT_DIR="$BASE_DIR/$folder_name"
    mkdir -p "$OUTPUT_DIR"
    
    echo -e "${GREEN}✅ Screenshots will be saved to: $OUTPUT_DIR${NC}"
    echo
}

# Function to capture a screenshot with custom name
capture_screenshot() {
    local custom_name=""
    local file_path=""
    
    echo -e "${BLUE}──────────────────────────────────────────${NC}"
    echo -e "${YELLOW}Screenshot #$SCREENSHOT_NUMBER${NC}"
    echo
    
    # Show instructions
    echo -e "${MAGENTA}📱 Navigate to the screen you want to capture on the iPad${NC}"
    echo -e "${YELLOW}Press Enter when ready (or 'q' to quit):${NC}"
    read -r ready
    
    if [ "$ready" = "q" ] || [ "$ready" = "Q" ]; then
        return 1
    fi
    
    # Ask for custom name
    echo -e "${BLUE}Enter name for this screenshot:${NC}"
    echo -e "${YELLOW}(e.g., 'home-screen', 'user-profile', 'activity-list')${NC}"
    read -r custom_name
    
    if [ -z "$custom_name" ]; then
        custom_name="screenshot-$SCREENSHOT_NUMBER"
        echo -e "${YELLOW}Using default: $custom_name${NC}"
    fi
    
    # Sanitize filename (replace spaces and special chars)
    custom_name=$(echo "$custom_name" | sed 's/[^a-zA-Z0-9-]/-/g' | tr '[:upper:]' '[:lower:]')
    file_path="$OUTPUT_DIR/${custom_name}.png"
    
    # Check if file already exists
    if [ -f "$file_path" ]; then
        echo -e "${YELLOW}⚠️  File already exists. Overwrite? (y/n):${NC}"
        read -r overwrite
        if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
            echo -e "${YELLOW}Skipping...${NC}"
            return 0
        fi
    fi
    
    # Capture the screenshot
    echo -e "${YELLOW}📸 Capturing...${NC}"
    
    if xcrun simctl io "$DEVICE_NAME" screenshot "$file_path" 2>/dev/null; then
        echo -e "${GREEN}✅ Saved: $file_path${NC}"
        
        # Show file info
        if [ -f "$file_path" ]; then
            dimensions=$(sips -g pixelWidth -g pixelHeight "$file_path" 2>/dev/null | grep pixel | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
            size=$(du -h "$file_path" | cut -f1)
            echo -e "${BLUE}   Dimensions: $dimensions${NC}"
            echo -e "${BLUE}   File size: $size${NC}"
        fi
        
        ((SCREENSHOT_NUMBER++))
    else
        echo -e "${RED}❌ Failed to capture screenshot${NC}"
        echo -e "${YELLOW}Make sure the iPad simulator is visible and not minimized${NC}"
    fi
    
    echo
    return 0
}

# Function to show captured screenshots
show_summary() {
    echo -e "${BLUE}──────────────────────────────────────────${NC}"
    echo -e "${GREEN}📋 Screenshot Summary${NC}"
    echo
    
    if [ -d "$OUTPUT_DIR" ]; then
        file_count=$(ls -1 "$OUTPUT_DIR"/*.png 2>/dev/null | wc -l)
        
        if [ "$file_count" -gt 0 ]; then
            echo -e "${GREEN}✅ Captured $file_count screenshots:${NC}"
            echo
            ls -la "$OUTPUT_DIR"/*.png | awk '{print "   📸 " $NF}' | sed "s|$OUTPUT_DIR/||"
            echo
            echo -e "${BLUE}📁 Location: $OUTPUT_DIR${NC}"
            
            # Offer to open folder
            echo
            echo -e "${YELLOW}Open folder in Finder? (y/n):${NC}"
            read -r open_folder
            if [ "$open_folder" = "y" ] || [ "$open_folder" = "Y" ]; then
                open "$OUTPUT_DIR"
            fi
        else
            echo -e "${YELLOW}No screenshots captured${NC}"
        fi
    fi
}

# Function to show App Store requirements
show_requirements() {
    echo -e "${BLUE}──────────────────────────────────────────${NC}"
    echo -e "${MAGENTA}📱 App Store Screenshot Requirements${NC}"
    echo
    echo -e "${YELLOW}iPad Pro (12.9\" 6th gen) Requirements:${NC}"
    echo "  • Resolution: 2048 × 2732 pixels (portrait)"
    echo "  • Resolution: 2732 × 2048 pixels (landscape)"
    echo "  • Format: PNG or JPEG"
    echo "  • Minimum: 2 screenshots"
    echo "  • Maximum: 10 screenshots"
    echo
    echo -e "${YELLOW}Recommended Screenshots:${NC}"
    echo "  1. Home screen with key features"
    echo "  2. Main functionality in action"
    echo "  3. Unique features"
    echo "  4. Settings or customization"
    echo "  5. Any achievements or progress screens"
    echo
    echo -e "${GREEN}Press Enter to continue...${NC}"
    read -r
}

# Main execution
main() {
    show_header
    check_device
    setup_directory
    show_requirements
    
    # Capture loop
    while true; do
        if ! capture_screenshot; then
            break
        fi
        
        echo -e "${YELLOW}Continue capturing? (y/n):${NC}"
        read -r continue_capture
        if [ "$continue_capture" != "y" ] && [ "$continue_capture" != "Y" ]; then
            break
        fi
    done
    
    # Show summary
    show_summary
    
    echo
    echo -e "${GREEN}✨ Screenshot capture complete!${NC}"
    echo -e "${BLUE}Remember to review and edit screenshots before App Store submission.${NC}"
}

# Run the script
main