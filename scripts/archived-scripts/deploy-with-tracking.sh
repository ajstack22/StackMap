#!/bin/bash
# StackMap Intelligent Deployment System
# Maintains clean main branch while tracking all deployments

set -e  # Exit on any error

# Load app configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/app-config.sh"

echo "🚀 ${APP_NAME} Deployment with Git Tracking"
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to validate deployment readiness
validate_deployment() {
    local DEPLOY_ENV=$1
    echo -e "${YELLOW}🔍 Running pre-deployment validation...${NC}"

    # Check for uncommitted changes (tier-specific)
    if [[ -n $(git status --porcelain) ]]; then
        if [[ "$DEPLOY_ENV" == "qual" || "$DEPLOY_ENV" == "stage" ]]; then
            echo -e "${YELLOW}⚠️  Uncommitted changes detected (allowed for $DEPLOY_ENV)${NC}"
        else
            echo -e "${RED}❌ ERROR: Uncommitted changes detected!${NC}"
            echo "Please commit or stash your changes first."
            echo "Beta and prod deployments require clean git state for traceability."
            exit 1
        fi
    fi

    # Ensure we're on main branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" ]]; then
        echo -e "${RED}❌ ERROR: Not on main branch (currently on $CURRENT_BRANCH)${NC}"
        echo "Please switch to main branch: git checkout main"
        exit 1
    fi

    # Pull latest changes (skip for qual/stage with uncommitted changes)
    if [[ -z $(git status --porcelain) ]]; then
        echo "📥 Pulling latest changes from main..."
        git pull origin main
    else
        echo -e "${YELLOW}⏭️  Skipping git pull (uncommitted changes present)${NC}"
    fi

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
    
    # Fix paths for QUAL and BETA environments (need absolute paths for nested URLs)
    if [[ "$DEPLOY_ENV" == "qual" ]]; then
        echo "📝 Fixing paths for QUAL environment..."
        # Replace relative paths with absolute paths in index.html
        sed -i.bak 's|src="./|src="/qual/|g' index.html
        sed -i.bak 's|href="./|href="/qual/|g' index.html
        rm index.html.bak
    elif [[ "$DEPLOY_ENV" == "beta" ]]; then
        echo "📝 Fixing paths for BETA environment..."
        # Replace relative paths with absolute paths in index.html
        sed -i.bak 's|src="./|src="/beta/|g' index.html
        sed -i.bak 's|href="./|href="/beta/|g' index.html
        rm index.html.bak
    fi
    
    # Stage ONLY the current build files (not old bundles)
    git add -f index.html manifest.json service-worker.js workbox-*.js
    
    # Add current bundle files (extract from index.html)
    BUNDLE_HASH=$(grep -o 'bundle\.[a-f0-9]*\.js' index.html | head -1 | sed 's/bundle\.\([a-f0-9]*\)\.js/\1/')
    if [[ -n "$BUNDLE_HASH" ]]; then
        git add -f "bundle.${BUNDLE_HASH}.js"*
    fi
    
    # Add asset directories
    git add -f fonts/ icons/ 2>/dev/null || true
    
    # Add .htaccess for QUAL and BETA environments
    if [[ "$DEPLOY_ENV" == "qual" ]] && [[ -f "qual/.htaccess" ]]; then
        echo "📝 Including .htaccess for QUAL..."
        cp qual/.htaccess .
        git add -f .htaccess
    elif [[ "$DEPLOY_ENV" == "beta" ]] && [[ -f "beta/.htaccess" ]]; then
        echo "📝 Including .htaccess for BETA..."
        cp beta/.htaccess .
        git add -f .htaccess
    fi
    
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
        ssh "$APP_SSH_HOST" "cd $APP_SSH_QUAL_DIR && git fetch && git reset --hard origin/${BRANCH_NAME}" || {
            echo -e "${RED}❌ ERROR: Failed to deploy to qual server${NC}"
            git checkout main
            exit 1
        }
        echo -e "${GREEN}✅ Deployed to: $APP_URL_QUAL/${NC}"
    elif [[ "$DEPLOY_ENV" == "beta" ]]; then
        echo "📡 Triggering beta server pull..."
        ssh "$APP_SSH_HOST" "cd $APP_SSH_BETA_DIR && git fetch && git reset --hard origin/${BRANCH_NAME}" || {
            echo -e "${RED}❌ ERROR: Failed to deploy to beta server${NC}"
            git checkout main
            exit 1
        }
        echo -e "${GREEN}✅ Deployed to: $APP_URL_BETA/${NC}"
    elif [[ "$DEPLOY_ENV" == "prod" ]]; then
        echo "📡 Deploying to production..."
        ssh "$APP_SSH_HOST" "cd ~/scripts && ./simple-deploy.sh deploy" || {
            echo -e "${RED}❌ ERROR: Failed to deploy to production${NC}"
            git checkout main
            exit 1
        }
        echo -e "${GREEN}✅ Deployed to: $APP_URL_PROD/${NC}"
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
DEPLOY_ENV="${1:-qual}"

case "$DEPLOY_ENV" in
    "qual")
        validate_deployment "qual"
        build_project
        prepare_deployment "qual"
        deploy_to_server "qual"
        ;;
    "beta")
        validate_deployment "beta"
        build_project
        prepare_deployment "beta"
        deploy_to_server "beta"
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
        validate_deployment "prod"
        deploy_to_server "prod"
        ;;
    "history")
        show_history "${2:-qual}"
        ;;
    "setup")
        echo "📝 One-time server setup instructions:"
        echo ""
        echo "QUAL Setup:"
        echo "  cd $APP_SSH_QUAL_DIR"
        echo "  git fetch origin"
        echo "  git checkout -b deploy-qual origin/deploy-qual"
        echo "  git branch --set-upstream-to=origin/deploy-qual"
        echo ""
        echo "BETA Setup:"
        echo "  cd $APP_SSH_BETA_DIR"
        echo "  git fetch origin"
        echo "  git checkout -b deploy-beta origin/deploy-beta"
        echo "  git branch --set-upstream-to=origin/deploy-beta"
        ;;
    *)
        echo "Usage: $0 [qual|beta|prod|history|setup]"
        echo "  qual    - Build and deploy to qual environment (default)"
        echo "  beta    - Build and deploy to beta environment"
        echo "  prod    - Deploy current qual to production"
        echo "  history - Show deployment history"
        echo "  setup   - Show one-time server setup instructions"
        exit 1
        ;;
esac