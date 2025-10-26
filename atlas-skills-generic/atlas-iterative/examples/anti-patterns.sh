#!/bin/bash

# Anti-Patterns Check Script - Example Template
#
# Copy this to `.atlas/anti-patterns.sh` in your project root and customize.
# Make it executable: chmod +x .atlas/anti-patterns.sh
#
# This script checks for project-specific code smells and convention violations.
# It runs during Phase 2 self-review in the Iterative workflow.

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0

echo "🔍 Running project-specific anti-pattern checks..."
echo ""

# ============================================================================
# SECTION 1: Debug Statements
# ============================================================================

echo "Checking for debug statements..."

# JavaScript/TypeScript
if find src/ -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -exec grep -l "console\.log\|console\.error\|debugger" {} \; 2>/dev/null | grep -q .; then
  echo -e "${RED}❌ Debug statements found (console.log, console.error, debugger)${NC}"
  find src/ -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -exec grep -Hn "console\.log\|console\.error\|debugger" {} \; 2>/dev/null | head -5
  echo "  (showing first 5 occurrences)"
  ERRORS=$((ERRORS + 1))
fi

# Python
if find src/ -type f -name "*.py" -exec grep -l "print(" {} \; 2>/dev/null | grep -q .; then
  echo -e "${YELLOW}⚠️  print() statements found - ensure they're intentional${NC}"
  find src/ -type f -name "*.py" -exec grep -Hn "print(" {} \; 2>/dev/null | head -5
  echo "  (showing first 5 occurrences)"
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# SECTION 2: Commented Code
# ============================================================================

echo ""
echo "Checking for commented-out code..."

# Look for multiple consecutive comment lines (likely commented code)
if find src/ -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -exec awk '/^[[:space:]]*\/\// {count++} /^[[:space:]]*[^\/]/ {if (count > 3) found=1; count=0} END {exit !found}' {} \; 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Possible commented-out code blocks found${NC}"
  echo "  Review and remove if not needed"
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# SECTION 3: Hardcoded Values
# ============================================================================

echo ""
echo "Checking for hardcoded credentials and secrets..."

# Check for potential secrets (case insensitive)
if grep -ri "password[[:space:]]*=[[:space:]]*[\"']" src/ --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null | grep -v "placeholder\|example\|test\|mock"; then
  echo -e "${RED}❌ Possible hardcoded passwords found${NC}"
  ERRORS=$((ERRORS + 1))
fi

if grep -ri "api[_-]key[[:space:]]*=[[:space:]]*[\"']" src/ --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null | grep -v "placeholder\|example\|test\|mock"; then
  echo -e "${RED}❌ Possible hardcoded API keys found${NC}"
  ERRORS=$((ERRORS + 1))
fi

if grep -ri "secret[[:space:]]*=[[:space:]]*[\"']" src/ --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null | grep -v "placeholder\|example\|test\|mock"; then
  echo -e "${RED}❌ Possible hardcoded secrets found${NC}"
  ERRORS=$((ERRORS + 1))
fi

# ============================================================================
# SECTION 4: TODO/FIXME Comments
# ============================================================================

echo ""
echo "Checking for untracked TODOs..."

# Find TODOs without issue tracker references
if grep -rn "TODO\|FIXME\|HACK" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "#[0-9]\|JIRA-\|TODO:" | grep -q .; then
  echo -e "${YELLOW}⚠️  TODO/FIXME comments without issue tracker references${NC}"
  grep -rn "TODO\|FIXME\|HACK" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "#[0-9]\|JIRA-" | head -5
  echo "  (showing first 5 occurrences)"
  echo "  Link TODOs to issue tracker: TODO(#123): description"
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# SECTION 5: Error Handling
# ============================================================================

echo ""
echo "Checking for missing error handling..."

# JavaScript/TypeScript: fetch without catch
if find src/ -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -exec grep -l "fetch(" {} \; 2>/dev/null | xargs grep -L "catch\|try" 2>/dev/null | grep -q .; then
  echo -e "${YELLOW}⚠️  fetch() calls without error handling detected${NC}"
  echo "  Ensure all API calls have try/catch or .catch()"
  WARNINGS=$((WARNINGS + 1))
fi

# Python: requests without try/except
if find src/ -type f -name "*.py" -exec grep -l "requests\." {} \; 2>/dev/null | xargs grep -L "try:\|except" 2>/dev/null | grep -q .; then
  echo -e "${YELLOW}⚠️  requests calls without try/except detected${NC}"
  echo "  Ensure all API calls have proper error handling"
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# SECTION 6: State Management (JavaScript/TypeScript)
# ============================================================================

echo ""
echo "Checking state management patterns..."

# Direct state mutation (if using Redux/similar)
if grep -rn "state\[" src/ --include="*.js" --include="*.ts" 2>/dev/null | grep "=" | grep -v "useState\|setState\|getState" | grep -q .; then
  echo -e "${YELLOW}⚠️  Possible direct state mutation detected${NC}"
  echo "  Use state update functions instead of direct assignment"
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# SECTION 7: Security Patterns
# ============================================================================

echo ""
echo "Checking security patterns..."

# SQL concatenation (SQL injection risk)
if grep -rn "SELECT.*+\|INSERT.*+\|UPDATE.*+" src/ --include="*.js" --include="*.ts" --include="*.py" 2>/dev/null | grep -q .; then
  echo -e "${RED}❌ Possible SQL injection vulnerability (string concatenation in query)${NC}"
  echo "  Use parameterized queries instead"
  ERRORS=$((ERRORS + 1))
fi

# eval usage (security risk)
if grep -rn "\beval(" src/ --exclude-dir=node_modules 2>/dev/null | grep -q .; then
  echo -e "${RED}❌ eval() usage detected - security risk${NC}"
  ERRORS=$((ERRORS + 1))
fi

# innerHTML usage (XSS risk)
if grep -rn "\.innerHTML\s*=" src/ --include="*.js" --include="*.ts" 2>/dev/null | grep -q .; then
  echo -e "${YELLOW}⚠️  innerHTML usage detected - potential XSS risk${NC}"
  echo "  Ensure data is sanitized or use textContent/innerText"
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# SECTION 8: Performance Patterns
# ============================================================================

echo ""
echo "Checking performance patterns..."

# Multiple array iterations
if find src/ -type f \( -name "*.js" -o -name "*.ts" \) -exec grep -Pzo "\.map\([^)]+\)[\s\n]*\.filter\([^)]+\)" {} \; 2>/dev/null | grep -q .; then
  echo -e "${YELLOW}⚠️  Chained map().filter() detected - consider combining${NC}"
  echo "  Use reduce() or filter first, then map for better performance"
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# SECTION 9: Naming Conventions
# ============================================================================

echo ""
echo "Checking naming conventions..."

# Component files should be PascalCase (JavaScript/TypeScript)
if find src/components -type f \( -name "*.jsx" -o -name "*.tsx" \) 2>/dev/null | grep -v "^[A-Z]" | grep -q .; then
  echo -e "${YELLOW}⚠️  Component files should use PascalCase${NC}"
  find src/components -type f \( -name "*.jsx" -o -name "*.tsx" \) 2>/dev/null | grep -v "^[A-Z]" | head -5
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# SECTION 10: Testing
# ============================================================================

echo ""
echo "Checking test coverage..."

# Check for test files
if [ -d "src/" ] && [ ! -d "src/__tests__" ] && [ ! -d "tests/" ]; then
  echo -e "${YELLOW}⚠️  No test directory found${NC}"
  echo "  Consider adding tests for your changes"
  WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# PROJECT-SPECIFIC CHECKS
# ============================================================================

echo ""
echo "Running project-specific checks..."

# Add your own project-specific checks here
# Examples:

# Check for banned imports
# if grep -rn "import.*lodash" src/ 2>/dev/null | grep -q .; then
#   echo -e "${YELLOW}⚠️  lodash usage detected - prefer native methods${NC}"
#   WARNINGS=$((WARNINGS + 1))
# fi

# Check for specific anti-patterns in your codebase
# if grep -rn "\.setState.*setState" src/ 2>/dev/null | grep -q .; then
#   echo -e "${YELLOW}⚠️  Multiple setState calls - consider batching${NC}"
#   WARNINGS=$((WARNINGS + 1))
# fi

# Check for missing props validation
# if find src/ -name "*.jsx" -o -name "*.tsx" | xargs grep -L "PropTypes\|interface.*Props" 2>/dev/null | grep -q .; then
#   echo -e "${YELLOW}⚠️  Components without prop validation detected${NC}"
#   WARNINGS=$((WARNINGS + 1))
# fi

# ============================================================================
# RESULTS
# ============================================================================

echo ""
echo "============================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ All anti-pattern checks passed!${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  ${WARNINGS} warning(s) found${NC}"
  echo "Review warnings before proceeding"
  exit 0
else
  echo -e "${RED}❌ ${ERRORS} error(s) and ${WARNINGS} warning(s) found${NC}"
  echo "Fix errors before deploying"
  exit 1
fi
