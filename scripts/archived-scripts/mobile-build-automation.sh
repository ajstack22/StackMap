#!/bin/bash
# Mobile Build Automation Script for StackMap
# This script automates the build process for both iOS and Android

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Capacitor
    if ! command -v cap &> /dev/null; then
        print_warning "Capacitor CLI not found globally, using local version"
    fi
    
    print_success "Prerequisites check passed"
}

# Function to sync web assets
sync_web_assets() {
    print_status "Syncing web assets to platform folders..."
    
    # Copy to www directory first
    rm -rf www
    mkdir -p www
    cp -r *.html *.js *.json *.xml *.png components config data demo js styles timer utils www/
    
    # Sync with Capacitor
    npx cap sync
    
    print_success "Web assets synced"
}

# Function to build iOS
build_ios() {
    print_status "Building iOS app..."
    
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "iOS builds can only be created on macOS"
        return 1
    fi
    
    cd ios/App
    
    # Clean build folder
    print_status "Cleaning iOS build folder..."
    xcodebuild clean -workspace App.xcworkspace -scheme App -configuration Release
    
    # Archive the app
    print_status "Creating iOS archive..."
    xcodebuild archive \
        -workspace App.xcworkspace \
        -scheme App \
        -configuration Release \
        -archivePath ../build/App.xcarchive \
        -allowProvisioningUpdates \
        -destination 'generic/platform=iOS'
    
    # Export IPA
    print_status "Exporting IPA..."
    xcodebuild -exportArchive \
        -archivePath ../build/App.xcarchive \
        -exportPath ../build \
        -exportOptionsPlist ../exportOptions.plist \
        -allowProvisioningUpdates
    
    cd ../..
    print_success "iOS build completed"
}

# Function to build Android
build_android() {
    print_status "Building Android app..."
    
    cd android
    
    # Clean build
    print_status "Cleaning Android build..."
    ./gradlew clean
    
    # Build debug APK
    if [[ "$BUILD_TYPE" == "debug" ]]; then
        print_status "Building debug APK..."
        ./gradlew assembleDebug
        print_success "Debug APK created at: app/build/outputs/apk/debug/"
    fi
    
    # Build release APK
    if [[ "$BUILD_TYPE" == "release" ]]; then
        print_status "Building release APK..."
        ./gradlew assembleRelease
        print_success "Release APK created at: app/build/outputs/apk/release/"
        
        # Build AAB for Play Store
        print_status "Building release Bundle (AAB)..."
        ./gradlew bundleRelease
        print_success "Release Bundle created at: app/build/outputs/bundle/release/"
    fi
    
    cd ..
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Run web tests
    npm test
    
    # Run Android tests if building Android
    if [[ "$PLATFORM" == "android" ]] || [[ "$PLATFORM" == "all" ]]; then
        cd android
        ./gradlew test
        cd ..
    fi
    
    print_success "All tests passed"
}

# Function to create build report
create_build_report() {
    print_status "Creating build report..."
    
    REPORT_FILE="build-reports/build-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p build-reports
    
    cat > "$REPORT_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "platform": "$PLATFORM",
    "buildType": "$BUILD_TYPE",
    "gitCommit": "$(git rev-parse HEAD)",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD)",
    "nodeVersion": "$(node -v)",
    "npmVersion": "$(npm -v)",
    "status": "success",
    "artifacts": {
        "ios": {
            "ipa": "ios/build/App.ipa",
            "archive": "ios/build/App.xcarchive"
        },
        "android": {
            "apk": "android/app/build/outputs/apk/$BUILD_TYPE/",
            "aab": "android/app/build/outputs/bundle/$BUILD_TYPE/"
        }
    }
}
EOF
    
    print_success "Build report created: $REPORT_FILE"
}

# Main script
main() {
    # Parse arguments
    PLATFORM=${1:-all}
    BUILD_TYPE=${2:-debug}
    
    print_status "Starting StackMap mobile build process"
    print_status "Platform: $PLATFORM"
    print_status "Build type: $BUILD_TYPE"
    
    # Check prerequisites
    check_prerequisites
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci
    
    # Run pre-build hooks
    if [ -f ".git/hooks/pre-build" ]; then
        print_status "Running pre-build hooks..."
        ./.git/hooks/pre-build
    fi
    
    # Sync web assets
    sync_web_assets
    
    # Run tests
    if [[ "$SKIP_TESTS" != "true" ]]; then
        run_tests
    fi
    
    # Build platforms
    case $PLATFORM in
        ios)
            build_ios
            ;;
        android)
            build_android
            ;;
        all)
            build_android
            if [[ "$OSTYPE" == "darwin"* ]]; then
                build_ios
            else
                print_warning "Skipping iOS build on non-macOS system"
            fi
            ;;
        *)
            print_error "Invalid platform: $PLATFORM"
            echo "Usage: $0 [ios|android|all] [debug|release]"
            exit 1
            ;;
    esac
    
    # Create build report
    create_build_report
    
    print_success "Build process completed successfully!"
}

# Run main function
main "$@"