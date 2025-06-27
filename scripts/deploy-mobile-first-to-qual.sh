#!/bin/bash

# Deploy mobile-first-refactor branch to qual
# Run this in cPanel Terminal or SSH

echo "🚀 Deploying mobile-first-refactor to qual..."

# Navigate to qual directory
cd ~/public_html/qual

# Check current branch
echo "📍 Current branch:"
git branch

# Fetch all branches
echo "🔄 Fetching latest from GitHub..."
git fetch origin

# Check if mobile-first-refactor branch exists locally
if git show-ref --verify --quiet refs/heads/mobile-first-refactor; then
    echo "🔄 Switching to mobile-first-refactor branch..."
    git checkout mobile-first-refactor
    git pull origin mobile-first-refactor
else
    echo "📥 Creating mobile-first-refactor branch..."
    git checkout -b mobile-first-refactor origin/mobile-first-refactor
fi

# Verify we're on the right branch
echo ""
echo "✅ Now on branch:"
git branch

# Check if the new files are present
echo ""
echo "📋 Checking for new architecture files:"
if [ -f "src/stackmap.js" ]; then
    echo "✅ src/stackmap.js found"
else
    echo "❌ src/stackmap.js NOT found"
fi

if [ -f "sw.js" ]; then
    echo "✅ Service worker updated"
    grep "SW_VERSION" sw.js | head -1
else
    echo "❌ sw.js NOT found"
fi

# Clear any server-side cache if needed
echo ""
echo "🧹 Clearing potential server caches..."

# Touch .htaccess to force Apache to reload
if [ -f ".htaccess" ]; then
    touch .htaccess
    echo "✅ Refreshed .htaccess"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Please check:"
echo "1. Visit https://stackmap.app/qual in an incognito/private window"
echo "2. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo "3. Check browser console for SW version (should be 2.0.0)"
echo ""
echo "If still seeing old version:"
echo "- Clear browser cache completely"
echo "- Check if CloudFlare cache needs purging"
echo "- Run: curl -I https://stackmap.app/qual/sw.js to check headers"