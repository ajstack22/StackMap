#!/bin/bash
# Quick production deployment trigger

echo "🚀 Triggering production deployment..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not installed!"
    echo ""
    echo "To install on Mac: brew install gh"
    echo "Then run: gh auth login"
    exit 1
fi

# Trigger the workflow
gh workflow run deploy-to-production.yml -f confirm=DEPLOY

echo ""
echo "✅ Production deployment triggered!"
echo ""
echo "Monitor progress at:"
echo "https://github.com/ajstack22/StackMap/actions"
echo ""
echo "Or check status with:"
echo "gh run list --workflow=deploy-to-production.yml"