#!/bin/bash

# StackMap Link Verification Script
# Checks all links and navigation elements to ensure they work properly

set -e

echo "🔗 StackMap Link Verification"
echo "============================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0
WARNINGS=0

# Arrays to store results
declare -a FAILED_LINKS
declare -a WARNING_LINKS

# Function to check if a file exists
check_file_link() {
    local file="$1"
    local link="$2"
    local description="$3"
    
    TOTAL=$((TOTAL + 1))
    
    # Remove leading slash for file check
    local check_path="${link#/}"
    
    if [ -f "$check_path" ]; then
        echo -e "${GREEN}✓${NC} $description: $link"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $description: $link (file not found)"
        FAILED=$((FAILED + 1))
        FAILED_LINKS+=("$description: $link")
    fi
}

# Function to check if a method exists
check_js_method() {
    local method="$1"
    local description="$2"
    local file_pattern="${3:-*.js}"
    
    TOTAL=$((TOTAL + 1))
    
    if grep -r "$method" --include="$file_pattern" js/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $description: $method()"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $description: $method() not found"
        FAILED=$((FAILED + 1))
        FAILED_LINKS+=("$description: $method()")
    fi
}

# Function to check external URLs (optional, requires curl)
check_external_url() {
    local url="$1"
    local description="$2"
    
    TOTAL=$((TOTAL + 1))
    
    if command -v curl &> /dev/null; then
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "^[23]"; then
            echo -e "${GREEN}✓${NC} $description: $url"
            PASSED=$((PASSED + 1))
        else
            echo -e "${YELLOW}⚠${NC} $description: $url (may be down or require auth)"
            WARNINGS=$((WARNINGS + 1))
            WARNING_LINKS+=("$description: $url")
        fi
    else
        echo -e "${BLUE}ℹ${NC} Skipping external URL check (curl not available): $url"
    fi
}

echo ""
echo "1. Checking Help & Privacy Links..."
echo "-----------------------------------"

# Check Help & Privacy panel method
check_js_method "showHelpPrivacy" "Help & Privacy panel method"

# Check privacy and terms pages
check_file_link "privacy.html" "/privacy.html" "Privacy Policy page"
check_file_link "terms.html" "/terms.html" "Terms of Service page"

# Check support email
echo -e "${BLUE}ℹ${NC} Support email: support@stackmap.app (manual verification needed)"

echo ""
echo "2. Checking Support/Donation Links..."
echo "------------------------------------"

# Check Support panel method
check_js_method "showSupportUs" "Support StackMap panel method"

# Check support page
check_file_link "support.html" "/support.html" "Support/Donation page"

echo ""
echo "3. Checking Menu Configuration Links..."
echo "---------------------------------------"

# Check for onclick handlers in MenuConfigurations
echo "Checking onclick handlers in MenuConfigurations.js..."

# List of critical onclick handlers to check
declare -a ONCLICK_METHODS=(
    "hybridPanelManager.showHelpPrivacy"
    "hybridPanelManager.showSupportUs"
    "hybridPanelManager.addNewCard"
    "hybridPanelManager.showLibraryMenu"
    "hybridPanelManager.showLibraryEditor"
    "hybridPanelManager.addNewUser"
    "hybridPanelManager.exportData"
    "hybridPanelManager.importData"
    "hybridPanelManager.openSyncSettings"
)

for method in "${ONCLICK_METHODS[@]}"; do
    TOTAL=$((TOTAL + 1))
    if grep -q "$method" js/MenuConfigurations.js 2>/dev/null; then
        # Now check if the method exists
        method_name=$(echo "$method" | cut -d'.' -f2)
        if grep -q "$method_name" js/HybridPanelManager.js 2>/dev/null; then
            echo -e "${GREEN}✓${NC} onclick handler: $method"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗${NC} onclick handler found but method missing: $method"
            FAILED=$((FAILED + 1))
            FAILED_LINKS+=("Missing method: $method")
        fi
    else
        echo -e "${YELLOW}⚠${NC} onclick handler not found: $method"
        WARNINGS=$((WARNINGS + 1))
        WARNING_LINKS+=("Handler not found: $method")
    fi
done

echo ""
echo "4. Checking Navigation Links..."
echo "-------------------------------"

# Check for common navigation patterns
declare -a NAV_PATTERNS=(
    "href=['\"]#['\"].*onclick"
    "href=['\"][^'\"#]+\.html['\"]"
    "window\.location"
    "navigate\("
)

echo "Scanning for navigation patterns..."
for pattern in "${NAV_PATTERNS[@]}"; do
    count=$(grep -r "$pattern" --include="*.js" --include="*.html" --exclude-dir="node_modules" --exclude-dir="www" . 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
        echo -e "${BLUE}ℹ${NC} Found $count instances of: $pattern"
    fi
done

echo ""
echo "5. Checking Menu Definitions..."
echo "------------------------------"

# Check that all menus in MenuConfigurations have corresponding sections
declare -a MENU_IDS=(
    "preferences"
    "settings"
    "activityLibrary"
    "activityForm"
    "userForm"
    "userDaySelector"
    "syncSettings"
    "libraryEditor"
    "helpPrivacy"
    "supportUs"
)

echo "Verifying menu configurations..."
for menu_id in "${MENU_IDS[@]}"; do
    TOTAL=$((TOTAL + 1))
    if grep -q "^[[:space:]]*$menu_id:[[:space:]]*{" js/MenuConfigurations.js 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Menu configuration found: $menu_id"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} Menu configuration missing: $menu_id"
        FAILED=$((FAILED + 1))
        FAILED_LINKS+=("Missing menu: $menu_id")
    fi
done

echo ""
echo "============================"
echo "Link Verification Summary"
echo "============================"

echo -e "Total checks: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed items:${NC}"
    for item in "${FAILED_LINKS[@]}"; do
        echo "  - $item"
    done
fi

if [ $WARNINGS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Warning items:${NC}"
    for item in "${WARNING_LINKS[@]}"; do
        echo "  - $item"
    done
fi

echo ""

# Exit code
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical links verified!${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED link check(s) failed${NC}"
    echo -e "Please fix the broken links before deploying."
    exit 1
fi