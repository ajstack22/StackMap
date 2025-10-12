#!/bin/bash

# ============================================
# Test Script for Deployment Fixes
# Validates CRITICAL and HIGH priority fixes
# ============================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing Deployment Fixes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
    local name="$1"
    local result="$2"

    if [ "$result" = "pass" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - $name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# ============================================
# Test 1: iOS Fastfile Signal Traps
# ============================================

echo "Test 1: iOS Fastfile Signal Traps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "trap(\"INT\")" "$PROJECT_ROOT/ios/fastlane/Fastfile" && \
   grep -q "trap(\"TERM\")" "$PROJECT_ROOT/ios/fastlane/Fastfile" && \
   grep -q "at_exit do" "$PROJECT_ROOT/ios/fastlane/Fastfile" && \
   grep -q "@info_plist_modified" "$PROJECT_ROOT/ios/fastlane/Fastfile"; then
    test_result "Signal traps and at_exit handler added" "pass"
else
    test_result "Signal traps and at_exit handler added" "fail"
fi

echo

# ============================================
# Test 2: Beta Verification URL
# ============================================

echo "Test 2: Beta Verification URL Fix"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -A 2 "beta)" "$PROJECT_ROOT/scripts/lib/verification.sh" | grep -q "stackmap.app/beta"; then
    test_result "Beta verification checks correct URL" "pass"
else
    test_result "Beta verification checks correct URL" "fail"
fi

echo

# ============================================
# Test 3: SSH Write Permission Validation
# ============================================

echo "Test 3: SSH Write Permission Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "test -w ~/public_html" "$PROJECT_ROOT/scripts/lib/validation.sh"; then
    test_result "SSH validation checks write permissions" "pass"
else
    test_result "SSH validation checks write permissions" "fail"
fi

echo

# ============================================
# Test 4: Rollback Library Exists
# ============================================

echo "Test 4: Rollback Strategy Implementation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$PROJECT_ROOT/scripts/lib/rollback.sh" ]; then
    test_result "Rollback library created" "pass"

    # Check for key functions
    if grep -q "save_deployment_state()" "$PROJECT_ROOT/scripts/lib/rollback.sh" && \
       grep -q "rollback_deployment()" "$PROJECT_ROOT/scripts/lib/rollback.sh" && \
       grep -q "create_deployment_manifest()" "$PROJECT_ROOT/scripts/lib/rollback.sh"; then
        test_result "Rollback functions implemented" "pass"
    else
        test_result "Rollback functions implemented" "fail"
    fi
else
    test_result "Rollback library created" "fail"
fi

# Check rollback loaded in master script
if grep -q "rollback.sh" "$PROJECT_ROOT/scripts/deploy.sh"; then
    test_result "Rollback library loaded in master script" "pass"
else
    test_result "Rollback library loaded in master script" "fail"
fi

echo

# ============================================
# Test 5: Script Validation Bypass Prevention
# ============================================

echo "Test 5: Script Validation Bypass Prevention"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "VALIDATED_BY_MASTER" "$PROJECT_ROOT/scripts/deploy_stage.sh" && \
   grep -q "This script must be called via deploy.sh" "$PROJECT_ROOT/scripts/deploy_stage.sh"; then
    test_result "Stage script requires validation token" "pass"
else
    test_result "Stage script requires validation token" "fail"
fi

if grep -q "VALIDATED_BY_MASTER" "$PROJECT_ROOT/scripts/deploy_beta.sh" && \
   grep -q "This script must be called via deploy.sh" "$PROJECT_ROOT/scripts/deploy_beta.sh"; then
    test_result "Beta script requires validation token" "pass"
else
    test_result "Beta script requires validation token" "fail"
fi

if grep -q "export VALIDATED_BY_MASTER" "$PROJECT_ROOT/scripts/deploy.sh"; then
    test_result "Master script exports validation token" "pass"
else
    test_result "Master script exports validation token" "fail"
fi

echo

# ============================================
# Test 6: Deployment Locking
# ============================================

echo "Test 6: Deployment Locking Mechanism"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "acquire_deployment_lock" "$PROJECT_ROOT/scripts/lib/common.sh" && \
   grep -q "release_deployment_lock" "$PROJECT_ROOT/scripts/lib/common.sh" && \
   grep -q "flock" "$PROJECT_ROOT/scripts/lib/common.sh"; then
    test_result "Locking functions implemented in common.sh" "pass"
else
    test_result "Locking functions implemented in common.sh" "fail"
fi

if grep -q "acquire_deployment_lock" "$PROJECT_ROOT/scripts/deploy.sh" && \
   grep -q "trap release_deployment_lock EXIT" "$PROJECT_ROOT/scripts/deploy.sh"; then
    test_result "Locking integrated in master script" "pass"
else
    test_result "Locking integrated in master script" "fail"
fi

echo

# ============================================
# Test 7: Enhanced Error Reporting
# ============================================

echo "Test 7: Enhanced Fastlane Error Reporting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "/tmp/stackmap-logs" "$PROJECT_ROOT/scripts/deploy_stage.sh" && \
   grep -q "tail -30" "$PROJECT_ROOT/scripts/deploy_stage.sh" && \
   grep -q "Full log saved to:" "$PROJECT_ROOT/scripts/deploy_stage.sh"; then
    test_result "Stage script captures fastlane logs" "pass"
else
    test_result "Stage script captures fastlane logs" "fail"
fi

if grep -q "/tmp/stackmap-logs" "$PROJECT_ROOT/scripts/deploy_beta.sh" && \
   grep -q "tail -30" "$PROJECT_ROOT/scripts/deploy_beta.sh" && \
   grep -q "Full log saved to:" "$PROJECT_ROOT/scripts/deploy_beta.sh"; then
    test_result "Beta script captures fastlane logs" "pass"
else
    test_result "Beta script captures fastlane logs" "fail"
fi

echo

# ============================================
# Test Summary
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ ALL TESTS PASSED - Deployment fixes verified!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ SOME TESTS FAILED - Review implementation${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
