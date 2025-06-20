#!/bin/bash

# Script to build release APK and AAB for StackMap Android app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}StackMap Android Release Build${NC}"
echo "================================"

# Check if we're in the android directory
if [ ! -f "build.gradle" ] || [ ! -d "app" ]; then
    echo -e "${RED}Error: This script must be run from the android directory${NC}"
    exit 1
fi

# Check for signing configuration
if [ ! -f "gradle.properties" ]; then
    echo -e "${RED}Error: gradle.properties not found${NC}"
    echo "Please run ./generate-release-key.sh first"
    exit 1
fi

# Check if signing properties are set
if ! grep -q "STACKMAP_UPLOAD_STORE_FILE" gradle.properties || grep -q "^#.*STACKMAP_UPLOAD_STORE_FILE" gradle.properties; then
    echo -e "${YELLOW}Warning: Signing properties not configured in gradle.properties${NC}"
    echo "Checking for environment variables..."
    
    if [ -z "$STACKMAP_UPLOAD_STORE_FILE" ] || [ -z "$STACKMAP_UPLOAD_STORE_PASSWORD" ] || [ -z "$STACKMAP_UPLOAD_KEY_ALIAS" ] || [ -z "$STACKMAP_UPLOAD_KEY_PASSWORD" ]; then
        echo -e "${RED}Error: Signing configuration not found${NC}"
        echo "Please either:"
        echo "1. Uncomment and set the properties in gradle.properties"
        echo "2. Set the following environment variables:"
        echo "   - STACKMAP_UPLOAD_STORE_FILE"
        echo "   - STACKMAP_UPLOAD_STORE_PASSWORD"
        echo "   - STACKMAP_UPLOAD_KEY_ALIAS"
        echo "   - STACKMAP_UPLOAD_KEY_PASSWORD"
        exit 1
    fi
fi

# Sync Capacitor
echo -e "\n${YELLOW}Syncing Capacitor...${NC}"
cd .. && npx cap sync android && cd android

# Update version code and name from package.json
echo -e "\n${YELLOW}Updating version from package.json...${NC}"
VERSION=$(cd .. && node -p "require('./package.json').version")
VERSION_CODE=$(echo $VERSION | sed 's/\.//g' | sed 's/^0*//')
echo "Version: $VERSION (code: $VERSION_CODE)"

# Clean previous builds
echo -e "\n${YELLOW}Cleaning previous builds...${NC}"
./gradlew clean

# Build release APK
echo -e "\n${YELLOW}Building release APK...${NC}"
./gradlew assembleRelease

# Build release Bundle (AAB)
echo -e "\n${YELLOW}Building release Bundle (AAB)...${NC}"
./gradlew bundleRelease

# Create output directory
OUTPUT_DIR="release-builds"
mkdir -p $OUTPUT_DIR

# Check if builds were successful
echo -e "\n${YELLOW}Checking build outputs...${NC}"

if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    cp app/build/outputs/apk/release/app-release.apk "$OUTPUT_DIR/stackmap-v${VERSION}-release.apk"
    echo -e "${GREEN}✓${NC} Release APK: $OUTPUT_DIR/stackmap-v${VERSION}-release.apk"
    size=$(ls -lh "$OUTPUT_DIR/stackmap-v${VERSION}-release.apk" | awk '{print $5}')
    echo -e "  Size: ${YELLOW}$size${NC}"
else
    echo -e "${RED}✗${NC} Release APK build failed!"
fi

if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
    cp app/build/outputs/bundle/release/app-release.aab "$OUTPUT_DIR/stackmap-v${VERSION}-release.aab"
    echo -e "${GREEN}✓${NC} Release Bundle: $OUTPUT_DIR/stackmap-v${VERSION}-release.aab"
    size=$(ls -lh "$OUTPUT_DIR/stackmap-v${VERSION}-release.aab" | awk '{print $5}')
    echo -e "  Size: ${YELLOW}$size${NC}"
else
    echo -e "${RED}✗${NC} Release Bundle build failed!"
fi

# Generate checksums
echo -e "\n${YELLOW}Generating checksums...${NC}"
cd $OUTPUT_DIR
if command -v shasum &> /dev/null; then
    shasum -a 256 *.apk *.aab > checksums.txt 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Checksums saved to $OUTPUT_DIR/checksums.txt"
fi
cd ..

echo -e "\n${GREEN}Build complete!${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Test the APK on a device: adb install $OUTPUT_DIR/stackmap-v${VERSION}-release.apk"
echo "2. Upload the AAB to Google Play Console"
echo "3. Generate and test Digital Asset Links"
echo "4. Submit for review"