#!/bin/bash

# StackMap Post-Deployment Validation Script
# Runs automated checks against a deployed environment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default to qual environment
ENV=${1:-qual}
BASE_URL="https://stackmap.app"

if [ "$ENV" = "qual" ]; then
    URL="$BASE_URL/qual/"
elif [ "$ENV" = "prod" ]; then
    URL="$BASE_URL/"
else
    echo -e "${RED}Invalid environment: $ENV${NC}"
    echo "Usage: $0 [qual|prod]"
    exit 1
fi

echo "🔍 Validating $ENV deployment at $URL"
echo "========================================"
echo ""

FAILED=0

# Function to check HTTP status
check_http() {
    local path=$1
    local expected=$2
    local description=$3
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$URL$path")
    
    if [ "$status" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} $description (HTTP $status)"
    else
        echo -e "${RED}✗${NC} $description (Expected: $expected, Got: $status)"
        FAILED=$((FAILED + 1))
    fi
}

# Function to check if content exists
check_content() {
    local path=$1
    local search=$2
    local description=$3
    
    if curl -s "$URL$path" | grep -q "$search"; then
        echo -e "${GREEN}✓${NC} $description"
    else
        echo -e "${RED}✗${NC} $description"
        FAILED=$((FAILED + 1))
    fi
}

# Function to check resource loading
check_resource() {
    local resource=$1
    local description=$2
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$URL$resource")
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓${NC} $description"
    else
        echo -e "${RED}✗${NC} $description (HTTP $status)"
        FAILED=$((FAILED + 1))
    fi
}

echo "1. Basic Connectivity"
echo "--------------------"
check_http "" "200" "Main page accessible"
check_http "manifest.json" "200" "PWA manifest accessible"
check_http "sw.js" "200" "Service worker accessible"

echo ""
echo "2. Core Resources"
echo "-----------------"
check_resource "styles/index.css" "CSS loaded"
check_resource "app/StackMapApp.js" "Main app JS loaded"
check_resource "components.js" "Components JS loaded"
check_resource "icon-192.png" "PWA icon loaded"

echo ""
echo "3. Android Fixes"
echo "----------------"
check_resource "styles/android-app-fixes.css" "Android fixes CSS loaded"
check_resource "styles/material-icons-fix.css" "Material Icons fix loaded"

echo ""
echo "4. Content Validation"
echo "--------------------"
check_content "" "<title>StackMap" "Page title present"
check_content "" "material-icons" "Material Icons referenced"
check_content "" "manifest.json" "Manifest link present"
check_content "" "viewport" "Mobile viewport configured"

echo ""
echo "5. Material Icons Check"
echo "-----------------------"
# Check if Material Icons font is accessible
FONT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://fonts.googleapis.com/icon?family=Material+Icons")
if [ "$FONT_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Material Icons font accessible"
else
    echo -e "${YELLOW}⚠${NC} Material Icons font issue (HTTP $FONT_STATUS)"
fi

echo ""
echo "6. JavaScript Errors"
echo "--------------------"
# Use puppeteer to check for JS errors
if command -v node >/dev/null 2>&1 && [ -f "scripts/check-js-errors.js" ]; then
    node scripts/check-js-errors.js "$URL"
else
    echo -e "${YELLOW}⚠${NC} Skipping JS error check (Puppeteer not available)"
fi

echo ""
echo "7. Performance Metrics"
echo "----------------------"
# Basic load time check
START_TIME=$(date +%s.%N)
curl -s "$URL" > /dev/null
END_TIME=$(date +%s.%N)
LOAD_TIME=$(echo "$END_TIME - $START_TIME" | bc)
echo -e "${BLUE}ℹ${NC} Page load time: ${LOAD_TIME}s"

# Check total page size
PAGE_SIZE=$(curl -s "$URL" | wc -c)
PAGE_SIZE_KB=$((PAGE_SIZE / 1024))
echo -e "${BLUE}ℹ${NC} HTML size: ${PAGE_SIZE_KB}KB"

echo ""
echo "========================================"
echo "Validation Summary"
echo "========================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "The $ENV deployment appears healthy."
else
    echo -e "${RED}❌ $FAILED check(s) failed${NC}"
    echo ""
    echo "Please investigate the failures above."
fi

echo ""
echo "Manual checks recommended:"
echo "- [ ] Visual inspection on mobile device"
echo "- [ ] Test Material Icons display"
echo "- [ ] Check card alignment on mobile"
echo "- [ ] Test PWA installation"
echo "- [ ] Verify offline functionality"
echo ""

exit $FAILED