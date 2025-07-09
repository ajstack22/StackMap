#!/bin/bash
# Simple deployment script for qual environment

echo "Deploying to qual environment..."

# Build the web app
echo "Building web app..."
npm run build:web

# Create a deployment directory
echo "Preparing deployment files..."
rm -rf deploy-temp
mkdir -p deploy-temp

# Copy only the build files
cp -R web/build/* deploy-temp/
cp web/build/.htaccess deploy-temp/ 2>/dev/null || true

echo "Deployment files ready in deploy-temp/"
echo "Please manually upload the contents of deploy-temp/ to /public_html/qual/"