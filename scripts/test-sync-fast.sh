#!/bin/bash

# Fast sync test script - minimal clicks required
# Usage: ./scripts/test-sync-fast.sh

echo "🧪 Fast Sync Test Script"
echo "========================"
echo ""
echo "This script will guide you through sync testing with minimal clicks."
echo ""

# Generate a test sync ID
SYNC_ID=$(openssl rand -hex 16)
echo "📝 Test Sync ID: $SYNC_ID"
echo ""

# Create test URLs
URL_A="https://stackmap.app/qual/?syncTest=true&device=A"
URL_B="https://stackmap.app/qual/?syncTest=true&device=B"

echo "Instructions:"
echo "-------------"
echo "1. Opening two browser windows..."
echo ""

# Open Device A
echo "📱 Device A (Creator):"
echo "   - Click '🧪 Sync Testing'"
echo "   - Click 'Create New Sync'"
echo "   - Copy the sync ID"
echo ""
open "$URL_A"

sleep 2

# Open Device B
echo "📱 Device B (Joiner):"
echo "   - Click '🧪 Sync Testing'"
echo "   - Click 'Join Existing Sync'"
echo "   - Paste the sync ID from Device A"
echo "   - Click 'Join Sync'"
echo ""
open "$URL_B"

echo ""
echo "Quick Test Steps:"
echo "-----------------"
echo "1. ✅ After both devices are synced:"
echo "   - On Device B: Click 'Add New User' → Enter 'Test User B' → Save"
echo "   - Wait 3 seconds"
echo "   - On Device A: Refresh the page (Cmd+R)"
echo "   - Verify 'Test User B' appears on Device A"
echo ""
echo "2. ✅ For bidirectional test:"
echo "   - On Device A: Add a new user 'Test User A'"
echo "   - Wait 3 seconds"
echo "   - On Device B: Refresh the page"
echo "   - Verify 'Test User A' appears on Device B"
echo ""
echo "Expected Results:"
echo "-----------------"
echo "✅ Users added on Device B appear on Device A"
echo "✅ Users added on Device A appear on Device B"
echo "✅ No console errors about 'reduce is not a function'"
echo "✅ Data persists after page refresh"
echo ""
echo "Press Enter when testing is complete..."
read

echo ""
echo "Test completed!"
echo ""
echo "If sync worked correctly, you should have seen:"
echo "  • Bidirectional data sync"
echo "  • No JavaScript errors"
echo "  • Data persistence"
echo ""
echo "Run './scripts/test-sync-fast.sh' anytime to test sync quickly."