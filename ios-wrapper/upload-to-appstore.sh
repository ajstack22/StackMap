#!/bin/bash

# StackMap iOS App Store Upload Script
# This script uploads the built app to App Store Connect

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IPA_PATH="build/Export/StackMap.ipa"
APP_STORE_CONNECT_API_KEY_PATH="path/to/AuthKey_XXXXXXXXXX.p8"
KEY_ID="YOUR_KEY_ID"
ISSUER_ID="YOUR_ISSUER_ID"

echo -e "${GREEN}Starting App Store upload process...${NC}"

# Check if IPA exists
if [ ! -f "$IPA_PATH" ]; then
    echo -e "${RED}IPA file not found at $IPA_PATH${NC}"
    echo -e "${YELLOW}Please run build.sh first and export the IPA${NC}"
    exit 1
fi

# Validate the app
echo -e "${YELLOW}Validating app...${NC}"
xcrun altool --validate-app \
    -f "$IPA_PATH" \
    -t ios \
    --apiKey "$KEY_ID" \
    --apiIssuer "$ISSUER_ID" \
    --apiKeyPath "$APP_STORE_CONNECT_API_KEY_PATH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Validation successful!${NC}"
else
    echo -e "${RED}Validation failed!${NC}"
    exit 1
fi

# Upload to App Store Connect
echo -e "${YELLOW}Uploading to App Store Connect...${NC}"
xcrun altool --upload-app \
    -f "$IPA_PATH" \
    -t ios \
    --apiKey "$KEY_ID" \
    --apiIssuer "$ISSUER_ID" \
    --apiKeyPath "$APP_STORE_CONNECT_API_KEY_PATH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Upload successful!${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Log in to App Store Connect"
    echo "2. Complete app information"
    echo "3. Add screenshots and descriptions"
    echo "4. Submit for review"
else
    echo -e "${RED}Upload failed!${NC}"
    exit 1
fi