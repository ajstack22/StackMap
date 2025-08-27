#!/bin/bash

# Script to generate iOS app icons from the base icon-512.png

echo "Generating iOS app icons..."

# Check if source icon exists
if [ ! -f "icon-512.png" ]; then
    echo "Error: icon-512.png not found in the root directory"
    exit 1
fi

# Check if sips is available (macOS built-in tool)
if ! command -v sips &> /dev/null; then
    echo "Error: sips command not found. This script requires macOS."
    exit 1
fi

# iOS App Icon directory
ICON_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"

# Create directory if it doesn't exist
mkdir -p "$ICON_DIR"

# Generate all required iOS icon sizes
echo "Generating icon sizes..."

# iPhone icons
sips -z 40 40 icon-512.png --out "$ICON_DIR/AppIcon-20@2x.png"
sips -z 60 60 icon-512.png --out "$ICON_DIR/AppIcon-20@3x.png"
sips -z 58 58 icon-512.png --out "$ICON_DIR/AppIcon-29@2x.png"
sips -z 87 87 icon-512.png --out "$ICON_DIR/AppIcon-29@3x.png"
sips -z 80 80 icon-512.png --out "$ICON_DIR/AppIcon-40@2x.png"
sips -z 120 120 icon-512.png --out "$ICON_DIR/AppIcon-40@3x.png"
sips -z 120 120 icon-512.png --out "$ICON_DIR/AppIcon-60@2x.png"
sips -z 180 180 icon-512.png --out "$ICON_DIR/AppIcon-60@3x.png"

# iPad icons
sips -z 20 20 icon-512.png --out "$ICON_DIR/AppIcon-20.png"
sips -z 29 29 icon-512.png --out "$ICON_DIR/AppIcon-29.png"
sips -z 40 40 icon-512.png --out "$ICON_DIR/AppIcon-40.png"
sips -z 76 76 icon-512.png --out "$ICON_DIR/AppIcon-76.png"
sips -z 152 152 icon-512.png --out "$ICON_DIR/AppIcon-76@2x.png"
sips -z 167 167 icon-512.png --out "$ICON_DIR/AppIcon-83.5@2x.png"

# App Store icon
sips -z 1024 1024 icon-512.png --out "$ICON_DIR/AppIcon-1024.png"

echo "iOS app icons generated successfully!"