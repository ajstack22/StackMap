#!/bin/bash

# StackMap Staging Verification Helper Script
# This script helps verify staging deployments before production

echo "🔍 StackMap Staging Verification"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we can connect to server
echo "Checking SSH connection..."
if ssh -o BatchMode=yes -o ConnectTimeout=5 stackmap-cpanel echo "Connected" &> /dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to server${NC}"
    echo "Run: ssh stackmap-cpanel"
    exit 1
fi

echo ""
echo "Fetching staging information..."
echo ""

# Get deployment info
echo -e "${YELLOW}Latest Staging Deployment:${NC}"
ssh stackmap-cpanel "cd ~/public_html/staging && git log --oneline -1 && echo '' && ls -la index.html | awk '{print \"Deployed: \" \$6 \" \" \$7 \" \" \$8}'"

echo ""
echo -e "${YELLOW}Recent Changes:${NC}"
ssh stackmap-cpanel "cd ~/public_html/staging && git log --oneline -5"

echo ""
echo -e "${YELLOW}File Differences from Production:${NC}"
ssh stackmap-cpanel "cd ~/public_html && diff -r --brief staging . 2>/dev/null | grep -v '^Only in \./staging' | grep -v '^Only in \./qual' | head -10"

echo ""
echo "================================"
echo -e "${YELLOW}Verification Options:${NC}"
echo ""
echo "1. Download staging files for local testing:"
echo "   scp -r stackmap-cpanel:~/public_html/staging ~/Desktop/staging-test"
echo ""
echo "2. SSH to server for direct inspection:"
echo "   ssh stackmap-cpanel"
echo "   cd ~/public_html/staging"
echo ""
echo "3. Compare specific file with production:"
echo "   ssh stackmap-cpanel 'diff ~/public_html/staging/FILE ~/public_html/FILE'"
echo ""
echo "4. Run local server on staging (via SSH):"
echo "   ssh -L 8080:localhost:8080 stackmap-cpanel"
echo "   # In server: cd ~/public_html/staging && python3 -m http.server 8080"
echo "   # Then visit: http://localhost:8080"
echo ""
echo "================================"
echo ""
read -p "Have you verified the staging deployment? (y/n) " -n 1 -r
echo ""
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✓ Great! Proceed to GitHub Actions to approve production deployment${NC}"
    echo ""
    echo "Go to: https://github.com/ajstack22/StackMap/actions"
    echo "Click on the running workflow → Review deployments → Approve"
else
    echo -e "${YELLOW}⚠️  Please complete verification before approving production deployment${NC}"
    echo ""
    echo "Refer to: docs/DEPLOYMENT_VERIFICATION_CHECKLIST.md"
fi