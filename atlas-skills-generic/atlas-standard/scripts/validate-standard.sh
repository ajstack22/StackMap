#!/bin/bash
# Atlas Standard Workflow Validation Script
# Runs all quality checks before deployment
# Generic version - customize via .atlas/ configuration

set -e  # Exit on error

echo "Atlas Standard Workflow Validation"
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

# Load project-specific configuration if it exists
if [ -f .atlas/validation.sh ]; then
    echo "Loading project-specific validation..."
    source .atlas/validation.sh
fi

# 1. Linting
echo "1️⃣ Running linter..."
if command -v npm &> /dev/null && npm run lint &> /dev/null; then
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
else
    echo -e "${YELLOW}⚠️  Linting not configured (skip)${NC}"
fi
echo ""

# 2. Type Checking (if TypeScript or similar)
echo "2️⃣ Running type checking..."
if command -v npm &> /dev/null && npm run typecheck &> /dev/null; then
    if npm run typecheck > /tmp/atlas-typecheck.log 2>&1; then
        print_status 0 "Type checking passed"
    else
        print_status 1 "Type checking failed"
        echo "   See: /tmp/atlas-typecheck.log"
        cat /tmp/atlas-typecheck.log
    fi
elif [ -f tsconfig.json ]; then
    if npx tsc --noEmit > /tmp/atlas-typecheck.log 2>&1; then
        print_status 0 "Type checking passed"
    else
        print_status 1 "Type checking failed"
        cat /tmp/atlas-typecheck.log
    fi
else
    echo -e "${YELLOW}⚠️  Type checking not configured (skip)${NC}"
fi
echo ""

# 3. Unit Tests
echo "3️⃣ Running tests..."
if command -v npm &> /dev/null && npm test -- --version &> /dev/null; then
    if npm test > /tmp/atlas-test.log 2>&1; then
        # Try to extract test count (works with Jest, Mocha, etc.)
        TEST_COUNT=$(grep -o "[0-9]* passed\|[0-9]* passing" /tmp/atlas-test.log | head -1 | awk '{print $1}')
        if [ -n "$TEST_COUNT" ]; then
            print_status 0 "Tests passed (${TEST_COUNT} tests)"
        else
            print_status 0 "Tests passed"
        fi
    else
        print_status 1 "Tests failed"
        echo "   See: /tmp/atlas-test.log"
        cat /tmp/atlas-test.log | tail -50
    fi
else
    echo -e "${YELLOW}⚠️  Tests not configured (skip)${NC}"
fi
echo ""

# 4. Build Check
echo "4️⃣ Checking build..."
if command -v npm &> /dev/null && npm run build &> /dev/null; then
    if npm run build > /tmp/atlas-build.log 2>&1; then
        print_status 0 "Build succeeded"
    else
        print_status 1 "Build failed"
        echo "   See: /tmp/atlas-build.log"
        cat /tmp/atlas-build.log | tail -30
    fi
else
    echo -e "${YELLOW}⚠️  Build not configured (skip)${NC}"
fi
echo ""

# 5. Check for common anti-patterns (generic)
echo "5️⃣ Checking for common anti-patterns..."

ANTIPATTERN_FOUND=0

# Check for console statements (should be removed or conditional)
CONSOLE_LOGS=$(grep -r "console\.log\|console\.error\|console\.warn" src/ 2>/dev/null | grep -v "node_modules" | grep -v "\.test\." | grep -v "\.spec\." | grep -v "process\.env\.NODE_ENV" | grep -v "logger" | wc -l || echo "0")
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️  Found ${CONSOLE_LOGS} console statements (should be removed or wrapped)${NC}"
    echo "   Consider using conditional logging or a logger"
    ANTIPATTERN_FOUND=1
fi

# Check for hardcoded URLs (should be in config)
HARDCODED_URLS=$(grep -r "https\?://[^/]*\.(com\|org\|net\|io)" src/ 2>/dev/null | grep -v "node_modules" | grep -v "config" | grep -v "\.test\." | grep -v "example\|placeholder" | wc -l || echo "0")
if [ "$HARDCODED_URLS" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️  Found ${HARDCODED_URLS} hardcoded URLs (should be in config)${NC}"
    ANTIPATTERN_FOUND=1
fi

# Check for TODO/FIXME comments
TODOS=$(grep -r "TODO\|FIXME\|HACK" src/ 2>/dev/null | grep -v "node_modules" | wc -l || echo "0")
if [ "$TODOS" -gt 5 ]; then
    echo -e "${YELLOW}   ⚠️  Found ${TODOS} TODO/FIXME comments (consider creating issues)${NC}"
fi

# Run project-specific anti-pattern checks if defined
if type check_project_antipatterns &> /dev/null; then
    if check_project_antipatterns; then
        echo "   ✅ Project-specific checks passed"
    else
        echo -e "${RED}   ❌ Project-specific checks failed${NC}"
        ANTIPATTERN_FOUND=1
    fi
fi

if [ $ANTIPATTERN_FOUND -eq 0 ]; then
    print_status 0 "No anti-patterns found"
else
    print_status 1 "Anti-patterns detected"
fi
echo ""

# 6. Documentation Check (optional)
echo "6️⃣ Checking documentation..."
DOC_ISSUES=0

# Check for changelog if it exists
if [ -f CHANGELOG.md ]; then
    # Check if changelog was recently updated
    LAST_MODIFIED=$(git log -1 --format="%ai" -- CHANGELOG.md 2>/dev/null || echo "unknown")
    if [ "$LAST_MODIFIED" != "unknown" ]; then
        echo "   ℹ️  CHANGELOG.md last updated: $LAST_MODIFIED"
    fi
else
    echo -e "${YELLOW}   ⚠️  No CHANGELOG.md found (consider adding one)${NC}"
fi

# Check for README
if [ ! -f README.md ]; then
    echo -e "${YELLOW}   ⚠️  No README.md found${NC}"
    DOC_ISSUES=1
fi

if [ $DOC_ISSUES -eq 0 ]; then
    print_status 0 "Documentation checks passed"
else
    echo -e "${YELLOW}⚠️  Some documentation checks failed${NC}"
fi
echo ""

# 7. Security Checks (basic)
echo "7️⃣ Running basic security checks..."
SECURITY_ISSUES=0

# Check for potential secrets
POTENTIAL_SECRETS=$(grep -ri "password\s*=\|api_key\s*=\|secret\s*=" src/ 2>/dev/null | grep -v "node_modules" | grep -v "\.test\." | grep -v "example\|placeholder\|mock" | wc -l || echo "0")
if [ "$POTENTIAL_SECRETS" -gt 0 ]; then
    echo -e "${RED}   ❌ Found ${POTENTIAL_SECRETS} potential hardcoded secrets${NC}"
    echo "   Review and move to environment variables"
    SECURITY_ISSUES=1
fi

# Check for eval usage
EVAL_USAGE=$(grep -r "\beval\s*(" src/ 2>/dev/null | grep -v "node_modules" | grep -v "\.test\." | wc -l || echo "0")
if [ "$EVAL_USAGE" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️  Found ${EVAL_USAGE} eval() usage (potential security risk)${NC}"
    SECURITY_ISSUES=1
fi

if [ $SECURITY_ISSUES -eq 0 ]; then
    print_status 0 "Basic security checks passed"
else
    print_status 1 "Security issues detected"
fi
echo ""

# 8. Final Status
echo "======================================"
if [ $VALIDATION_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    echo ""
    echo "Ready to deploy via your project's deployment process."

    # Show deployment hints if .atlas/deployment.md exists
    if [ -f .atlas/deployment.md ]; then
        echo "See .atlas/deployment.md for deployment instructions."
    fi

    exit 0
else
    echo -e "${RED}❌ Validation failed${NC}"
    echo ""
    echo "Fix the issues above before deploying."

    # Show common fixes
    echo ""
    echo "Common fixes:"
    echo "  - Console statements: Remove or wrap in process.env.NODE_ENV check"
    echo "  - Hardcoded URLs: Move to config/environment variables"
    echo "  - Test failures: Fix failing tests"
    echo "  - Type errors: Fix type issues"

    exit 1
fi
