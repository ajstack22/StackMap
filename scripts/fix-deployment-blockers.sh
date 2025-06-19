#!/bin/bash

# Script to help fix common deployment blockers

echo "🔧 Fixing Common Deployment Blockers"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "1. Removing console.log statements..."
echo "-------------------------------------"

# Count current console.logs
CONSOLE_COUNT=$(grep -r "console\.log" --include="*.js" --exclude-dir=node_modules --exclude-dir=tests . | wc -l | tr -d ' ')
echo "Found $CONSOLE_COUNT console.log statements"

if [ "$CONSOLE_COUNT" -gt 0 ]; then
    read -p "Remove all console.log statements? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create backup
        echo "Creating backup..."
        mkdir -p .backup
        tar -czf .backup/before-console-removal-$(date +%s).tar.gz --exclude=node_modules --exclude=.git .
        
        # Remove console.logs but keep the line structure
        find . -name "*.js" -not -path "./node_modules/*" -not -path "./tests/*" -exec sed -i.bak 's/console\.log/\/\/ console\.log/g' {} +
        
        # Clean up .bak files
        find . -name "*.js.bak" -delete
        
        echo -e "${GREEN}✅ Console.log statements commented out${NC}"
    fi
fi

echo ""
echo "2. Updating Service Worker Version..."
echo "-------------------------------------"

TODAY=$(date +"%Y-%m-%d")
CURRENT_VERSION=$(grep -o "CACHE_NAME = '[^']*'" sw.js | cut -d"'" -f2)
echo "Current version: $CURRENT_VERSION"
echo "Today's date: $TODAY"

if [[ ! "$CURRENT_VERSION" == *"$TODAY"* ]]; then
    NEW_VERSION="stackmap-v1.6.6-$TODAY"
    sed -i.bak "s/CACHE_NAME = '[^']*'/CACHE_NAME = '$NEW_VERSION'/" sw.js
    rm -f sw.js.bak
    echo -e "${GREEN}✅ Service worker updated to: $NEW_VERSION${NC}"
else
    echo -e "${GREEN}✅ Service worker already up to date${NC}"
fi

echo ""
echo "3. Checking Security Issues..."
echo "------------------------------"

# Find potential secrets
echo "Searching for potential secrets..."
SECRETS=$(grep -r "api_key\|apiKey\|API_KEY\|secret\|password" --include="*.js" --exclude-dir=node_modules --exclude-dir=tests . | grep -v "// " | wc -l | tr -d ' ')

if [ "$SECRETS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $SECRETS potential secrets${NC}"
    echo "Please review these manually:"
    grep -r "api_key\|apiKey\|API_KEY\|secret\|password" --include="*.js" --exclude-dir=node_modules --exclude-dir=tests . | grep -v "// " | head -5
    echo ""
fi

# Find localhost references
echo "Searching for localhost references..."
LOCALHOST=$(grep -r "localhost\|127\.0\.0\.1" --include="*.js" --exclude-dir=node_modules --exclude-dir=tests . | grep -v "// " | wc -l | tr -d ' ')

if [ "$LOCALHOST" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $LOCALHOST localhost references${NC}"
    echo "These should be environment-specific"
fi

echo ""
echo "4. Git Status..."
echo "----------------"

# Show current status
git status --short

echo ""
echo "5. Test Stability..."
echo "-------------------"

# Check for test issues
echo "Checking for missing waits after clicks..."
CLICK_NO_WAIT=$(grep -r "\.click(" tests/ --include="*.js" | grep -v "waitForSelector\|waitForTimeout\|wait" | wc -l | tr -d ' ')

if [ "$CLICK_NO_WAIT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $CLICK_NO_WAIT clicks without waits${NC}"
    echo "Consider adding waitForSelector after clicks"
fi

echo ""
echo "Summary"
echo "-------"
echo ""
echo "Run 'npm run tollgate:check' to see current status"
echo ""
echo -e "${YELLOW}Manual fixes still needed:${NC}"
echo "1. Review and fix security warnings"
echo "2. Commit or stash changes"
echo "3. Fix test stability issues"
echo ""
echo "Once all issues are fixed, run: npm run deploy"