#!/bin/bash
echo "Creating proper Android Adaptive Icon..."

cd android/app/src/main/res

# Clean up error directory
rm -rf 0

# Create adaptive icon directories
echo "Creating adaptive icon structure..."
mkdir -p mipmap-anydpi-v26
mkdir -p drawable-v24

# Create adaptive icon XML files
echo "Creating adaptive icon XML..."
cat > mipmap-anydpi-v26/ic_launcher.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:color="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
EOF

cat > mipmap-anydpi-v26/ic_launcher_round.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:color="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
EOF

# Create/update colors.xml with blue background
echo "Setting blue background color..."
if [ ! -f "values/colors.xml" ]; then
    cat > values/colors.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#5EAEFF</color>
</resources>
EOF
else
    # Check if color already exists
    if ! grep -q "ic_launcher_background" values/colors.xml; then
        # Add color before closing tag
        sed -i '' '/<\/resources>/i\
    <color name="ic_launcher_background">#5EAEFF</color>' values/colors.xml
    fi
fi

echo "✅ Adaptive icon XML structure created!"
echo ""
echo "Now we need to create the foreground images."
echo "The foreground should be your white logo on transparent background."