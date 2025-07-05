#!/bin/bash
echo "Clearing old logs..."
adb logcat -c

echo "Starting app and monitoring logs..."
echo "Please launch the StackMap app on your device now..."
echo ""
echo "Watching for crashes (press Ctrl+C to stop):"
echo "========================================"

# Filter for React Native and crash-related logs
adb logcat -v time | grep -E "(ReactNative|ReactNativeJS|AndroidRuntime|FATAL|StackMap|com.stackmapnative)" | grep -v "eglCodecCommon"