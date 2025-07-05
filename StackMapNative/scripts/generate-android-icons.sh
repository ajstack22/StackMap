#!/bin/bash
echo "Generating Android app icons..."

# Source icon
SOURCE_ICON="icon-1024-truly-centered.png"

if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Error: $SOURCE_ICON not found!"
    exit 1
fi

# Create launcher icons for each density
echo "Creating mipmap-mdpi icons (48x48)..."
sips -s format png -z 48 48 "$SOURCE_ICON" --out "android/app/src/main/res/mipmap-mdpi/ic_launcher.png"
sips -s format png -z 48 48 "$SOURCE_ICON" --out "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png"

echo "Creating mipmap-hdpi icons (72x72)..."
sips -s format png -z 72 72 "$SOURCE_ICON" --out "android/app/src/main/res/mipmap-hdpi/ic_launcher.png"
sips -s format png -z 72 72 "$SOURCE_ICON" --out "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png"

echo "Creating mipmap-xhdpi icons (96x96)..."
sips -s format png -z 96 96 "$SOURCE_ICON" --out "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png"
sips -s format png -z 96 96 "$SOURCE_ICON" --out "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png"

echo "Creating mipmap-xxhdpi icons (144x144)..."
sips -s format png -z 144 144 "$SOURCE_ICON" --out "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png"
sips -s format png -z 144 144 "$SOURCE_ICON" --out "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png"

echo "Creating mipmap-xxxhdpi icons (192x192)..."
sips -s format png -z 192 192 "$SOURCE_ICON" --out "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"
sips -s format png -z 192 192 "$SOURCE_ICON" --out "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png"

# Create play store icon (512x512)
echo "Creating Play Store icon (512x512)..."
sips -s format png -z 512 512 "$SOURCE_ICON" --out "android/app/src/main/res/playstore-icon.png" >/dev/null 2>&1

echo "✅ Android icons generated successfully!"
echo ""
echo "To see the new icon:"
echo "1. Rebuild: ./scripts/build-android-old-arch.sh"
echo "2. Uninstall old app: adb uninstall com.stackmapnative"
echo "3. Install new version: adb install android/app/build/outputs/apk/release/app-release.apk"