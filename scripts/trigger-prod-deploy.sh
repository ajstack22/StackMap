#!/bin/bash

# Local script to trigger production deployment
# Run this from your local machine after testing qual

echo "🚀 StackMap Production Deployment Trigger"
echo "========================================"
echo ""

# Check if we have uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo ""
fi

# Show recent commits
echo "Recent commits:"
git log --oneline -5
echo ""

# Get deployment message
read -p "Enter deployment message (or press Enter for default): " DEPLOY_MSG
if [ -z "$DEPLOY_MSG" ]; then
    DEPLOY_MSG="Manual production deployment $(date +%Y-%m-%d)"
fi

# Confirm deployment
echo ""
echo "This will:"
echo "1. SSH to your cPanel server"
echo "2. Create deployment flag in qual"
echo "3. The cron job will pick it up and deploy to production"
echo ""
read -p "Proceed with production deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# SSH to server and create deployment flag
echo ""
echo "📡 Connecting to cPanel server..."

# You'll need to update this with your actual SSH details
SSH_USER="stachblx"
SSH_HOST="your-cpanel-server.com"
SSH_PORT="22"  # Or your custom SSH port

ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
    echo "$DEPLOY_MSG" > /home/stachblx/qual/.deploy-to-prod
    echo "✅ Deployment flag created"
    echo ""
    echo "The cron job will deploy to production within the next few minutes."
    echo "Check https://stackmap.app to verify deployment."
EOF

echo ""
echo "✅ Deployment triggered!"
echo ""
echo "Next steps:"
echo "1. Wait 1-5 minutes for cron to run"
echo "2. Check https://stackmap.app"
echo "3. Verify the deployment succeeded"
echo ""