#!/bin/bash

# Production Deployment Script
# Deploys qual to prod and generates production mobile builds

set -e  # Exit on any error

# Load app configuration
# Script is now in scripts/deploy/, so go up two levels to reach project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_ROOT="$(dirname "$SCRIPT_DIR")"  # Parent scripts directory
PROJECT_ROOT="$(dirname "$SCRIPTS_ROOT")"

source "$SCRIPT_DIR/app-config.sh"
source "$SCRIPT_DIR/lib/reporting.sh"

echo "🚀 ${APP_NAME} Production Deployment System"
echo "========================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to update mobile versions
update_mobile_versions() {
    echo -e "${YELLOW}📱 Updating mobile app versions...${NC}"
    "$SCRIPTS_ROOT/update-mobile-versions.sh"

    # Commit mobile version changes to maintain clean git state
    if ! git diff --quiet android/app/build.gradle ios/StackMapNative/Info.plist 2>/dev/null; then
        echo "📝 Committing mobile version updates..."
        git add android/app/build.gradle ios/StackMapNative/Info.plist
        git commit -m "Build: Update mobile version codes for prod deployment" -m "🤖 Generated with [Claude Code](https://claude.com/claude-code)" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
        echo -e "${GREEN}✅ Mobile version changes committed${NC}"
    fi
    echo
}

# Function to build and upload Android to production
deploy_android_production() {
    echo -e "${YELLOW}📱 Deploying Android to Google Play Store...${NC}"

    # Ensure we're in production mode
    export NODE_ENV=production

    cd android

    # Run fastlane prod_android (builds and uploads to Play Store)
    echo "Running fastlane production deployment..."

    # Check if PENDING_CHANGES.md exists for release notes
    if [ -f "../PENDING_CHANGES.md" ]; then
        echo "📝 Release notes will be loaded from PENDING_CHANGES.md"
        fastlane prod_android
    else
        echo "⚠️  PENDING_CHANGES.md not found, using default release notes"
        fastlane prod_android
    fi

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Android deployed to Play Store!${NC}"
    else
        echo -e "${RED}❌ Android deployment failed${NC}"
        exit 1
    fi

    cd ..
}

# Function to build and deploy iOS to production
deploy_ios_production() {
    echo -e "${YELLOW}📱 Deploying iOS to App Store...${NC}"

    # Ensure we're in production mode
    export NODE_ENV=production

    cd ios

    # Update pods if needed
    echo "Checking CocoaPods..."
    pod install --silent

    # Run fastlane prod_ios
    echo "Running fastlane production deployment..."

    # Check if PENDING_CHANGES.md exists for release notes
    if [ -f "../PENDING_CHANGES.md" ]; then
        echo "📝 Release notes will be loaded from PENDING_CHANGES.md"
        fastlane prod_ios
    else
        echo "⚠️  PENDING_CHANGES.md not found, using default release notes"
        fastlane prod_ios changelog:"Bug fixes and improvements"
    fi

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ iOS uploaded to App Store Connect!${NC}"
        echo ""
        echo "📱 Next steps:"
        echo "   1. Check App Store Connect: https://appstoreconnect.apple.com/apps"
        echo "   2. Review build details and metadata"
        echo "   3. Submit for review when ready"
        echo "   4. Monitor review status"
    else
        echo -e "${RED}❌ iOS production deployment failed${NC}"
        cd ..
        exit 1
    fi

    cd ..
}

# Function to deploy web to production
deploy_web_to_prod() {
    echo -e "${YELLOW}🌐 Deploying Web to Production...${NC}"

    echo "📦 Creating backup of current production..."
    ssh "$APP_SSH_HOST" << 'EOF'
        cd ~/public_html
        TIMESTAMP=$(date +%Y%m%d-%H%M%S)
        tar -czf ~/backups/prod-before-deploy-$TIMESTAMP.tar.gz . --exclude='qual' --exclude='demo' --exclude='backups'
        echo $TIMESTAMP > ~/.last-deployment-timestamp
        echo "✅ Backup created: prod-before-deploy-$TIMESTAMP.tar.gz"
EOF

    echo
    echo "🔄 Syncing qual to production..."
    ssh "$APP_SSH_HOST" << 'EOF'
        cd ~/public_html
        # Use rsync to make prod identical to qual (excluding .git)
        rsync -av --exclude='.git' --exclude='error_log' --exclude='.htaccess' --exclude='qual' --exclude='demo' qual/ .
        echo "✅ Production updated from qual"
EOF

    echo -e "${GREEN}✅ Web deployed to production!${NC}"
    echo "🌐 Production: $APP_URL_PROD"
}

# Function to rollback
rollback_prod() {
    echo -e "${YELLOW}⏮️  Rolling back production to previous version...${NC}"
    
    # Get the last deployment timestamp
    TIMESTAMP=$(ssh "$APP_SSH_HOST" 'cat ~/.last-deployment-timestamp 2>/dev/null')

    if [ -z "$TIMESTAMP" ]; then
        echo -e "${RED}❌ No rollback available - no previous deployment found${NC}"
        exit 1
    fi

    echo "📦 Restoring from backup: prod-before-deploy-$TIMESTAMP.tar.gz"
    ssh "$APP_SSH_HOST" << EOF
        cd ~/public_html
        tar -xzf ~/backups/prod-before-deploy-$TIMESTAMP.tar.gz
        echo "✅ Production rolled back to state before $TIMESTAMP"
EOF
    
    echo
    echo -e "${GREEN}✅ ROLLBACK COMPLETE!${NC}"
    echo "🌐 Production restored: $APP_URL_PROD"
}

# Function to verify API URLs
verify_api_urls() {
    echo -e "${YELLOW}🔍 Verifying API URLs for production builds...${NC}"
    
    # Check syncServiceV2.js
    if grep -q "qualUrl = '${APP_API_QUAL}/sync'" src/services/sync/syncServiceV2.js; then
        echo -e "${GREEN}✅ Qual URL configured correctly${NC}"
    else
        echo -e "${RED}⚠️  Warning: Could not verify qual API URL${NC}"
    fi

    if grep -q "prodUrl = '${APP_API_PROD}/sync'" src/services/sync/syncServiceV2.js; then
        echo -e "${GREEN}✅ Production URL configured correctly${NC}"
    else
        echo -e "${RED}⚠️  Warning: Could not verify production API URL${NC}"
    fi
    
    # Check that production is the default
    if grep -q "return prodUrl" src/services/sync/syncServiceV2.js; then
        echo -e "${GREEN}✅ Production is default for mobile builds${NC}"
    fi
}

# Main menu
show_menu() {
    echo "What would you like to do?"
    echo
    echo "  1) Full Production Deploy (Web + Android AAB + iOS to App Store)"
    echo "  2) Web Only"
    echo "  3) Android AAB Only"
    echo "  4) iOS to App Store (Automated)"
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
        CURRENT_VERSION=$(grep '"version":' package.json | head -1 | cut -d'"' -f4)
        DEPLOYMENT_START=$(date +%s)
        verify_api_urls
        deploy_web_to_prod
        ;;
    "android")
        CURRENT_VERSION=$(grep '"version":' package.json | head -1 | cut -d'"' -f4)
        DEPLOYMENT_START=$(date +%s)
        verify_api_urls
        update_mobile_versions
        deploy_android_production
        ;;
    "ios")
        CURRENT_VERSION=$(grep '"version":' package.json | head -1 | cut -d'"' -f4)
        DEPLOYMENT_START=$(date +%s)
        verify_api_urls
        update_mobile_versions
        deploy_ios_production
        ;;
    "all")
        CURRENT_VERSION=$(grep '"version":' package.json | head -1 | cut -d'"' -f4)
        DEPLOYMENT_START=$(date +%s)
        verify_api_urls
        update_mobile_versions
        deploy_web_to_prod
        deploy_android_production
        deploy_ios_production
        echo
        echo -e "${GREEN}🎉 FULL PRODUCTION DEPLOYMENT COMPLETE!${NC}"
        echo
        echo "📋 Summary:"
        echo "  ✅ Web deployed to $APP_URL_PROD"
        echo "  ✅ Android uploaded to Google Play Store"
        echo "  ✅ iOS uploaded to App Store Connect"
        ;;
    "menu"|"")
        show_menu
        case $choice in
            1)
                CURRENT_VERSION=$(grep '"version":' package.json | head -1 | cut -d'"' -f4)
                DEPLOYMENT_START=$(date +%s)
                verify_api_urls
                update_mobile_versions
                deploy_web_to_prod
                deploy_android_production
                deploy_ios_production
                echo
                echo -e "${GREEN}🎉 FULL PRODUCTION DEPLOYMENT COMPLETE!${NC}"
                ;;
            2)
                CURRENT_VERSION=$(grep '"version":' package.json | head -1 | cut -d'"' -f4)
                DEPLOYMENT_START=$(date +%s)
                verify_api_urls
                deploy_web_to_prod
                ;;
            3)
                CURRENT_VERSION=$(grep '"version":' package.json | head -1 | cut -d'"' -f4)
                DEPLOYMENT_START=$(date +%s)
                verify_api_urls
                update_mobile_versions
                deploy_android_production
                ;;
            4)
                CURRENT_VERSION=$(grep '"version":' package.json | head -1 | cut -d'"' -f4)
                DEPLOYMENT_START=$(date +%s)
                verify_api_urls
                update_mobile_versions
                deploy_ios_production
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
        echo "  all      - Full production deploy (web + mobile to app stores)"
        echo "  web      - Deploy web to production only"
        echo "  android  - Build and upload Android AAB to Play Store"
        echo "  ios      - Build and upload iOS to App Store (automated)"
        echo "  rollback - Rollback web production to previous version"
        echo "  menu     - Show interactive menu (default)"
        exit 1
        ;;
esac