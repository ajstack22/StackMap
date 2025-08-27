#!/bin/bash

# Script to find potentially undefined method calls in the codebase
# This helps prevent runtime errors like syncService.pull() that doesn't exist

echo "🔍 Method Call Validator"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create temp directory for analysis
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Services and utilities to check
SERVICES=(
  "syncService:src/services/sync/syncService.js"
  "encryptionService:src/services/sync/encryptionService.js"
  "dataValidator:src/services/sync/dataValidator.js"
  "conflictResolver:src/services/sync/conflictResolver.js"
  "syncQueue:src/services/sync/syncQueue.js"
  "networkMonitor:src/services/sync/networkMonitor.js"
  "changeTracker:src/services/sync/changeTracker.js"
  "syncThrottle:src/services/sync/syncThrottle.js"
  "syncHistory:src/services/sync/syncHistory.js"
  "dataNormalizer:src/utils/dataNormalizer.js"
  "useAppStore:src/stores/useAppStore.js"
)

echo "Step 1: Extracting method definitions..."
echo "-----------------------------------------"

# Extract methods from each service
for service_path in "${SERVICES[@]}"; do
  IFS=':' read -r service_name file_path <<< "$service_path"
  
  if [ -f "$file_path" ]; then
    echo "Analyzing $service_name..."
    
    # Extract method definitions (handles various patterns)
    # Pattern 1: Class methods - async methodName() or methodName()
    grep -E '^\s*(async\s+)?[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{' "$file_path" | \
      sed -E 's/^\s*(async\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(.*/\2/' > "$TEMP_DIR/${service_name}_methods.txt"
    
    # Pattern 2: Arrow functions assigned to properties - methodName: async () => or methodName: () =>
    grep -E '^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:\s*(async\s*)?\([^)]*\)\s*=>' "$file_path" | \
      sed -E 's/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:.*/\1/' >> "$TEMP_DIR/${service_name}_methods.txt"
    
    # Pattern 3: Property functions - methodName: function()
    grep -E '^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:\s*function\s*\(' "$file_path" | \
      sed -E 's/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:.*/\1/' >> "$TEMP_DIR/${service_name}_methods.txt"
    
    # Pattern 4: Exported functions - export function methodName() or export async function
    grep -E '^export\s+(async\s+)?function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(' "$file_path" | \
      sed -E 's/^export\s+(async\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(.*/\2/' >> "$TEMP_DIR/${service_name}_methods.txt"
    
    # Remove duplicates and sort
    sort -u "$TEMP_DIR/${service_name}_methods.txt" -o "$TEMP_DIR/${service_name}_methods.txt"
    
    method_count=$(wc -l < "$TEMP_DIR/${service_name}_methods.txt")
    echo "  Found $method_count methods in $service_name"
  else
    echo -e "${YELLOW}  Warning: $file_path not found${NC}"
  fi
done

echo ""
echo "Step 2: Finding method calls in codebase..."
echo "--------------------------------------------"

# Find all calls to each service
for service_path in "${SERVICES[@]}"; do
  IFS=':' read -r service_name file_path <<< "$service_path"
  
  if [ -f "$TEMP_DIR/${service_name}_methods.txt" ]; then
    echo "Checking calls to $service_name..."
    
    # Find all calls to this service (serviceName.methodName())
    grep -r "${service_name}\.[a-zA-Z_][a-zA-Z0-9_]*\s*(" src/ --include="*.js" --include="*.jsx" | \
      sed -E "s/.*${service_name}\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(.*/\1/" | \
      sort -u > "$TEMP_DIR/${service_name}_calls.txt"
    
    call_count=$(wc -l < "$TEMP_DIR/${service_name}_calls.txt")
    echo "  Found $call_count unique method calls to $service_name"
  fi
done

echo ""
echo "Step 3: Identifying undefined method calls..."
echo "----------------------------------------------"

TOTAL_ISSUES=0

for service_path in "${SERVICES[@]}"; do
  IFS=':' read -r service_name file_path <<< "$service_path"
  
  if [ -f "$TEMP_DIR/${service_name}_methods.txt" ] && [ -f "$TEMP_DIR/${service_name}_calls.txt" ]; then
    # Find calls that don't have corresponding methods
    undefined_methods=$(comm -13 "$TEMP_DIR/${service_name}_methods.txt" "$TEMP_DIR/${service_name}_calls.txt")
    
    if [ ! -z "$undefined_methods" ]; then
      echo -e "${RED}❌ Found undefined methods in $service_name:${NC}"
      while IFS= read -r method; do
        echo -e "   ${RED}• ${service_name}.${method}()${NC}"
        
        # Show where it's called from
        echo "     Called from:"
        grep -rn "${service_name}\.${method}\s*(" src/ --include="*.js" --include="*.jsx" | \
          head -3 | \
          while IFS= read -r line; do
            echo "       $line" | cut -c1-100
          done
        
        ((TOTAL_ISSUES++))
      done <<< "$undefined_methods"
      echo ""
    fi
  fi
done

echo ""
echo "Step 4: Summary"
echo "---------------"

if [ $TOTAL_ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ No undefined method calls found!${NC}"
else
  echo -e "${RED}❌ Found $TOTAL_ISSUES undefined method call(s)${NC}"
  echo ""
  echo "These undefined methods will cause runtime errors when called."
  echo "Please fix them before they reach production!"
fi

echo ""
echo "Step 5: Additional Checks"
echo "-------------------------"

# Check for common typos
echo "Checking for common typos..."

TYPOS=(
  "lenght:length"
  "heigth:height"
  "widht:width"
  "cancle:cancel"
  "recieve:receive"
  "occured:occurred"
)

for typo_pair in "${TYPOS[@]}"; do
  IFS=':' read -r typo correct <<< "$typo_pair"
  
  count=$(grep -r "\b${typo}\b" src/ --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
  if [ $count -gt 0 ]; then
    echo -e "${YELLOW}  ⚠️  Found '$typo' (should be '$correct') in $count location(s)${NC}"
  fi
done

echo ""
echo "Done! 🎉"