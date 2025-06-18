#!/bin/bash

# Generate Android app icons from the source icon
# Requires ImageMagick: brew install imagemagick

SOURCE_ICON="../icon-512.png"
DRAWABLE_DIR="app/src/main/res/drawable"
MIPMAP_DIR="app/src/main/res"

if [ ! -f "$SOURCE_ICON" ]; then
    echo "Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

echo "Generating Android icons from $SOURCE_ICON..."

# Create directories if they don't exist
mkdir -p $DRAWABLE_DIR

# Generate launcher icons (square)
convert "$SOURCE_ICON" -resize 48x48 "$MIPMAP_DIR/mipmap-mdpi/ic_launcher.png"
convert "$SOURCE_ICON" -resize 72x72 "$MIPMAP_DIR/mipmap-hdpi/ic_launcher.png"
convert "$SOURCE_ICON" -resize 96x96 "$MIPMAP_DIR/mipmap-xhdpi/ic_launcher.png"
convert "$SOURCE_ICON" -resize 144x144 "$MIPMAP_DIR/mipmap-xxhdpi/ic_launcher.png"
convert "$SOURCE_ICON" -resize 192x192 "$MIPMAP_DIR/mipmap-xxxhdpi/ic_launcher.png"

# Generate splash logo (smaller version for splash screen)
convert "$SOURCE_ICON" -resize 144x144 "$DRAWABLE_DIR/ic_splash_logo.png"

# Copy icons for adaptive icon foreground
cp "$SOURCE_ICON" "$DRAWABLE_DIR/ic_launcher_foreground.png"

echo "Icons generated successfully!"
echo ""
echo "Generated icons:"
echo "- Launcher icons in mipmap-* directories"
echo "- Splash logo in drawable directory"
echo ""
echo "Note: For production, consider creating adaptive icons with proper padding"