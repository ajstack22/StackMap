#!/bin/bash

# StackMap Deployment Script
# Enforces all deployment practices from DEPLOYMENT.md

set -e  # Exit on any error

echo "🚀 StackMap Deployment Script"
echo "============================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (update these for your environment)
DEPLOY_BRANCH="main"
REMOTE_NAME="origin"

# Function to exit with error
exit_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Function to show info
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to show success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to show warning
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo "Step 1: Pre-Deployment Validation"
echo "---------------------------------"

# Run pre-deployment checks
if [ -f "scripts/pre-deploy-check.sh" ]; then
    bash scripts/pre-deploy-check.sh
    if [ $? -ne 0 ]; then
        exit_error "Pre-deployment checks failed!"
    fi
else
    exit_error "pre-deploy-check.sh not found!"
fi

echo ""
echo "Step 2: Git Status Check"
echo "-----------------------"

# Ensure we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$DEPLOY_BRANCH" ]; then
    warn "Not on $DEPLOY_BRANCH branch (current: $CURRENT_BRANCH)"
    read -p "Switch to $DEPLOY_BRANCH branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout $DEPLOY_BRANCH
        success "Switched to $DEPLOY_BRANCH branch"
    else
        exit_error "Deployment must be from $DEPLOY_BRANCH branch"
    fi
fi

# Pull latest changes
info "Pulling latest changes..."
git pull $REMOTE_NAME $DEPLOY_BRANCH

echo ""
echo "Step 3: Running Tests"
echo "--------------------"

# Check if tests can be run automatically
if [ -f "package.json" ] && [ -f "tests/run-tests.js" ]; then
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        info "Installing test dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            exit_error "Failed to install test dependencies"
        fi
    fi
    
    info "Running automated tests..."
    npm test
    TEST_RESULT=$?
    
    if [ $TEST_RESULT -ne 0 ]; then
        warn "Automated tests encountered an issue"
        echo ""
        echo "Opening test runner in browser..."
        node tests/run-tests-simple.js
        echo ""
        read -p "Did all tests pass in the browser? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit_error "Tests must pass before deployment"
        fi
    else
        success "All tests passed!"
    fi
else
    exit_error "Test infrastructure missing. Please ensure package.json and tests/run-tests.js exist."
fi

echo ""
echo "Step 4: Build Process"
echo "--------------------"

# Update service worker cache version
SW_FILE="sw.js"
if [ -f "$SW_FILE" ]; then
    # Increment cache version
    CURRENT_VERSION=$(grep -o "CACHE_VERSION = '[0-9]*'" $SW_FILE | grep -o "[0-9]*")
    NEW_VERSION=$((CURRENT_VERSION + 1))
    
    # For macOS sed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/CACHE_VERSION = '$CURRENT_VERSION'/CACHE_VERSION = '$NEW_VERSION'/" $SW_FILE
    else
        sed -i "s/CACHE_VERSION = '$CURRENT_VERSION'/CACHE_VERSION = '$NEW_VERSION'/" $SW_FILE
    fi
    
    success "Updated service worker cache version to $NEW_VERSION"
fi

echo ""
echo "Step 5: Final Confirmation"
echo "-------------------------"

echo "Deployment Summary:"
echo "  Branch: $DEPLOY_BRANCH"
echo "  Remote: $REMOTE_NAME"
echo "  Cache Version: $NEW_VERSION"
echo ""

# Show what will be deployed
info "Files to be deployed:"
git diff --name-status HEAD~1

echo ""
read -p "Proceed with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warn "Deployment cancelled"
    exit 0
fi

echo ""
echo "Step 6: Deploying"
echo "----------------"

# Commit cache version update if changed
if git diff --quiet $SW_FILE; then
    info "No service worker changes"
else
    git add $SW_FILE
    git commit -m "Bump service worker cache version to v$NEW_VERSION"
    success "Committed cache version update"
fi

# Push to remote
info "Pushing to $REMOTE_NAME/$DEPLOY_BRANCH..."
git push $REMOTE_NAME $DEPLOY_BRANCH

success "Code pushed successfully!"

echo ""
echo "Step 7: Post-Deployment"
echo "----------------------"

echo "Please complete these manual steps:"
echo ""
echo "1. [ ] Verify deployment on production URL"
echo "2. [ ] Test service worker update (hard refresh)"
echo "3. [ ] Run UAT tests against production"
echo "4. [ ] Check browser console for errors"
echo "5. [ ] Test on multiple devices/browsers"
echo "6. [ ] Verify PWA installation works"
echo ""

# If deployment URL is configured, open it
if [ -n "$DEPLOY_URL" ]; then
    info "Opening production site..."
    open "$DEPLOY_URL" 2>/dev/null || xdg-open "$DEPLOY_URL" 2>/dev/null || echo "Please manually open: $DEPLOY_URL"
fi

echo ""
success "Deployment complete! 🎉"
echo ""
echo "Remember to monitor the production site for any issues."
echo "If problems occur, you can rollback with:"
echo "  git revert HEAD && git push"
echo ""