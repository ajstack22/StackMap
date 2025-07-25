#!/bin/bash

echo "Emergency Repository Fix Script"
echo "==============================="
echo ""
echo "WARNING: The repository shows hundreds of deleted files."
echo "This script will help restore the repository to a working state."
echo ""

# Safety check
echo "Current directory: $(pwd)"
echo ""

# Check git status
echo "1. Current git status summary:"
git status --short | head -20
echo "..."
echo "Total deleted files: $(git status --short | grep -c '^D')"
echo ""

# Show current branch and commit
echo "2. Current branch and commit:"
git branch --show-current
git log -1 --oneline
echo ""

# Options for fixing
echo "3. Options to fix this issue:"
echo ""
echo "Option A: Reset to HEAD (recommended if files were accidentally deleted)"
echo "  Command: git reset --hard HEAD"
echo ""
echo "Option B: Stash changes and pull latest"
echo "  Commands:"
echo "    git stash"
echo "    git pull"
echo ""
echo "Option C: Force checkout from remote"
echo "  Commands:"
echo "    git fetch origin"
echo "    git reset --hard origin/main"
echo ""
echo "Option D: Clone fresh (nuclear option - will lose any local changes)"
echo "  Commands:"
echo "    cd .."
echo "    mv qual qual.backup.$(date +%Y%m%d_%H%M%S)"
echo "    git clone https://github.com/ajstack22/StackMap.git qual"
echo "    cd qual"
echo "    cp ../qual.backup.*/api/sync/config.php api/sync/ (if exists)"
echo ""

# Recommendation
echo "RECOMMENDATION: Try Option A first (git reset --hard HEAD)"
echo ""
echo "To execute Option A, run:"
echo "  git reset --hard HEAD"
echo ""
echo "Then run:"
echo "  ./verify-deployment.sh"
echo ""
echo "If that doesn't work, try Option C (force checkout from remote)."