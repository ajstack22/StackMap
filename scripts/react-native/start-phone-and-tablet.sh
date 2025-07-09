#!/bin/bash
echo "Starting phone and tablet emulators..."

# Start phone emulator
echo "Starting phone..."
emulator -avd Medium_Phone_API_36.0 > /dev/null 2>&1 &
PHONE_PID=$!

# Wait a bit before starting tablet to avoid resource conflicts
sleep 5

# Start tablet emulator (adjust name if different)
echo "Starting tablet..."
emulator -avd Pixel_Tablet_API_33 > /dev/null 2>&1 &
TABLET_PID=$!

echo "Waiting for devices to be ready..."
adb wait-for-device

# Wait for both to fully boot
echo "Waiting for boot completion..."
while [ "$(adb devices | grep emulator | wc -l)" -lt "2" ]; do
    echo "Waiting for both emulators..."
    sleep 5
done

# Install on both devices
echo "Installing StackMap on all connected devices..."
for device in $(adb devices | grep emulator | cut -f1); do
    echo "Installing on $device..."
    adb -s $device install android/app/build/outputs/apk/release/app-release.apk
done

echo "✅ Done! StackMap installed on both phone and tablet"