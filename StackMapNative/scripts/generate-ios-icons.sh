#!/bin/bash

# Script to generate iOS app icons for React Native project

echo "Generating iOS app icons..."

# Check if source icon exists
if [ ! -f "icon-1024-truly-centered.png" ]; then
    echo "Error: icon-1024-truly-centered.png not found in the current directory"
    exit 1
fi

# Check if sips is available (macOS built-in tool)
if ! command -v sips &> /dev/null; then
    echo "Error: sips command not found. This script requires macOS."
    exit 1
fi

# iOS App Icon directory for React Native
ICON_DIR="ios/StackMapNative/Images.xcassets/AppIcon.appiconset"

# Create directory if it doesn't exist
mkdir -p "$ICON_DIR"

# Generate all required iOS icon sizes
echo "Generating icon sizes..."

# iPhone Notification - 20pt
sips -z 40 40 icon-1024-truly-centered.png --out "$ICON_DIR/icon-20@2x.png"
sips -z 60 60 icon-1024-truly-centered.png --out "$ICON_DIR/icon-20@3x.png"

# iPhone Settings - 29pt
sips -z 58 58 icon-1024-truly-centered.png --out "$ICON_DIR/icon-29@2x.png"
sips -z 87 87 icon-1024-truly-centered.png --out "$ICON_DIR/icon-29@3x.png"

# iPhone Spotlight - 40pt
sips -z 80 80 icon-1024-truly-centered.png --out "$ICON_DIR/icon-40@2x.png"
sips -z 120 120 icon-1024-truly-centered.png --out "$ICON_DIR/icon-40@3x.png"

# iPhone App - 60pt
sips -z 120 120 icon-1024-truly-centered.png --out "$ICON_DIR/icon-60@2x.png"
sips -z 180 180 icon-1024-truly-centered.png --out "$ICON_DIR/icon-60@3x.png"

# iPad Notification - 20pt
sips -z 20 20 icon-1024-truly-centered.png --out "$ICON_DIR/icon-20@1x.png"
sips -z 40 40 icon-1024-truly-centered.png --out "$ICON_DIR/icon-20@2x-ipad.png"

# iPad Settings - 29pt
sips -z 29 29 icon-1024-truly-centered.png --out "$ICON_DIR/icon-29@1x.png"
sips -z 58 58 icon-1024-truly-centered.png --out "$ICON_DIR/icon-29@2x-ipad.png"

# iPad Spotlight - 40pt
sips -z 40 40 icon-1024-truly-centered.png --out "$ICON_DIR/icon-40@1x.png"
sips -z 80 80 icon-1024-truly-centered.png --out "$ICON_DIR/icon-40@2x-ipad.png"

# iPad App - 76pt
sips -z 76 76 icon-1024-truly-centered.png --out "$ICON_DIR/icon-76@1x.png"
sips -z 152 152 icon-1024-truly-centered.png --out "$ICON_DIR/icon-76@2x.png"

# iPad Pro App - 83.5pt
sips -z 167 167 icon-1024-truly-centered.png --out "$ICON_DIR/icon-83.5@2x.png"

# App Store - 1024pt
cp icon-1024-truly-centered.png "$ICON_DIR/icon-1024@1x.png"

echo "iOS app icons generated successfully!"
echo "Next steps:"
echo "1. Open Xcode and verify the icons in Images.xcassets"
echo "2. Update Contents.json if needed"