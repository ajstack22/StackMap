#!/bin/bash

# StackMap Qual to Production Deployment Script
# This is THE OFFICIAL deployment method - all other methods are deprecated

set -e  # Exit on any error

echo "🚀 StackMap Qual → Production Deployment"
echo "========================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSH_ALIAS="stackmap-cpanel"
QUAL_PATH="~/public_html/qual"
PROD_PATH="~/public_html"
BACKUP_PATH="~/backups/production-$(date +%Y%m%d-%H%M%S)"

# Function to exit with error
exit_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Function to show success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to show warning
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to show info
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo ""
echo "Step 1: Pre-flight Checks"
echo "------------------------"

# Check SSH connection
if ! ssh $SSH_ALIAS "echo 'SSH OK'" > /dev/null 2>&1; then
    exit_error "Cannot connect to server via SSH"
fi
success "SSH connection verified"

# Check qual exists and has content
if ! ssh $SSH_ALIAS "test -f $QUAL_PATH/index.html"; then
    exit_error "Qual environment not found or empty"
fi
success "Qual environment verified"

# Check production exists
if ! ssh $SSH_ALIAS "test -f $PROD_PATH/index.html"; then
    exit_error "Production environment not found"
fi
success "Production environment verified"

echo ""
echo "Step 2: Qual Status Check"
echo "------------------------"

# Show qual git status
info "Checking qual environment status..."
ssh $SSH_ALIAS "cd $QUAL_PATH && git log -1 --oneline"

echo ""
echo "Step 3: Test Qual Environment"
echo "-----------------------------"

QUAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://stackmap.app/qual/)
if [ "$QUAL_STATUS" != "200" ]; then
    exit_error "Qual environment is not responding correctly (HTTP $QUAL_STATUS)"
fi
success "Qual environment is healthy (HTTP 200)"

echo ""
echo "Step 4: Production Backup"
echo "------------------------"

info "Creating production backup..."
ssh $SSH_ALIAS "mkdir -p ~/backups"

# Create backup (excluding large/unnecessary directories)
ssh $SSH_ALIAS "tar -czf $BACKUP_PATH.tar.gz \
    --exclude='$PROD_PATH/qual' \
    --exclude='$PROD_PATH/demo' \
    --exclude='$PROD_PATH/.git' \
    --exclude='$PROD_PATH/node_modules' \
    -C $(dirname $PROD_PATH) \
    $(basename $PROD_PATH)"

success "Backup created at: $BACKUP_PATH.tar.gz"

echo ""
echo "Step 5: Deployment Method"
echo "------------------------"

echo "Choose deployment method:"
echo "1) Git Pull (Recommended - clean and trackable)"
echo "2) File Copy (Alternative - exact copy from qual)"
read -p "Select method (1 or 2): " METHOD

if [ "$METHOD" = "1" ]; then
    echo ""
    info "Using Git Pull method..."
    
    # First, ensure production is on the correct branch
    ssh $SSH_ALIAS "cd $PROD_PATH && git checkout main" || warn "Git checkout failed"
    
    # Pull latest changes
    if ssh $SSH_ALIAS "cd $PROD_PATH && git pull origin main"; then
        success "Git pull completed successfully"
    else
        exit_error "Git pull failed! Check git status on production"
    fi
    
elif [ "$METHOD" = "2" ]; then
    echo ""
    info "Using File Copy method..."
    
    # Use rsync to copy files, preserving important production files
    ssh $SSH_ALIAS "rsync -av --delete \
        --exclude='.git' \
        --exclude='.well-known' \
        --exclude='qual' \
        --exclude='demo' \
        --exclude='*.log' \
        --exclude='node_modules' \
        --exclude='.htpasswd*' \
        $QUAL_PATH/ $PROD_PATH/"
    
    success "Files copied from qual to production"
else
    exit_error "Invalid selection"
fi

echo ""
echo "Step 6: Post-Deployment Tasks"
echo "-----------------------------"

# Update service worker cache version
info "Updating service worker cache..."
TODAY=$(date +"%Y-%m-%d-%H%M")
ssh $SSH_ALIAS "cd $PROD_PATH && sed -i \"s/CACHE_NAME = 'stackmap-v[^']*'/CACHE_NAME = 'stackmap-v1.5.7-$TODAY'/\" sw.js" || warn "Service worker update failed"

# Set correct permissions
info "Setting file permissions..."
ssh $SSH_ALIAS "find $PROD_PATH -type f -name '*.html' -o -name '*.js' -o -name '*.css' | xargs chmod 644"
ssh $SSH_ALIAS "find $PROD_PATH -type d | xargs chmod 755"
success "Permissions updated"

echo ""
echo "Step 7: Verification"
echo "-------------------"

# Test production site
PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://stackmap.app/)
if [ "$PROD_STATUS" != "200" ]; then
    warn "Production site returned HTTP $PROD_STATUS"
    echo ""
    echo "⚠️  POSSIBLE ISSUE DETECTED!"
    echo ""
    echo "To rollback, run:"
    echo "  ssh $SSH_ALIAS \"cd $PROD_PATH && tar -xzf $BACKUP_PATH.tar.gz -C ~/\""
    echo ""
else
    success "Production site is responding correctly (HTTP 200)"
fi

echo ""
echo "Step 8: Deployment Summary"
echo "-------------------------"

success "Deployment completed!"
echo ""
echo "Deployed from: https://stackmap.app/qual/"
echo "Deployed to:   https://stackmap.app/"
echo "Backup saved:  $BACKUP_PATH.tar.gz"
echo ""
echo "Next steps:"
echo "1. [ ] Test production site manually"
echo "2. [ ] Check browser console for errors"
echo "3. [ ] Verify service worker updated (hard refresh)"
echo "4. [ ] Test on mobile devices"
echo ""

# Show rollback command
info "To rollback if needed:"
echo "  ssh $SSH_ALIAS \"cd ~ && tar -xzf $BACKUP_PATH.tar.gz\""
echo ""

# Log deployment
ssh $SSH_ALIAS "echo '[$(date)] Deployed from qual to production' >> ~/deployment.log"

exit 0