# StackMap Testing Framework

## Overview
This framework integrates story-based testing with our deployment workflow, ensuring every feature is tested before going live.

## Test Story Structure

Each feature/bug fix requires a corresponding test story:

```javascript
// tests/stories/sync-authentication.story.js
module.exports = {
  title: 'User can authenticate with Google Drive',
  priority: 'critical',
  tags: ['sync', 'authentication'],
  
  scenarios: [
    {
      given: 'User is on the settings page',
      when: 'User clicks the sync toggle',
      then: 'Google sign-in should appear without errors',
      test: async (page) => {
        await page.click('[data-test="settings-button"]');
        await page.click('[data-test="sync-toggle"]');
        
        // Should not have console errors
        const errors = await page.evaluate(() => window.__errors || []);
        expect(errors).not.toContain('authenticate is not a function');
      }
    }
  ]
};
```

## Test Categories

### 1. Critical Path Tests (Block Deployment)
- User authentication
- Data persistence
- Core CRUD operations
- Sync functionality

### 2. Feature Tests (Warning Only)
- UI interactions
- Visual consistency
- Performance metrics

### 3. Regression Tests
- Previously fixed bugs
- Edge cases

## Integration Points

### Pre-Commit Hook
```bash
# .githooks/pre-commit
echo "🧪 Running critical tests..."
npm run test:critical || {
  echo "❌ Critical tests failed! Commit blocked."
  exit 1
}
```

### Pre-Push Hook
```bash
# .githooks/pre-push
echo "🧪 Running full test suite..."
npm run test:all || {
  echo "❌ Tests failed! Push blocked."
  echo "Run 'npm run test:report' for details"
  exit 1
}
```

## Writing Tests

### 1. Create the Story
```javascript
// tests/stories/feature-name.story.js
module.exports = {
  title: 'Clear description of what user can do',
  issue: '#123', // GitHub issue number
  priority: 'critical|high|medium|low',
  
  scenarios: [
    {
      given: 'Initial state',
      when: 'User action',
      then: 'Expected result',
      test: async (page) => {
        // Puppeteer test code
      }
    }
  ]
};
```

### 2. Add Test Data
```javascript
// tests/fixtures/feature-name.fixture.js
module.exports = {
  validUser: {
    name: 'Test User',
    icon: '👤'
  },
  invalidUser: {
    name: '', // Should fail validation
    icon: '👤'
  }
};
```

### 3. Run Tests
```bash
# Run specific story
npm run test:story sync-authentication

# Run all critical tests
npm run test:critical

# Run with visual debugging
npm run test:debug sync-authentication

# Generate report
npm run test:report
```

## Test Report Format

```markdown
# Test Report - 2024-01-18

## Summary
- Total Stories: 25
- Passed: 23
- Failed: 2
- Coverage: 92%

## Failed Stories
### ❌ User can authenticate with Google Drive
- Error: authenticate is not a function
- File: HybridPanelManager.js:4368
- [View Details](#auth-error)

## Deployment Decision
❌ BLOCKED - Critical tests failing
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results/
```

## Test Commands

```json
// package.json
{
  "scripts": {
    "test": "node tests/run-tests.js",
    "test:critical": "node tests/run-tests.js --critical-only",
    "test:story": "node tests/run-story.js",
    "test:debug": "node tests/run-tests.js --debug",
    "test:report": "node tests/generate-report.js",
    "test:ci": "node tests/run-tests-ci.js"
  }
}
```

## Best Practices

1. **One Story Per Feature/Bug**
   - Each issue should have a corresponding test story
   - Stories should be self-contained

2. **Use Data Attributes**
   ```html
   <button data-test="save-user">Save</button>
   ```

3. **Test User Journeys**
   - Focus on what users do, not implementation
   - Test the happy path and error cases

4. **Keep Tests Fast**
   - Mock external services
   - Use test data fixtures
   - Parallelize where possible

5. **Clear Failure Messages**
   ```javascript
   expect(syncButton).toBeVisible(
     'Sync button should be visible in grown-up mode'
   );
   ```