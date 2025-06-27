#!/bin/bash

# Build script for StackMap refactor
# Copies web assets to www directory for Capacitor

echo "Building StackMap refactor..."

# Clean www directory
rm -rf www/*

# Copy HTML files
cp index.html www/
cp emergency-static.html www/
cp test-sqlite.html www/ 2>/dev/null || true

# Copy directories
cp -r js www/
cp -r css www/
cp -r icons www/ 2>/dev/null || true

# Copy manifest
cp manifest.json www/ 2>/dev/null || true

echo "Build complete! Files copied to www/"
echo "Run 'npx cap sync' to update native projects"