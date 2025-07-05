#!/bin/bash
echo "Opening Android Studio AVD Manager..."
echo ""
echo "Please create a tablet emulator with these steps:"
echo "1. Click 'Create Virtual Device' button"
echo "2. Select 'Tablet' category on the left"
echo "3. Choose 'Pixel Tablet' or '10.1 WXGA (Tablet)'"
echo "4. Click Next"
echo "5. Select 'API 36' system image (same as your phone)"
echo "6. Click Next, then Finish"
echo ""
echo "Name it: Pixel_Tablet"
echo ""

# Open Android Studio
open -a "Android Studio"

echo "Press Enter after you've created the tablet in AVD Manager..."
read

# Check if it was created
if emulator -list-avds | grep -q "Pixel_Tablet"; then
    echo "✅ Great! Found Pixel_Tablet"
    
    # Start the tablet
    echo "Starting tablet emulator..."
    emulator -avd Pixel_Tablet &
    
    echo "Waiting for tablet to boot..."
    sleep 30
    adb wait-for-device
    
    # Install StackMap
    echo "Installing StackMap..."
    TABLET=$(adb devices | grep emulator | tail -1 | cut -f1)
    adb -s $TABLET install android/app/build/outputs/apk/release/app-release.apk
    
    echo "✅ Done! StackMap is installed on the tablet"
else
    echo "❌ Couldn't find Pixel_Tablet. Please make sure you named it exactly 'Pixel_Tablet'"
fi