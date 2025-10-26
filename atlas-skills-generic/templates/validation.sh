#!/bin/bash
# Project-Specific Validation
# This script checks for project-specific anti-patterns

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function: Check for your anti-pattern (example)
check_example_antipattern() {
  echo "Checking for example anti-pattern..."

  # Replace with your check
  # if grep -r "pattern" src/ --include="*.ext" 2>/dev/null; then
  #   echo -e "${RED}❌ Anti-pattern found${NC}"
  #   return 1
  # fi

  echo -e "${GREEN}✅ Example check passed${NC}"
  return 0
}

# Main validation function
check_project_antipatterns() {
  echo ""
  echo "========================================="
  echo "Running Project-Specific Validation"
  echo "========================================="
  echo ""

  local failed=0

  # Run all checks
  check_example_antipattern || failed=1

  echo ""
  if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ All project validations passed${NC}"
    return 0
  else
    echo -e "${RED}❌ Some validations failed${NC}"
    return 1
  fi
}

# Export function so it can be sourced by other scripts
export -f check_project_antipatterns

# If script is run directly (not sourced), run validation
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
  check_project_antipatterns
fi
