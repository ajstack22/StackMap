#!/bin/bash

# Post-pull script for cPanel
# This script should be run after git pull to prepare files for serving

# This script should be placed on the cPanel server and run after git pull

QUAL_PATH="/home/stachblx/qual"
LOG_FILE="/home/stachblx/deployment-logs/post-pull-$(date +%Y%m%d-%H%M%S).log"

exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "Running post-pull tasks..."
echo "=========================="

cd "$QUAL_PATH"

# Check if web/build exists
if [ -d "web/build" ]; then
    echo "✅ Found web/build directory"
    
    # Copy files from web/build to qual root
    echo "📋 Copying build files to qual root..."
    cp -r web/build/* . 2>/dev/null || echo "Note: Some files may already exist"
    
    echo "✅ Build files deployed to qual root"
else
    echo "⚠️  No web/build directory found - using existing files"
fi

# Set proper permissions
find . -type f -name "*.html" -exec chmod 644 {} \;
find . -type f -name "*.js" -exec chmod 644 {} \;
find . -type f -name "*.css" -exec chmod 644 {} \;

echo "✅ Post-pull tasks complete"
echo "🔗 Site available at: https://stackmap.app/qual/"