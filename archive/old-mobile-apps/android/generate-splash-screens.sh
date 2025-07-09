#!/bin/bash

# Script to generate Android splash screens for StackMap

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}StackMap Android Splash Screen Generator${NC}"
echo "========================================="

# Source icon for splash screen center
SOURCE_ICON="../icon-512.png"
ANDROID_RES_DIR="app/src/main/res"
BACKGROUND_COLOR="#FFFFFF"

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
echo -e "${YELLOW}Background color: $BACKGROUND_COLOR${NC}"

# Function to create splash screen with centered logo
create_splash() {
    local width=$1
    local height=$2
    local output_dir=$3
    local logo_size=$4
    
    mkdir -p "$output_dir"
    
    # Create a white background
    local temp_bg="/tmp/splash_bg_${width}x${height}.png"
    # Create white background using sips
    echo "P3 $width $height 255 255 255 255" | convert -size ${width}x${height} -depth 8 rgb:- "$temp_bg" 2>/dev/null || {
        # Fallback: create using printf and convert if available
        if command -v convert &> /dev/null; then
            convert -size ${width}x${height} xc:white "$temp_bg"
        else
            echo -e "${YELLOW}Warning: ImageMagick not found. Creating simplified splash screen.${NC}"
            # Just copy and resize the icon as splash
            sips -z $height $width "$SOURCE_ICON" --out "$output_dir/splash.png" >/dev/null 2>&1
            return
        fi
    }
    
    # Resize logo
    local temp_logo="/tmp/splash_logo_${logo_size}.png"
    sips -z $logo_size $logo_size "$SOURCE_ICON" --out "$temp_logo" >/dev/null 2>&1
    
    # Composite logo onto background (if ImageMagick is available)
    if command -v composite &> /dev/null; then
        composite -gravity center "$temp_logo" "$temp_bg" "$output_dir/splash.png"
    else
        # Fallback: just use the resized logo
        cp "$temp_logo" "$output_dir/splash.png"
    fi
    
    # Clean up temp files
    rm -f "$temp_bg" "$temp_logo"
    
    echo -e "${GREEN}✓${NC} Generated $output_dir/splash.png (${width}x${height}, logo: ${logo_size}px)"
}

# Generate splash screens for different orientations and densities
echo -e "\n${YELLOW}Generating portrait splash screens...${NC}"
create_splash 320 480 "$ANDROID_RES_DIR/drawable-port-mdpi" 128
create_splash 480 800 "$ANDROID_RES_DIR/drawable-port-hdpi" 192
create_splash 720 1280 "$ANDROID_RES_DIR/drawable-port-xhdpi" 256
create_splash 960 1600 "$ANDROID_RES_DIR/drawable-port-xxhdpi" 384
create_splash 1280 1920 "$ANDROID_RES_DIR/drawable-port-xxxhdpi" 512

echo -e "\n${YELLOW}Generating landscape splash screens...${NC}"
create_splash 480 320 "$ANDROID_RES_DIR/drawable-land-mdpi" 128
create_splash 800 480 "$ANDROID_RES_DIR/drawable-land-hdpi" 192
create_splash 1280 720 "$ANDROID_RES_DIR/drawable-land-xhdpi" 256
create_splash 1600 960 "$ANDROID_RES_DIR/drawable-land-xxhdpi" 384
create_splash 1920 1280 "$ANDROID_RES_DIR/drawable-land-xxxhdpi" 512

# Create default splash screen
echo -e "\n${YELLOW}Creating default splash screen...${NC}"
create_splash 1280 1920 "$ANDROID_RES_DIR/drawable" 512

# Update splash screen theme
echo -e "\n${YELLOW}Updating splash screen theme...${NC}"
cat > "$ANDROID_RES_DIR/values/splash_theme.xml" << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Splash Screen Theme -->
    <style name="AppTheme.Splash" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/splash_background</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/splash</item>
        <item name="windowSplashScreenAnimationDuration">200</item>
        <item name="postSplashScreenTheme">@style/AppTheme</item>
    </style>
    
    <!-- Colors -->
    <color name="splash_background">#FFFFFF</color>
</resources>
EOF
echo -e "${GREEN}✓${NC} Created splash screen theme"

# Update styles.xml to include splash theme
echo -e "\n${YELLOW}Updating app theme for splash screen...${NC}"
if ! grep -q "AppTheme.NoActionBarLaunch" "$ANDROID_RES_DIR/values/styles.xml"; then
    # Add splash screen style if it doesn't exist
    sed -i.bak '/<\/resources>/i\
\    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">\
\        <item name="windowSplashScreenBackground">@color/splash_background</item>\
\        <item name="windowSplashScreenAnimatedIcon">@drawable/splash</item>\
\        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>\
\    </style>' "$ANDROID_RES_DIR/values/styles.xml"
fi

echo -e "\n${GREEN}Splash screens generated successfully!${NC}"
echo -e "\n${YELLOW}Splash screen summary:${NC}"
echo "- Portrait splash screens: drawable-port-*/splash.png"
echo "- Landscape splash screens: drawable-land-*/splash.png"
echo "- Default splash screen: drawable/splash.png"
echo "- Splash theme: @style/AppTheme.Splash"
echo -e "\n${YELLOW}Note:${NC} The app will use Android 12+ splash screen API automatically"