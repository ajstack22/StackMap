#!/bin/bash

echo "Building and preparing web deployment..."

# Build with production settings
NODE_ENV=production npm run build:web

# Copy files from web/build to root
echo "Copying build files to root..."
cp web/build/index.html .
cp web/build/bundle.*.js .
cp web/build/bundle.*.js.LICENSE.txt . 2>/dev/null || true
cp web/build/service-worker.js .
cp web/build/workbox-*.js .
cp web/build/manifest.json .
cp -r web/build/icons .
cp -r web/build/fonts .

# Show what needs to be deployed
echo ""
echo "Files ready for deployment:"
ls -la index.html bundle.*.js service-worker.js manifest.json

echo ""
echo "These files are gitignored and need to be manually deployed."
echo "Options:"
echo "1. Use FTP/cPanel to upload these files to /public_html/qual/"
echo "2. OR temporarily remove from .gitignore, commit, push, then re-add to .gitignore"