#!/bin/bash
# Atlas Standard Workflow Validation Script
# Runs all quality checks before deployment

set -e  # Exit on error

echo "🔍 Atlas Standard Workflow Validation"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
VALIDATION_FAILED=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        VALIDATION_FAILED=1
    fi
}

# 1. Type Checking
echo "1️⃣ Running TypeScript type checking..."
if npm run typecheck > /tmp/atlas-typecheck.log 2>&1; then
    print_status 0 "Type checking passed"
else
    print_status 1 "Type checking failed"
    echo "   See: /tmp/atlas-typecheck.log"
    cat /tmp/atlas-typecheck.log
fi
echo ""

# 2. Linting
echo "2️⃣ Running linter..."
if npm run lint > /tmp/atlas-lint.log 2>&1; then
    print_status 0 "Linting passed"
else
    # Check if it's just warnings vs errors
    if grep -q "error" /tmp/atlas-lint.log; then
        print_status 1 "Linting failed with errors"
        cat /tmp/atlas-lint.log
    else
        echo -e "${YELLOW}⚠️  Linting passed with warnings${NC}"
        cat /tmp/atlas-lint.log | grep "warning" | head -10
    fi
fi
echo ""

# 3. Unit Tests
echo "3️⃣ Running unit tests..."
if npm test > /tmp/atlas-test.log 2>&1; then
    TEST_COUNT=$(grep -o "[0-9]* passed" /tmp/atlas-test.log | head -1 | awk '{print $1}')
    print_status 0 "Tests passed (${TEST_COUNT} tests)"
else
    print_status 1 "Tests failed"
    echo "   See: /tmp/atlas-test.log"
    cat /tmp/atlas-test.log | tail -50
fi
echo ""

# 4. Check PENDING_CHANGES.md
echo "4️⃣ Checking PENDING_CHANGES.md..."
if [ -f "PENDING_CHANGES.md" ]; then
    # Check if file is not empty (more than just whitespace)
    if [ -s "PENDING_CHANGES.md" ] && grep -q "[^[:space:]]" "PENDING_CHANGES.md"; then
        print_status 0 "PENDING_CHANGES.md exists and has content"
    else
        print_status 1 "PENDING_CHANGES.md is empty"
        echo "   Update PENDING_CHANGES.md with your changes before deploying"
    fi
else
    print_status 1 "PENDING_CHANGES.md not found"
    echo "   Create PENDING_CHANGES.md with your changes"
fi
echo ""

# 5. Check for common StackMap anti-patterns
echo "5️⃣ Checking for StackMap anti-patterns..."

ANTIPATTERN_FOUND=0

# Check for direct useAppStore.setState usage (should use store-specific methods)
if grep -r "useAppStore\.setState" src/ 2>/dev/null | grep -v "node_modules" | grep -v ".test.js"; then
    echo -e "${RED}   ❌ Found useAppStore.setState() - use store-specific methods${NC}"
    ANTIPATTERN_FOUND=1
fi

# Check for console.log (should be removed or wrapped in __DEV__)
CONSOLE_LOGS=$(grep -r "console\.log\|console\.error\|console\.warn" src/ 2>/dev/null | grep -v "node_modules" | grep -v "__DEV__" | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️  Found ${CONSOLE_LOGS} console.log statements (should be removed or wrapped in __DEV__)${NC}"
    ANTIPATTERN_FOUND=1
fi

# Check for legacy field names in recent changes
if git diff --cached | grep -E "activity\.(name|emoji)" | grep -v "fallback" > /dev/null 2>&1; then
    echo -e "${RED}   ❌ Found legacy field names (name/emoji) - use text/icon${NC}"
    ANTIPATTERN_FOUND=1
fi

if [ $ANTIPATTERN_FOUND -eq 0 ]; then
    print_status 0 "No anti-patterns found"
else
    print_status 1 "Anti-patterns detected"
fi
echo ""

# 6. Final Status
echo "======================================"
if [ $VALIDATION_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    echo ""
    echo "Ready to deploy with:"
    echo "  ./scripts/deploy.sh qual --all"
    exit 0
else
    echo -e "${RED}❌ Validation failed${NC}"
    echo ""
    echo "Fix the issues above before deploying."
    exit 1
fi
