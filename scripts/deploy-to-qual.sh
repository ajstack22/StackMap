#!/bin/bash

# Quick deploy to qual/staging environment

echo "🚀 Deploying to Qual/Staging..."
echo "=============================="

# Deploy to qual
if ssh stackmap-cpanel "cd ~/public_html/qual && git pull origin main"; then
    echo "✅ Successfully deployed to qual!"
    echo "🔗 Test at: https://stackmap.app/qual/"
else
    echo "❌ Deployment failed!"
    exit 1
fi