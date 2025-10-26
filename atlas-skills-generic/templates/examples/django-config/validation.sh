#!/bin/bash
# Django Project-Specific Validation

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for business logic in views
check_business_logic_in_views() {
  echo "Checking for business logic in views..."

  # Look for .create(), .save(), .delete() directly in views
  if grep -r "\.objects\.create\|\.objects\.update\|\.save()" apps/*/views.py 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Database operations found in views${NC}"
    echo "Consider moving business logic to services.py"
  fi

  return 0
}

# Check for N+1 query patterns
check_n_plus_one_queries() {
  echo "Checking for potential N+1 queries..."

  # Look for common N+1 patterns
  if grep -r "for .* in .*\.all():" apps/ --include="*.py" | grep -E "\.(get|filter|all)\(" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Potential N+1 query pattern found${NC}"
    echo "Consider using select_related() or prefetch_related()"
  fi

  return 0
}

# Check for raw SQL without parameterization
check_raw_sql() {
  echo "Checking for unsafe raw SQL..."

  if grep -r "\.raw(f['\"]" apps/ --include="*.py" 2>/dev/null; then
    echo -e "${RED}❌ F-string in raw SQL query (SQL injection risk)${NC}"
    echo "Use parameterized queries: .raw('SELECT * WHERE id = %s', [user_id])"
    return 1
  fi

  if grep -r "\.raw(.*\.format\|\.raw(.* %" apps/ --include="*.py" 2>/dev/null; then
    echo -e "${RED}❌ String formatting in raw SQL (SQL injection risk)${NC}"
    return 1
  fi

  echo -e "${GREEN}✅ No unsafe raw SQL found${NC}"
  return 0
}

# Check for missing select_related/prefetch_related
check_query_optimization() {
  echo "Checking query optimization..."

  # Look for serializers accessing related fields without optimization
  if grep -r "depth = [0-9]" apps/*/serializers.py 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Serializer using depth (consider explicit nested serializers)${NC}"
    echo "Explicit nested serializers give better control over queries"
  fi

  return 0
}

# Check for exposed secrets
check_secrets() {
  echo "Checking for exposed secrets..."

  # Look for hardcoded API keys, passwords, secrets
  if grep -rE "(api_key|password|secret|token)\s*=\s*['\"][^'\"]+['\"]" apps/ --include="*.py" 2>/dev/null | grep -v "settings" | grep -v "test"; then
    echo -e "${RED}❌ Hardcoded secrets found${NC}"
    echo "Use environment variables for sensitive data"
    return 1
  fi

  echo -e "${GREEN}✅ No exposed secrets${NC}"
  return 0
}

# Check for missing atomic decorators
check_transactions() {
  echo "Checking for missing transaction management..."

  # Look for services with multiple saves without atomic
  if grep -r "def create_.*:" apps/*/services.py 2>/dev/null | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    func=$(echo "$line" | cut -d: -f2 | sed 's/def //' | sed 's/(.*//')

    # Check if function has multiple .save() or .create() calls
    content=$(sed -n "/$func/,/^def /p" "$file" | grep -c "\.save()\|\.create()")

    if [ "$content" -gt 1 ]; then
      # Check if @transaction.atomic is present
      if ! grep -B 5 "def $func" "$file" | grep -q "@transaction.atomic"; then
        echo -e "${YELLOW}⚠️  Multiple database operations without @transaction.atomic in $file::$func${NC}"
      fi
    fi
  done

  return 0
}

# Check for print statements
check_print_statements() {
  echo "Checking for print statements..."

  if grep -r "^[^#]*print(" apps/ --include="*.py" | grep -v "pprint" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  print() statements found${NC}"
    echo "Use logging instead: logger.info(), logger.debug(), etc."
  fi

  return 0
}

# Check for missing pagination
check_pagination() {
  echo "Checking for missing pagination..."

  # Look for list views without pagination
  if grep -r "class.*ViewSet\|class.*ListAPIView" apps/*/views.py 2>/dev/null | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    if ! grep -q "pagination_class" "$file"; then
      echo -e "${YELLOW}⚠️  ViewSet/ListView without pagination_class in $file${NC}"
    fi
  done

  return 0
}

# Check code formatting
check_formatting() {
  echo "Checking code formatting..."

  if command -v black &> /dev/null; then
    if ! black --check apps/ 2>/dev/null; then
      echo -e "${YELLOW}⚠️  Code not formatted with Black${NC}"
      echo "Run: black apps/"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️  Black not installed, skipping format check${NC}"
  fi

  if command -v isort &> /dev/null; then
    if ! isort --check-only apps/ 2>/dev/null; then
      echo -e "${YELLOW}⚠️  Imports not sorted${NC}"
      echo "Run: isort apps/"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️  isort not installed, skipping import check${NC}"
  fi

  echo -e "${GREEN}✅ Code formatting looks good${NC}"
  return 0
}

# Check linting
check_linting() {
  echo "Checking linting..."

  if command -v flake8 &> /dev/null; then
    if ! flake8 apps/ 2>/dev/null; then
      echo -e "${RED}❌ Linting errors found${NC}"
      return 1
    fi
    echo -e "${GREEN}✅ Linting passed${NC}"
  else
    echo -e "${YELLOW}⚠️  flake8 not installed, skipping lint check${NC}"
  fi

  return 0
}

# Main validation function
check_project_antipatterns() {
  echo ""
  echo "========================================="
  echo "Django Project Validation"
  echo "========================================="
  echo ""

  local failed=0

  check_business_logic_in_views || failed=1
  check_n_plus_one_queries || failed=1
  check_raw_sql || failed=1
  check_query_optimization || failed=1
  check_secrets || failed=1
  check_transactions || failed=1
  check_print_statements || failed=1
  check_pagination || failed=1
  check_formatting || failed=1
  check_linting || failed=1

  echo ""
  if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ All Django validations passed${NC}"
    return 0
  else
    echo -e "${RED}❌ Some validations failed${NC}"
    return 1
  fi
}

export -f check_project_antipatterns

if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
  check_project_antipatterns
fi
