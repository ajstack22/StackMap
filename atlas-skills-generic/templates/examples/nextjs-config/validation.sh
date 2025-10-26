#!/bin/bash
# Next.js Project-Specific Validation

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for 'use client' overuse
check_use_client_overuse() {
  echo "Checking for 'use client' overuse..."

  local client_components=$(grep -r "^'use client'" src/app --include="*.tsx" 2>/dev/null | wc -l)
  local total_components=$(find src/app -name "*.tsx" 2>/dev/null | wc -l)

  if [ "$total_components" -gt 0 ]; then
    local percentage=$((client_components * 100 / total_components))

    if [ "$percentage" -gt 50 ]; then
      echo -e "${YELLOW}⚠️  ${percentage}% of components use 'use client'${NC}"
      echo "Consider using Server Components by default"
    else
      echo -e "${GREEN}✅ Client Component usage looks reasonable (${percentage}%)${NC}"
    fi
  fi

  return 0
}

# Check for useEffect data fetching anti-pattern
check_useeffect_fetching() {
  echo "Checking for useEffect data fetching..."

  if grep -r "useEffect.*fetch\|useEffect.*axios" src/ --include="*.tsx" --include="*.ts" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  useEffect with fetch/axios found${NC}"
    echo "Consider using React Query or Server Components instead"
  fi

  return 0
}

# Check for img tag instead of next/image
check_image_optimization() {
  echo "Checking for unoptimized images..."

  if grep -r "<img" src/ --include="*.tsx" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  <img> tag found instead of next/image${NC}"
    echo "Use Next.js Image component for optimization"
  fi

  return 0
}

# Check for hardcoded URLs
check_hardcoded_urls() {
  echo "Checking for hardcoded URLs..."

  if grep -rE "fetch\(['\"]http://|fetch\(['\"]https://" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "example.com"; then
    echo -e "${YELLOW}⚠️  Hardcoded URLs found${NC}"
    echo "Use environment variables: process.env.NEXT_PUBLIC_API_URL"
  fi

  return 0
}

# Check for Context used for server state
check_context_for_server_state() {
  echo "Checking for Context usage..."

  if grep -r "createContext.*fetch\|useContext.*data" src/ --include="*.tsx" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Potential Context use for server state${NC}"
    echo "Consider React Query for server state management"
  fi

  return 0
}

# Check for missing metadata
check_metadata() {
  echo "Checking for metadata exports..."

  # Find page.tsx files without metadata export
  find src/app -name "page.tsx" 2>/dev/null | while read -r file; do
    if ! grep -q "export.*metadata\|generateMetadata" "$file"; then
      echo -e "${YELLOW}⚠️  Missing metadata in $file${NC}"
    fi
  done

  return 0
}

# Check for console.log
check_console_logs() {
  echo "Checking for console.log statements..."

  local console_logs=$(grep -r "console\.log\|console\.error" src/ --include="*.ts" --include="*.tsx" \
    --exclude-dir="__tests__" --exclude="*.test.*" 2>/dev/null | wc -l)

  if [ $console_logs -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $console_logs console.log/error statements${NC}"
    echo "Remove debug statements before production"
  fi

  return 0
}

# Check for any type usage
check_any_types() {
  echo "Checking for 'any' type usage..."

  if grep -r ": any\|<any>" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "test" | head -n 5; then
    echo -e "${YELLOW}⚠️  'any' type found${NC}"
    echo "Use specific types or 'unknown' instead"
  fi

  return 0
}

# Check for missing alt attributes
check_image_alt() {
  echo "Checking for images without alt text..."

  if grep -r "<Image" src/ --include="*.tsx" | grep -v "alt=" | head -n 5; then
    echo -e "${YELLOW}⚠️  Image components without alt attribute${NC}"
    echo "Add alt text for accessibility"
  fi

  return 0
}

# Check TypeScript
check_typescript() {
  echo "Checking TypeScript..."

  if command -v npm &> /dev/null; then
    if npm run type-check > /dev/null 2>&1 || npm run typecheck > /dev/null 2>&1; then
      echo -e "${GREEN}✅ TypeScript check passed${NC}"
    else
      echo -e "${RED}❌ TypeScript errors found${NC}"
      echo "Run: npm run type-check (or npm run typecheck)"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️  npm not found, skipping TypeScript check${NC}"
  fi

  return 0
}

# Check linting
check_linting() {
  echo "Checking ESLint..."

  if command -v npm &> /dev/null; then
    if npm run lint > /dev/null 2>&1; then
      echo -e "${GREEN}✅ ESLint passed${NC}"
    else
      echo -e "${RED}❌ ESLint errors found${NC}"
      echo "Run: npm run lint"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️  npm not found, skipping ESLint check${NC}"
  fi

  return 0
}

# Check for dynamic imports without loading state
check_dynamic_imports() {
  echo "Checking dynamic imports..."

  if grep -r "dynamic(.*import" src/ --include="*.tsx" | grep -v "loading:" | head -n 3; then
    echo -e "${YELLOW}⚠️  dynamic() without loading state found${NC}"
    echo "Add loading component for better UX"
  fi

  return 0
}

# Check for missing error boundaries
check_error_boundaries() {
  echo "Checking for error boundaries..."

  # Check if app-level error.tsx exists
  if [ ! -f "src/app/error.tsx" ] && [ ! -f "app/error.tsx" ]; then
    echo -e "${YELLOW}⚠️  No app-level error.tsx found${NC}"
    echo "Consider adding error.tsx for better error handling"
  fi

  return 0
}

# Main validation function
check_project_antipatterns() {
  echo ""
  echo "========================================="
  echo "Next.js Project Validation"
  echo "========================================="
  echo ""

  local failed=0

  check_use_client_overuse || failed=1
  check_useeffect_fetching || failed=1
  check_image_optimization || failed=1
  check_hardcoded_urls || failed=1
  check_context_for_server_state || failed=1
  check_metadata || failed=1
  check_console_logs || failed=1
  check_any_types || failed=1
  check_image_alt || failed=1
  check_typescript || failed=1
  check_linting || failed=1
  check_dynamic_imports || failed=1
  check_error_boundaries || failed=1

  echo ""
  if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ All Next.js validations passed${NC}"
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
