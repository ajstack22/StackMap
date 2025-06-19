# Issue: Add pre-deployment validation to prevent broken deployments

## Problem
Broken deployments reaching production due to:
- Missing critical files (404 errors)
- Syntax errors in JavaScript
- Low disk space
- No validation before deployment
- Manual testing often skipped

## Solution
Implement automated pre-deployment checks that fail the pipeline if issues detected.

## Implementation Details

### 1. Create Validation Script
`scripts/validate-deployment.sh`:
```bash
#!/bin/bash
set -e  # Exit on any error

echo "🔍 Running pre-deployment validation..."

# 1. Check disk space
echo "Checking disk space..."
DISK_USAGE=$(df /home/stachblx | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "❌ ERROR: Disk usage critical: ${DISK_USAGE}%"
    exit 1
fi
echo "✅ Disk space OK: ${DISK_USAGE}% used"

# 2. Verify critical files exist
echo "Checking critical files..."
CRITICAL_FILES=(
    "index.html"
    "sw.js"
    "manifest.json"
    "config/index.js"
    "styles/index.css"
    "app/StackMapApp.js"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ ERROR: Missing critical file: $file"
        exit 1
    fi
done
echo "✅ All critical files present"

# 3. Validate JavaScript syntax
echo "Checking JavaScript syntax..."
for js in $(find . -name "*.js" -not -path "./node_modules/*" -not -path "./tests/*"); do
    node -c "$js" 2>/dev/null || {
        echo "❌ ERROR: Syntax error in $js"
        exit 1
    }
done
echo "✅ JavaScript syntax valid"

# 4. Check service worker version
echo "Checking service worker..."
SW_VERSION=$(grep -o "SW_VERSION = '[^']*'" sw.js | cut -d"'" -f2)
if [ -z "$SW_VERSION" ]; then
    echo "❌ ERROR: No service worker version found"
    exit 1
fi
echo "✅ Service worker version: $SW_VERSION"

# 5. Validate .htaccess (if exists)
if [ -f ".htaccess" ]; then
    echo "Checking .htaccess..."
    # Basic syntax check
    if grep -q "RewriteEngine" .htaccess; then
        echo "✅ .htaccess appears valid"
    fi
fi

# 6. Check for console.log in production
echo "Checking for console.log..."
CONSOLE_COUNT=$(grep -r "console\.log" --include="*.js" --exclude-dir=node_modules --exclude-dir=tests | grep -v "^//" | wc -l)
if [ "$CONSOLE_COUNT" -gt 100 ]; then
    echo "⚠️  WARNING: $CONSOLE_COUNT console.log statements found"
fi

echo "✅ Pre-deployment validation complete!"
```

### 2. Add to GitHub Actions
```yaml
- name: Validate deployment
  run: bash scripts/validate-deployment.sh
  
- name: Test staging deployment
  run: |
    # Deploy to staging first
    # ... deployment steps ...
    
    # Test staging site
    response=$(curl -s -o /dev/null -w "%{http_code}" https://staging.stackmap.app)
    if [ "$response" -ne 200 ]; then
        echo "❌ Staging returned HTTP $response"
        exit 1
    fi
    
    # Test critical endpoints
    for path in "/" "/sw.js" "/manifest.json"; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "https://staging.stackmap.app$path")
        if [ "$response" -ne 200 ]; then
            echo "❌ Failed to load $path: HTTP $response"
            exit 1
        fi
    done
```

### 3. Post-deployment Health Check
```bash
#!/bin/bash
# health-check.sh

URL="${1:-https://stackmap.app}"
echo "🏥 Running health check for $URL..."

# Check main page
check_endpoint() {
    local path=$1
    local expected=$2
    response=$(curl -s -o /dev/null -w "%{http_code}" "$URL$path")
    if [ "$response" -ne "$expected" ]; then
        echo "❌ $path returned $response (expected $expected)"
        return 1
    fi
    echo "✅ $path OK"
    return 0
}

# Run checks
check_endpoint "/" 200
check_endpoint "/sw.js" 200
check_endpoint "/manifest.json" 200
check_endpoint "/config/index.js" 200
check_endpoint "/this-should-404" 404

# Check Material Icons loaded
if curl -s "$URL" | grep -q "material-icons"; then
    echo "✅ Material Icons reference found"
else
    echo "⚠️  Material Icons might not be loading"
fi

echo "🏥 Health check complete!"
```

## Benefits
- Catch errors before production
- Prevent 404 errors
- Ensure disk space available
- Validate syntax automatically
- Quick feedback on issues

## Testing Plan
1. Test validation script locally
2. Intentionally break a file to test detection
3. Test with low disk space warning
4. Verify staging checks work
5. Test health check endpoints

## Success Criteria
- [ ] Validation runs in <30 seconds
- [ ] Catches missing files
- [ ] Detects syntax errors
- [ ] Checks disk space
- [ ] Staging deployment tested
- [ ] Clear error messages

## References
- Research: [CICD_research.md lines 373-404]
- Production 404 errors incident
- Material Icons loading failures