#!/bin/bash

echo "🎮 Deploying Demo Environment..."
echo "================================"

# SSH into the server and update demo
ssh stackmap-cpanel << 'ENDSSH'
    cd ~/public_html/demo
    
    # Backup current demo
    if [ -f "index.html" ]; then
        tar -czf ~/backups/demo-backup-$(date +%Y%m%d-%H%M%S).tar.gz .
        echo "✅ Demo backed up"
    fi
    
    # Pull latest changes
    git pull origin main
    
    # Now apply demo-specific modifications to index.html
    echo "Applying demo customizations..."
    
    # 1. Insert demo banner after <body> tag
    if [ -f "../scripts/demo-banner.html" ]; then
        # Insert the banner right after the body tag
        sed -i '/<body[^>]*>/r ../scripts/demo-banner.html' index.html
    fi
    
    # 2. Add demo-specific CSS before </head>
    if [ -f "../scripts/demo-styles.css" ]; then
        # Insert the demo styles before </head>
        sed -i '/<\/head>/i\<style>/* Demo-specific styles */' index.html
        sed -i '/<style>\/\* Demo-specific styles \*\//r ../scripts/demo-styles.css' index.html
        sed -i '/<style>\/\* Demo-specific styles \*\//a\</style>' index.html
    fi
    
    # 3. Set DEMO_MODE flag
    # Add window.DEMO_MODE = true after the first <script> tag
    sed -i '0,/<script>/{s/<script>/<script>\n    window.DEMO_MODE = true;/}' index.html
    
    # 4. Copy demo data file if it exists
    if [ -f "../demo-mushroom-kingdom.json" ]; then
        cp ../demo-mushroom-kingdom.json .
    fi
    
    echo "✅ Demo customizations applied"
ENDSSH

if [ $? -eq 0 ]; then
    echo "✅ Successfully deployed demo!"
    echo "🔗 Test at: https://stackmap.app/demo/"
else
    echo "❌ Demo deployment failed!"
    exit 1
fi