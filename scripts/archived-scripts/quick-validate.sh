#!/bin/bash

# Quick validation of deployment
URL="${1:-https://stackmap.app/qual/}"

echo "🔍 Quick Validation of $URL"
echo "=========================="
echo ""

# Check main resources
echo "Checking resources..."
curl -s -I "$URL" | grep "HTTP" | head -1
curl -s "$URL" | grep -q "android-app-fixes.css" && echo "✓ Android fixes CSS found" || echo "✗ Android fixes CSS missing"
curl -s "$URL" | grep -q "Material Icons" && echo "✓ Material Icons referenced" || echo "✗ Material Icons missing"

echo ""
echo "Mobile preview link:"
echo "📱 https://www.browserstack.com/responsive?url=$URL"
echo ""
echo "Or test on your Android device directly!"