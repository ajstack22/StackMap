#!/bin/bash
# React Native Project-Specific Validation

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for direct state mutation
check_direct_state_mutation() {
  echo "Checking for direct state mutation..."

  if grep -r "useAppStore\.setState" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// @allowed" | grep -v useAppStore.ts; then
    echo -e "${RED}❌ Direct useAppStore.setState found${NC}"
    echo "Use store-specific methods instead:"
    echo "  - useUserStore.getState().updateUser()"
    echo "  - useSettingsStore.getState().updateSettings()"
    return 1
  fi

  echo -e "${GREEN}✅ No direct state mutation${NC}"
  return 0
}

# Check for console.log in production code
check_console_logs() {
  echo "Checking for console.log statements..."

  local console_logs=$(grep -r "console\.log\|console\.error" src/ --include="*.ts" --include="*.tsx" \
    --exclude-dir="__tests__" --exclude="*.test.*" 2>/dev/null | wc -l)

  if [ $console_logs -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $console_logs console.log/error statements${NC}"
    echo "Consider removing debug statements before production"
  fi

  return 0
}

# Check for field naming conventions
check_field_naming() {
  echo "Checking field naming conventions..."

  # Check for deprecated 'emoji' field
  if grep -r "\.emoji" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// legacy"; then
    echo -e "${YELLOW}⚠️  Found .emoji field usage${NC}"
    echo "Use .icon instead (with fallback: activity.icon || activity.emoji)"
  fi

  # Check for missing fallbacks
  if grep -r "activity\.text[^|]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "activity\.text ||"; then
    echo -e "${YELLOW}⚠️  Found activity.text without fallback${NC}"
    echo "Use: activity.text || activity.name || activity.title"
  fi

  return 0
}

# Check for platform-specific anti-patterns
check_platform_antipatterns() {
  echo "Checking platform-specific anti-patterns..."

  # Check for calculateCardWidth on Android
  if grep -r "calculateCardWidth" src/ --include="*.android.*" 2>/dev/null; then
    echo -e "${RED}❌ calculateCardWidth used on Android${NC}"
    echo "Android must use percentage widths (48%) for FlexWrap cards"
    return 1
  fi

  # Check for NetInfo.fetch() usage
  if grep -r "NetInfo\.fetch()" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}❌ NetInfo.fetch() found${NC}"
    echo "NetInfo.fetch() causes freezes on iOS - use NetInfo.addEventListener only"
    return 1
  fi

  # Check for Alert.alert in web files
  if grep -r "Alert\.alert" src/ --include="*.web.*" 2>/dev/null; then
    echo -e "${RED}❌ Alert.alert used in web code${NC}"
    echo "Use ConfirmModal component instead for web compatibility"
    return 1
  fi

  echo -e "${GREEN}✅ No platform-specific anti-patterns${NC}"
  return 0
}

# Check for accessibility issues
check_accessibility() {
  echo "Checking accessibility..."

  # Check for buttons without accessibility labels
  if grep -r "<TouchableOpacity" src/ --include="*.tsx" | grep -v "accessibilityLabel" | head -n 5; then
    echo -e "${YELLOW}⚠️  TouchableOpacity without accessibilityLabel found${NC}"
    echo "Add accessibilityLabel for screen reader support"
  fi

  return 0
}

# Check for unoptimized lists
check_list_optimization() {
  echo "Checking list optimization..."

  # Check for .map() used for rendering lists
  if grep -r "\.map((.*) => \(<.*\)" src/ --include="*.tsx" | grep -v "FlatList\|SectionList" | wc -l | grep -v "^0"; then
    echo -e "${YELLOW}⚠️  Array.map() used for rendering lists${NC}"
    echo "Consider using FlatList for better performance with long lists"
  fi

  return 0
}

# Check for hardcoded styles
check_hardcoded_styles() {
  echo "Checking for hardcoded styles..."

  if grep -r "style={{" src/ --include="*.tsx" | wc -l | grep -v "^0"; then
    echo -e "${YELLOW}⚠️  Inline styles found${NC}"
    echo "Consider using StyleSheet.create() for better performance"
  fi

  return 0
}

# Check TypeScript
check_typescript() {
  echo "Checking TypeScript..."

  if command -v npm &> /dev/null; then
    if npm run typecheck > /dev/null 2>&1; then
      echo -e "${GREEN}✅ TypeScript check passed${NC}"
    else
      echo -e "${RED}❌ TypeScript errors found${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️  npm not found, skipping TypeScript check${NC}"
  fi

  return 0
}

# Main validation function
check_project_antipatterns() {
  echo ""
  echo "========================================="
  echo "React Native Project Validation"
  echo "========================================="
  echo ""

  local failed=0

  check_direct_state_mutation || failed=1
  check_console_logs || failed=1
  check_field_naming || failed=1
  check_platform_antipatterns || failed=1
  check_accessibility || failed=1
  check_list_optimization || failed=1
  check_hardcoded_styles || failed=1
  check_typescript || failed=1

  echo ""
  if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ All React Native validations passed${NC}"
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
