#!/bin/bash

echo "StackMap Deployment Fix Script"
echo "=============================="
echo ""
echo "This script will help ensure all files are properly deployed."
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Not in StackMap directory. Please run from /public_html/qual/"
    exit 1
fi

echo "Current directory: $(pwd)"
echo ""

# Pull latest changes
echo "1. Pulling latest changes from git..."
git pull
echo ""

# Check and create directories
echo "2. Ensuring directories exist..."
directories=("fonts" "api/sync" "icons")
for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "   Creating $dir..."
        mkdir -p "$dir"
    else
        echo "   ✓ $dir exists"
    fi
done
echo ""

# Check for missing files
echo "3. Checking for critical files..."
missing_files=0

# Font files
if [ ! -f "fonts/ComicRelief-Regular.ttf" ] || [ $(stat -f%z "fonts/ComicRelief-Regular.ttf" 2>/dev/null || stat -c%s "fonts/ComicRelief-Regular.ttf" 2>/dev/null || echo 0) -lt 50000 ]; then
    echo "   ❌ fonts/ComicRelief-Regular.ttf missing or too small"
    missing_files=$((missing_files + 1))
else
    echo "   ✓ fonts/ComicRelief-Regular.ttf ($(ls -lh fonts/ComicRelief-Regular.ttf | awk '{print $5}'))"
fi

if [ ! -f "fonts/ComicRelief-Bold.ttf" ] || [ $(stat -f%z "fonts/ComicRelief-Bold.ttf" 2>/dev/null || stat -c%s "fonts/ComicRelief-Bold.ttf" 2>/dev/null || echo 0) -lt 50000 ]; then
    echo "   ❌ fonts/ComicRelief-Bold.ttf missing or too small"
    missing_files=$((missing_files + 1))
else
    echo "   ✓ fonts/ComicRelief-Bold.ttf ($(ls -lh fonts/ComicRelief-Bold.ttf | awk '{print $5}'))"
fi

# API files
api_files=("access_share.php" "create_share.php" "database.php" "config.php")
for file in "${api_files[@]}"; do
    if [ ! -f "api/sync/$file" ]; then
        echo "   ❌ api/sync/$file missing"
        missing_files=$((missing_files + 1))
    else
        echo "   ✓ api/sync/$file"
    fi
done

# Other files
if [ ! -f "workbox-ff8f0705.js" ] || [ $(stat -f%z "workbox-ff8f0705.js" 2>/dev/null || stat -c%s "workbox-ff8f0705.js" 2>/dev/null || echo 0) -lt 10000 ]; then
    echo "   ❌ workbox-ff8f0705.js missing or too small"
    missing_files=$((missing_files + 1))
else
    echo "   ✓ workbox-ff8f0705.js ($(ls -lh workbox-ff8f0705.js | awk '{print $5}'))"
fi

echo ""

# Check .htaccess
echo "4. Checking .htaccess configuration..."
if [ -f ".htaccess" ]; then
    echo "   ✓ .htaccess exists"
    if grep -q "RewriteEngine" .htaccess; then
        echo "   ⚠️  Warning: .htaccess contains rewrite rules that might interfere"
    fi
else
    echo "   ❌ .htaccess missing"
fi

echo ""

# Summary
if [ $missing_files -eq 0 ]; then
    echo "✅ All files appear to be in place!"
    echo ""
    echo "If you're still seeing errors, check:"
    echo "1. File permissions (should be 644 for files, 755 for directories)"
    echo "2. .htaccess rules that might be blocking access"
    echo "3. Server configuration for serving .ttf files"
else
    echo "❌ $missing_files files are missing or incorrect!"
    echo ""
    echo "To fix:"
    echo "1. Make sure you've committed all files locally"
    echo "2. Run: git status (to check for uncommitted files)"
    echo "3. Run: git pull (to get latest changes)"
    echo "4. Check if git is tracking the files: git ls-files | grep fonts"
fi

echo ""
echo "5. Git status:"
git status --short

echo ""
echo "6. Recent commits:"
git log --oneline -5