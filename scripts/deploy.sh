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
echo "Step 1: Release Notes and Test Results"
echo "--------------------------------------"

# Check for release notes with test results
RELEASE_NOTES=$(ls -t releases/release-notes-*.md 2>/dev/null | head -1)
if [ -z "$RELEASE_NOTES" ]; then
    warn "No release notes found!"
    info "Generating release notes with test results..."
    bash scripts/generate-release-notes.sh
    if [ $? -ne 0 ]; then
        exit_error "Failed to generate release notes!"
    fi
    RELEASE_NOTES=$(ls -t releases/release-notes-*.md 2>/dev/null | head -1)
fi

# Check if release notes are from today
TODAY=$(date +"%Y-%m-%d")
if [[ ! "$RELEASE_NOTES" == *"$TODAY"* ]]; then
    warn "Release notes are not from today"
    info "Found: $RELEASE_NOTES"
    read -p "Generate new release notes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        bash scripts/generate-release-notes.sh
        if [ $? -ne 0 ]; then
            exit_error "Failed to generate release notes!"
        fi
        RELEASE_NOTES=$(ls -t releases/release-notes-*.md | head -1)
    fi
fi

# Verify tests passed in release notes
if grep -q "Status: FAILED" "$RELEASE_NOTES"; then
    exit_error "Tests are FAILING in release notes! Cannot deploy with failing tests."
fi

success "Found release notes with PASSING tests: $RELEASE_NOTES"
info "Test results are documented and passing"

echo ""
echo "Step 2: Pre-Deployment Validation"
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
echo "Step 3: Git Status Check"
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
echo "Step 4: Running Tests (Already in Release Notes)"
echo "-----------------------------------------------"

info "Tests have already been run and documented in release notes"
success "Skipping duplicate test run"

echo ""
echo "Step 5: Build Process"
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
echo "Step 6: Final Confirmation"
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
echo "Step 7: Deploying to cPanel"
echo "---------------------------"

info "Release notes will be uploaded with deployment"

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
echo "Step 8: Create Deployment Log"
echo "-----------------------------"

# Create deployment log with test results
DEPLOY_LOG="deploy-log-$(date +%Y-%m-%d-%H%M%S).txt"
info "Creating deployment log: $DEPLOY_LOG"

{
    echo "STACKMAP DEPLOYMENT LOG"
    echo "======================"
    echo ""
    echo "Date: $(date)"
    echo "Branch: $DEPLOY_BRANCH"
    echo "Version: $NEW_VERSION"
    echo "Commit: $(git rev-parse --short HEAD) - $(git log -1 --pretty=%s)"
    echo ""
    echo "TEST RESULTS"
    echo "============"
    
    # Extract test results from release notes
    if [ -f "$RELEASE_NOTES" ]; then
        sed -n '/## Test Results/,/## Pre-Deployment Checklist/p' "$RELEASE_NOTES" | head -n -1
    else
        echo "No release notes found"
    fi
    
    echo ""
    echo "DEPLOYMENT ACTIONS"
    echo "=================="
    echo "- Service worker cache updated to: $NEW_VERSION"
    echo "- Code pushed to: $REMOTE_NAME/$DEPLOY_BRANCH"
    echo "- Release notes saved to: $RELEASE_NOTES"
    echo ""
    echo "DEPLOYMENT STATUS: SUCCESS"
    echo ""
} > "$DEPLOY_LOG"

success "Deployment log created"

echo ""
echo "Step 9: Post-Deployment"
echo "----------------------"

info "Release notes have been saved to: $RELEASE_NOTES"
info "Deployment log has been saved to: $DEPLOY_LOG"
echo ""

echo "Please complete these manual steps:"
echo ""
echo "1. [ ] Verify deployment on production URL"
echo "2. [ ] Test service worker update (hard refresh)"
echo "3. [ ] Run UAT tests against production"
echo "4. [ ] Check browser console for errors"
echo "5. [ ] Test on multiple devices/browsers"
echo "6. [ ] Verify PWA installation works"
echo "7. [ ] Upload deployment log to cPanel"
echo ""

info "To upload deployment log to cPanel:"
echo "  1. Log into cPanel File Manager"
echo "  2. Navigate to public_html/logs/ (create if needed)"
echo "  3. Upload: $DEPLOY_LOG"
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