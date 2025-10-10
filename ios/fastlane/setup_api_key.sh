#!/bin/bash
# FastLane API Key Setup Helper
# Automates moving and configuring your App Store Connect API Key

set -e

echo "🔑 FastLane API Key Setup"
echo "=========================="
echo ""

# Find AuthKey file
echo "🔍 Looking for AuthKey_*.p8 file..."
API_KEY_FILE=$(find ~/Downloads ~/Desktop ~/Documents ~ -maxdepth 1 -name "AuthKey_*.p8" -type f 2>/dev/null | head -1)

if [ -z "$API_KEY_FILE" ]; then
    echo "❌ Could not find AuthKey_*.p8 file in common locations"
    echo ""
    echo "Please specify the path to your AuthKey file:"
    read -p "Path: " API_KEY_FILE

    if [ ! -f "$API_KEY_FILE" ]; then
        echo "❌ File not found: $API_KEY_FILE"
        exit 1
    fi
fi

echo "✅ Found: $API_KEY_FILE"
echo ""

# Extract Key ID from filename
FILENAME=$(basename "$API_KEY_FILE")
KEY_ID=$(echo "$FILENAME" | sed 's/AuthKey_\(.*\)\.p8/\1/')

echo "📝 Extracted Key ID: $KEY_ID"
echo ""

# Move to secure location
echo "📦 Moving API Key to ~/.fastlane/ ..."
mkdir -p ~/.fastlane
cp "$API_KEY_FILE" ~/.fastlane/
chmod 600 ~/.fastlane/"$FILENAME"
echo "✅ Secured: ~/.fastlane/$FILENAME"
echo ""

# Get Issuer ID
echo "🌐 Get your Issuer ID from App Store Connect:"
echo "   https://appstoreconnect.apple.com/access/api"
echo ""
echo "   Look at the top of the page for 'Issuer ID'"
echo "   (Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
echo ""
read -p "Paste Issuer ID: " ISSUER_ID

if [ -z "$ISSUER_ID" ]; then
    echo "❌ Issuer ID is required"
    exit 1
fi

echo ""
echo "✅ Got Issuer ID: $ISSUER_ID"
echo ""

# Update .env file
ENV_FILE="$(dirname "$0")/.env"
echo "📝 Updating $ENV_FILE ..."

sed -i.bak "s|APP_STORE_CONNECT_API_KEY_KEY_ID=.*|APP_STORE_CONNECT_API_KEY_KEY_ID=\"$KEY_ID\"|g" "$ENV_FILE"
sed -i.bak "s|APP_STORE_CONNECT_API_KEY_ISSUER_ID=.*|APP_STORE_CONNECT_API_KEY_ISSUER_ID=\"$ISSUER_ID\"|g" "$ENV_FILE"
sed -i.bak "s|APP_STORE_CONNECT_API_KEY_KEY=.*|APP_STORE_CONNECT_API_KEY_KEY=\"~/.fastlane/$FILENAME\"|g" "$ENV_FILE"

rm "$ENV_FILE.bak"

echo "✅ Configuration updated!"
echo ""

# Show final config
echo "📋 Final Configuration:"
echo "   Key ID: $KEY_ID"
echo "   Issuer ID: $ISSUER_ID"
echo "   Key File: ~/.fastlane/$FILENAME"
echo ""

# Validate
echo "🔍 Validating environment..."
cd "$(dirname "$0")/.."

if command -v fastlane &> /dev/null; then
    export PATH="$HOME/.rbenv/shims:$PATH"
    fastlane validate_environment || echo "⚠️  Validation warnings (may be ok)"
else
    echo "⚠️  Fastlane not in PATH, skipping validation"
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "  cd ~/StackMap/StackMap/ios"
echo "  fastlane build_release    # Test build"
echo "  fastlane beta_ios         # Deploy to TestFlight!"
echo ""
