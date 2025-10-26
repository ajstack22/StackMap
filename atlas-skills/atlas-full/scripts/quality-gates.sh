#!/bin/bash
# Atlas Full Workflow Quality Gates Script
# Comprehensive validation before deployment

set -e  # Exit on error

echo "🔍 Atlas Full Workflow Quality Gates"
echo "==========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
VALIDATION_FAILED=0
WARNINGS=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        VALIDATION_FAILED=1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Type Checking
echo "1️⃣ Running TypeScript type checking..."
if npm run typecheck > /tmp/atlas-full-typecheck.log 2>&1; then
    print_status 0 "Type checking passed"
else
    print_status 1 "Type checking failed"
    echo "   See: /tmp/atlas-full-typecheck.log"
    cat /tmp/atlas-full-typecheck.log
fi
echo ""

# 2. Linting
echo "2️⃣ Running linter..."
if npm run lint > /tmp/atlas-full-lint.log 2>&1; then
    print_status 0 "Linting passed"
else
    # Check if it's just warnings vs errors
    if grep -q "error" /tmp/atlas-full-lint.log; then
        print_status 1 "Linting failed with errors"
        cat /tmp/atlas-full-lint.log
    else
        WARNING_COUNT=$(grep -c "warning" /tmp/atlas-full-lint.log || echo "0")
        print_warning "Linting passed with ${WARNING_COUNT} warnings"
        cat /tmp/atlas-full-lint.log | grep "warning" | head -10
    fi
fi
echo ""

# 3. Unit Tests
echo "3️⃣ Running unit tests..."
if npm test > /tmp/atlas-full-test.log 2>&1; then
    TEST_COUNT=$(grep -o "[0-9]* passed" /tmp/atlas-full-test.log | head -1 | awk '{print $1}')
    print_status 0 "Tests passed (${TEST_COUNT} tests)"
else
    print_status 1 "Tests failed"
    echo "   See: /tmp/atlas-full-test.log"
    cat /tmp/atlas-full-test.log | tail -50
fi
echo ""

# 4. Test Coverage
echo "4️⃣ Checking test coverage..."
if npm run test:coverage > /tmp/atlas-full-coverage.log 2>&1; then
    COVERAGE=$(grep -o "[0-9]*\.[0-9]*%" /tmp/atlas-full-coverage.log | head -1 || echo "0%")
    COVERAGE_NUM=$(echo $COVERAGE | sed 's/%//')

    if (( $(echo "$COVERAGE_NUM >= 80" | bc -l) )); then
        print_status 0 "Test coverage: ${COVERAGE} (target: 80%)"
    elif (( $(echo "$COVERAGE_NUM >= 60" | bc -l) )); then
        print_warning "Test coverage: ${COVERAGE} (target: 80%, acceptable: 60%+)"
    else
        print_status 1 "Test coverage: ${COVERAGE} (below 60%)"
    fi
else
    print_warning "Test coverage measurement not available (npm run test:coverage not configured)"
fi
echo ""

# 5. Build Validation
echo "5️⃣ Validating builds..."

# Web build
print_info "Building web..."
if npm run build:web > /tmp/atlas-full-build-web.log 2>&1; then
    print_status 0 "Web build succeeded"
else
    print_status 1 "Web build failed"
    echo "   See: /tmp/atlas-full-build-web.log"
    cat /tmp/atlas-full-build-web.log | tail -30
fi

# Note: iOS/Android builds take 10+ minutes, so we just check for basic issues
print_info "Checking iOS/Android build prerequisites..."
if [ -d "ios/" ] && [ -d "android/" ]; then
    print_status 0 "iOS/Android directories present"
else
    print_warning "iOS/Android directories missing (web-only project?)"
fi
echo ""

# 6. Check PENDING_CHANGES.md
echo "6️⃣ Checking PENDING_CHANGES.md..."
if [ -f "PENDING_CHANGES.md" ]; then
    # Check if file is not empty (more than just whitespace)
    if [ -s "PENDING_CHANGES.md" ] && grep -q "[^[:space:]]" "PENDING_CHANGES.md"; then
        # Check for minimum content (should have title and changes)
        if grep -q "## Title:" "PENDING_CHANGES.md" && grep -q "### Changes Made:" "PENDING_CHANGES.md"; then
            print_status 0 "PENDING_CHANGES.md complete"
        else
            print_status 1 "PENDING_CHANGES.md incomplete (needs Title and Changes Made sections)"
        fi
    else
        print_status 1 "PENDING_CHANGES.md is empty"
        echo "   Update PENDING_CHANGES.md with your changes before deploying"
    fi
else
    print_status 1 "PENDING_CHANGES.md not found"
    echo "   Create PENDING_CHANGES.md with your changes"
fi
echo ""

# 7. Documentation Check
echo "7️⃣ Checking documentation..."

DOC_ISSUES=0

# Check if README or docs were updated (if feature is user-facing)
if git diff --cached --name-only | grep -q "^src/"; then
    if git diff --cached --name-only | grep -qE "README|docs/"; then
        print_status 0 "Documentation updated"
    else
        print_warning "Code changes detected but no documentation updates (confirm if needed)"
        DOC_ISSUES=1
    fi
else
    print_status 0 "No code changes or documentation update not required"
fi
echo ""

# 8. Check for StackMap anti-patterns
echo "8️⃣ Checking for StackMap anti-patterns..."

ANTIPATTERN_FOUND=0

# Check for direct useAppStore.setState usage (should use store-specific methods)
print_info "Checking for direct useAppStore.setState()..."
if grep -r "useAppStore\.setState" src/ 2>/dev/null | grep -v "node_modules" | grep -v ".test.js" | grep -v "useAppStore.js"; then
    echo -e "${RED}   ❌ Found useAppStore.setState() - use store-specific methods${NC}"
    echo "      Use: useUserStore.getState().setUsers()"
    echo "           useSettingsStore.getState().updateSettings()"
    echo "           useLibraryStore.getState().setLibrary()"
    ANTIPATTERN_FOUND=1
fi

# Check for console.log (should be removed or wrapped in __DEV__)
print_info "Checking for console statements..."
CONSOLE_LOGS=$(grep -r "console\.log\|console\.error\|console\.warn" src/ 2>/dev/null | grep -v "node_modules" | grep -v "__DEV__" | wc -l | tr -d ' ')
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    print_warning "Found ${CONSOLE_LOGS} console statements (should be removed or wrapped in __DEV__)"
    echo "   Example: if (__DEV__) { console.log('debug info') }"
    ANTIPATTERN_FOUND=1
fi

# Check for legacy field names in recent changes
print_info "Checking for legacy field names (activity.name, activity.emoji)..."
if git diff --cached 2>/dev/null | grep -E "\+.*activity\.(name|emoji)" | grep -v "fallback" | grep -v "||"; then
    echo -e "${RED}   ❌ Found legacy field names (name/emoji) - use text/icon${NC}"
    echo "      Activities: Use 'text' and 'icon'"
    echo "      Reading: Use fallbacks 'text || name || title', 'icon || emoji'"
    ANTIPATTERN_FOUND=1
fi

# Check for gray text (accessibility violation)
print_info "Checking for gray text (accessibility)..."
if grep -r "color:.*#[0-9a-fA-F]*[6789]" src/ 2>/dev/null | grep -v "node_modules" | grep -v "backgroundColor"; then
    print_warning "Found potential gray text (use #000 for accessibility)"
    ANTIPATTERN_FOUND=1
fi

# Check for direct fontWeight usage (Android compatibility)
print_info "Checking for direct fontWeight usage (Android)..."
if grep -r "fontWeight:" src/ 2>/dev/null | grep -v "node_modules" | grep -v "Typography" | grep -v ".web.js"; then
    print_warning "Found direct fontWeight usage (use Typography component for Android compatibility)"
    ANTIPATTERN_FOUND=1
fi

if [ $ANTIPATTERN_FOUND -eq 0 ]; then
    print_status 0 "No anti-patterns found"
else
    print_status 1 "Anti-patterns detected (see above)"
fi
echo ""

# 9. Security Check (Basic)
echo "9️⃣ Running basic security checks..."

SECURITY_ISSUES=0

# Check for hardcoded secrets/keys
print_info "Checking for hardcoded secrets..."
if grep -rE "api[_-]?key|secret|password|token" src/ 2>/dev/null | grep -v "node_modules" | grep -v "propTypes" | grep -E "=.*['\"][a-zA-Z0-9]{20,}['\"]"; then
    print_warning "Potential hardcoded secrets found (review manually)"
    SECURITY_ISSUES=1
fi

# Check for eval usage
print_info "Checking for eval() usage..."
if grep -r "eval(" src/ 2>/dev/null | grep -v "node_modules"; then
    print_status 1 "eval() usage found (security risk)"
    SECURITY_ISSUES=1
fi

# Check for dangerouslySetInnerHTML
print_info "Checking for dangerouslySetInnerHTML..."
if grep -r "dangerouslySetInnerHTML" src/ 2>/dev/null | grep -v "node_modules"; then
    print_warning "dangerouslySetInnerHTML found (ensure input sanitized)"
    SECURITY_ISSUES=1
fi

if [ $SECURITY_ISSUES -eq 0 ]; then
    print_status 0 "No obvious security issues"
else
    print_status 1 "Security concerns detected (review required)"
fi
echo ""

# 10. Dependency Check
echo "🔟 Checking dependencies..."

# Check for outdated critical dependencies
print_info "Checking for critical dependency updates..."
if command -v npm &> /dev/null; then
    # Check if npm audit exists
    if npm audit > /tmp/atlas-full-audit.log 2>&1; then
        CRITICAL=$(grep -c "critical" /tmp/atlas-full-audit.log || echo "0")
        HIGH=$(grep -c "high" /tmp/atlas-full-audit.log || echo "0")

        if [ "$CRITICAL" -gt 0 ]; then
            print_status 1 "Found ${CRITICAL} critical vulnerabilities (run: npm audit fix)"
        elif [ "$HIGH" -gt 0 ]; then
            print_warning "Found ${HIGH} high vulnerabilities (run: npm audit)"
        else
            print_status 0 "No critical dependencies vulnerabilities"
        fi
    else
        print_info "npm audit not available or no package-lock.json"
    fi
else
    print_info "npm not available, skipping dependency check"
fi
echo ""

# 11. Git Status Check
echo "1️⃣1️⃣ Checking git status..."

if git rev-parse --git-dir > /dev/null 2>&1; then
    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        print_status 0 "Working directory clean (no uncommitted changes)"
    else
        print_warning "Uncommitted changes detected (acceptable for QUAL, required clean for BETA/PROD)"
    fi

    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    print_info "Current branch: ${CURRENT_BRANCH}"
else
    print_warning "Not a git repository"
fi
echo ""

# 12. Performance Check (Basic)
echo "1️⃣2️⃣ Running basic performance checks..."

# Check bundle size (if built)
if [ -f "web/build/bundle.js" ] || [ -f "build/bundle.js" ]; then
    BUNDLE_PATH=$(find . -name "bundle.js" -o -name "main.*.js" | head -1)
    if [ -n "$BUNDLE_PATH" ]; then
        BUNDLE_SIZE=$(du -h "$BUNDLE_PATH" | cut -f1)
        print_info "Bundle size: ${BUNDLE_SIZE}"

        # Warn if > 1MB
        BUNDLE_KB=$(du -k "$BUNDLE_PATH" | cut -f1)
        if [ "$BUNDLE_KB" -gt 1024 ]; then
            print_warning "Bundle size > 1MB (consider code splitting)"
        fi
    fi
else
    print_info "Bundle not built yet (will be checked during build)"
fi
echo ""

# Final Summary
echo "==========================================="
echo ""

if [ $VALIDATION_FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ All quality gates passed!${NC}"
        echo ""
        echo "Ready to deploy with:"
        echo "  ./scripts/deploy.sh qual --all      # QUAL: Development testing"
        echo "  ./scripts/deploy.sh stage --all     # STAGE: Internal validation"
        echo "  ./scripts/deploy.sh beta --all      # BETA: Closed beta testing"
        echo "  ./scripts/deploy.sh prod --all      # PROD: Production release"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Quality gates passed with ${WARNINGS} warnings${NC}"
        echo ""
        echo "Review warnings above. If acceptable, deploy with:"
        echo "  ./scripts/deploy.sh qual --all"
        echo ""
        echo "For BETA/PROD deployments, resolve warnings first."
        exit 0
    fi
else
    echo -e "${RED}❌ Quality gates failed${NC}"
    echo ""
    echo "Fix the issues above before deploying."
    echo ""
    echo "Common fixes:"
    echo "  - Type errors: Review TypeScript errors in /tmp/atlas-full-typecheck.log"
    echo "  - Test failures: Review test output in /tmp/atlas-full-test.log"
    echo "  - Linting: Run 'npm run lint --fix' to auto-fix"
    echo "  - Anti-patterns: Use store-specific methods, remove console.logs"
    echo "  - PENDING_CHANGES.md: Add your changes with title and description"
    exit 1
fi
