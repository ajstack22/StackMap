#!/bin/bash
# StackMap Intelligent Deployment System
# Maintains clean main branch while tracking all deployments

set -e  # Exit on any error

echo "🚀 StackMap Deployment with Git Tracking"
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to validate deployment readiness
validate_deployment() {
    echo -e "${YELLOW}🔍 Running pre-deployment validation...${NC}"
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        echo -e "${RED}❌ ERROR: Uncommitted changes detected!${NC}"
        echo "Please commit or stash your changes first."
        exit 1
    fi
    
    # Ensure we're on main branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" ]]; then
        echo -e "${RED}❌ ERROR: Not on main branch (currently on $CURRENT_BRANCH)${NC}"
        echo "Please switch to main branch: git checkout main"
        exit 1
    fi
    
    # Pull latest changes
    echo "📥 Pulling latest changes from main..."
    git pull origin main
    
    echo -e "${GREEN}✅ Validation passed!${NC}"
}

# Function to build the project
build_project() {
    echo -e "${YELLOW}🔨 Building project for production...${NC}"
    
    # Clean previous build
    rm -rf web/build
    
    # Build with production settings
    NODE_ENV=production npm run build:web
    
    # Verify build succeeded
    if [[ ! -f "web/build/index.html" ]]; then
        echo -e "${RED}❌ ERROR: Build failed - no index.html generated${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
}

# Function to prepare deployment branch
prepare_deployment() {
    local DEPLOY_ENV=$1
    local BRANCH_NAME="deploy-${DEPLOY_ENV}"
    
    echo -e "${YELLOW}📦 Preparing ${BRANCH_NAME} branch...${NC}"
    
    # Store current commit hash for reference
    MAIN_COMMIT=$(git rev-parse --short HEAD)
    MAIN_COMMIT_MSG=$(git log -1 --pretty=%B)
    
    # Create or switch to deploy branch
    git checkout -B ${BRANCH_NAME}
    
    # Copy build files to root (required for server)
    echo "📄 Copying build files to root..."
    cp web/build/*.html .
    cp web/build/*.json .
    cp web/build/*.js .
    cp web/build/*.txt . 2>/dev/null || true
    cp -r web/build/fonts . 2>/dev/null || true
    cp -r web/build/icons . 2>/dev/null || true
    
    # Stage ONLY the current build files (not old bundles)
    git add -f index.html manifest.json service-worker.js workbox-*.js
    
    # Add current bundle files (extract from index.html)
    BUNDLE_HASH=$(grep -o 'bundle\.[a-f0-9]*\.js' index.html | head -1 | sed 's/bundle\.\([a-f0-9]*\)\.js/\1/')
    if [[ -n "$BUNDLE_HASH" ]]; then
        git add -f "bundle.${BUNDLE_HASH}.js"*
    fi
    
    # Add asset directories
    git add -f fonts/ icons/ 2>/dev/null || true
    
    # Create deployment commit with metadata
    DEPLOY_MSG="Deploy to ${DEPLOY_ENV}: $(date +%Y-%m-%d_%H:%M:%S)

Source: main@${MAIN_COMMIT}
Message: ${MAIN_COMMIT_MSG}
Build: NODE_ENV=production
Version: $(node -p "require('./package.json').version")"
    
    git commit -m "$DEPLOY_MSG" || {
        echo -e "${YELLOW}⚠️  No changes to deploy (build unchanged)${NC}"
        git checkout main
        exit 0
    }
    
    echo -e "${GREEN}✅ Deployment branch prepared!${NC}"
}

# Function to push and deploy
deploy_to_server() {
    local DEPLOY_ENV=$1
    local BRANCH_NAME="deploy-${DEPLOY_ENV}"
    
    echo -e "${YELLOW}🚀 Deploying to ${DEPLOY_ENV}...${NC}"
    
    # Force push to deploy branch (replaces previous deployment)
    git push -f origin ${BRANCH_NAME}
    
    # Deploy to server based on environment
    if [[ "$DEPLOY_ENV" == "qual" ]]; then
        echo "📡 Triggering qual server pull..."
        ssh stackmap-cpanel "cd ~/public_html/qual && git fetch && git reset --hard origin/${BRANCH_NAME}" || {
            echo -e "${RED}❌ ERROR: Failed to deploy to qual server${NC}"
            git checkout main
            exit 1
        }
        echo -e "${GREEN}✅ Deployed to: https://stackmap.app/qual/${NC}"
    elif [[ "$DEPLOY_ENV" == "prod" ]]; then
        echo "📡 Deploying to production..."
        ssh stackmap-cpanel "cd ~/scripts && ./simple-deploy.sh deploy" || {
            echo -e "${RED}❌ ERROR: Failed to deploy to production${NC}"
            git checkout main
            exit 1
        }
        echo -e "${GREEN}✅ Deployed to: https://stackmap.app/${NC}"
    fi
    
    # Return to main branch
    git checkout main
    
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
}

# Function to show deployment history
show_history() {
    local DEPLOY_ENV=$1
    local BRANCH_NAME="deploy-${DEPLOY_ENV}"
    
    echo -e "${YELLOW}📜 Recent deployments to ${DEPLOY_ENV}:${NC}"
    git log --oneline -10 origin/${BRANCH_NAME} 2>/dev/null || echo "No deployment history found"
}

# Main execution
case "${1:-qual}" in
    "qual")
        validate_deployment
        build_project
        prepare_deployment "qual"
        deploy_to_server "qual"
        ;;
    "prod")
        echo -e "${YELLOW}⚠️  PRODUCTION DEPLOYMENT${NC}"
        echo "This will deploy the current qual build to production."
        read -p "Have you tested on qual? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Deployment cancelled. Test on qual first!"
            exit 1
        fi
        deploy_to_server "prod"
        ;;
    "history")
        show_history "${2:-qual}"
        ;;
    "setup")
        echo "📝 One-time server setup instructions:"
        echo "1. SSH into server"
        echo "2. Run these commands:"
        echo "   cd ~/public_html/qual"
        echo "   git fetch origin"
        echo "   git checkout -b deploy-qual origin/deploy-qual"
        echo ""
        echo "3. Update server's git config to track deploy branch:"
        echo "   git branch --set-upstream-to=origin/deploy-qual"
        ;;
    *)
        echo "Usage: $0 [qual|prod|history|setup]"
        echo "  qual    - Build and deploy to staging (default)"
        echo "  prod    - Deploy current qual to production"
        echo "  history - Show deployment history"
        echo "  setup   - Show one-time server setup instructions"
        exit 1
        ;;
esac