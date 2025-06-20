#!/bin/bash
# Google Play Console Deployment Script for StackMap Android App

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[PLAY CONSOLE]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check requirements
check_requirements() {
    print_status "Checking requirements..."
    
    # Check for Java
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed"
        exit 1
    fi
    
    # Check for bundletool (optional but recommended)
    if ! command -v bundletool &> /dev/null; then
        print_warning "bundletool not found. Install it for local testing: brew install bundletool"
    fi
    
    # Check for fastlane (if using fastlane)
    if [ "$USE_FASTLANE" == "true" ] && ! command -v fastlane &> /dev/null; then
        print_error "Fastlane is not installed but USE_FASTLANE is set to true"
        exit 1
    fi
    
    print_success "Requirements check passed"
}

# Build the app
build_app() {
    print_status "Building Android app for distribution..."
    
    cd android
    
    # Clean
    ./gradlew clean
    
    # Build release bundle
    print_status "Building release bundle (AAB)..."
    ./gradlew bundleRelease
    
    # Also build APK for testing
    print_status "Building release APK for testing..."
    ./gradlew assembleRelease
    
    cd ..
    
    print_success "Build completed successfully"
}

# Validate the bundle
validate_bundle() {
    print_status "Validating app bundle..."
    
    AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
    
    if [ ! -f "$AAB_PATH" ]; then
        print_error "App bundle not found at: $AAB_PATH"
        exit 1
    fi
    
    # Get file size
    AAB_SIZE=$(ls -lh "$AAB_PATH" | awk '{print $5}')
    print_status "Bundle size: $AAB_SIZE"
    
    # If bundletool is available, validate the bundle
    if command -v bundletool &> /dev/null; then
        print_status "Running bundletool validation..."
        bundletool validate --bundle="$AAB_PATH"
        print_success "Bundle validation passed"
    fi
    
    print_success "Bundle is ready for upload"
}

# Deploy using fastlane
deploy_with_fastlane() {
    print_status "Deploying with Fastlane..."
    
    cd android
    
    # Initialize fastlane if needed
    if [ ! -d "fastlane" ]; then
        print_status "Initializing Fastlane..."
        fastlane init
    fi
    
    # Deploy to internal track
    fastlane deploy track:internal
    
    cd ..
    
    print_success "Fastlane deployment completed"
}

# Deploy using Google Play API
deploy_with_api() {
    print_status "Deploying using Google Play API..."
    
    # This would require the Google Play Developer API
    # For now, we'll prepare the files and provide instructions
    
    AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
    MAPPING_PATH="android/app/build/outputs/mapping/release/mapping.txt"
    
    print_status "Files prepared for manual upload:"
    echo "  - App Bundle: $AAB_PATH"
    if [ -f "$MAPPING_PATH" ]; then
        echo "  - ProGuard mapping: $MAPPING_PATH"
    fi
    
    print_warning "Automated API deployment not configured. Please upload manually to Play Console."
    print_status "Steps for manual upload:"
    echo "  1. Go to https://play.google.com/console"
    echo "  2. Select your app"
    echo "  3. Go to 'Release' > 'Production' or 'Testing' > 'Internal testing'"
    echo "  4. Create a new release"
    echo "  5. Upload the AAB file"
    echo "  6. Upload the mapping file if using ProGuard/R8"
    echo "  7. Add release notes"
    echo "  8. Review and roll out"
}

# Create deployment report
create_deployment_report() {
    print_status "Creating deployment report..."
    
    REPORT_FILE="deployment-reports/play-console-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p deployment-reports
    
    # Get version info from build.gradle
    VERSION_NAME=$(grep versionName android/app/build.gradle | awk -F'"' '{print $2}' | head -1)
    VERSION_CODE=$(grep versionCode android/app/build.gradle | awk '{print $2}' | head -1)
    
    cat > "$REPORT_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "platform": "Android",
    "store": "Google Play Console",
    "versionName": "$VERSION_NAME",
    "versionCode": "$VERSION_CODE",
    "gitCommit": "$(git rev-parse HEAD)",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD)",
    "gitTag": "$(git describe --tags --abbrev=0 2>/dev/null || echo 'none')",
    "status": "prepared",
    "artifacts": {
        "aab": "android/app/build/outputs/bundle/release/app-release.aab",
        "apk": "android/app/build/outputs/apk/release/app-release.apk",
        "mapping": "android/app/build/outputs/mapping/release/mapping.txt"
    },
    "bundleSize": "$(ls -l android/app/build/outputs/bundle/release/app-release.aab | awk '{print $5}')",
    "apkSize": "$(ls -l android/app/build/outputs/apk/release/app-release.apk | awk '{print $5}')"
}
EOF
    
    print_success "Deployment report created: $REPORT_FILE"
}

# Generate release notes
generate_release_notes() {
    print_status "Generating release notes..."
    
    RELEASE_NOTES_FILE="deployment-reports/release-notes-android-$(date +%Y%m%d).txt"
    
    cat > "$RELEASE_NOTES_FILE" << EOF
StackMap v$VERSION_NAME (Build $VERSION_CODE)

What's New:
- Performance improvements and bug fixes
- Enhanced offline functionality
- Improved sync reliability

Recent Changes:
$(git log --oneline -n 5)

This release includes all changes up to commit $(git rev-parse --short HEAD)
EOF
    
    print_success "Release notes generated: $RELEASE_NOTES_FILE"
}

# Main function
main() {
    print_status "Starting Google Play Console deployment process..."
    
    # Parse arguments
    DEPLOYMENT_METHOD=${1:-api}  # 'api' or 'fastlane'
    TRACK=${2:-internal}  # 'internal', 'alpha', 'beta', or 'production'
    
    # Check requirements
    check_requirements
    
    # Build the app
    build_app
    
    # Validate the bundle
    validate_bundle
    
    # Deploy based on method
    if [ "$DEPLOYMENT_METHOD" == "fastlane" ]; then
        deploy_with_fastlane
    else
        deploy_with_api
    fi
    
    # Create reports
    create_deployment_report
    generate_release_notes
    
    print_success "Google Play Console deployment preparation completed!"
    
    if [ "$DEPLOYMENT_METHOD" != "fastlane" ]; then
        print_warning "Manual upload required. See instructions above."
    fi
}

# Run main function
main "$@"