#!/bin/bash

# Script to generate release signing key for StackMap Android app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}StackMap Android Release Key Generator${NC}"
echo "======================================="

# Default values
KEYSTORE_NAME="stackmap-release.keystore"
KEY_ALIAS="stackmap-key"
VALIDITY_DAYS=10000 # ~27 years

# Check if keystore already exists
if [ -f "$KEYSTORE_NAME" ]; then
    echo -e "${YELLOW}Warning: Keystore already exists at $KEYSTORE_NAME${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    rm -f "$KEYSTORE_NAME"
fi

echo -e "\n${YELLOW}Please provide the following information for your release key:${NC}"
echo "(Press Enter to use default values shown in brackets)"

# Gather information
read -p "Key alias [$KEY_ALIAS]: " input_alias
KEY_ALIAS=${input_alias:-$KEY_ALIAS}

read -p "Your full name: " CN
while [ -z "$CN" ]; do
    echo -e "${RED}Full name is required${NC}"
    read -p "Your full name: " CN
done

read -p "Organizational unit (e.g., Development): " OU
OU=${OU:-Development}

read -p "Organization name: " O
O=${O:-StackMap}

read -p "City or Locality: " L
while [ -z "$L" ]; do
    echo -e "${RED}City is required${NC}"
    read -p "City or Locality: " L
done

read -p "State or Province: " ST
while [ -z "$ST" ]; do
    echo -e "${RED}State is required${NC}"
    read -p "State or Province: " ST
done

read -p "Country code (2 letters, e.g., US): " C
while [ -z "$C" ] || [ ${#C} -ne 2 ]; do
    echo -e "${RED}Valid 2-letter country code is required${NC}"
    read -p "Country code (2 letters): " C
done

# Generate the key
echo -e "\n${YELLOW}Generating release key...${NC}"
keytool -genkeypair -v \
    -keystore "$KEYSTORE_NAME" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity $VALIDITY_DAYS \
    -dname "CN=$CN, OU=$OU, O=$O, L=$L, ST=$ST, C=$C"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Release key generated successfully!${NC}"
    
    # Generate key properties file
    echo -e "\n${YELLOW}Creating key.properties file...${NC}"
    cat > key.properties << EOF
# Release key properties for StackMap
# IMPORTANT: Do not commit this file to version control!

storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=$KEY_ALIAS
storeFile=../$KEYSTORE_NAME
EOF
    
    # Update .gitignore
    if ! grep -q "key.properties" .gitignore 2>/dev/null; then
        echo -e "\n# Android signing" >> .gitignore
        echo "key.properties" >> .gitignore
        echo "*.keystore" >> .gitignore
        echo "*.jks" >> .gitignore
        echo -e "${GREEN}✓${NC} Updated .gitignore"
    fi
    
    # Create gradle properties template
    echo -e "\n${YELLOW}Creating gradle.properties template...${NC}"
    if [ ! -f gradle.properties ]; then
        cat > gradle.properties << EOF
# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx4096m
android.useAndroidX=true
android.enableJetifier=true

# Signing properties (set these in your local environment)
# STACKMAP_UPLOAD_STORE_FILE=../stackmap-release.keystore
# STACKMAP_UPLOAD_STORE_PASSWORD=your_store_password
# STACKMAP_UPLOAD_KEY_ALIAS=$KEY_ALIAS
# STACKMAP_UPLOAD_KEY_PASSWORD=your_key_password
EOF
        echo -e "${GREEN}✓${NC} Created gradle.properties template"
    fi
    
    echo -e "\n${GREEN}Setup complete!${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Update key.properties with your actual passwords"
    echo "2. Set the signing properties in gradle.properties or as environment variables"
    echo "3. Keep $KEYSTORE_NAME in a secure location"
    echo "4. Back up your keystore file - losing it means you can't update your app!"
    echo -e "\n${YELLOW}To build a signed release APK:${NC}"
    echo "   ./gradlew assembleRelease"
    echo -e "\n${YELLOW}To build a signed release Bundle (AAB):${NC}"
    echo "   ./gradlew bundleRelease"
else
    echo -e "\n${RED}Error: Failed to generate release key${NC}"
    exit 1
fi