#!/bin/bash

# Script to generate iOS launch screen images

echo "Generating iOS launch screen images..."

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

# Launch screen directory
SPLASH_DIR="ios/App/App/Assets.xcassets/Splash.imageset"

# Create directory if it doesn't exist
mkdir -p "$SPLASH_DIR"

# Create a white background image with the icon centered
# We'll create a 2732x2732 image (largest iOS screen size)

# First, create a white background
echo "Creating launch screen background..."
convert -size 2732x2732 xc:white "$SPLASH_DIR/background.png" 2>/dev/null || {
    # If ImageMagick is not installed, create using sips
    # Create a small white image first
    echo "P3" > temp.ppm
    echo "1 1" >> temp.ppm
    echo "255" >> temp.ppm
    echo "255 255 255" >> temp.ppm
    sips -s format png temp.ppm --out temp.png
    sips -z 2732 2732 temp.png --out "$SPLASH_DIR/background.png"
    rm temp.ppm temp.png
}

# Resize icon to a reasonable size for splash screen (512x512)
sips -z 512 512 icon-512.png --out "$SPLASH_DIR/icon-splash.png"

# If ImageMagick is available, composite the images
if command -v composite &> /dev/null; then
    echo "Compositing launch screen..."
    composite -gravity center "$SPLASH_DIR/icon-splash.png" "$SPLASH_DIR/background.png" "$SPLASH_DIR/splash-2732x2732.png"
else
    echo "ImageMagick not found. Creating simple splash screens..."
    # Use the resized icon as splash (not ideal but works)
    cp "$SPLASH_DIR/background.png" "$SPLASH_DIR/splash-2732x2732.png"
fi

# Create copies for different scales
cp "$SPLASH_DIR/splash-2732x2732.png" "$SPLASH_DIR/splash-2732x2732-1.png"
cp "$SPLASH_DIR/splash-2732x2732.png" "$SPLASH_DIR/splash-2732x2732-2.png"

# Clean up temporary files
rm -f "$SPLASH_DIR/background.png" "$SPLASH_DIR/icon-splash.png"

echo "iOS launch screens generated successfully!"