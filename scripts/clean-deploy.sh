#!/bin/bash

# Clean Deployment Script with Orphaned File Removal
# Handles both frontend and API deployment with proper cleanup

set -e  # Exit on any error

echo "🚀 StackMap Clean Deployment System"
echo "====================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to deploy with cleanup
deploy_with_cleanup() {
    echo -e "${YELLOW}📦 Creating backup of current production...${NC}"
    ssh stackmap-cpanel << 'EOF'
        cd ~/public_html
        TIMESTAMP=$(date +%Y%m%d-%H%M%S)
        tar -czf ~/backups/prod-before-deploy-$TIMESTAMP.tar.gz . \
            --exclude='qual' \
            --exclude='demo' \
            --exclude='manyla' \
            --exclude='manylla' \
            --exclude='backups' \
            --exclude='.well-known'
        echo $TIMESTAMP > ~/.last-deployment-timestamp
        echo "✅ Backup created: prod-before-deploy-$TIMESTAMP.tar.gz"
EOF

    echo
    echo -e "${YELLOW}🧹 Cleaning orphaned bundle files in production...${NC}"
    ssh stackmap-cpanel << 'EOF'
        cd ~/public_html
        # Count old bundle files
        OLD_BUNDLES=$(ls -1 bundle.*.js 2>/dev/null | wc -l)
        if [ $OLD_BUNDLES -gt 0 ]; then
            echo "Found $OLD_BUNDLES old bundle files"
            # Remove all bundle files (new ones will be copied from qual)
            rm -f bundle.*.js bundle.*.js.LICENSE.txt
            echo "✅ Removed old bundle files"
        else
            echo "No old bundle files to clean"
        fi
        
        # Remove old webpack image assets (they have hash names)
        OLD_IMAGES=$(ls -1 *.png *.jpg 2>/dev/null | grep -E '^[a-f0-9]{20}\.' | wc -l || true)
        if [ $OLD_IMAGES -gt 0 ]; then
            echo "Found $OLD_IMAGES old image assets"
            ls -1 *.png *.jpg 2>/dev/null | grep -E '^[a-f0-9]{20}\.' | xargs rm -f
            echo "✅ Removed old image assets"
        fi
EOF

    echo
    echo -e "${YELLOW}📋 Preserving important production files...${NC}"
    ssh stackmap-cpanel << 'EOF'
        cd ~/public_html
        # Temporarily save files we want to preserve
        mkdir -p /tmp/preserve-prod
        [ -f .htaccess ] && cp .htaccess /tmp/preserve-prod/
        [ -f privacy.html ] && cp privacy.html /tmp/preserve-prod/
        [ -f support.html ] && cp support.html /tmp/preserve-prod/
        echo "✅ Preserved production-specific files"
EOF

    echo
    echo -e "${YELLOW}🔄 Syncing qual to production with cleanup...${NC}"
    ssh stackmap-cpanel << 'EOF'
        cd ~/public_html
        # Use rsync with --delete to remove files that don't exist in qual
        # But exclude directories we want to keep
        rsync -av --delete \
            --exclude='.git' \
            --exclude='error_log' \
            --exclude='.htaccess' \
            --exclude='qual' \
            --exclude='demo' \
            --exclude='manyla' \
            --exclude='manylla' \
            --exclude='.well-known' \
            --exclude='backups' \
            --exclude='privacy.html' \
            --exclude='support.html' \
            qual/ .
        
        # Restore preserved files
        [ -f /tmp/preserve-prod/.htaccess ] && cp /tmp/preserve-prod/.htaccess .
        [ -f /tmp/preserve-prod/privacy.html ] && cp /tmp/preserve-prod/privacy.html .
        [ -f /tmp/preserve-prod/support.html ] && cp /tmp/preserve-prod/support.html .
        rm -rf /tmp/preserve-prod
        
        echo "✅ Production synced from qual with cleanup"
EOF

    echo
    echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
    ssh stackmap-cpanel << 'EOF'
        cd ~/public_html
        echo "Current bundle files:"
        ls -1 bundle.*.js 2>/dev/null | head -3
        echo
        echo "API files count: $(find api -name '*.php' | wc -l)"
        echo "Font files: $(ls fonts/*.ttf 2>/dev/null | wc -l)"
        echo "Icon files: $(ls icons/*.png 2>/dev/null | wc -l)"
EOF

    echo
    echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
    echo "🌐 Production: https://stackmap.app"
    echo
    echo -e "${YELLOW}❗ If issues occur, run: ./scripts/clean-deploy.sh rollback${NC}"
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
        # Clean current deployment
        rm -rf api fonts icons
        rm -f bundle.*.js bundle.*.js.LICENSE.txt
        rm -f *.png *.jpg
        rm -f index.html manifest.json service-worker.js workbox-*.js
        
        # Restore from backup
        tar -xzf ~/backups/prod-before-deploy-$TIMESTAMP.tar.gz
        echo "✅ Production rolled back to state before $TIMESTAMP"
EOF
    
    echo
    echo -e "${GREEN}✅ ROLLBACK COMPLETE!${NC}"
    echo "🌐 Production restored: https://stackmap.app"
}

# Function to show status
show_status() {
    echo -e "${YELLOW}📊 Deployment Status Check${NC}"
    echo "=========================="
    
    ssh stackmap-cpanel << 'EOF'
        echo "QUAL Status:"
        echo "------------"
        cd ~/public_html/qual
        QUAL_BUNDLE=$(ls -1 bundle.*.js 2>/dev/null | head -1)
        echo "Bundle: $QUAL_BUNDLE"
        echo "Last modified: $(stat -c %y $QUAL_BUNDLE 2>/dev/null | cut -d' ' -f1,2 || echo 'N/A')"
        
        echo
        echo "PRODUCTION Status:"
        echo "------------------"
        cd ~/public_html
        PROD_BUNDLE=$(ls -1 bundle.*.js 2>/dev/null | head -1)
        echo "Bundle: $PROD_BUNDLE"
        echo "Last modified: $(stat -c %y $PROD_BUNDLE 2>/dev/null | cut -d' ' -f1,2 || echo 'N/A')"
        
        echo
        echo "Orphaned files check:"
        echo "--------------------"
        BUNDLE_COUNT=$(ls -1 bundle.*.js 2>/dev/null | wc -l)
        echo "Bundle files in production: $BUNDLE_COUNT"
        if [ $BUNDLE_COUNT -gt 1 ]; then
            echo "⚠️  Multiple bundle files detected - cleanup recommended"
            ls -1 bundle.*.js | tail -n +2
        fi
EOF
}

# Main logic
case "${1:-deploy}" in
    "rollback")
        rollback_prod
        ;;
    "deploy")
        deploy_with_cleanup
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 [deploy|rollback|status]"
        echo "  deploy   - Deploy qual to production with cleanup (default)"
        echo "  rollback - Rollback to previous production version"
        echo "  status   - Show deployment status and check for orphaned files"
        exit 1
        ;;
esac