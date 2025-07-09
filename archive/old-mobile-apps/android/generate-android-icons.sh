#!/bin/bash

# Script to generate Android app icons for StackMap

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}StackMap Android Icon Generator${NC}"
echo "================================="

# Source icon (should be at least 1024x1024)
SOURCE_ICON="../icon-512.png"
ANDROID_RES_DIR="app/src/main/res"

# Check if we're in the android directory
if [ ! -f "build.gradle" ] || [ ! -d "app" ]; then
    echo -e "${RED}Error: This script must be run from the android directory${NC}"
    exit 1
fi

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo -e "${RED}Error: Source icon not found at $SOURCE_ICON${NC}"
    echo "Please ensure icon-512.png exists in the parent directory"
    exit 1
fi

# Check if sips is available (macOS)
if ! command -v sips &> /dev/null; then
    echo -e "${RED}Error: sips command not found. This script requires macOS.${NC}"
    echo "For other platforms, please use ImageMagick or similar tools."
    exit 1
fi

echo -e "${YELLOW}Using source icon: $SOURCE_ICON${NC}"

# Function to resize icon
resize_icon() {
    local size=$1
    local output_dir=$2
    local output_name=$3
    
    mkdir -p "$output_dir"
    sips -z $size $size "$SOURCE_ICON" --out "$output_dir/$output_name" >/dev/null 2>&1
    echo -e "${GREEN}✓${NC} Generated $output_dir/$output_name (${size}x${size})"
}

# Generate launcher icons
echo -e "\n${YELLOW}Generating launcher icons...${NC}"
resize_icon 48 "$ANDROID_RES_DIR/mipmap-mdpi" "ic_launcher.png"
resize_icon 72 "$ANDROID_RES_DIR/mipmap-hdpi" "ic_launcher.png"
resize_icon 96 "$ANDROID_RES_DIR/mipmap-xhdpi" "ic_launcher.png"
resize_icon 144 "$ANDROID_RES_DIR/mipmap-xxhdpi" "ic_launcher.png"
resize_icon 192 "$ANDROID_RES_DIR/mipmap-xxxhdpi" "ic_launcher.png"

# Generate round launcher icons (same as regular for now)
echo -e "\n${YELLOW}Generating round launcher icons...${NC}"
resize_icon 48 "$ANDROID_RES_DIR/mipmap-mdpi" "ic_launcher_round.png"
resize_icon 72 "$ANDROID_RES_DIR/mipmap-hdpi" "ic_launcher_round.png"
resize_icon 96 "$ANDROID_RES_DIR/mipmap-xhdpi" "ic_launcher_round.png"
resize_icon 144 "$ANDROID_RES_DIR/mipmap-xxhdpi" "ic_launcher_round.png"
resize_icon 192 "$ANDROID_RES_DIR/mipmap-xxxhdpi" "ic_launcher_round.png"

# Generate adaptive icon foreground
echo -e "\n${YELLOW}Generating adaptive icon foreground...${NC}"
resize_icon 108 "$ANDROID_RES_DIR/mipmap-mdpi" "ic_launcher_foreground.png"
resize_icon 162 "$ANDROID_RES_DIR/mipmap-hdpi" "ic_launcher_foreground.png"
resize_icon 216 "$ANDROID_RES_DIR/mipmap-xhdpi" "ic_launcher_foreground.png"
resize_icon 324 "$ANDROID_RES_DIR/mipmap-xxhdpi" "ic_launcher_foreground.png"
resize_icon 432 "$ANDROID_RES_DIR/mipmap-xxxhdpi" "ic_launcher_foreground.png"

# Create adaptive icon background color
echo -e "\n${YELLOW}Setting adaptive icon background color...${NC}"
cat > "$ANDROID_RES_DIR/values/ic_launcher_background.xml" << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
EOF
echo -e "${GREEN}✓${NC} Created adaptive icon background color"

# Update adaptive icon configuration
echo -e "\n${YELLOW}Updating adaptive icon configuration...${NC}"
cat > "$ANDROID_RES_DIR/mipmap-anydpi-v26/ic_launcher.xml" << EOF
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF

cat > "$ANDROID_RES_DIR/mipmap-anydpi-v26/ic_launcher_round.xml" << EOF
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF
echo -e "${GREEN}✓${NC} Updated adaptive icon configuration"

# Generate notification icon (monochrome)
echo -e "\n${YELLOW}Generating notification icon...${NC}"
resize_icon 24 "$ANDROID_RES_DIR/drawable-mdpi" "ic_notification.png"
resize_icon 36 "$ANDROID_RES_DIR/drawable-hdpi" "ic_notification.png"
resize_icon 48 "$ANDROID_RES_DIR/drawable-xhdpi" "ic_notification.png"
resize_icon 72 "$ANDROID_RES_DIR/drawable-xxhdpi" "ic_notification.png"
resize_icon 96 "$ANDROID_RES_DIR/drawable-xxxhdpi" "ic_notification.png"

echo -e "\n${GREEN}Android icons generated successfully!${NC}"
echo -e "\n${YELLOW}Icon summary:${NC}"
echo "- Launcher icons: mipmap-*/ic_launcher.png"
echo "- Round launcher icons: mipmap-*/ic_launcher_round.png"
echo "- Adaptive icon foreground: mipmap-*/ic_launcher_foreground.png"
echo "- Adaptive icon background: @color/ic_launcher_background (white)"
echo "- Notification icons: drawable-*/ic_notification.png"