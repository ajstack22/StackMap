#!/bin/bash

# Script to fix cPanel Git configuration
echo "=== Fixing cPanel Git Configuration ==="
echo ""

# Function to setup git repo
setup_git_repo() {
    local dir=$1
    local repo_url="https://github.com/ajstack22/StackMap.git"
    
    echo "Setting up Git in $dir..."
    cd "$dir" || exit 1
    
    # Check if it's already a git repo
    if [ -d ".git" ]; then
        echo "Git repository already exists. Checking configuration..."
        
        # Ensure we're on main branch
        current_branch=$(git branch --show-current)
        if [ "$current_branch" != "main" ]; then
            echo "Switching to main branch..."
            git checkout main || git checkout -b main origin/main
        fi
        
        # Update remote URL if needed
        current_url=$(git remote get-url origin 2>/dev/null)
        if [ "$current_url" != "$repo_url" ]; then
            echo "Updating remote URL..."
            git remote set-url origin "$repo_url"
        fi
        
        # Fetch latest
        echo "Fetching latest from origin..."
        git fetch origin
        
        # Reset to match origin/main
        echo "Resetting to match origin/main..."
        git reset --hard origin/main
    else
        echo "Initializing new Git repository..."
        git init
        git remote add origin "$repo_url"
        git fetch origin
        git checkout -b main origin/main
    fi
    
    echo "Git setup completed for $dir"
    echo ""
}

# Fix production repository
echo "1. Fixing Production Repository (/home/stachblx/public_html):"
setup_git_repo "/home/stachblx/public_html"

# Fix qual repository
echo "2. Fixing Qual Repository (/home/stachblx/qual):"
setup_git_repo "/home/stachblx/qual"

echo "=== Git Configuration Fixed ==="
echo ""
echo "You should now be able to use cPanel's Git deployment feature."
echo "Try pulling from the repository again in cPanel."