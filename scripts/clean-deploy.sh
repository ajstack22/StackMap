#!/bin/bash
# Clean deployment script that prevents orphaned files
# This script ensures the deployment matches exactly what's in the repository

set -e  # Exit on any error

# Configuration
TEMP_DIR="stackmap-deploy-temp"
BACKUP_DIR="stackmap-backup-$(date +%Y%m%d-%H%M%S)"

echo "🚀 StackMap Clean Deployment Script"
echo "=================================="

# Function to deploy to a target
deploy_to_target() {
    local TARGET=$1
    local TARGET_DIR=$2
    
    echo ""
    echo "📦 Deploying to $TARGET..."
    echo "Target directory: $TARGET_DIR"
    
    # Create deployment package
    echo "Creating deployment package..."
    rm -rf $TEMP_DIR
    mkdir -p $TEMP_DIR
    
    # Copy all files except excluded ones
    rsync -av \
        --exclude='.git*' \
        --exclude='node_modules' \
        --exclude='tests' \
        --exclude='docs' \
        --exclude='scripts' \
        --exclude='.github' \
        --exclude='package-lock.json' \
        --exclude='README.md' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --exclude='mobile-launch-issues' \
        --exclude='ios-wrapper' \
        --exclude='store-assets' \
        --exclude='issues' \
        --exclude='launch-prompts' \
        --exclude='context/CICD_research.md' \
        --exclude='DEVELOPMENT_PLAN.md' \
        --exclude='FTP_*' \
        --exclude='*.sh' \
        --exclude=$TEMP_DIR \
        --exclude=$BACKUP_DIR \
        ./ $TEMP_DIR/
    
    # Additional exclusions for production
    if [ "$TARGET" == "prod" ]; then
        rm -rf $TEMP_DIR/qual
        rm -rf $TEMP_DIR/.well-known
    fi
    
    echo ""
    echo "📋 Deployment package contents:"
    echo "Files: $(find $TEMP_DIR -type f | wc -l)"
    echo "Size: $(du -sh $TEMP_DIR | cut -f1)"
    
    # Create .ftp-deploy-sync-state.json for clean deployment
    # This tells FTP-Deploy-Action to delete files not in our package
    cat > $TEMP_DIR/.ftp-deploy-sync-state.json << EOF
{
  "version": 1,
  "description": "Clean deployment state",
  "generatedTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "data": []
}
EOF
    
    echo ""
    echo "Ready to deploy to $TARGET"
    echo "This will:"
    echo "  ✅ Upload all files from the deployment package"
    echo "  ✅ Delete any files on server not in the package"
    echo "  ❌ Preserve excluded directories (.well-known, qual)"
    echo ""
    
    # Clean up
    rm -rf $TEMP_DIR
}

# Main menu
echo ""
echo "Select deployment target:"
echo "1) Qual (stackmap.app/qual/)"
echo "2) Production (stackmap.app/)"
echo "3) Both (Qual first, then Production)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        deploy_to_target "qual" "/public_html/qual/"
        echo ""
        echo "✅ Qual deployment package ready!"
        echo ""
        echo "Next steps:"
        echo "1. Run the FTP deployment workflow for qual"
        echo "2. Verify at https://stackmap.app/qual/"
        ;;
    2)
        deploy_to_target "prod" "/public_html/"
        echo ""
        echo "✅ Production deployment package ready!"
        echo ""
        echo "⚠️  WARNING: This will update production!"
        echo ""
        echo "Next steps:"
        echo "1. Test thoroughly on qual first"
        echo "2. Run the FTP deployment workflow for production"
        echo "3. Verify at https://stackmap.app/"
        ;;
    3)
        deploy_to_target "qual" "/public_html/qual/"
        echo ""
        echo "✅ Qual deployment package ready!"
        echo ""
        read -p "Deploy to qual now? (y/n): " confirm
        if [ "$confirm" == "y" ]; then
            echo "Run qual deployment workflow..."
            echo ""
            read -p "Qual deployment complete? Continue to production? (y/n): " prod_confirm
            if [ "$prod_confirm" == "y" ]; then
                deploy_to_target "prod" "/public_html/"
                echo ""
                echo "✅ Production deployment package ready!"
            fi
        fi
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🏁 Deployment preparation complete!"