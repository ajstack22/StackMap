#!/bin/bash
# Atlas Full Workflow Quality Gates Script
# Comprehensive validation before deployment
#
# CUSTOMIZATION INSTRUCTIONS:
# 1. Update npm script names to match your project (typecheck, lint, test, build)
# 2. Add/remove platform-specific build checks
# 3. Customize anti-pattern checks for your codebase conventions
# 4. Update thresholds (coverage %, bundle size, etc.) for your needs
# 5. Modify change tracking to match your process (git, changelog, etc.)

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

# ============================================================================
# CONFIGURATION - CUSTOMIZE THESE FOR YOUR PROJECT
# ============================================================================

# Test coverage target (%)
COVERAGE_TARGET=80
COVERAGE_MIN_ACCEPTABLE=60

# Bundle size warning threshold (KB)
BUNDLE_SIZE_WARNING=1024

# Change tracking file (customize to your project)
# Examples: CHANGELOG.md, CHANGES.md, version file, etc.
CHANGE_FILE="CHANGELOG.md"

# ============================================================================
# 1. Type Checking (skip if not using TypeScript)
# ============================================================================
echo "1️⃣ Running type checking..."
if command -v npm &> /dev/null && npm run --silent 2>&1 | grep -q "typecheck"; then
    if npm run typecheck > /tmp/atlas-full-typecheck.log 2>&1; then
        print_status 0 "Type checking passed"
    else
        print_status 1 "Type checking failed"
        echo "   See: /tmp/atlas-full-typecheck.log"
        cat /tmp/atlas-full-typecheck.log
    fi
else
    print_info "Type checking not configured (npm run typecheck not found)"
fi
echo ""

# ============================================================================
# 2. Linting
# ============================================================================
echo "2️⃣ Running linter..."
if command -v npm &> /dev/null && npm run --silent 2>&1 | grep -q "lint"; then
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
else
    print_warning "Linting not configured (npm run lint not found)"
fi
echo ""

# ============================================================================
# 3. Unit Tests
# ============================================================================
echo "3️⃣ Running unit tests..."
if command -v npm &> /dev/null && npm run --silent 2>&1 | grep -q "test"; then
    if npm test > /tmp/atlas-full-test.log 2>&1; then
        TEST_COUNT=$(grep -o "[0-9]* passed" /tmp/atlas-full-test.log | head -1 | awk '{print $1}' || echo "unknown")
        print_status 0 "Tests passed (${TEST_COUNT} tests)"
    else
        print_status 1 "Tests failed"
        echo "   See: /tmp/atlas-full-test.log"
        cat /tmp/atlas-full-test.log | tail -50
    fi
else
    print_warning "Tests not configured (npm test not found)"
fi
echo ""

# ============================================================================
# 4. Test Coverage
# ============================================================================
echo "4️⃣ Checking test coverage..."
if command -v npm &> /dev/null && npm run --silent 2>&1 | grep -q "test:coverage"; then
    if npm run test:coverage > /tmp/atlas-full-coverage.log 2>&1; then
        COVERAGE=$(grep -o "[0-9]*\.[0-9]*%" /tmp/atlas-full-coverage.log | head -1 || echo "0%")
        COVERAGE_NUM=$(echo $COVERAGE | sed 's/%//')

        if command -v bc &> /dev/null; then
            if (( $(echo "$COVERAGE_NUM >= $COVERAGE_TARGET" | bc -l) )); then
                print_status 0 "Test coverage: ${COVERAGE} (target: ${COVERAGE_TARGET}%)"
            elif (( $(echo "$COVERAGE_NUM >= $COVERAGE_MIN_ACCEPTABLE" | bc -l) )); then
                print_warning "Test coverage: ${COVERAGE} (target: ${COVERAGE_TARGET}%, acceptable: ${COVERAGE_MIN_ACCEPTABLE}%+)"
            else
                print_status 1 "Test coverage: ${COVERAGE} (below ${COVERAGE_MIN_ACCEPTABLE}%)"
            fi
        else
            print_info "Test coverage: ${COVERAGE} (bc not available for comparison)"
        fi
    else
        print_warning "Test coverage measurement failed"
    fi
else
    print_info "Test coverage not configured (npm run test:coverage not found)"
fi
echo ""

# ============================================================================
# 5. Build Validation
# ============================================================================
echo "5️⃣ Validating builds..."

# Check for build script
if command -v npm &> /dev/null && npm run --silent 2>&1 | grep -q "build"; then
    print_info "Building project..."
    if npm run build > /tmp/atlas-full-build.log 2>&1; then
        print_status 0 "Build succeeded"
    else
        print_status 1 "Build failed"
        echo "   See: /tmp/atlas-full-build.log"
        cat /tmp/atlas-full-build.log | tail -30
    fi
else
    print_info "Build script not configured (npm run build not found)"
fi
echo ""

# ============================================================================
# 6. Check Change Tracking
# ============================================================================
echo "6️⃣ Checking change tracking..."
if [ -f "$CHANGE_FILE" ]; then
    # Check if file is not empty (more than just whitespace)
    if [ -s "$CHANGE_FILE" ] && grep -q "[^[:space:]]" "$CHANGE_FILE"; then
        print_status 0 "$CHANGE_FILE is present and not empty"
    else
        print_warning "$CHANGE_FILE is empty (update before deploying)"
    fi
else
    print_info "$CHANGE_FILE not found (optional for your project)"
fi
echo ""

# ============================================================================
# 7. Documentation Check
# ============================================================================
echo "7️⃣ Checking documentation..."

DOC_ISSUES=0

# Check if code changes exist
if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
    # Check if there are staged changes in source code
    if git diff --cached --name-only | grep -q "^src/\|^lib/\|^app/"; then
        # Check if documentation was also updated
        if git diff --cached --name-only | grep -qE "README|docs/|CHANGELOG|\.md$"; then
            print_status 0 "Documentation updated alongside code changes"
        else
            print_warning "Code changes detected but no documentation updates (confirm if needed)"
            DOC_ISSUES=1
        fi
    else
        print_info "No source code changes or documentation update not required"
    fi
else
    print_info "Not a git repository or git not available"
fi
echo ""

# ============================================================================
# 8. Check for Common Anti-patterns
# ============================================================================
echo "8️⃣ Checking for common anti-patterns..."

ANTIPATTERN_FOUND=0

# Check for console statements (should be removed or wrapped)
print_info "Checking for console statements..."
if [ -d "src/" ]; then
    CONSOLE_LOGS=$(grep -r "console\.log\|console\.error\|console\.warn" src/ 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
    if [ "$CONSOLE_LOGS" -gt 0 ]; then
        print_warning "Found ${CONSOLE_LOGS} console statements (should be removed or wrapped for production)"
        ANTIPATTERN_FOUND=1
    fi
fi

# Check for TODO/FIXME comments
print_info "Checking for TODO/FIXME comments..."
if [ -d "src/" ]; then
    TODO_COUNT=$(grep -r "TODO\|FIXME" src/ 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
    if [ "$TODO_COUNT" -gt 0 ]; then
        print_info "Found ${TODO_COUNT} TODO/FIXME comments (ensure they're tracked)"
    fi
fi

# Check for debugger statements
print_info "Checking for debugger statements..."
if [ -d "src/" ]; then
    DEBUGGER_COUNT=$(grep -r "debugger" src/ 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
    if [ "$DEBUGGER_COUNT" -gt 0 ]; then
        print_status 1 "Found ${DEBUGGER_COUNT} debugger statements (must remove)"
        ANTIPATTERN_FOUND=1
    fi
fi

# ADD YOUR PROJECT-SPECIFIC ANTI-PATTERN CHECKS HERE
# Example:
# print_info "Checking for deprecated API usage..."
# if grep -r "deprecatedFunction" src/ 2>/dev/null | grep -v "node_modules"; then
#     print_warning "Found usage of deprecated API"
#     ANTIPATTERN_FOUND=1
# fi

if [ $ANTIPATTERN_FOUND -eq 0 ]; then
    print_status 0 "No major anti-patterns found"
else
    print_status 1 "Anti-patterns detected (see above)"
fi
echo ""

# ============================================================================
# 9. Security Check (Basic)
# ============================================================================
echo "9️⃣ Running basic security checks..."

SECURITY_ISSUES=0

# Check for hardcoded secrets/keys
print_info "Checking for hardcoded secrets..."
if [ -d "src/" ]; then
    if grep -rE "api[_-]?key|secret|password|token" src/ 2>/dev/null | grep -v "node_modules" | grep -v "propTypes" | grep -E "=.*['\"][a-zA-Z0-9]{20,}['\"]" > /dev/null; then
        print_warning "Potential hardcoded secrets found (review manually)"
        SECURITY_ISSUES=1
    fi
fi

# Check for eval usage
print_info "Checking for eval() usage..."
if [ -d "src/" ]; then
    if grep -r "eval(" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
        print_status 1 "eval() usage found (security risk)"
        SECURITY_ISSUES=1
    fi
fi

# Check for dangerouslySetInnerHTML (React)
print_info "Checking for dangerouslySetInnerHTML..."
if [ -d "src/" ]; then
    if grep -r "dangerouslySetInnerHTML" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
        print_warning "dangerouslySetInnerHTML found (ensure input sanitized)"
        SECURITY_ISSUES=1
    fi
fi

if [ $SECURITY_ISSUES -eq 0 ]; then
    print_status 0 "No obvious security issues"
else
    print_status 1 "Security concerns detected (review required)"
fi
echo ""

# ============================================================================
# 10. Dependency Check
# ============================================================================
echo "🔟 Checking dependencies..."

# Check for dependency vulnerabilities
print_info "Checking for dependency vulnerabilities..."
if command -v npm &> /dev/null; then
    if npm audit --audit-level=moderate > /tmp/atlas-full-audit.log 2>&1; then
        print_status 0 "No moderate+ vulnerabilities found"
    else
        CRITICAL=$(grep -c "critical" /tmp/atlas-full-audit.log || echo "0")
        HIGH=$(grep -c "high" /tmp/atlas-full-audit.log || echo "0")

        if [ "$CRITICAL" -gt 0 ]; then
            print_status 1 "Found ${CRITICAL} critical vulnerabilities (run: npm audit fix)"
            cat /tmp/atlas-full-audit.log | head -30
        elif [ "$HIGH" -gt 0 ]; then
            print_warning "Found ${HIGH} high vulnerabilities (run: npm audit)"
        fi
    fi
else
    print_info "npm not available, skipping dependency check"
fi
echo ""

# ============================================================================
# 11. Git Status Check
# ============================================================================
echo "1️⃣1️⃣ Checking git status..."

if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
    # Check for uncommitted changes
    if git diff-index --quiet HEAD -- 2>/dev/null; then
        print_status 0 "Working directory clean (no uncommitted changes)"
    else
        print_info "Uncommitted changes detected (ensure they're intentional)"
    fi

    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    print_info "Current branch: ${CURRENT_BRANCH}"
else
    print_info "Not a git repository or git not available"
fi
echo ""

# ============================================================================
# 12. Performance Check (Basic)
# ============================================================================
echo "1️⃣2️⃣ Running basic performance checks..."

# Check bundle size (if built)
BUNDLE_FOUND=0
for pattern in "bundle.js" "main.*.js" "index.js"; do
    BUNDLE_PATH=$(find . -name "$pattern" -not -path "*/node_modules/*" | head -1)
    if [ -n "$BUNDLE_PATH" ]; then
        BUNDLE_SIZE=$(du -h "$BUNDLE_PATH" | cut -f1)
        print_info "Bundle size: ${BUNDLE_SIZE} (${BUNDLE_PATH})"

        # Warn if > threshold
        BUNDLE_KB=$(du -k "$BUNDLE_PATH" | cut -f1)
        if [ "$BUNDLE_KB" -gt "$BUNDLE_SIZE_WARNING" ]; then
            print_warning "Bundle size > ${BUNDLE_SIZE_WARNING}KB (consider code splitting)"
        fi
        BUNDLE_FOUND=1
        break
    fi
done

if [ $BUNDLE_FOUND -eq 0 ]; then
    print_info "Bundle not found (will be checked during build)"
fi
echo ""

# ============================================================================
# Final Summary
# ============================================================================
echo "==========================================="
echo ""

if [ $VALIDATION_FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ All quality gates passed!${NC}"
        echo ""
        echo "Ready to deploy. Follow your project's deployment process."
        exit 0
    else
        echo -e "${YELLOW}⚠️  Quality gates passed with ${WARNINGS} warnings${NC}"
        echo ""
        echo "Review warnings above. If acceptable, proceed with deployment."
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
    echo "  - Build errors: Review build output in /tmp/atlas-full-build.log"
    echo "  - Security: Address security concerns found above"
    exit 1
fi
