#!/bin/bash

echo "Verifying StackMap deployment files..."
echo ""

# Check for critical files
files=(
    "index.html"
    "bundle.*.js"
    "service-worker.js"
    "workbox-*.js"
    "manifest.json"
    "fonts/ComicRelief-Regular.ttf"
    "fonts/ComicRelief-Bold.ttf"
    "api/sync/access_share.php"
    "api/sync/create_share.php"
    "api/sync/database.php"
)

missing_files=0

for pattern in "${files[@]}"; do
    # Use ls to handle wildcards
    if ls $pattern >/dev/null 2>&1; then
        echo "✓ $pattern exists"
    else
        echo "✗ $pattern MISSING"
        missing_files=$((missing_files + 1))
    fi
done

echo ""
if [ $missing_files -eq 0 ]; then
    echo "✅ All files present! Deployment looks good."
else
    echo "❌ $missing_files files missing. Please check deployment."
fi

echo ""
echo "Latest commit:"
git log -1 --oneline