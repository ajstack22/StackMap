#!/bin/bash

echo "Cleaning up root directory..."

# Remove built bundle files
echo "Removing bundle files..."
rm -f bundle.*.js
rm -f bundle.*.js.LICENSE.txt

# Remove hash-named image files
echo "Removing built image assets..."
rm -f 4164151b95ac79da8f72.png
rm -f 486aba93bf293905721b.png
rm -f 48fd557641a58f08c6c3.png
rm -f 53a807a3c6564e756e9f.png
rm -f 5442ce857d1c486d9ccd.png
rm -f 79dab4c2ffd95ab9aa85.png
rm -f 91c4cd9ad3817cd82b7d.png
rm -f 982a04fa1d3adebebf3b.png
rm -f 9db3bb4b1374629c20af.png
rm -f be73bec85ce7f8b7c601.png

# Remove service worker and workbox files
echo "Removing service worker files..."
rm -f service-worker.js
rm -f workbox-ff8f0705.js

# Remove built HTML and manifest
echo "Removing built web files..."
rm -f index.html
rm -f manifest.json

# Remove test/debug files
echo "Removing test files..."
rm -f check-files.php
rm -f check-workbox.php
rm -f clear-cache.html
rm -f debug-shares.html
rm -f test-api-share.html
rm -f test-before-push.js
rm -f test-browser.js
rm -f test-resources.html
rm -f test_button.html
rm -f direct-file-check.php
rm -f show-structure.php

# Remove duplicate directories
echo "Removing duplicate directories..."
rm -rf fonts/  # Keep only assets/fonts/
rm -rf icons/  # Keep only web/public/icons/

echo "Root directory cleaned!"
echo ""
echo "Files that should remain:"
echo "- Source files (*.js, App.js, etc.)"
echo "- Config files (package.json, webpack.config.js, etc.)"
echo "- Documentation (*.md)"
echo "- Source directories (src/, assets/, etc.)"
echo "- Build/deployment scripts"