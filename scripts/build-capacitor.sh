#!/bin/bash

# Build script for Capacitor
# This script copies all necessary files to the www directory for Capacitor builds

echo "Building StackMap for Capacitor..."

# Clean the www directory
rm -rf www
mkdir -p www

# Copy all necessary files
echo "Copying application files..."
cp index.html www/
cp manifest.json www/
cp browserconfig.xml www/
cp sw.js www/
cp offline.html www/
cp privacy.html www/
cp support.html www/
cp terms.html www/

# Copy icons
echo "Copying icons..."
cp icon-*.png www/

# Copy JavaScript files
echo "Copying JavaScript files..."
cp *.js www/
cp -r js www/
cp -r app www/
cp -r components www/
cp -r config www/
cp -r data www/
cp -r utils www/

# Copy styles
echo "Copying styles..."
cp -r styles www/

# Copy demo files
echo "Copying demo files..."
cp -r demo www/
cp demo-mushroom-kingdom.json www/

# Copy timer
echo "Copying timer app..."
cp -r timer www/

echo "Build complete! Files copied to www directory."