#!/bin/bash

# Build script for Capacitor
# This script copies all necessary files to the www directory for Capacitor builds

echo "Building StackMap for Capacitor..."

# Clean the www directory
rm -rf www
mkdir -p www
mkdir -p www/src

# Copy all necessary files
echo "Copying application files..."
cp index.html www/
cp manifest.json www/
cp sw.js www/
cp offline.html www/ 2>/dev/null || true

# Copy icons
echo "Copying icons..."
cp icon-*.png www/ 2>/dev/null || true

# Copy src directory (JavaScript and CSS)
echo "Copying source files..."
cp -r src www/

# Copy any other necessary files
if [ -f stackmap-ios-test.json ]; then
    cp stackmap-ios-test.json www/
fi

echo "Build complete! Files copied to www directory."

# Update version in copied files
if [ -f "version.json" ]; then
    cp version.json www/
    echo "Version file copied to www directory."
fi