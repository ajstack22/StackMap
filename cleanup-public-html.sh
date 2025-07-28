#!/bin/bash

# Server cleanup script for public_html
# Run this on your server via SSH

echo "=== StackMap public_html Cleanup Script ==="
echo ""

# Step 1: List current contents
echo "Step 1: Current contents of public_html:"
ls -la ~/public_html/

echo ""
echo "Step 2: Backing up current state..."
# Create a backup just in case
cd ~/public_html/
tar -czf ~/stackmap-backup-$(date +%Y%m%d-%H%M%S).tar.gz .

echo ""
echo "Step 3: Removing unnecessary files (keeping manylla and qual folders)..."
# Remove all files and folders except manylla and qual
find ~/public_html -maxdepth 1 -type f -delete
find ~/public_html -maxdepth 1 -type d ! -name 'public_html' ! -name 'manylla' ! -name 'qual' -exec rm -rf {} + 2>/dev/null

echo ""
echo "Step 4: Copying files from qual to public_html root..."
# Copy all files from qual to public_html (not the qual directory itself)
cp -r ~/public_html/qual/* ~/public_html/
cp ~/public_html/qual/.htaccess ~/public_html/ 2>/dev/null || true

echo ""
echo "Step 5: Final structure:"
ls -la ~/public_html/

echo ""
echo "=== Cleanup Complete ==="
echo "StackMap should now be accessible from your main domain"
echo "Qual version remains at: /qual"
echo "Manylla remains at: /manylla"