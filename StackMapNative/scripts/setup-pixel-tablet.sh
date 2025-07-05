#!/bin/bash
echo "Setting up Pixel Tablet emulator..."

# Set Android SDK paths
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH

# Find avdmanager
AVDMANAGER=$(find $ANDROID_HOME -name "avdmanager" -type f 2>/dev/null | head -1)

if [ -z "$AVDMANAGER" ]; then
    echo "❌ Error: avdmanager not found in Android SDK"
    exit 1
fi

echo "Found avdmanager at: $AVDMANAGER"

# Check if tablet already exists
if emulator -list-avds | grep -q "Pixel_Tablet"; then
    echo "✅ Pixel_Tablet already exists"
else
    echo "Creating Pixel Tablet AVD..."
    
    # Create the tablet AVD with the same system image as the phone
    echo "no" | $AVDMANAGER create avd \
        -n "Pixel_Tablet" \
        -k "system-images;android-36;google_apis_playstore;arm64-v8a" \
        -c 512M \
        -f
    
    # Configure tablet-specific settings
    AVD_CONFIG="$HOME/.android/avd/Pixel_Tablet.avd/config.ini"
    if [ -f "$AVD_CONFIG" ]; then
        echo "Configuring tablet display settings..."
        # Set tablet screen size and density
        echo "hw.lcd.width=2560" >> "$AVD_CONFIG"
        echo "hw.lcd.height=1600" >> "$AVD_CONFIG"
        echo "hw.lcd.density=320" >> "$AVD_CONFIG"
        echo "hw.device.name=Pixel Tablet" >> "$AVD_CONFIG"
        echo "skin.name=2560x1600" >> "$AVD_CONFIG"
    fi
fi

# Start the tablet
echo "Starting Pixel Tablet emulator..."
emulator -avd Pixel_Tablet &
TABLET_PID=$!

echo "Waiting for tablet to boot (this may take 2-3 minutes)..."
adb wait-for-device

# Wait for boot completion
while [ -z "$(adb devices | grep emulator.*device)" ]; do
    echo "Still booting..."
    sleep 5
done

# Additional wait for full boot
sleep 10

# Install StackMap
echo "Installing StackMap on tablet..."
TABLET_SERIAL=$(adb devices | grep emulator | tail -1 | cut -f1)

if [ -n "$TABLET_SERIAL" ]; then
    adb -s $TABLET_SERIAL install android/app/build/outputs/apk/release/app-release.apk
    
    if [ $? -eq 0 ]; then
        echo "✅ Success! StackMap installed on Pixel Tablet"
        echo "📱 Tablet serial: $TABLET_SERIAL"
    else
        echo "❌ Failed to install StackMap"
    fi
else
    echo "❌ Could not find tablet device"
fi

echo ""
echo "To install on tablet in the future, use:"
echo "adb -s $TABLET_SERIAL install android/app/build/outputs/apk/release/app-release.apk"