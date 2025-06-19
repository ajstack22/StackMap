#!/bin/bash

# StackMap Branch Cleanup Script
# Created: 2025-06-19
# Purpose: Clean up merged branches safely

echo "🌿 StackMap Branch Cleanup Script"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ You must be on the main branch to run this script${NC}"
    echo "Current branch: $CURRENT_BRANCH"
    echo "Run: git checkout main"
    exit 1
fi

echo "📊 Current branch status:"
echo "------------------------"
echo -e "${GREEN}✓ On main branch${NC}"
echo ""

# List merged branches
echo "📋 Branches merged into main:"
echo "----------------------------"
MERGED_BRANCHES=$(git branch --merged main | grep -v "^\\* main" | grep -v "^  main$")
if [ -z "$MERGED_BRANCHES" ]; then
    echo "No merged branches found."
else
    echo "$MERGED_BRANCHES"
fi

echo ""
echo "📋 Unmerged branches:"
echo "-------------------"
UNMERGED_BRANCHES=$(git branch --no-merged main)
if [ -z "$UNMERGED_BRANCHES" ]; then
    echo "No unmerged branches found."
else
    echo -e "${YELLOW}$UNMERGED_BRANCHES${NC}"
fi

echo ""
echo "🗑️  Deleting merged local branches..."
echo "------------------------------------"

# Delete each merged branch
while IFS= read -r branch; do
    if [ ! -z "$branch" ]; then
        # Trim whitespace
        branch=$(echo "$branch" | xargs)
        echo -n "  - Deleting: $branch ... "
        if git branch -d "$branch" 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗ Failed${NC}"
        fi
    fi
done <<< "$MERGED_BRANCHES"

echo ""
echo "🌐 Remote branches status:"
echo "-------------------------"

# Check for remote branches that can be pruned
echo "Fetching remote branch information..."
git fetch --prune --dry-run 2>&1 | grep -E "Would prune" || echo "No remote branches to prune."

echo ""
echo "📋 Remote branches:"
git branch -r | grep -v HEAD

echo ""
echo "🧹 Cleanup Summary:"
echo "------------------"

# Count remaining branches
LOCAL_COUNT=$(git branch | grep -v "^\\*" | wc -l | xargs)
REMOTE_COUNT=$(git branch -r | grep -v HEAD | wc -l | xargs)

echo "Local branches remaining: $LOCAL_COUNT"
echo "Remote branches: $REMOTE_COUNT"

echo ""
echo "💡 Next steps:"
echo "--------------"

# Check for unmerged branch
if [ ! -z "$UNMERGED_BRANCHES" ]; then
    echo -e "${YELLOW}⚠️  You have unmerged branches:${NC}"
    echo "$UNMERGED_BRANCHES"
    echo ""
    echo "To check what's in an unmerged branch:"
    echo "  git log main..feature-access-control"
    echo ""
    echo "To delete an unmerged branch (if no longer needed):"
    echo "  git branch -D feature-access-control"
fi

echo ""
echo "To clean up remote tracking branches:"
echo "  git fetch --prune"
echo ""
echo "To push the branch cleanup to remote:"
echo "  git push --all"

echo ""
echo -e "${GREEN}✅ Branch cleanup complete!${NC}"