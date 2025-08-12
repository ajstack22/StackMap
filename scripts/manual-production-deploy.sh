#!/bin/bash

# Manual Production Deployment Script
# Run this in cPanel Terminal or SSH

echo "🚀 Manual Production Deployment"
echo "================================"

# Navigate to public_html
cd ~/public_html

# Backup critical files
echo "📦 Backing up critical files..."
cp .htaccess .htaccess.backup 2>/dev/null
cp -r .well-known .well-known.backup 2>/dev/null

# Remove old architecture files and directories
echo "🧹 Cleaning up old architecture..."
rm -rf app/ components/ config/ data/ js/ styles/ utils/ timer/
rm -f state.js components.js renderer.js drive-sync.js env-loader.js
rm -f privacy.html terms.html support.html offline.html

# Fetch latest from GitHub
echo "📥 Fetching latest from GitHub..."
if [ ! -d .git ]; then
    git init
    git remote add origin https://github.com/ajstack22/StackMap.git
fi

git fetch origin main
git reset --hard origin/main

# Restore critical files if they were removed
echo "🔄 Restoring critical files..."
if [ -f .htaccess.backup ]; then
    mv .htaccess.backup .htaccess
fi
if [ -d .well-known.backup ]; then
    rm -rf .well-known
    mv .well-known.backup .well-known
fi

# Verify deployment
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Verification checklist:"
echo "- Check if src/ directory exists"
echo "- Check if old directories (app/, components/, etc.) are gone"
echo "- Visit https://stackmap.app in incognito mode"
echo "- Check console for SW version 2.0.0"

# List current structure
echo ""
echo "📁 Current file structure:"
ls -la | grep -E "^d|\.js$|\.html$|\.json$"