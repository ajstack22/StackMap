#!/bin/bash

# StackMap Unified Deployment Script
# Ensures all platforms (Web, Android, iOS) are deployed from the same source
# Last Updated: 2025-01-20

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERSION_FILE="version.json"
DEPLOYMENT_LOG="deployment-log.txt"

# Functions
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if version file exists
check_version() {
    if [ ! -f "$VERSION_FILE" ]; then
        print_error "Version file not found. Creating initial version..."
        echo '{
  "version": "1.4.0",
  "build": 1,
  "lastDeployment": {
    "web": null,
    "android": null,
    "ios": null
  }
}' > "$VERSION_FILE"
    fi
}

# Increment build number
increment_build() {
    local current_version=$(jq -r '.version' "$VERSION_FILE")
    local current_build=$(jq -r '.build' "$VERSION_FILE")
    local new_build=$((current_build + 1))
    
    # Update version file
    jq ".build = $new_build" "$VERSION_FILE" > temp.json && mv temp.json "$VERSION_FILE"
    
    echo "$current_version-build$new_build"
}

# Update deployment timestamp
update_deployment_time() {
    local platform=$1
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    jq ".lastDeployment.$platform = \"$timestamp\"" "$VERSION_FILE" > temp.json && mv temp.json "$VERSION_FILE"
}

# Deploy to web (staging/production)
deploy_web() {
    local target=$1
    print_header "Deploying Web/PWA to $target"
    
    if [ "$target" == "staging" ]; then
        print_warning "Deploying to Qual/Staging..."
        ./scripts/deploy-to-qual.sh
        
        if [ $? -eq 0 ]; then
            print_success "Web deployed to staging"
            update_deployment_time "web-staging"
        else
            print_error "Web deployment to staging failed"
            return 1
        fi
    else
        print_warning "Deploying to Production..."
        ./scripts/deploy-qual-to-prod.sh
        
        if [ $? -eq 0 ]; then
            print_success "Web deployed to production"
            update_deployment_time "web"
        else
            print_error "Web deployment to production failed"
            return 1
        fi
    fi
}

# Build and prepare mobile platforms
prepare_mobile() {
    print_header "Preparing Mobile Platforms"
    
    # Clean and build www directory
    print_warning "Building Capacitor assets..."
    ./scripts/build-capacitor.sh
    
    # Sync to native platforms
    print_warning "Syncing to native platforms..."
    npx cap sync
    
    print_success "Mobile platforms prepared"
}

# Build Android
build_android() {
    print_header "Building Android APK"
    
    cd android
    
    # Build debug APK
    print_warning "Building debug APK..."
    ./build-debug.sh
    
    if [ -f "stackmap-debug.apk" ]; then
        print_success "Android debug APK built successfully"
        cd ..
        
        # Update deployment time
        update_deployment_time "android"
        
        # Copy to releases directory
        mkdir -p releases/android
        cp android/stackmap-debug.apk "releases/android/stackmap-$(date +%Y%m%d)-debug.apk"
        
        return 0
    else
        print_error "Android build failed"
        cd ..
        return 1
    fi
}

# Build iOS
build_ios() {
    print_header "Building iOS App"
    
    # Check if on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_warning "iOS build requires macOS. Skipping..."
        return 0
    fi
    
    cd ios/App
    
    # Update pods
    print_warning "Updating CocoaPods..."
    pod install
    
    # Build using xcodebuild
    print_warning "Building iOS app..."
    xcodebuild -workspace App.xcworkspace \
               -scheme App \
               -configuration Debug \
               -sdk iphonesimulator \
               -derivedDataPath build
    
    if [ $? -eq 0 ]; then
        print_success "iOS app built successfully"
        cd ../..
        
        # Update deployment time
        update_deployment_time "ios"
        
        return 0
    else
        print_error "iOS build failed"
        cd ../..
        return 1
    fi
}

# Show deployment status
show_status() {
    print_header "Deployment Status"
    
    local version=$(jq -r '.version' "$VERSION_FILE")
    local build=$(jq -r '.build' "$VERSION_FILE")
    
    echo -e "${BLUE}Current Version:${NC} $version (build $build)"
    echo ""
    echo -e "${BLUE}Last Deployments:${NC}"
    echo -e "  Web Production: $(jq -r '.lastDeployment.web // "Never"' "$VERSION_FILE")"
    echo -e "  Web Staging:    $(jq -r '.lastDeployment."web-staging" // "Never"' "$VERSION_FILE")"
    echo -e "  Demo:           $(jq -r '.lastDeployment.demo // "Never"' "$VERSION_FILE")"
    echo -e "  Android:        $(jq -r '.lastDeployment.android // "Never"' "$VERSION_FILE")"
    echo -e "  iOS:            $(jq -r '.lastDeployment.ios // "Never"' "$VERSION_FILE")"
}

# Run pre-deployment checks
run_pre_checks() {
    print_header "Running Pre-Deployment Checks"
    
    if [ -f "./scripts/pre-deploy-check.sh" ]; then
        ./scripts/pre-deploy-check.sh
        if [ $? -ne 0 ]; then
            print_error "Pre-deployment checks failed!"
            echo ""
            read -p "Continue anyway? (not recommended) (y/n): " force
            if [ "$force" != "y" ]; then
                print_error "Deployment cancelled"
                exit 1
            fi
            print_warning "Continuing despite failed checks..."
        else
            print_success "All pre-deployment checks passed"
        fi
    else
        print_warning "Pre-deployment check script not found"
    fi
}

# Main deployment flow
main() {
    print_header "StackMap Unified Deployment System"
    
    # Check prerequisites
    check_version
    
    # Run pre-deployment checks first
    run_pre_checks
    
    # Show current status
    show_status
    
    # Get deployment target
    echo ""
    echo "Select deployment target:"
    echo "1) Staging (Web only)"
    echo "2) Production (Web only)"
    echo "3) Demo (Web only)"
    echo "4) Mobile (Android & iOS)"
    echo "5) Everything (Staging → Production → Mobile)"
    echo "6) Show status only"
    read -p "Enter choice (1-6): " choice
    
    case $choice in
        1)
            deploy_web "staging"
            ;;
        2)
            # Confirm production deployment
            read -p "Deploy to PRODUCTION? Type 'deploy' to confirm: " confirm
            if [ "$confirm" == "deploy" ]; then
                deploy_web "production"
            else
                print_error "Production deployment cancelled"
            fi
            ;;
        3)
            # Deploy demo
            print_header "Deploying Demo Environment"
            ./scripts/deploy-to-demo.sh
            ;;
        4)
            prepare_mobile
            build_android
            build_ios
            ;;
        5)
            # Full deployment pipeline
            print_header "Full Deployment Pipeline"
            
            # Increment build number
            new_version=$(increment_build)
            print_success "Version: $new_version"
            
            # Deploy to staging
            deploy_web "staging"
            
            # Ask to continue to production
            echo ""
            read -p "Continue to PRODUCTION? (y/n): " confirm
            if [ "$confirm" == "y" ]; then
                deploy_web "production"
                
                # Build mobile apps
                echo ""
                read -p "Build mobile apps? (y/n): " confirm_mobile
                if [ "$confirm_mobile" == "y" ]; then
                    prepare_mobile
                    build_android
                    build_ios
                fi
            fi
            ;;
        6)
            # Status already shown
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    # Show final status
    echo ""
    show_status
    
    # Log deployment
    echo "[$(date)] Deployment completed - $(jq -r '.version' "$VERSION_FILE")-build$(jq -r '.build' "$VERSION_FILE")" >> "$DEPLOYMENT_LOG"
}

# Run main function
main