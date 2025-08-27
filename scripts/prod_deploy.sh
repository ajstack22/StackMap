#!/bin/bash

# Production Deployment Script
# Deploys qual to prod and generates production mobile builds

set -e  # Exit on any error

echo "🚀 StackMap Production Deployment System"
echo "========================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to build Android AAB (production)
build_android_aab() {
    echo -e "${YELLOW}📱 Building Android AAB for Production...${NC}"
    
    # Ensure we're in production mode
    export NODE_ENV=production
    
    cd android
    
    # Clean previous builds
    ./gradlew clean
    
    # Build release AAB
    echo "Building release AAB..."
    ./gradlew bundleRelease
    
    # Check if AAB was created
    AAB_PATH="app/build/outputs/bundle/release/app-release.aab"
    if [ -f "$AAB_PATH" ]; then
        echo -e "${GREEN}✅ AAB created successfully at:${NC}"
        echo "   android/$AAB_PATH"
        
        # Copy to a more accessible location with timestamp
        TIMESTAMP=$(date +%Y%m%d-%H%M%S)
        cp "$AAB_PATH" "../stackmap-production-$TIMESTAMP.aab"
        echo -e "${GREEN}✅ Copied to: stackmap-production-$TIMESTAMP.aab${NC}"
    else
        echo -e "${RED}❌ AAB build failed${NC}"
        exit 1
    fi
    
    cd ..
}

# Function to build iOS archive
build_ios_archive() {
    echo -e "${YELLOW}📱 Building iOS Archive for Production...${NC}"
    
    # Ensure we're in production mode
    export NODE_ENV=production
    
    cd ios
    
    # Update pods
    echo "Updating CocoaPods..."
    pod install
    
    # Clean build folder
    echo "Cleaning build folder..."
    xcodebuild clean -workspace StackMapNative.xcworkspace -scheme StackMapNative -configuration Release
    
    # Build archive
    echo "Building iOS archive..."
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    ARCHIVE_PATH="$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/StackMapNative-$TIMESTAMP.xcarchive"
    
        # Archive step removed as requested.
    echo -e "${GREEN}✅ iOS project is ready for archiving.${NC}"
    echo "To create the archive, open Xcode and follow these steps:"
    echo "   1. Open the workspace: open ios/StackMapNative.xcworkspace"
    echo "   2. Select 'Any iOS Device (arm64)' as the build target."
    echo "   3. From the menu, choose 'Product' → 'Archive'."
    
    if [ -f "$ARCHIVE_PATH/Info.plist" ]; then
        echo -e "${GREEN}✅ Archive created successfully at:${NC}"
        echo "   $ARCHIVE_PATH"
        echo
        echo "📝 To distribute to App Store Connect:"
        echo "   1. Open Xcode Organizer: open -b com.apple.dt.Xcode /Applications/Xcode.app"
        echo "   2. Select the archive from today's date"
        echo "   3. Click 'Distribute App'"
        echo "   4. Select 'App Store Connect' → 'Upload'"
        echo "   5. Follow the prompts to upload"
        echo
        echo "Or use xcodebuild to upload directly:"
        echo "   xcodebuild -exportArchive -archivePath \"$ARCHIVE_PATH\" \\"
        echo "     -exportOptionsPlist ios/ExportOptions.plist \\"
        echo "     -exportPath \"$HOME/Desktop/StackMap-iOS-$TIMESTAMP\""
    else
        echo -e "${RED}❌ Archive build failed${NC}"
        echo "To build manually:"
        echo "   1. Open Xcode: open ios/StackMapNative.xcworkspace"
        echo "   2. Select 'Any iOS Device' as target"
        echo "   3. Product → Archive"
        exit 1
    fi
    
    cd ..
}

# Function to deploy web to production
deploy_web_to_prod() {
    echo -e "${YELLOW}🌐 Deploying Web to Production...${NC}"
    
    echo "📦 Creating backup of current production..."
    ssh stackmap-cpanel << 'EOF'
        cd ~/public_html
        TIMESTAMP=$(date +%Y%m%d-%H%M%S)
        tar -czf ~/backups/prod-before-deploy-$TIMESTAMP.tar.gz . --exclude='qual' --exclude='demo' --exclude='backups'
        echo $TIMESTAMP > ~/.last-deployment-timestamp
        echo "✅ Backup created: prod-before-deploy-$TIMESTAMP.tar.gz"
EOF

    echo
    echo "🔄 Syncing qual to production..."
    ssh stackmap-cpanel << 'EOF'
        cd ~/public_html
        # Use rsync to make prod identical to qual (excluding .git)
        rsync -av --exclude='.git' --exclude='error_log' --exclude='.htaccess' --exclude='qual' --exclude='demo' qual/ .
        echo "✅ Production updated from qual"
EOF

    echo -e "${GREEN}✅ Web deployed to production!${NC}"
    echo "🌐 Production: https://stackmap.app"
}

# Function to rollback
rollback_prod() {
    echo -e "${YELLOW}⏮️  Rolling back production to previous version...${NC}"
    
    # Get the last deployment timestamp
    TIMESTAMP=$(ssh stackmap-cpanel 'cat ~/.last-deployment-timestamp 2>/dev/null')
    
    if [ -z "$TIMESTAMP" ]; then
        echo -e "${RED}❌ No rollback available - no previous deployment found${NC}"
        exit 1
    fi
    
    echo "📦 Restoring from backup: prod-before-deploy-$TIMESTAMP.tar.gz"
    ssh stackmap-cpanel << EOF
        cd ~/public_html
        tar -xzf ~/backups/prod-before-deploy-$TIMESTAMP.tar.gz
        echo "✅ Production rolled back to state before $TIMESTAMP"
EOF
    
    echo
    echo -e "${GREEN}✅ ROLLBACK COMPLETE!${NC}"
    echo "🌐 Production restored: https://stackmap.app"
}

# Function to verify API URLs
verify_api_urls() {
    echo -e "${YELLOW}🔍 Verifying API URLs for production builds...${NC}"
    
    # Check syncServiceV2.js
    if grep -q "__DEV__.*qual/api" src/services/sync/syncServiceV2.js; then
        echo -e "${GREEN}✅ Development builds use qual API${NC}"
    fi
    
    if grep -q "return 'https://stackmap.app/api/sync'" src/services/sync/syncServiceV2.js; then
        echo -e "${GREEN}✅ Production builds will use production API${NC}"
    else
        echo -e "${RED}⚠️  Warning: Could not verify production API URL${NC}"
    fi
}

# Main menu
show_menu() {
    echo "What would you like to do?"
    echo
    echo "  1) Full Production Deploy (Web + Android AAB + iOS prep)"
    echo "  2) Web Only"
    echo "  3) Android AAB Only"
    echo "  4) iOS Archive Preparation Only"
    echo "  5) Rollback Web Production"
    echo "  6) Exit"
    echo
    read -p "Enter your choice (1-6): " choice
}

# Main logic
case "${1:-menu}" in
    "rollback")
        rollback_prod
        ;;
    "web")
        verify_api_urls
        deploy_web_to_prod
        ;;
    "android")
        verify_api_urls
        build_android_aab
        ;;
    "ios")
        verify_api_urls
        build_ios_archive
        ;;
    "all")
        verify_api_urls
        deploy_web_to_prod
        build_android_aab
        build_ios_archive
        echo
        echo -e "${GREEN}🎉 FULL PRODUCTION DEPLOYMENT COMPLETE!${NC}"
        echo
        echo "📋 Summary:"
        echo "  ✅ Web deployed to https://stackmap.app"
        echo "  ✅ Android AAB ready for Play Store upload"
        echo "  ✅ iOS ready for Xcode archive and App Store upload"
        ;;
    "menu"|"")
        show_menu
        case $choice in
            1)
                verify_api_urls
                deploy_web_to_prod
                build_android_aab
                build_ios_archive
                echo
                echo -e "${GREEN}🎉 FULL PRODUCTION DEPLOYMENT COMPLETE!${NC}"
                ;;
            2)
                verify_api_urls
                deploy_web_to_prod
                ;;
            3)
                verify_api_urls
                build_android_aab
                ;;
            4)
                verify_api_urls
                build_ios_archive
                ;;
            5)
                rollback_prod
                ;;
            6)
                echo "Exiting..."
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice${NC}"
                exit 1
                ;;
        esac
        ;;
    *)
        echo "Usage: $0 [all|web|android|ios|rollback|menu]"
        echo
        echo "  all      - Full production deploy (web + mobile builds)"
        echo "  web      - Deploy web to production only"
        echo "  android  - Build Android AAB only"
        echo "  ios      - Prepare iOS for archive only"
        echo "  rollback - Rollback web production to previous version"
        echo "  menu     - Show interactive menu (default)"
        exit 1
        ;;
esac