#!/bin/bash
# Simple script to create font upload commands
# Run this on your server in the /public_html/qual directory

echo "Creating fonts directory..."
mkdir -p fonts

echo "Font files need to be uploaded to:"
echo "  /public_html/qual/fonts/ComicRelief-Bold.ttf"
echo "  /public_html/qual/fonts/ComicRelief-Regular.ttf"
echo ""
echo "File sizes should be:"
echo "  ComicRelief-Bold.ttf: ~92.5 KB"
echo "  ComicRelief-Regular.ttf: ~78.4 KB"