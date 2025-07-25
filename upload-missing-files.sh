#!/bin/bash

echo "Manual File Upload Script"
echo "========================"
echo ""
echo "This script creates a tar archive of the missing files for manual upload."
echo ""

# Create temporary directory
TEMP_DIR="stackmap-files-upload"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copy essential files
echo "Copying files..."
mkdir -p $TEMP_DIR/fonts
cp fonts/ComicRelief-*.ttf $TEMP_DIR/fonts/

mkdir -p $TEMP_DIR/icons  
cp icons/*.png $TEMP_DIR/icons/

# Copy root files
cp workbox-ff8f0705.js $TEMP_DIR/
cp .htaccess $TEMP_DIR/

# Create tar archive
TAR_FILE="stackmap-missing-files.tar.gz"
echo "Creating archive: $TAR_FILE"
tar -czf $TAR_FILE $TEMP_DIR

# Cleanup
rm -rf $TEMP_DIR

echo ""
echo "Archive created: $TAR_FILE"
echo "Size: $(ls -lh $TAR_FILE | awk '{print $5}')"
echo ""
echo "To deploy manually:"
echo "1. Upload $TAR_FILE to the server"
echo "2. On server, run:"
echo "   tar -xzf stackmap-missing-files.tar.gz"
echo "   cp -r stackmap-files-upload/* ."
echo "   rm -rf stackmap-files-upload stackmap-missing-files.tar.gz"
echo ""
echo "Or use CPanel File Manager to upload individual files."