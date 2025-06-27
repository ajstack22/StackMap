#!/bin/bash

# Fix cPanel Qual Directory Setup
# This script should be run via cPanel Terminal or SSH

echo "🔧 Fixing cPanel Qual Directory Setup..."

# Check if we're in the right directory
if [[ ! "$HOME" == "/home/stachblx" ]]; then
    echo "❌ Error: This script should be run on the NameCheap server"
    echo "Current HOME: $HOME"
    exit 1
fi

echo "📁 Creating qual directory structure..."

# Create public_html/qual directory if it doesn't exist
if [ ! -d "$HOME/public_html/qual" ]; then
    mkdir -p "$HOME/public_html/qual"
    echo "✅ Created public_html/qual directory"
else
    echo "✅ public_html/qual directory already exists"
fi

# Initialize git in public_html/qual directory
cd "$HOME/public_html/qual"
if [ ! -d ".git" ]; then
    git init
    echo "✅ Initialized git repository in qual"
else
    echo "✅ Git repository already initialized"
fi

# Set up remote if not already set
if ! git remote | grep -q "origin"; then
    git remote add origin https://github.com/ajstack22/StackMap.git
    echo "✅ Added GitHub remote"
else
    echo "✅ Remote already configured"
fi

# Fetch latest
echo "🔄 Fetching latest from GitHub..."
git fetch origin

# Check if main branch exists locally
if ! git show-ref --verify --quiet refs/heads/main; then
    echo "📥 Setting up main branch..."
    git checkout -b main origin/main
else
    echo "🔄 Checking out main branch..."
    git checkout main
    git pull origin main
fi

echo "✅ Qual directory setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go back to cPanel Git Version Control"
echo "2. If the repository is already listed, remove it"
echo "3. Create a new repository with path: /home/stachblx/public_html/qual"
echo "4. The deployment path should be the same: /home/stachblx/public_html/qual"
echo "5. Pull the latest changes from the main branch"