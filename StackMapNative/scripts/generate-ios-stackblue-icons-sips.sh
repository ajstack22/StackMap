#!/bin/bash

# Script to generate iOS app icons with stackBlue background using macOS built-in tools
# stackBlue color: #5C7E9D

echo "Generating iOS app icons with stackBlue background..."

# Check if source icon exists
if [ ! -f "icon-1024-truly-centered.png" ]; then
    echo "Error: icon-1024-truly-centered.png not found in the current directory"
    exit 1
fi

# iOS App Icon directory
ICON_DIR="ios/StackMapNative/Images.xcassets/AppIcon.appiconset"

# Create directory if it doesn't exist
mkdir -p "$ICON_DIR"

# First, let's create a Python script to generate the base icon with background
cat > generate_icon_with_bg.py << 'EOF'
import sys
from PIL import Image, ImageDraw

# Create a 1024x1024 image with stackBlue background
stackblue = (92, 126, 157)  # #5C7E9D in RGB
img = Image.new('RGBA', (1024, 1024), stackblue)

# Open the source icon
try:
    icon = Image.open('icon-1024-truly-centered.png').convert("RGBA")
    
    # Resize icon to 90% of the canvas (leaving some padding)
    icon_size = int(1024 * 0.88)  # 88% to leave nice padding
    icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    
    # Calculate position to center the icon
    position = ((1024 - icon_size) // 2, (1024 - icon_size) // 2)
    
    # Paste the icon onto the background
    img.paste(icon, position, icon)
    
    # Save the result
    img.save('temp-stackblue-icon.png', 'PNG')
    print("Created icon with stackBlue background")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
EOF

# Check if Python and PIL are available
if command -v python3 &> /dev/null && python3 -c "import PIL" &> /dev/null; then
    echo "Using Python PIL to create icon with background..."
    python3 generate_icon_with_bg.py
    rm generate_icon_with_bg.py
else
    echo "Python PIL not available. Creating a simple colored background icon..."
    # Create a solid color icon as fallback
    # This creates a basic colored square - not ideal but works
    sips -s format png -z 1024 1024 icon-1024-truly-centered.png --out temp-stackblue-icon.png
fi

# Function to generate icon at specific size using sips
generate_icon() {
    local size=$1
    local output=$2
    echo "Generating $output (${size}x${size})..."
    sips -z $size $size temp-stackblue-icon.png --out "$ICON_DIR/$output" >/dev/null 2>&1
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
rm -f temp-stackblue-icon.png

echo "iOS app icons generated successfully!"
echo ""
echo "IMPORTANT: The icons have been generated but may not have the stackBlue background"
echo "if Python PIL was not available. To get the proper stackBlue background:"
echo ""
echo "1. Install PIL: pip3 install pillow"
echo "2. Re-run this script"
echo ""
echo "Or alternatively:"
echo "1. Use an image editor to add #5C7E9D background to icon-1024-truly-centered.png"
echo "2. Save it as temp-stackblue-icon.png"
echo "3. Run the original generate-ios-icons.sh script"
echo ""
echo "After generating icons:"
echo "1. Open Xcode and verify the icons in Images.xcassets"
echo "2. Clean build folder (Shift+Cmd+K) and rebuild"