#!/bin/bash

echo "🚀 StackMap CI/CD Setup Script"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will help you set up GitHub Actions CI/CD for StackMap${NC}"
echo ""

echo "Prerequisites:"
echo "1. GitHub CLI (gh) must be installed"
echo "2. You must be authenticated with GitHub CLI"
echo ""

# Check if gh is installed
GH_PATH=""
if command -v gh &> /dev/null; then
    GH_PATH="gh"
elif [ -x "/opt/homebrew/bin/gh" ]; then
    GH_PATH="/opt/homebrew/bin/gh"
else
    echo -e "${RED}GitHub CLI (gh) is not installed!${NC}"
    echo "Install it with: brew install gh"
    echo "Then authenticate with: gh auth login"
    exit 1
fi

# Check if authenticated
if ! $GH_PATH auth status &> /dev/null; then
    echo -e "${RED}You are not authenticated with GitHub CLI!${NC}"
    echo "Run: $GH_PATH auth login"
    exit 1
fi

echo -e "${GREEN}✓ GitHub CLI is installed and authenticated${NC}"
echo ""

echo "Setting up GitHub Secrets for CI/CD..."
echo "======================================"
echo ""

# Set up secrets
echo "Setting CPANEL_HOST..."
$GH_PATH secret set CPANEL_HOST -b "199.188.200.57"

echo "Setting CPANEL_USER..."
$GH_PATH secret set CPANEL_USER -b "stachblx"

echo "Setting CPANEL_PORT..."
$GH_PATH secret set CPANEL_PORT -b "21098"

echo "Setting CPANEL_SSH_KEY..."
# Read the private key and set it as a secret
if [ -f ~/.ssh/id_rsa_cpanel ]; then
    $GH_PATH secret set CPANEL_SSH_KEY < ~/.ssh/id_rsa_cpanel
    echo -e "${GREEN}✓ SSH key added successfully${NC}"
else
    echo -e "${RED}SSH key not found at ~/.ssh/id_rsa_cpanel${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ All GitHub secrets have been set!${NC}"
echo ""

echo "Next Steps:"
echo "==========="
echo "1. Commit and push the .github/workflows/deploy.yml file"
echo "2. Fix the cPanel .cpanel.yml file to use correct paths"
echo "3. Enable GitHub Actions in your repository settings if needed"
echo "4. Push to main branch to trigger deployment"
echo ""

echo "To fix cPanel deployment path, run this on your server:"
echo "ssh stackmap-cpanel"
echo "cd ~/qual"
echo "sed -i 's|/home/stachblx/public_html/qual|/home/stachblx/qual|g' .cpanel.yml"
echo ""

echo -e "${GREEN}Setup complete!${NC}"