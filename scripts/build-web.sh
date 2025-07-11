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

# Note: Build files are kept in web/build/ directory
# They should be deployed from there, not copied to root
echo "📋 Build files ready in web/build/"
success "Build files ready for deployment"

# Create deployment manifest
echo "📝 Creating deployment manifest..."
cat > web/build/.deployment-manifest <<EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "react-native-web",
  "bundleHash": "$(cd web/build && ls bundle.*.js | head -1 | grep -o '[a-f0-9]\{16,\}')"
}
EOF
success "Deployment manifest created"

echo
echo "✅ BUILD COMPLETE!"
echo "📦 Build files ready in web/build/ directory"
echo
echo "Next steps:"
echo "1. Commit changes: git add web/build && git commit -m 'Build for deployment'"
echo "2. Push to GitHub: git push origin main"
echo "3. Deploy will use files from web/build/ directory"