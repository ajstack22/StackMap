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
    
    # Copy demo-specific files if they exist in the main repo
    if [ -f "../demo-mushroom-kingdom.json" ]; then
        cp ../demo-mushroom-kingdom.json .
    fi
    
    # The demo has its own index.html, so we don't copy from main
    echo "✅ Demo updated (preserving demo-specific index.html)"
ENDSSH

if [ $? -eq 0 ]; then
    echo "✅ Successfully deployed demo!"
    echo "🔗 Test at: https://stackmap.app/demo/"
else
    echo "❌ Demo deployment failed!"
    exit 1
fi