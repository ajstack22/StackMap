#!/bin/bash

# StackMap Version Verification Script
# Checks that all platforms have synchronized versions

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get version from version.json
ROOT_VERSION=$(jq -r '.version' version.json)
ROOT_BUILD=$(jq -r '.build' version.json)

echo -e "${BLUE}StackMap Version Verification${NC}"
echo -e "${BLUE}═══════════════════════════════${NC}"
echo ""
echo -e "Expected version: ${YELLOW}$ROOT_VERSION-build$ROOT_BUILD${NC}"
echo ""

# Check Web version
WEB_VERSION=$(grep "APP_VERSION:" config/constants.js | sed -E "s/.*APP_VERSION: '([^']+)'.*/\1/" || echo "NOT FOUND")
WEB_BUILD_DATE=$(grep "APP_BUILD_DATE:" config/constants.js | sed -E "s/.*APP_BUILD_DATE: '([^']+)'.*/\1/" || echo "NOT FOUND")

if [ "$WEB_VERSION" = "$ROOT_VERSION" ]; then
    echo -e "${GREEN}✓ Web:     $WEB_VERSION (updated $WEB_BUILD_DATE)${NC}"
else
    echo -e "${RED}✗ Web:     $WEB_VERSION (MISMATCH)${NC}"
fi

# Check Android version
if [ -f "android/app/build.gradle" ]; then
    ANDROID_VERSION=$(grep "versionName" android/app/build.gradle | sed -E 's/.*versionName "([^"]+)".*/\1/' || echo "NOT FOUND")
    ANDROID_CODE=$(grep "versionCode" android/app/build.gradle | sed -E 's/.*versionCode ([0-9]+).*/\1/' || echo "0")
    
    if [ "$ANDROID_VERSION" = "$ROOT_VERSION" ]; then
        echo -e "${GREEN}✓ Android: $ANDROID_VERSION (versionCode: $ANDROID_CODE)${NC}"
    else
        echo -e "${RED}✗ Android: $ANDROID_VERSION (MISMATCH)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Android: Not configured${NC}"
fi

# Check iOS version
if [ -f "ios/App/App/Info.plist" ]; then
    # Use different method for macOS vs Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        IOS_VERSION=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" ios/App/App/Info.plist 2>/dev/null || echo "NOT FOUND")
        IOS_BUILD=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" ios/App/App/Info.plist 2>/dev/null || echo "NOT FOUND")
    else
        # Fallback for non-macOS systems
        IOS_VERSION=$(grep -A1 "CFBundleShortVersionString" ios/App/App/Info.plist | grep string | sed 's/.*<string>\(.*\)<\/string>/\1/' || echo "NOT FOUND")
        IOS_BUILD=$(grep -A1 "CFBundleVersion" ios/App/App/Info.plist | grep string | sed 's/.*<string>\(.*\)<\/string>/\1/' || echo "NOT FOUND")
    fi
    
    if [ "$IOS_VERSION" = "$ROOT_VERSION" ]; then
        echo -e "${GREEN}✓ iOS:     $IOS_VERSION (build: $IOS_BUILD)${NC}"
    else
        echo -e "${RED}✗ iOS:     $IOS_VERSION (MISMATCH)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ iOS:     Not configured${NC}"
fi

# Check www directory (build output)
if [ -d "www" ] && [ -f "www/config/constants.js" ]; then
    WWW_VERSION=$(grep "APP_VERSION:" www/config/constants.js | sed -E "s/.*APP_VERSION: '([^']+)'.*/\1/" || echo "NOT FOUND")
    
    if [ "$WWW_VERSION" = "$ROOT_VERSION" ]; then
        echo -e "${GREEN}✓ WWW:     $WWW_VERSION (build output)${NC}"
    else
        echo -e "${RED}✗ WWW:     $WWW_VERSION (MISMATCH - run build-capacitor.sh)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ WWW:     Not built yet${NC}"
fi

echo ""

# Summary
if [ "$WEB_VERSION" = "$ROOT_VERSION" ]; then
    echo -e "${GREEN}All detected platforms are synchronized!${NC}"
else
    echo -e "${RED}Version mismatch detected!${NC}"
    echo -e "${YELLOW}Run ./scripts/unified-deploy.sh to synchronize all platforms.${NC}"
    exit 1
fi