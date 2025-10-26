#!/bin/bash
# Example: Project-specific validation checks
# Copy to .atlas/validation.sh and customize

# Function to check project-specific anti-patterns
# This will be called by the main validation script
check_project_antipatterns() {
    echo "Running project-specific validation checks..."

    local FAILED=0

    # Example 1: Check for direct state mutations
    echo "  Checking for direct state mutations..."
    if grep -r "state\[.*\]\s*=" src/ 2>/dev/null | grep -v "node_modules" | grep -v "\.test\." | grep -v "setState"; then
        echo "    ❌ Found direct state mutation (use immutable updates)"
        FAILED=1
    fi

    # Example 2: Check for hardcoded API URLs
    echo "  Checking for hardcoded API URLs..."
    if grep -r "https://api\.example\.com" src/ 2>/dev/null | grep -v "node_modules" | grep -v "config" | grep -v "\.test\."; then
        echo "    ❌ Found hardcoded API URL (use config.API_BASE_URL)"
        FAILED=1
    fi

    # Example 3: Check for forbidden imports
    echo "  Checking for forbidden imports..."
    if grep -r "import.*lodash" src/ 2>/dev/null | grep -v "node_modules" | grep -v "lodash-es"; then
        echo "    ❌ Use lodash-es instead of lodash for tree-shaking"
        FAILED=1
    fi

    # Example 4: Check for missing prop-types (React)
    echo "  Checking for missing PropTypes..."
    # Find React components without propTypes
    for file in $(find src/components -name "*.jsx" -o -name "*.js"); do
        if grep -q "export default" "$file" && ! grep -q "propTypes\|PropTypes" "$file"; then
            echo "    ⚠️  Missing PropTypes in $file"
        fi
    done

    # Example 5: Check for required exports
    echo "  Checking for default exports in components..."
    for file in $(find src/components -name "*.jsx" -o -name "*.js"); do
        if ! grep -q "export default" "$file"; then
            echo "    ⚠️  No default export in $file (components should use default export)"
        fi
    done

    # Example 6: Check for TypeScript 'any' type
    echo "  Checking for TypeScript 'any' type..."
    ANY_COUNT=$(grep -r ": any\|<any>" src/ 2>/dev/null | grep -v "node_modules" | grep -v "\.test\." | wc -l || echo "0")
    if [ "$ANY_COUNT" -gt 0 ]; then
        echo "    ⚠️  Found $ANY_COUNT uses of 'any' type (use 'unknown' instead)"
    fi

    # Example 7: Check for missing error handling
    echo "  Checking for async functions without error handling..."
    # Find async functions without try-catch
    ASYNC_NO_CATCH=$(grep -r "async function\|async (" src/ 2>/dev/null | wc -l || echo "0")
    if [ "$ASYNC_NO_CATCH" -gt 0 ]; then
        echo "    ℹ️  Found $ASYNC_NO_CATCH async functions (verify error handling)"
    fi

    # Example 8: Check for large files
    echo "  Checking for large files..."
    find src/ -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | while read file; do
        LINES=$(wc -l < "$file" 2>/dev/null || echo "0")
        if [ "$LINES" -gt 500 ]; then
            echo "    ⚠️  Large file: $file ($LINES lines - consider splitting)"
        fi
    done

    # Example 9: Check for proper test coverage
    echo "  Checking test coverage..."
    if [ -f coverage/coverage-summary.json ]; then
        COVERAGE=$(cat coverage/coverage-summary.json | grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*' | head -1)
        # Parse coverage percentage
        # This is simplified - adjust based on your coverage tool
        echo "    ℹ️  Test coverage: $COVERAGE"
    fi

    # Example 10: Check for deprecated APIs
    echo "  Checking for deprecated APIs..."
    if grep -r "componentWillMount\|componentWillReceiveProps\|componentWillUpdate" src/ 2>/dev/null | grep -v "node_modules"; then
        echo "    ❌ Found deprecated React lifecycle methods"
        FAILED=1
    fi

    # Example 11: Security checks
    echo "  Checking for security issues..."

    # Check for dangerouslySetInnerHTML
    if grep -r "dangerouslySetInnerHTML" src/ 2>/dev/null | grep -v "node_modules" | grep -v "\.test\."; then
        echo "    ⚠️  Found dangerouslySetInnerHTML (ensure HTML is sanitized)"
    fi

    # Check for eval usage
    if grep -r "\beval\s*(" src/ 2>/dev/null | grep -v "node_modules" | grep -v "\.test\."; then
        echo "    ❌ Found eval() usage (security risk)"
        FAILED=1
    fi

    # Check for hardcoded credentials
    if grep -ri "password\s*=\s*['\"]" src/ 2>/dev/null | grep -v "node_modules" | grep -v "\.test\." | grep -v "placeholder"; then
        echo "    ❌ Found potential hardcoded password"
        FAILED=1
    fi

    # Example 12: Performance checks
    echo "  Checking for performance issues..."

    # Check for unoptimized images
    if find src/assets -name "*.jpg" -o -name "*.png" 2>/dev/null | xargs ls -lh | awk '$5 ~ /M/ && $5+0 > 1'; then
        echo "    ⚠️  Found large images (consider optimization or WebP)"
    fi

    # Example 13: Accessibility checks
    echo "  Checking for accessibility issues..."

    # Check for images without alt text
    if grep -r "<img" src/ 2>/dev/null | grep -v "alt=" | grep -v "node_modules"; then
        echo "    ⚠️  Found <img> without alt attribute"
    fi

    # Example 14: Bundle size check
    echo "  Checking bundle size..."
    if [ -f dist/bundle.js ]; then
        SIZE=$(wc -c < dist/bundle.js)
        SIZE_KB=$((SIZE / 1024))
        if [ $SIZE -gt 500000 ]; then
            echo "    ⚠️  Bundle size is ${SIZE_KB}KB (exceeds 500KB limit)"
        else
            echo "    ✅ Bundle size: ${SIZE_KB}KB"
        fi
    fi

    # Example 15: Dependency checks
    echo "  Checking for outdated dependencies..."
    if command -v npm &> /dev/null; then
        OUTDATED=$(npm outdated 2>/dev/null | tail -n +2 | wc -l || echo "0")
        if [ "$OUTDATED" -gt 0 ]; then
            echo "    ℹ️  Found $OUTDATED outdated dependencies (run 'npm outdated')"
        fi
    fi

    # Return status
    if [ $FAILED -eq 0 ]; then
        echo "  ✅ All project-specific checks passed"
        return 0
    else
        echo "  ❌ Some project-specific checks failed"
        return 1
    fi
}

# Export the function so it can be called by the main validation script
export -f check_project_antipatterns

# Example: Additional helper functions
check_required_files() {
    echo "Checking for required project files..."

    local MISSING=0

    # Check for required documentation
    if [ ! -f "README.md" ]; then
        echo "  ❌ Missing README.md"
        MISSING=1
    fi

    if [ ! -f "CHANGELOG.md" ]; then
        echo "  ⚠️  Missing CHANGELOG.md (recommended)"
    fi

    if [ ! -f "LICENSE" ]; then
        echo "  ⚠️  Missing LICENSE file (recommended)"
    fi

    # Check for required config files
    if [ ! -f ".gitignore" ]; then
        echo "  ❌ Missing .gitignore"
        MISSING=1
    fi

    if [ ! -f ".eslintrc.js" ] && [ ! -f ".eslintrc.json" ]; then
        echo "  ⚠️  Missing ESLint config"
    fi

    return $MISSING
}

export -f check_required_files

# Example: Custom test validation
validate_test_structure() {
    echo "Validating test structure..."

    # Check if tests are co-located with source files
    for src_file in $(find src/ -name "*.js" -o -name "*.jsx" | grep -v "\.test\."); do
        test_file="${src_file%.js}.test.js"
        if [ ! -f "$test_file" ]; then
            basename=$(basename "$src_file")
            echo "  ℹ️  No test file for $basename"
        fi
    done
}

export -f validate_test_structure

# You can add more custom validation functions here
# Each function should:
# - Print clear messages
# - Return 0 for success, 1 for failure
# - Use echo for output
# - Export the function so it can be called externally
