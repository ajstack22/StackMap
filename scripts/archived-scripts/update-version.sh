#!/bin/bash
# Version Update Script for StackMap

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[VERSION]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if version provided
if [ -z "$1" ]; then
    print_error "No version provided"
    echo "Usage: $0 <version> [build-number]"
    echo "Example: $0 1.2.0 42"
    exit 1
fi

VERSION=$1
BUILD_NUMBER=${2:-$(date +%Y%m%d%H%M)}

print_status "Updating to version $VERSION (build $BUILD_NUMBER)"

# Update package.json
print_status "Updating package.json..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
else
    sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
fi

# Update Android version
print_status "Updating Android version..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/versionName \".*\"/versionName \"$VERSION\"/" android/app/build.gradle
    sed -i '' "s/versionCode [0-9]*/versionCode $BUILD_NUMBER/" android/app/build.gradle
else
    sed -i "s/versionName \".*\"/versionName \"$VERSION\"/" android/app/build.gradle
    sed -i "s/versionCode [0-9]*/versionCode $BUILD_NUMBER/" android/app/build.gradle
fi

# Update iOS version
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Updating iOS version..."
    /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" ios/App/App/Info.plist
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" ios/App/App/Info.plist
else
    print_status "Skipping iOS version update (not on macOS)"
fi

# Update capacitor.config.json if it has version
if grep -q "\"version\"" capacitor.config.json; then
    print_status "Updating capacitor.config.json..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" capacitor.config.json
    else
        sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" capacitor.config.json
    fi
fi

# Update app version in JavaScript
print_status "Updating app version in JavaScript..."
cat > js/app-version.js << EOF
// Auto-generated version file
window.APP_VERSION = '$VERSION';
window.APP_BUILD = '$BUILD_NUMBER';
window.APP_RELEASE_DATE = '$(date -u +%Y-%m-%dT%H:%M:%SZ)';
EOF

# Sync with Capacitor
print_status "Syncing with Capacitor..."
npx cap sync

print_success "Version updated to $VERSION (build $BUILD_NUMBER)"
echo ""
echo "Next steps:"
echo "1. Commit version changes"
echo "2. Create git tag: git tag -a v$VERSION -m \"Release v$VERSION\""
echo "3. Build release versions"
echo "4. Deploy to stores"