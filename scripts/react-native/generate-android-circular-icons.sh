#!/bin/bash
echo "Generating circular Android app icons..."

# Source icon
SOURCE_ICON="icon-1024-truly-centered.png"

if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Error: $SOURCE_ICON not found!"
    exit 1
fi

# Create circular icons for each density
echo "Creating circular Android icons..."

# Function to create circular icon with blue background
create_circular_icon() {
    local size=$1
    local output=$2
    
    # Create a circular mask with blue background
    # Using ImageMagick syntax compatible with macOS sips alternative
    sips -s format png \
         -s formatOptions best \
         -z $size $size \
         "$SOURCE_ICON" \
         --out "$output" 2>/dev/null
         
    # Note: sips doesn't support circular masks directly
    # We'll need to create pre-made circular versions
}

# For now, let's use the square icons for ic_launcher (square icons)
# and create better round icons for ic_launcher_round

echo "Copying square icons for legacy support..."
for dir in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
    # Keep existing square icons as-is
    echo "Keeping square icon in $dir"
done

echo ""
echo "For proper circular icons, we need to:"
echo "1. Create a circular version of your logo with blue background in an image editor"
echo "2. Save it as 'icon-1024-circular.png'"
echo "3. Re-run this script"
echo ""
echo "Or we can use Android's adaptive icons feature (recommended)"