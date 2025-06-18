#!/bin/bash

# StackMap iOS Build Script
# This script builds the iOS app for distribution

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="StackMap"
SCHEME_NAME="StackMap"
WORKSPACE_PATH="$PROJECT_NAME.xcodeproj"
BUILD_PATH="build"
ARCHIVE_PATH="$BUILD_PATH/$PROJECT_NAME.xcarchive"
EXPORT_PATH="$BUILD_PATH/Export"

echo -e "${GREEN}Starting StackMap iOS build process...${NC}"

# Clean previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf "$BUILD_PATH"
mkdir -p "$BUILD_PATH"

# Build archive
echo -e "${YELLOW}Building archive...${NC}"
xcodebuild archive \
    -project "$WORKSPACE_PATH" \
    -scheme "$SCHEME_NAME" \
    -archivePath "$ARCHIVE_PATH" \
    -configuration Release \
    -sdk iphoneos \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO \
    ONLY_ACTIVE_ARCH=NO

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Archive build successful!${NC}"
else
    echo -e "${RED}Archive build failed!${NC}"
    exit 1
fi

# Export IPA (requires proper signing)
echo -e "${YELLOW}Exporting IPA...${NC}"
echo -e "${YELLOW}Note: You'll need to configure code signing in Xcode for distribution${NC}"

# Create export options plist
cat > "$BUILD_PATH/ExportOptions.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <true/>
    <key>compileBitcode</key>
    <true/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOF

echo -e "${GREEN}Build complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open $WORKSPACE_PATH in Xcode"
echo "2. Configure your Apple Developer Team ID"
echo "3. Set up code signing certificates"
echo "4. Run 'xcodebuild -exportArchive' with proper signing"
echo "5. Upload to App Store Connect"

echo -e "${GREEN}Archive location: $ARCHIVE_PATH${NC}"