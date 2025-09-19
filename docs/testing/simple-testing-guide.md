# Simple Testing Guide for StackMap
**Last Updated:** 2025-08-14

## Philosophy: Test What Actually Breaks

We don't do complex testing. We do **smoke tests** - simple checks that catch real problems before deployment.

## How It Works

### Automatic Testing
Every deployment automatically runs essential tests:
```bash
./scripts/qual_deploy.sh or prod_deploy.sh  # Tests run automatically
```

### Skip Tests (Emergency Deploy)
```bash
./scripts/qual_deploy.sh or prod_deploy.sh --skip-tests  # Bypass tests when needed
```

## What We Test

### 1. App Structure
- ✅ App.js exists
- ✅ Has React import
- ✅ Has default export

### 2. Critical Services
- ✅ syncService.js exists
- ✅ useAppStore.js exists

### 3. Common Issues (Warnings Only)
- ⚠️ Too many console.logs (>100)
- ℹ️ TODO comments in code

## Why This Works

1. **Only 3 tests** - You understand all of them
2. **Tests real problems** - Not theoretical edge cases
3. **Blocks bad deploys** - But can skip in emergency
4. **No complexity** - Just bash file checks
5. **No maintenance** - Tests rarely need updating

## Adding New Tests

Only add a test if you've been burned by something multiple times.

Example: If bundle size keeps breaking the app, add:
```bash
# In qual_deploy.sh or prod_deploy.sh, add to test section:
if [ -f "bundle.js" ]; then
    BUNDLE_SIZE=$(stat -f%z bundle.js)
    if [ $BUNDLE_SIZE -gt 4194304 ]; then  # 4MB
        echo "❌ Bundle too large!"
        exit 1
    fi
fi
```

## What We DON'T Test

❌ Unit tests for every function
❌ Mocking dependencies
❌ Coverage metrics
❌ Complex E2E automation
❌ TDD methodology

These are great for big teams but add friction for solo developers.

## Emergency Procedures

### When Tests Fail
1. Read the error - it's usually obvious
2. Fix the issue (missing file, bad import)
3. Re-run deployment

### When You Need to Deploy NOW
```bash
./scripts/qual_deploy.sh or prod_deploy.sh --skip-tests
```
Use sparingly - tests exist for a reason.

## Future: Visual Testing

When ready, add screenshot testing:
```bash
# Take screenshots of key screens
xcrun simctl io booted screenshot tests/ios-home.png
# Manually review before release
open tests/
```

## Remember

> "Perfect is the enemy of good. Simple tests that run are better than complex tests that don't."

The goal is confidence, not perfection. These tests give you a safety net without slowing you down.