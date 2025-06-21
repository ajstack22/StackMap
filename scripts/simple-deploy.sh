#!/bin/bash

# Simple Push-Button Deployment Script
# One command to deploy qual to prod with automatic rollback capability

set -e  # Exit on any error

echo "🚀 StackMap Simple Deployment System"
echo "===================================="
echo

# Function to deploy
deploy_to_prod() {
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

    echo
    echo "✅ DEPLOYMENT COMPLETE!"
    echo "🌐 Production: https://stackmap.app"
    echo
    echo "❗ If issues occur, run: ./scripts/simple-deploy.sh rollback"
}

# Function to rollback
rollback_prod() {
    echo "⏮️  Rolling back production to previous version..."
    
    # Get the last deployment timestamp
    TIMESTAMP=$(ssh stackmap-cpanel 'cat ~/.last-deployment-timestamp 2>/dev/null')
    
    if [ -z "$TIMESTAMP" ]; then
        echo "❌ No rollback available - no previous deployment found"
        exit 1
    fi
    
    echo "📦 Restoring from backup: prod-before-deploy-$TIMESTAMP.tar.gz"
    ssh stackmap-cpanel << EOF
        cd ~/public_html
        tar -xzf ~/backups/prod-before-deploy-$TIMESTAMP.tar.gz
        echo "✅ Production rolled back to state before $TIMESTAMP"
EOF
    
    echo
    echo "✅ ROLLBACK COMPLETE!"
    echo "🌐 Production restored: https://stackmap.app"
}

# Main logic
case "${1:-deploy}" in
    "rollback")
        rollback_prod
        ;;
    "deploy")
        deploy_to_prod
        ;;
    *)
        echo "Usage: $0 [deploy|rollback]"
        echo "  deploy   - Deploy qual to production (default)"
        echo "  rollback - Rollback to previous production version"
        exit 1
        ;;
esac