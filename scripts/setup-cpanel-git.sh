#!/bin/bash
# Script to set up Git remote for cPanel

echo "🔧 StackMap - Setup cPanel Git Remote"
echo "====================================="

# Configuration
CPANEL_HOST="your-domain.com"
CPANEL_USER="your-cpanel-username"
CPANEL_PATH="/home/$CPANEL_USER/public_html/stackmap"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}This script will set up a Git remote for your cPanel${NC}"
echo "Make sure you have:"
echo "1. SSH access to your cPanel account"
echo "2. Git installed on your cPanel server"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    echo "Run 'git init' first"
    exit 1
fi

# Check if cpanel remote already exists
if git remote | grep -q "cpanel"; then
    echo -e "${YELLOW}Remote 'cpanel' already exists${NC}"
    echo "Current URL: $(git remote get-url cpanel)"
    echo -e "\n${YELLOW}Do you want to update it? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        git remote remove cpanel
    else
        exit 0
    fi
fi

# Add cPanel as remote
echo -e "\n${GREEN}Adding cPanel as git remote...${NC}"
git remote add cpanel "ssh://$CPANEL_USER@$CPANEL_HOST$CPANEL_PATH"

echo -e "${GREEN}✅ Remote added successfully!${NC}"
echo ""
echo -e "${YELLOW}Usage:${NC}"
echo "  Push to cPanel:  git push cpanel main"
echo "  Pull from cPanel: git pull cpanel main"
echo ""
echo -e "${YELLOW}First time setup on cPanel (via SSH):${NC}"
echo "  ssh $CPANEL_USER@$CPANEL_HOST"
echo "  cd $CPANEL_PATH"
echo "  git init"
echo "  git add ."
echo "  git commit -m 'Initial cPanel commit'"
echo ""
echo -e "${YELLOW}To pull current cPanel files:${NC}"
echo "  git pull cpanel main --allow-unrelated-histories"