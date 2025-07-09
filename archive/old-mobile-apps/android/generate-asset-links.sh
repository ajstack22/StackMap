#!/bin/bash

# Script to generate Digital Asset Links for Android App Links / TWA

set -e

KEYSTORE_PATH=""
KEYSTORE_ALIAS=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}StackMap Android Digital Asset Links Generator${NC}"
echo "================================================"

# Function to generate SHA256 fingerprint
generate_fingerprint() {
    local keystore=$1
    local alias=$2
    
    echo -e "\n${YELLOW}Generating SHA256 fingerprint...${NC}"
    
    # Extract the SHA256 fingerprint
    fingerprint=$(keytool -list -v -keystore "$keystore" -alias "$alias" 2>/dev/null | grep "SHA256:" | awk '{print $2}' | tr -d ':')
    
    if [ -z "$fingerprint" ]; then
        echo -e "${RED}Error: Could not extract SHA256 fingerprint${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}SHA256 Fingerprint: ${fingerprint}${NC}"
    
    # Generate assetlinks.json content
    cat > assetlinks.json << EOF
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.stackmap.app",
    "sha256_cert_fingerprints": [
      "$fingerprint"
    ]
  }
}]
EOF
    
    echo -e "\n${GREEN}Generated assetlinks.json file${NC}"
    echo -e "${YELLOW}Contents:${NC}"
    cat assetlinks.json
    
    # Update the asset links in the Android project
    cp assetlinks.json app/src/main/assets/.well-known/assetlinks.json
    echo -e "\n${GREEN}Updated app/src/main/assets/.well-known/assetlinks.json${NC}"
}

# Check if we're in the android directory
if [ ! -f "build.gradle" ] || [ ! -d "app" ]; then
    echo -e "${RED}Error: This script must be run from the android directory${NC}"
    exit 1
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keystore)
            KEYSTORE_PATH="$2"
            shift 2
            ;;
        --alias)
            KEYSTORE_ALIAS="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 --keystore <path> --alias <alias>"
            exit 1
            ;;
    esac
done

# Check for debug keystore if no keystore specified
if [ -z "$KEYSTORE_PATH" ]; then
    DEBUG_KEYSTORE="$HOME/.android/debug.keystore"
    if [ -f "$DEBUG_KEYSTORE" ]; then
        echo -e "${YELLOW}No keystore specified, using debug keystore${NC}"
        KEYSTORE_PATH="$DEBUG_KEYSTORE"
        KEYSTORE_ALIAS="androiddebugkey"
    else
        echo -e "${RED}Error: No keystore specified and debug keystore not found${NC}"
        echo "Usage: $0 --keystore <path> --alias <alias>"
        exit 1
    fi
fi

# Verify keystore exists
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo -e "${RED}Error: Keystore not found at $KEYSTORE_PATH${NC}"
    exit 1
fi

# Generate fingerprint
generate_fingerprint "$KEYSTORE_PATH" "$KEYSTORE_ALIAS"

echo -e "\n${GREEN}Digital Asset Links generation complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Upload the assetlinks.json file to: https://stackmap.app/.well-known/assetlinks.json"
echo "2. Ensure the file is served with Content-Type: application/json"
echo "3. The file must be accessible via HTTPS without redirects"
echo "4. Test your setup at: https://developers.google.com/digital-asset-links/tools/generator"