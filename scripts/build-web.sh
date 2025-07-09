#!/bin/bash

# Build React Native Web for Production Deployment
# This script builds the web version and prepares files for deployment

set -e  # Exit on any error

echo "🏗️  StackMap React Native Web Build"
echo "==================================="
echo

# Function to exit with error
exit_error() {
    echo -e "\033[0;31m❌ $1\033[0m"
    exit 1
}

# Function to show success
success() {
    echo -e "\033[0;32m✅ $1\033[0m"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "webpack.config.js" ]; then
    exit_error "Must run from StackMap root directory"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install || exit_error "Failed to install dependencies"
    success "Dependencies installed"
fi

# Build the web version
echo "🔨 Building React Native web..."
npm run build:web || exit_error "Build failed"
success "Web build completed"

# Copy build files to root (for deployment)
echo "📋 Copying build files..."
cp -r web/build/* . || exit_error "Failed to copy build files"
success "Build files copied to root"

# Update service worker cache version
echo "🔄 Updating service worker cache version..."
TIMESTAMP=$(date +%s)
sed -i.bak "s/stackmap-v[0-9]*/stackmap-v$TIMESTAMP/" sw.js
rm sw.js.bak
success "Service worker updated with new cache version"

# Create deployment manifest
echo "📝 Creating deployment manifest..."
cat > .deployment-manifest <<EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "react-native-web",
  "bundleHash": "$(ls bundle.*.js | head -1 | grep -o '[a-f0-9]\{16,\}')"
}
EOF
success "Deployment manifest created"

echo
echo "✅ BUILD COMPLETE!"
echo "📦 Ready for deployment to server"
echo
echo "Next steps:"
echo "1. Commit changes: git add -A && git commit -m 'Build for deployment'"
echo "2. Push to GitHub: git push origin main"
echo "3. Deploy to server: ./scripts/simple-deploy.sh"