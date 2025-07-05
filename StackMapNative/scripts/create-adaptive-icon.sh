#!/bin/bash
echo "Creating Android Adaptive Icon..."

# First, let's check current structure
echo "Creating adaptive icon directories..."
mkdir -p android/app/src/main/res/mipmap-anydpi-v26
mkdir -p android/app/src/main/res/values

# Create adaptive icon XML
cat > android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:color="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF

cat > android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:color="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF

# Create colors.xml if it doesn't exist
if [ ! -f "android/app/src/main/res/values/colors.xml" ]; then
    cat > android/app/src/main/res/values/colors.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#5EAEFF</color>
</resources>
EOF
else
    echo "colors.xml already exists, please add: <color name=\"ic_launcher_background\">#5EAEFF</color>"
fi

# Now create foreground images (white icon on transparent background)
echo "Creating foreground icons..."
SOURCE_ICON="icon-1024-truly-centered.png"

# Create foreground versions for each density
for size in 48 72 96 144 192; do
    case $size in
        48) dir="mipmap-mdpi" ;;
        72) dir="mipmap-hdpi" ;;
        96) dir="mipmap-xhdpi" ;;
        144) dir="mipmap-xxhdpi" ;;
        192) dir="mipmap-xxxhdpi" ;;
    esac
    
    echo "Creating $dir/ic_launcher_foreground.png (${size}x${size})..."
    
    # For now, just copy the icon - ideally this should be white elements only
    sips -s format png -z $size $size "$SOURCE_ICON" \
         --out "android/app/src/main/res/$dir/ic_launcher_foreground.png"
done

echo "✅ Adaptive icon structure created!"
echo ""
echo "The icon will now:"
echo "- Show as a circle on Pixel devices"
echo "- Show as a squircle on Samsung devices"
echo "- Show as appropriate shape on other devices"
echo "- Have a blue background (#5EAEFF)"
echo ""
echo "Rebuild the app to see the changes!"