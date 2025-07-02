#!/bin/bash

# Copy qual to production
# Run this in cPanel Terminal after manually cleaning public_html

echo "📋 Copying qual to production..."

cd ~/public_html

# Copy all files from qual to current directory (public_html)
echo "📁 Copying files..."
cp -r qual/* .
cp qual/.htaccess . 2>/dev/null

echo ""
echo "✅ Copy complete!"
echo ""
echo "📋 Next steps:"
echo "1. Visit https://stackmap.app in an incognito window"
echo "2. Hard refresh if needed (Ctrl+Shift+R)"
echo "3. Check browser console for SW version 2.0.0"
echo ""
echo "Current structure:"
ls -la | grep -v "^\." | head -20