#!/bin/bash

# Update mobile app versions for production deployment
# Format: YY.MM.DD for version string, YYMMDDXXX for version code (XXX = build number)

set -e

echo "📱 Updating Mobile App Versions"
echo "================================"

# Get today's date in the required formats
DATE_SHORT=$(date +%y.%m.%d)  # Format: 25.09.01
DATE_BASE=$(date +%y%m%d)      # Format: 250901

# Find the highest existing build number for today
CURRENT_VERSION_CODE=$(grep "versionCode" android/app/build.gradle | grep -o '[0-9]*' | head -1)
TODAY_PREFIX="${DATE_BASE}"

# If current version starts with today's date, increment the build number
if [[ "$CURRENT_VERSION_CODE" == ${TODAY_PREFIX}* ]]; then
    # Extract the build number (last 3 digits)
    CURRENT_BUILD=${CURRENT_VERSION_CODE:6:3}
    # Remove leading zeros and increment
    NEXT_BUILD=$((10#$CURRENT_BUILD + 1))
else
    # Start with build 001 for a new day
    NEXT_BUILD=1
fi

# Format build number with leading zeros (3 digits)
BUILD_NUM=$(printf "%03d" $NEXT_BUILD)
DATE_CODE="${DATE_BASE}${BUILD_NUM}"  # Format: 250901001

echo "Setting versions to:"
echo "  Version String: $DATE_SHORT"
echo "  Version Code: $DATE_CODE (build #$BUILD_NUM for today)"
echo ""

# Update Android versions
echo "Updating Android versions..."
sed -i '' "s/versionCode [0-9]*/versionCode $DATE_CODE/" android/app/build.gradle
sed -i '' "s/versionName \"[^\"]*\"/versionName \"$DATE_SHORT\"/" android/app/build.gradle

# Update iOS versions
echo "Updating iOS versions..."
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $DATE_SHORT" ios/StackMapNative/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $DATE_CODE" ios/StackMapNative/Info.plist

echo ""
echo "✅ Version numbers updated successfully!"
echo ""
echo "Android:"
grep "versionCode\|versionName" android/app/build.gradle | grep -v "//" | head -2
echo ""
echo "iOS:"
echo "  CFBundleShortVersionString: $DATE_SHORT"
echo "  CFBundleVersion: $DATE_CODE"