#!/bin/bash
# TestFlight Deployment Script for StackMap iOS App

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TESTFLIGHT]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script can only run on macOS"
    exit 1
fi

# Check for required tools
check_requirements() {
    print_status "Checking requirements..."
    
    # Check for Xcode
    if ! command -v xcodebuild &> /dev/null; then
        print_error "Xcode is not installed"
        exit 1
    fi
    
    # Check for xcrun
    if ! command -v xcrun &> /dev/null; then
        print_error "xcrun is not available"
        exit 1
    fi
    
    print_success "All requirements met"
}

# Build the app
build_app() {
    print_status "Building iOS app for distribution..."
    
    cd ios/App
    
    # Clean
    xcodebuild clean -workspace App.xcworkspace -scheme App -configuration Release
    
    # Archive
    print_status "Creating archive..."
    xcodebuild archive \
        -workspace App.xcworkspace \
        -scheme App \
        -configuration Release \
        -archivePath ../../build/ios/App.xcarchive \
        -destination 'generic/platform=iOS' \
        -allowProvisioningUpdates
    
    cd ../..
    print_success "Archive created successfully"
}

# Export for App Store
export_app() {
    print_status "Exporting app for App Store..."
    
    # Create export options plist
    cat > build/ios/exportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>\${APPLE_TEAM_ID}</string>
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
    
    # Export IPA
    xcodebuild -exportArchive \
        -archivePath build/ios/App.xcarchive \
        -exportPath build/ios \
        -exportOptionsPlist build/ios/exportOptions.plist \
        -allowProvisioningUpdates
    
    print_success "IPA exported successfully"
}

# Upload to TestFlight
upload_to_testflight() {
    print_status "Uploading to TestFlight..."
    
    # Validate app
    print_status "Validating app..."
    xcrun altool --validate-app \
        -f build/ios/App.ipa \
        -t ios \
        --apiKey "$APPLE_API_KEY_ID" \
        --apiIssuer "$APPLE_API_ISSUER_ID"
    
    # Upload app
    print_status "Uploading app..."
    xcrun altool --upload-app \
        -f build/ios/App.ipa \
        -t ios \
        --apiKey "$APPLE_API_KEY_ID" \
        --apiIssuer "$APPLE_API_ISSUER_ID"
    
    print_success "App uploaded to TestFlight successfully!"
}

# Create deployment report
create_deployment_report() {
    print_status "Creating deployment report..."
    
    REPORT_FILE="deployment-reports/testflight-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p deployment-reports
    
    # Get app version
    APP_VERSION=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" ios/App/App/Info.plist)
    BUILD_NUMBER=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" ios/App/App/Info.plist)
    
    cat > "$REPORT_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "platform": "iOS",
    "store": "TestFlight",
    "appVersion": "$APP_VERSION",
    "buildNumber": "$BUILD_NUMBER",
    "gitCommit": "$(git rev-parse HEAD)",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD)",
    "gitTag": "$(git describe --tags --abbrev=0 2>/dev/null || echo 'none')",
    "status": "success",
    "archivePath": "build/ios/App.xcarchive",
    "ipaPath": "build/ios/App.ipa"
}
EOF
    
    print_success "Deployment report created: $REPORT_FILE"
}

# Send notification
send_notification() {
    print_status "Sending deployment notification..."
    
    # Create release notes
    RELEASE_NOTES=$(cat << EOF
StackMap iOS v$APP_VERSION (Build $BUILD_NUMBER) deployed to TestFlight

What's New:
- Check the release notes for details

Git Commit: $(git rev-parse --short HEAD)
Deployed by: $(git config user.name)
Deployment Time: $(date)
EOF
)
    
    # If gh CLI is available, create a comment on the latest PR
    if command -v gh &> /dev/null; then
        # Get the latest merged PR
        LATEST_PR=$(gh pr list --state merged --limit 1 --json number --jq '.[0].number' 2>/dev/null || echo "")
        
        if [ -n "$LATEST_PR" ]; then
            gh pr comment "$LATEST_PR" --body "$RELEASE_NOTES"
        fi
    fi
    
    print_success "Notifications sent"
}

# Main function
main() {
    print_status "Starting TestFlight deployment process..."
    
    # Check environment variables
    if [ -z "$APPLE_API_KEY_ID" ] || [ -z "$APPLE_API_ISSUER_ID" ]; then
        print_error "Missing Apple API credentials. Please set APPLE_API_KEY_ID and APPLE_API_ISSUER_ID"
        exit 1
    fi
    
    # Check requirements
    check_requirements
    
    # Create build directory
    mkdir -p build/ios
    
    # Build and deploy
    build_app
    export_app
    upload_to_testflight
    
    # Create report
    create_deployment_report
    
    # Send notifications
    send_notification
    
    print_success "TestFlight deployment completed successfully!"
    print_status "The app will be available in TestFlight within 10-30 minutes after processing."
}

# Run main function
main "$@"