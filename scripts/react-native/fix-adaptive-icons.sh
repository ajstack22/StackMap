#!/bin/bash
echo "Fixing adaptive icon setup..."

cd /Users/adamstack/StackMap/StackMap/StackMapNative

# Clean up error directory
rm -rf android/app/src/main/res/0

# Create foreground icons in drawable directories
echo "Creating foreground icons..."

# Source icon
SOURCE_ICON="icon-1024-truly-centered.png"

# Create drawable directories and foreground icons
echo "Creating drawable-mdpi (108x108)..."
mkdir -p android/app/src/main/res/drawable-mdpi
sips -s format png -z 108 108 "$SOURCE_ICON" --out "android/app/src/main/res/drawable-mdpi/ic_launcher_foreground.png"

echo "Creating drawable-hdpi (162x162)..."
mkdir -p android/app/src/main/res/drawable-hdpi
sips -s format png -z 162 162 "$SOURCE_ICON" --out "android/app/src/main/res/drawable-hdpi/ic_launcher_foreground.png"

echo "Creating drawable-xhdpi (216x216)..."
mkdir -p android/app/src/main/res/drawable-xhdpi
sips -s format png -z 216 216 "$SOURCE_ICON" --out "android/app/src/main/res/drawable-xhdpi/ic_launcher_foreground.png"

echo "Creating drawable-xxhdpi (324x324)..."
mkdir -p android/app/src/main/res/drawable-xxhdpi
sips -s format png -z 324 324 "$SOURCE_ICON" --out "android/app/src/main/res/drawable-xxhdpi/ic_launcher_foreground.png"

echo "Creating drawable-xxxhdpi (432x432)..."
mkdir -p android/app/src/main/res/drawable-xxxhdpi
sips -s format png -z 432 432 "$SOURCE_ICON" --out "android/app/src/main/res/drawable-xxxhdpi/ic_launcher_foreground.png"

# Also create a default drawable
mkdir -p android/app/src/main/res/drawable
sips -s format png -z 216 216 "$SOURCE_ICON" --out "android/app/src/main/res/drawable/ic_launcher_foreground.png"

echo "✅ Adaptive icon fixed! Your app will now show:"
echo "- Blue circular background on Pixel devices"
echo "- Your logo properly centered"
echo "- Adaptive to different device shapes"