#!/bin/bash

# Script to generate iOS app icons with stackBlue background
# stackBlue color: #5C7E9D

echo "Generating iOS app icons with stackBlue background..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed. Please install it first:"
    echo "brew install imagemagick"
    exit 1
fi

# Check if source icon exists
if [ ! -f "icon-1024-truly-centered.png" ]; then
    echo "Error: icon-1024-truly-centered.png not found in the current directory"
    exit 1
fi

# iOS App Icon directory
ICON_DIR="ios/StackMapNative/Images.xcassets/AppIcon.appiconset"

# Create directory if it doesn't exist
mkdir -p "$ICON_DIR"

# Create a temporary icon with stackBlue background
echo "Creating icon with stackBlue background..."
convert -size 1024x1024 xc:'#5C7E9D' \
    icon-1024-truly-centered.png -resize 900x900 -gravity center -composite \
    temp-stackblue-icon.png

# Function to generate icon at specific size
generate_icon() {
    local size=$1
    local output=$2
    echo "Generating $output ($size x $size)..."
    convert temp-stackblue-icon.png -resize ${size}x${size} "$ICON_DIR/$output"
}

# Generate all required iOS icon sizes
echo "Generating all iOS icon sizes..."

# iPhone Notification - 20pt
generate_icon 40 "icon-20@2x.png"
generate_icon 60 "icon-20@3x.png"

# iPhone Settings - 29pt
generate_icon 58 "icon-29@2x.png"
generate_icon 87 "icon-29@3x.png"

# iPhone Spotlight - 40pt
generate_icon 80 "icon-40@2x.png"
generate_icon 120 "icon-40@3x.png"

# iPhone App - 60pt
generate_icon 120 "icon-60@2x.png"
generate_icon 180 "icon-60@3x.png"

# iPad Notification - 20pt
generate_icon 20 "icon-20@1x.png"
generate_icon 40 "icon-20@2x-ipad.png"

# iPad Settings - 29pt
generate_icon 29 "icon-29@1x.png"
generate_icon 58 "icon-29@2x-ipad.png"

# iPad Spotlight - 40pt
generate_icon 40 "icon-40@1x.png"
generate_icon 80 "icon-40@2x-ipad.png"

# iPad App - 76pt
generate_icon 76 "icon-76@1x.png"
generate_icon 152 "icon-76@2x.png"

# iPad Pro App - 83.5pt
generate_icon 167 "icon-83.5@2x.png"

# App Store - 1024pt
cp temp-stackblue-icon.png "$ICON_DIR/icon-1024@1x.png"

# Clean up temporary file
rm temp-stackblue-icon.png

echo "iOS app icons with stackBlue background generated successfully!"
echo "Next steps:"
echo "1. Open Xcode and verify the icons in Images.xcassets"
echo "2. Build and run the app to see the new icon"
echo "3. You may need to clean the build folder in Xcode (Shift+Cmd+K)"