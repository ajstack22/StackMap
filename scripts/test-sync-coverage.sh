#!/bin/bash

# Comprehensive Sync System Test Coverage Script
# This script runs all sync-related tests and generates coverage reports

echo "================================================"
echo "  StackMap Sync System - Test Coverage Report  "
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set test files
SYNC_TEST_FILES=(
    "src/utils/__tests__/dataNormalizer.test.js"
    "src/services/sync/__tests__/conflictResolver.test.js"
    "src/services/sync/__tests__/encryptionService.test.js"
)

# Coverage paths
COVERAGE_PATHS=(
    "src/utils/dataNormalizer.js"
    "src/services/sync/conflictResolver.js"
    "src/services/sync/encryptionServiceFixed.ts"
    "src/services/sync/minimalSyncService.js"
    "src/services/sync/syncStoreIntegration.js"
)

# Create coverage collection argument
COVERAGE_ARGS=""
for path in "${COVERAGE_PATHS[@]}"; do
    if [ -z "$COVERAGE_ARGS" ]; then
        COVERAGE_ARGS="--collectCoverageFrom='$path'"
    else
        COVERAGE_ARGS="$COVERAGE_ARGS --collectCoverageFrom='$path'"
    fi
done

echo "🧪 Running Sync System Tests..."
echo "================================"
echo ""

# Run tests with coverage
npm test -- \
    ${SYNC_TEST_FILES[@]} \
    --coverage \
    --coverageReporters=text \
    --coverageReporters=lcov \
    --collectCoverageFrom='src/utils/dataNormalizer.js' \
    --collectCoverageFrom='src/services/sync/**/*.{js,ts}' \
    --collectCoverageFrom='!src/services/sync/**/*.test.{js,ts}' \
    --collectCoverageFrom='!src/services/sync/__tests__/**' \
    --verbose

TEST_EXIT_CODE=$?

echo ""
echo "================================================"
echo "                TEST SUMMARY                   "
echo "================================================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    
    # Check coverage thresholds
    echo ""
    echo "📊 Coverage Analysis:"
    echo "--------------------"
    
    # Parse coverage report (if lcov is available)
    if [ -f "coverage/lcov.info" ]; then
        # Extract coverage percentages
        TOTAL_LINES=$(grep -E "^LF:" coverage/lcov.info | awk -F: '{sum+=$2} END {print sum}')
        COVERED_LINES=$(grep -E "^LH:" coverage/lcov.info | awk -F: '{sum+=$2} END {print sum}')
        
        if [ "$TOTAL_LINES" -gt 0 ]; then
            COVERAGE_PERCENT=$((COVERED_LINES * 100 / TOTAL_LINES))
            
            if [ $COVERAGE_PERCENT -ge 90 ]; then
                echo -e "${GREEN}✅ Coverage: ${COVERAGE_PERCENT}% (>= 90% threshold)${NC}"
            elif [ $COVERAGE_PERCENT -ge 80 ]; then
                echo -e "${YELLOW}⚠️  Coverage: ${COVERAGE_PERCENT}% (below 90% threshold)${NC}"
            else
                echo -e "${RED}❌ Coverage: ${COVERAGE_PERCENT}% (critically low)${NC}"
            fi
        fi
    fi
else
    echo -e "${RED}❌ Tests failed! Check output above for details.${NC}"
fi

echo ""
echo "📁 Detailed coverage report available at: coverage/lcov-report/index.html"
echo ""

# List test files found/missing
echo "Test File Status:"
echo "-----------------"
for file in "${SYNC_TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (not found)"
    fi
done

echo ""
echo "================================================"
echo "           Verification Commands                "
echo "================================================"
echo ""
echo "To view detailed HTML coverage report:"
echo "  open coverage/lcov-report/index.html"
echo ""
echo "To run individual test files:"
for file in "${SYNC_TEST_FILES[@]}"; do
    echo "  npm test -- $file"
done
echo ""
echo "To run all sync tests with watch mode:"
echo "  npm test -- src/**/*sync* --watch"
echo ""

exit $TEST_EXIT_CODE