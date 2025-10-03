#!/bin/bash

# Test Health Report for StackMap
# Usage: ./scripts/test-health-report.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         StackMap Test Suite Health Report                 ║"
echo "╟────────────────────────────────────────────────────────────╢"

# Run each tier and capture results
echo "║ Running tests across all tiers...                         ║"
echo "╟────────────────────────────────────────────────────────────╢"

npm run test:smoke > /tmp/test-health-smoke.txt 2>&1
SMOKE_EXIT=$?

npm run test:critical > /tmp/test-health-critical.txt 2>&1
CRITICAL_EXIT=$?

npm run test:important > /tmp/test-health-important.txt 2>&1
IMPORTANT_EXIT=$?

npm run test:ui > /tmp/test-health-ui.txt 2>&1
UI_EXIT=$?

# Parse results
SMOKE_PASSED=$(grep -oE "[0-9]+ passed" /tmp/test-health-smoke.txt | head -1 | grep -oE "[0-9]+" || echo "0")
SMOKE_FAILED=$(grep -oE "[0-9]+ failed" /tmp/test-health-smoke.txt | head -1 | grep -oE "[0-9]+" || echo "0")

CRITICAL_PASSED=$(grep -oE "[0-9]+ passed" /tmp/test-health-critical.txt | head -1 | grep -oE "[0-9]+" || echo "0")
CRITICAL_FAILED=$(grep -oE "[0-9]+ failed" /tmp/test-health-critical.txt | head -1 | grep -oE "[0-9]+" || echo "0")

IMPORTANT_PASSED=$(grep -oE "[0-9]+ passed" /tmp/test-health-important.txt | head -1 | grep -oE "[0-9]+" || echo "0")
IMPORTANT_FAILED=$(grep -oE "[0-9]+ failed" /tmp/test-health-important.txt | head -1 | grep -oE "[0-9]+" || echo "0")
IMPORTANT_TOTAL=$((IMPORTANT_PASSED + IMPORTANT_FAILED))

UI_PASSED=$(grep -oE "[0-9]+ passed" /tmp/test-health-ui.txt | head -1 | grep -oE "[0-9]+" || echo "0")
UI_FAILED=$(grep -oE "[0-9]+ failed" /tmp/test-health-ui.txt | head -1 | grep -oE "[0-9]+" || echo "0")

# Display report
echo "║                                                            ║"
echo "║ Tier 0 (Smoke Test):                                      ║"
if [ $SMOKE_EXIT -eq 0 ]; then
    echo "║   ✅ $SMOKE_PASSED passed, $SMOKE_FAILED failed (100%)                        ║"
else
    echo "║   ❌ $SMOKE_PASSED passed, $SMOKE_FAILED failed                               ║"
fi

echo "║                                                            ║"
echo "║ Tier 1 (Critical - Security & Data):                      ║"
if [ $CRITICAL_EXIT -eq 0 ]; then
    echo "║   ✅ $CRITICAL_PASSED passed, $CRITICAL_FAILED failed (100%)                      ║"
else
    echo "║   ❌ $CRITICAL_PASSED passed, $CRITICAL_FAILED failed                             ║"
fi

echo "║                                                            ║"
echo "║ Tier 2 (Important - Core Features):                       ║"
if [ $IMPORTANT_TOTAL -gt 0 ]; then
    PASS_RATE=$((IMPORTANT_PASSED * 100 / IMPORTANT_TOTAL))
    if [ $PASS_RATE -ge 95 ]; then
        echo "║   ✅ $IMPORTANT_PASSED/$IMPORTANT_TOTAL passed (${PASS_RATE}%)                           ║"
    else
        echo "║   ⚠️  $IMPORTANT_PASSED/$IMPORTANT_TOTAL passed (${PASS_RATE}% - below 95%)               ║"
    fi
else
    echo "║   ✅ $IMPORTANT_PASSED passed                                       ║"
fi

echo "║                                                            ║"
echo "║ Tier 3 (UI/Integration):                                  ║"
echo "║   ℹ️  $UI_PASSED passed, $UI_FAILED failed (informational)                ║"

echo "╟────────────────────────────────────────────────────────────╢"
echo "║ Overall Status:                                            ║"

# Determine overall status
if [ $SMOKE_EXIT -eq 0 ] && [ $CRITICAL_EXIT -eq 0 ]; then
    if [ $IMPORTANT_TOTAL -gt 0 ] && [ $PASS_RATE -ge 95 ]; then
        echo "║   ✅ HEALTHY - Safe to deploy                              ║"
    elif [ $IMPORTANT_TOTAL -gt 0 ] && [ $PASS_RATE -ge 90 ]; then
        echo "║   ⚠️  CAUTION - Consider fixing important tests            ║"
    else
        echo "║   ⚠️  WARNING - Important test health degraded             ║"
    fi
else
    echo "║   ❌ FAILING - Critical tests must pass before deploy      ║"
fi

echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Detailed breakdown if requested
if [ "$1" = "--verbose" ] || [ "$1" = "-v" ]; then
    echo "Detailed Test Output:"
    echo ""

    if [ $SMOKE_EXIT -ne 0 ]; then
        echo "━━━ Smoke Test Failures ━━━"
        cat /tmp/test-health-smoke.txt
        echo ""
    fi

    if [ $CRITICAL_EXIT -ne 0 ]; then
        echo "━━━ Critical Test Failures ━━━"
        cat /tmp/test-health-critical.txt
        echo ""
    fi

    if [ $IMPORTANT_TOTAL -gt 0 ] && [ $PASS_RATE -lt 95 ]; then
        echo "━━━ Important Test Warnings ━━━"
        grep -A 5 "FAIL" /tmp/test-health-important.txt || echo "No failure details found"
        echo ""
    fi
fi

# Exit with error if critical tests failed
if [ $SMOKE_EXIT -ne 0 ] || [ $CRITICAL_EXIT -ne 0 ]; then
    exit 1
fi

exit 0
