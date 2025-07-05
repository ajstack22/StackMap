#!/bin/bash
echo "Starting Android emulator..."
emulator -avd Medium_Phone_API_36.0 &
EMULATOR_PID=$!

echo "Waiting for emulator to boot (this may take 1-2 minutes)..."
adb wait-for-device

# Wait a bit more for full boot
sleep 10

echo "Checking if emulator is ready..."
while [ "$(adb shell getprop sys.boot_completed 2>/dev/null)" != "1" ]; do
    echo "Still booting..."
    sleep 5
done

echo "Emulator ready! Installing APK..."
adb install android/app/build/outputs/apk/release/app-release.apk

if [ $? -eq 0 ]; then
    echo "✅ StackMap installed successfully!"
    echo "Look for the StackMap app icon in the emulator"
else
    echo "❌ Installation failed"
fi