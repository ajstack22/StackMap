#!/bin/bash

# Fix Material Icons in React Native iOS app

echo "Fixing Material Icons in StackMapNative..."

# Navigate to the React Native project
cd /Users/adamstack/Desktop/StackMapNative

# Install pods (this should link the vector icons fonts)
echo "Installing CocoaPods dependencies..."
cd ios
pod install

# If pod install doesn't automatically link the fonts, we need to manually add them
echo "Ensuring fonts are linked..."

# Create Fonts directory if it doesn't exist
mkdir -p StackMapNative/Fonts

# Copy Material Icons font
VECTOR_ICONS_PATH="../node_modules/react-native-vector-icons/Fonts"
if [ -d "$VECTOR_ICONS_PATH" ]; then
    cp "$VECTOR_ICONS_PATH/MaterialIcons.ttf" StackMapNative/Fonts/
    echo "Copied MaterialIcons.ttf to project"
else
    echo "Warning: Could not find vector icons fonts directory"
fi

echo ""
echo "Manual steps required in Xcode:"
echo "1. Open /Users/adamstack/Desktop/StackMapNative/ios/StackMapNative.xcworkspace"
echo "2. Right-click on StackMapNative folder in the project navigator"
echo "3. Select 'Add Files to StackMapNative...'"
echo "4. Navigate to StackMapNative/Fonts and select MaterialIcons.ttf"
echo "5. Make sure 'Copy items if needed' and 'Add to targets: StackMapNative' are checked"
echo "6. Click Add"
echo "7. Open Info.plist"
echo "8. Add a new row: 'Fonts provided by application' (UIAppFonts)"
echo "9. Add item: 'MaterialIcons.ttf'"
echo "10. Clean build folder (Cmd+Shift+K) and rebuild"

echo ""
echo "Alternative: Add this to Info.plist manually:"
echo "<key>UIAppFonts</key>"
echo "<array>"
echo "    <string>MaterialIcons.ttf</string>"
echo "</array>"