#!/bin/bash

echo "Manual deployment script for qual environment"
echo "============================================"

# Check if we have the required files
if [ ! -f "web/build/index.html" ]; then
    echo "Error: web/build/index.html not found. Run 'npm run build:web' first."
    exit 1
fi

if [ ! -f "web/build/bundle.fb306ac155830e34403b.js" ]; then
    echo "Error: bundle.fb306ac155830e34403b.js not found. Run 'npm run build:web' first."
    exit 1
fi

echo ""
echo "Files to deploy:"
echo "================"
ls -la web/build/

echo ""
echo "Instructions for manual deployment:"
echo "==================================="
echo "1. Log into cPanel"
echo "2. Open File Manager"
echo "3. Navigate to /public_html/qual/"
echo "4. Delete all files EXCEPT hidden files (like .htaccess)"
echo "5. Upload these files from your local web/build/ directory:"
echo "   - All .png files"
echo "   - bundle.fb306ac155830e34403b.js"
echo "   - bundle.fb306ac155830e34403b.js.LICENSE.txt"
echo "   - index.html"
echo "   - The fonts/ directory"
echo ""
echo "6. Create a .htaccess file in /public_html/qual/ with this content:"
echo "---"
cat << 'EOF'
Options -Indexes
RewriteEngine On

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# Set correct MIME types
AddType application/javascript .js
AddType text/css .css
AddType image/png .png
AddType font/ttf .ttf
EOF
echo "---"
echo ""
echo "Your site will then be accessible at https://stackmap.app/qual/"