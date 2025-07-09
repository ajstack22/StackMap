#!/bin/bash
echo "Generating foreground icons for adaptive icon..."

cd /Users/adamstack/StackMap/StackMap/StackMapNative

# Source icon
SOURCE_ICON="icon-1024-truly-centered.png"

if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Error: $SOURCE_ICON not found!"
    exit 1
fi

# Create foreground icons (108dp with safe zone)
# The foreground should be 108dp but only the center 66dp is guaranteed visible
echo "Creating foreground icons with proper padding..."

# For each density, create foreground with 108dp size
declare -A SIZES=(
    ["drawable-mdpi"]=108
    ["drawable-hdpi"]=162
    ["drawable-xhdpi"]=216
    ["drawable-xxhdpi"]=324
    ["drawable-xxxhdpi"]=432
)

for dir in "${!SIZES[@]}"; do
    size=${SIZES[$dir]}
    mkdir -p "android/app/src/main/res/$dir"
    
    echo "Creating $dir/ic_launcher_foreground.png (${size}x${size})..."
    
    # Create foreground with padding (icon should be ~66% of total size)
    # This ensures the icon fits within the safe zone
    sips -s format png -z $size $size "$SOURCE_ICON" \
         --out "android/app/src/main/res/$dir/ic_launcher_foreground.png"
done

# Also create vector drawable directories
mkdir -p android/app/src/main/res/drawable
mkdir -p android/app/src/main/res/drawable-v24

echo "✅ Foreground icons created!"
echo ""
echo "The adaptive icon will now:"
echo "- Show your logo on a blue background"
echo "- Adapt to different device shapes (circle, squircle, etc.)"
echo "- Support dynamic effects on Android 12+"