#!/bin/bash

# Fast sync testing between web and mobile
# Uses qual API for both environments

echo "🚀 Fast Sync Testing Setup"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if qual build exists
if [ ! -f "bundle.js" ]; then
    echo -e "${YELLOW}⚠️  No qual build found. Building now...${NC}"
    NODE_ENV=production PUBLIC_URL=/qual npm run build:web
    echo "Copying to qual directory..."
    cp bundle.* index.html manifest.json service-worker.js /Users/adamstack/StackMap/StackMap/
    echo -e "${GREEN}✅ Qual build ready${NC}"
fi

echo ""
echo -e "${GREEN}Option 1: Web (Qual) + iOS Simulator${NC}"
echo "--------------------------------------"
echo "Terminal 1:"
echo "  npm run ios"
echo ""
echo "Terminal 2 (or browser):"
echo "  open https://stackmap.app/qual/"
echo ""
echo "Both will use the qual API endpoints for sync"
echo ""

echo -e "${GREEN}Option 2: Web (Qual) + Android Emulator${NC}"
echo "----------------------------------------"
echo "Terminal 1:"
echo "  npm run android"
echo ""
echo "Terminal 2 (or browser):"
echo "  open https://stackmap.app/qual/"
echo ""

echo -e "${GREEN}Option 3: Multiple Browser Tabs (Qual)${NC}"
echo "---------------------------------------"
echo "  open https://stackmap.app/qual/"
echo "  Open in regular tab + incognito/private tab"
echo ""

echo -e "${YELLOW}Quick Test Workflow:${NC}"
echo "===================="
echo "1. Import demo-data-kids.json on Device/Tab 1"
echo "2. Settings → Sync → Enable Sync → Copy phrase"
echo "3. On Device/Tab 2: Settings → Sync → Join → Paste phrase"
echo "4. Make changes on either device"
echo "5. Watch console for sync logs"
echo ""

echo -e "${GREEN}Automated Test Commands:${NC}"
echo "========================"
echo ""
echo "# Test sync with mock data (if you have the test file):"
echo "node src/services/sync/testSyncIntegration.cjs"
echo ""

# Quick validation check
echo -e "${YELLOW}Running quick validation...${NC}"
echo "----------------------------"

# Check if deleted activity filter is present
if grep -q "!activity.deleted" src/services/sync/dataValidator.ts 2>/dev/null; then
    echo -e "${GREEN}✅ Deleted activity filter is active${NC}"
else
    echo -e "${YELLOW}⚠️  Deleted activity filter may not be active${NC}"
fi

# Check current version
CURRENT_VERSION=$(grep '"version"' package.json | cut -d '"' -f 4)
echo -e "📌 Current version: ${GREEN}$CURRENT_VERSION${NC}"

# Check qual deployment
echo ""
echo -e "${YELLOW}Checking qual deployment status...${NC}"
if curl -s -o /dev/null -w "%{http_code}" https://stackmap.app/qual/ | grep -q "200"; then
    echo -e "${GREEN}✅ Qual site is accessible${NC}"
    
    # Check if API is responding
    if curl -s -o /dev/null -w "%{http_code}" https://stackmap.app/qual/api/sync/health.php | grep -q "200"; then
        echo -e "${GREEN}✅ Qual sync API is responding${NC}"
    else
        echo -e "${YELLOW}⚠️  Qual sync API may not be responding${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Qual site may not be deployed${NC}"
fi

echo ""
echo -e "${GREEN}Ready to test!${NC}"
echo "=============="
echo "Choose one of the options above to start testing."
echo "The qual environment uses the same API for all platforms,"
echo "so changes will sync immediately between devices."