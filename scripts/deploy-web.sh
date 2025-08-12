#!/bin/bash

# Deploy Web/Qual Script - Handles version increment and web deployment
# Usage: ./scripts/deploy-web.sh [qual|prod]

set -e  # Exit on error

echo "🌐 Starting Web deployment process..."

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Source version increment function from shared script
source "$SCRIPT_DIR/version-increment.sh"

# Determine deployment target
TARGET="${1:-qual}"  # Default to qual if not specified

# Function to build web
build_web() {
    echo "📦 Building web application..."
    
    if [ "$TARGET" == "qual" ]; then
        echo "Building for Qual environment..."
        NODE_ENV=production npm run build:web
    else
        echo "Building for Production environment..."
        NODE_ENV=production PUBLIC_URL=/ npm run build:web
    fi
    
    echo "✅ Web build complete"
}

# Function to deploy to qual
deploy_qual() {
    echo "🚀 Deploying to Qual..."
    
    # Copy build files to root for qual
    echo "Copying build files to root..."
    cp web/build/*.* .
    cp -r web/build/fonts . 2>/dev/null || true
    cp -r web/build/icons . 2>/dev/null || true
    
    # Git operations
    echo "Committing changes..."
    git add -A
    git commit -m "Deploy to qual: v$NEW_VERSION" || echo "No changes to commit"
    git push origin main
    
    # Pull on server
    echo "Pulling changes on server..."
    ssh stackmap-cpanel "cd ~/public_html/qual && git pull" || {
        echo "⚠️  SSH deployment failed. Please manually pull on server."
    }
    
    echo "✅ Qual deployment complete"
    echo "🔗 Access at: https://stackmap.app/qual/"
}

# Function to deploy to production
deploy_production() {
    echo "🚀 Deploying to Production..."
    
    # Use simple-deploy script if it exists
    if [ -f "./scripts/simple-deploy.sh" ]; then
        echo "Using simple-deploy.sh for production..."
        ./scripts/simple-deploy.sh
    else
        echo "⚠️  simple-deploy.sh not found. Manual deployment required."
        echo "Production files are in web/build/"
    fi
    
    echo "✅ Production deployment complete"
    echo "🔗 Access at: https://stackmap.app/"
}

# Main execution
echo "========================================="
echo "   Web Deployment Script"
echo "   Target: $TARGET"
echo "========================================="

# Step 1: Increment version
increment_version

# Step 2: Build web
build_web

# Step 3: Deploy based on target
if [ "$TARGET" == "qual" ]; then
    deploy_qual
elif [ "$TARGET" == "prod" ] || [ "$TARGET" == "production" ]; then
    deploy_production
else
    echo "❌ Invalid target: $TARGET"
    echo "Usage: $0 [qual|prod]"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ Web Deployment complete!"
echo "✅ Version: $NEW_VERSION"
echo "✅ Environment: $TARGET"
echo "========================================="