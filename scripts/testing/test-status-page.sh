#!/bin/bash

# Test script for deployment status page
# Demonstrates how to use the status page functions

set -e

# Load deployment libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/reporting.sh"

echo "🧪 Testing Deployment Status Page"
echo "=================================="
echo ""

# Step 1: Generate initial status page
echo "1. Generating status page..."
generate_status_page "beta" "2025.10.11.1"
sleep 1

# Step 2: Update validation status
echo "2. Running validation..."
update_status_page "validation" "in_progress"
sleep 2
update_status_page "validation" "success"
echo "   ✅ Validation complete"
sleep 1

# Step 3: Update tests status
echo "3. Running tests..."
update_status_page "tests" "in_progress"
sleep 3
update_status_page "tests" "success"
echo "   ✅ Tests complete"
sleep 1

# Step 4: Update web status
echo "4. Deploying web..."
update_status_page "web" "in_progress"
sleep 2
update_status_page "web" "success"
echo "   ✅ Web deployed"
sleep 1

# Step 5: Update iOS status
echo "5. Deploying iOS..."
update_status_page "ios" "in_progress"
sleep 3
update_status_page "ios" "success"
echo "   ✅ iOS deployed"
sleep 1

# Step 6: Update Android status
echo "6. Deploying Android..."
update_status_page "android" "in_progress"
sleep 3
update_status_page "android" "success"
echo "   ✅ Android deployed"
sleep 1

# Step 7: Finalize
echo "7. Finalizing deployment..."
finalize_status_page
sleep 1

# Step 8: Open in browser
echo "8. Opening status page..."
open_status_page

echo ""
echo "=================================="
echo "✅ Test complete!"
echo ""
echo "Status page locations:"
echo "  Live:    $STATUS_PAGE_CURRENT"
echo "  Archive: $STATUS_PAGE_ARCHIVE"
echo ""
echo "The page should have opened in your browser."
echo "Check both the live and archived versions!"
