#!/bin/bash

# Quick sync testing script
# Tests sync without deployment

echo "🧪 Quick Sync Test Options:"
echo ""
echo "1. Test between two browser tabs (fastest)"
echo "   - Run: npm run web"
echo "   - Open http://localhost:3000 in two browsers/tabs"
echo "   - Enable sync in tab 1, copy phrase"
echo "   - Join sync in tab 2 with phrase"
echo ""
echo "2. Test between web and mobile"
echo "   - Terminal 1: npm run web"
echo "   - Terminal 2: npm run ios (or android)"
echo "   - Test sync between them"
echo ""
echo "3. Run automated tests"
echo "   - node src/services/sync/testSyncIntegration.cjs"
echo ""
echo "4. Test with mock data"
echo "   - Import data/demo-data-kids.json in first instance"
echo "   - Enable sync and test"
echo ""

# Quick automated test
echo "Running basic validation tests..."

# Test if sync service files exist and are valid
echo "✓ Checking sync service files..."
if [ -f "src/services/sync/syncService.ts" ]; then
    echo "  - syncService.ts exists"
fi

if [ -f "src/services/sync/dataValidator.ts" ]; then
    echo "  - dataValidator.ts exists"
    # Check if deleted activity filter was added
    if grep -q "activity.deleted" src/services/sync/dataValidator.ts; then
        echo "  - Deleted activity filter is present ✓"
    fi
fi

if [ -f "src/services/sync/conflictResolver.js" ]; then
    echo "  - conflictResolver.js exists"
fi

echo ""
echo "✓ Checking demo data..."
if [ -f "data/demo-data-kids.json" ]; then
    echo "  - Demo data file exists"
    # Basic JSON validation
    if python3 -m json.tool data/demo-data-kids.json > /dev/null 2>&1; then
        echo "  - Demo data is valid JSON ✓"
    else
        echo "  - Warning: Demo data may have JSON errors"
    fi
fi

echo ""
echo "📝 Recommended test flow:"
echo "1. npm run web (in one terminal)"
echo "2. Open two browser tabs"
echo "3. Import demo-data-kids.json in tab 1"
echo "4. Enable sync in tab 1"
echo "5. Join sync in tab 2"
echo "6. Make changes and observe sync"
echo ""
echo "For detailed testing, use: node src/services/sync/testSyncIntegration.cjs"