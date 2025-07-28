#!/bin/bash

# Safe interactive cleanup script for public_html
# Run this on your server via SSH

echo "=== StackMap public_html Safe Cleanup Script ==="
echo ""

# Function to ask for confirmation
confirm() {
    read -p "$1 [y/N] " response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Step 1: Show current contents
echo "Current contents of public_html:"
cd ~/public_html/
ls -la

echo ""
echo "Files/folders to KEEP:"
echo "  - manylla/ (folder)"
echo "  - qual/ (folder)"
echo "  - All files from qual/ will be copied to root"

echo ""
echo "Files/folders to DELETE:"
# List everything except manylla and qual
find . -maxdepth 1 ! -name '.' ! -name 'manylla' ! -name 'qual' -print

echo ""
if confirm "Do you want to create a backup first?"; then
    echo "Creating backup..."
    tar -czf ~/stackmap-backup-$(date +%Y%m%d-%H%M%S).tar.gz .
    echo "Backup created in home directory"
fi

echo ""
if confirm "Proceed with cleanup?"; then
    echo "Cleaning up..."
    
    # Remove files (not directories)
    find . -maxdepth 1 -type f -delete
    
    # Remove directories except manylla and qual
    find . -maxdepth 1 -type d ! -name '.' ! -name 'manylla' ! -name 'qual' -exec rm -rf {} + 2>/dev/null
    
    echo "Cleanup complete"
else
    echo "Cleanup cancelled"
    exit 0
fi

echo ""
if confirm "Copy files from qual/ to public_html root?"; then
    echo "Copying files..."
    cp -r qual/* .
    cp qual/.htaccess . 2>/dev/null || true
    echo "Files copied"
fi

echo ""
echo "Final structure:"
ls -la

echo ""
echo "=== Done ==="