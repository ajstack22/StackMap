# Story-Based Testing Guide for StackMap

## Overview

Our story-based testing framework ensures every feature works correctly before deployment. Tests are written as user stories using BDD (Behavior-Driven Development) format.

## Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run only critical tests (blocks commits)
npm run test:critical

# Run with visual debugging
npm run test:debug

# Run specific story
npm run test:story -- --story sync-authentication
```

### Writing a New Test

1. Copy the template:
```bash
cp tests/stories/STORY_TEMPLATE.js tests/stories/my-feature.story.js
```

2. Write your story:
```javascript
module.exports = {
    title: 'User can add a new activity',
    issue: '#123',
    priority: 'critical',
    
    scenarios: [{
        given: 'User is on the main page',
        when: 'User clicks New Activity',
        then: 'Activity form should appear',
        test: async (page) => {
            // Your Puppeteer test code
        }
    }]
};
```

## Testing Drive Sync with Mocks

For features that depend on external APIs like Google Drive, we use mocks:

```javascript
const GoogleDriveMock = require('../mocks/google-drive-mock');

module.exports = {
    title: 'Drive sync handles offline gracefully',
    setup: async (page) => {
        const mock = new GoogleDriveMock();
        await mock.inject(page);
    },
    
    scenarios: [{
        given: 'User is offline',
        when: 'User makes changes',
        then: 'Changes queue for later sync',
        test: async (page) => {
            // Simulate offline
            await page.evaluate(() => {
                window.__driveMock.setResponseSuccess(false);
            });
            
            // Test offline behavior
        }
    }]
};
```

## Test Priorities

- **Critical**: Blocks commits and deployments
  - Authentication flows
  - Data persistence
  - Core CRUD operations
  - Sync functionality

- **High**: Important but doesn't block
  - UI responsiveness
  - Error handling
  - Performance

- **Medium/Low**: Nice to have
  - Visual polish
  - Edge cases

## Integration with Development Workflow

### Pre-Commit Hook
Critical tests run automatically before every commit. If they fail, the commit is blocked.

### GitHub Actions
All tests run on push and PR. Critical failures block merge.

### Deployment Checklist
Test results are included in deployment decisions.

## Best Practices

1. **Test User Journeys**: Focus on what users do, not implementation details

2. **Use Data Attributes**: Add `data-test` attributes for reliable selectors
   ```html
   <button data-test="save-activity">Save</button>
   ```

3. **Mock External Dependencies**: Use mocks for APIs to ensure consistent tests

4. **Keep Tests Fast**: 
   - Mock network calls
   - Use test data fixtures
   - Avoid unnecessary waits

5. **Clear Error Messages**:
   ```javascript
   if (columns !== 3) {
       throw new Error(`Expected 3 columns but found ${columns}`);
   }
   ```

## Common Patterns

### Testing Panel Navigation
```javascript
// Open settings
await page.click('.floating-nav--right .fab');
await page.waitForSelector('.side-panel--open');

// Find and click menu item
await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.menu-item'));
    const settings = items.find(i => i.textContent.includes('Settings'));
    settings?.click();
});
```

### Testing Form Submission
```javascript
// Fill form
await page.type('#activityName', 'Test Activity');
await page.click('.emoji-option');

// Submit
await page.click('.primary-button');

// Verify success
await page.waitForSelector('.toast--success');
```

### Testing Error States
```javascript
// Trigger error
await page.evaluate(() => {
    window.__driveMock.setResponseSuccess(false);
});

// Attempt action
await page.click('#syncButton');

// Verify error handling
const errorMsg = await page.$('.error-message');
expect(errorMsg).toBeTruthy();
```

## Debugging Failed Tests

1. **Run with --debug flag**: Opens browser with DevTools
   ```bash
   npm run test:debug
   ```

2. **Check test report**: 
   ```bash
   cat test-results/story-report.json | jq
   ```

3. **Add console logs**:
   ```javascript
   page.on('console', msg => console.log('PAGE:', msg.text()));
   ```

4. **Take screenshots**:
   ```javascript
   await page.screenshot({ path: 'debug.png' });
   ```

## Adding to CI/CD

The framework integrates with:
- Pre-commit hooks (blocks on critical failures)
- GitHub Actions (runs all tests)
- Deployment checklist (includes test summary)

Tests ensure code quality and prevent regressions while keeping development velocity high.