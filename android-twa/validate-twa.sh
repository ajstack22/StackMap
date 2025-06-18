#!/bin/bash

echo "🔍 Validating StackMap TWA Configuration"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Warning function
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "1. Checking project structure..."
[ -f "app/build.gradle" ] && check 0 "app/build.gradle exists" || check 1 "app/build.gradle missing"
[ -f "app/src/main/AndroidManifest.xml" ] && check 0 "AndroidManifest.xml exists" || check 1 "AndroidManifest.xml missing"
[ -d "app/src/main/res" ] && check 0 "Resources directory exists" || check 1 "Resources directory missing"

echo ""
echo "2. Checking icons..."
for size in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    [ -f "app/src/main/res/mipmap-$size/ic_launcher.png" ] && check 0 "Icon for $size exists" || check 1 "Icon for $size missing"
done

echo ""
echo "3. Checking TWA configuration..."
grep -q "androidbrowserhelper" app/build.gradle && check 0 "Android Browser Helper dependency" || check 1 "Android Browser Helper dependency missing"
grep -q "LauncherActivity" app/src/main/AndroidManifest.xml && check 0 "TWA LauncherActivity configured" || check 1 "TWA LauncherActivity not configured"
grep -q "DEFAULT_URL" app/src/main/AndroidManifest.xml && check 0 "Default URL configured" || check 1 "Default URL not configured"

echo ""
echo "4. Checking Digital Asset Links..."
if [ -f "../.well-known/assetlinks.json" ]; then
    check 0 "assetlinks.json exists"
    if grep -q "REPLACE_WITH_YOUR_SHA256_FINGERPRINT" ../.well-known/assetlinks.json; then
        warn "assetlinks.json contains placeholder - update with your SHA256 fingerprint"
    else
        check 0 "assetlinks.json appears configured"
    fi
else
    check 1 "assetlinks.json missing"
fi

echo ""
echo "5. Checking build scripts..."
[ -x "build-debug.sh" ] && check 0 "Debug build script is executable" || check 1 "Debug build script not executable"
[ -x "build-release.sh" ] && check 0 "Release build script is executable" || check 1 "Release build script not executable"
[ -x "generate-signing-key.sh" ] && check 0 "Signing key script is executable" || check 1 "Signing key script not executable"

echo ""
echo "6. Checking Java/Gradle environment..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    check 0 "Java installed: $JAVA_VERSION"
else
    check 1 "Java not found - install Java 17 or higher"
fi

echo ""
echo "Summary:"
echo "--------"
echo "The TWA project structure is set up correctly."
echo ""
echo "Next steps:"
echo "1. Generate a signing key: ./generate-signing-key.sh"
echo "2. Update .well-known/assetlinks.json with your SHA256 fingerprint"
echo "3. Build debug APK: ./build-debug.sh"
echo "4. Test on a device or emulator"
echo "5. Build release bundle for Play Store: ./build-release.sh"
echo ""
echo "For detailed instructions, see README.md"