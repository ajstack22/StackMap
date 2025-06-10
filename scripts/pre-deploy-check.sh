#!/bin/bash

# StackMap Pre-Deployment Validation Script
# This script ensures all deployment requirements are met before pushing to production

set -e  # Exit on any error

echo "🚀 StackMap Pre-Deployment Checks"
echo "================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0
WARNINGS=0

# Function to check if a file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to run a command and check result
check_command() {
    if eval "$1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to show warnings
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

echo ""
echo "1. Checking Required Files..."
echo "-----------------------------"
check_file "index.html" "index.html exists"
check_file "manifest.json" "manifest.json exists"
check_file "sw.js" "Service worker exists"
check_file "styles/index.css" "Main CSS file exists"
check_file "app/StackMapApp.js" "Main app file exists"

echo ""
echo "2. Checking Test Suite..."
echo "------------------------"
check_file "tests/uat-edit-mode.js" "Edit mode UAT exists"
check_file "tests/test-runner.html" "Test runner exists"

echo ""
echo "3. Running Syntax Checks..."
echo "--------------------------"

# Check for console.log statements (warning only)
CONSOLE_LOGS=$(grep -r "console\.log" --include="*.js" --exclude-dir="tests" --exclude-dir="node_modules" . 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    warn "Found $CONSOLE_LOGS console.log statements in production code"
fi

# Check for debugger statements
if grep -r "debugger" --include="*.js" --exclude-dir="tests" --exclude-dir="node_modules" . > /dev/null 2>&1; then
    echo -e "${RED}✗${NC} Found debugger statements in code"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✓${NC} No debugger statements found"
fi

# Check for TODO comments
TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX" --include="*.js" --include="*.css" --exclude-dir="tests" --exclude-dir="node_modules" . 2>/dev/null | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    warn "Found $TODO_COUNT TODO/FIXME comments"
fi

echo ""
echo "4. Checking Git Status..."
echo "------------------------"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}✗${NC} Uncommitted changes detected"
    FAILED=$((FAILED + 1))
    echo "   Please commit or stash your changes before deploying"
else
    echo -e "${GREEN}✓${NC} Working directory clean"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    warn "Not on main branch (current: $CURRENT_BRANCH)"
fi

echo ""
echo "5. Checking Dependencies..."
echo "--------------------------"

# Check for removed files still referenced
check_command "! grep -r 'modal-card\.css' --include='*.html' --include='*.js' ." "No references to removed modal-card.css"

# Check PWA requirements
check_file "icon-192.png" "PWA icon 192x192 exists"
check_file "icon-512.png" "PWA icon 512x512 exists"

echo ""
echo "6. Security Checks..."
echo "--------------------"

# Check for potential secrets
if grep -r -E "(api_key|apikey|password|secret|token)" --include="*.js" --exclude-dir="tests" --exclude-dir="node_modules" . > /dev/null 2>&1; then
    warn "Potential secrets found in code - please review"
fi

# Check for localhost references
if grep -r "localhost\|127\.0\.0\.1" --include="*.js" --exclude="sw.js" --exclude="env-loader.js" --exclude-dir="tests" . > /dev/null 2>&1; then
    warn "Localhost references found - ensure they're environment-specific"
fi

echo ""
echo "7. Running UAT Tests..."
echo "----------------------"

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠${NC} Dependencies not installed. Installing now..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗${NC} Failed to install dependencies"
        FAILED=$((FAILED + 1))
    fi
fi

# Run automated tests
if [ -f "tests/run-tests.js" ] && [ -d "node_modules" ]; then
    echo "Running automated tests..."
    npm test
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} All UAT tests passed"
    else
        echo -e "${RED}✗${NC} UAT tests failed"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${RED}✗${NC} Test runner not found or dependencies missing"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "================================="
echo "Pre-Deployment Check Summary"
echo "================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
else
    echo -e "${RED}❌ $FAILED critical check(s) failed${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
fi

echo ""

# Final result
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Ready to deploy!${NC}"
    exit 0
else
    echo -e "${RED}Please fix the above issues before deploying${NC}"
    exit 1
fi