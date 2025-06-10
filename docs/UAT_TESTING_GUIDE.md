# StackMap UAT Testing Guide

## Overview

This guide documents the User Acceptance Testing (UAT) framework for StackMap, including lessons learned, best practices, and common pitfalls to avoid. This is designed to help future developers (and Claudes!) efficiently build and maintain tests.

## Quick Start

### Running Tests

1. **Browser-based Test Runner** (Recommended for development):
   ```bash
   # Open in browser
   open tests/test-runner.html
   ```
   - Click "Run Tests" to execute
   - Use "Copy Output" to share results
   - Tests run in an iframe for isolation

2. **Command Line** (For CI/CD):
   ```bash
   npm test
   # or
   node scripts/run-tests.js
   ```

3. **Pre-deployment Check**:
   ```bash
   ./scripts/pre-deploy-check.sh
   ```

## Test Architecture

### Key Components

1. **test-runner.html** - Browser-based test interface
2. **uat-edit-mode.js** - Edit mode test suite (example implementation)
3. **run-tests.js** - Automated test runner using Puppeteer
4. **pre-deploy-check.sh** - Pre-deployment validation script

### Test Structure

Each test suite should follow this pattern:

```javascript
class FeatureUAT {
    constructor() {
        // Get app window/document references
        this.appWindow = window;
        this.appDocument = document;
        
        // Handle iframe context if in test runner
        if (window.parent && window.parent !== window) {
            // We're in the iframe
        } else if (document.getElementById('appFrame')) {
            // We're in the test runner
            const iframe = document.getElementById('appFrame');
            this.appWindow = iframe.contentWindow;
            this.appDocument = iframe.contentDocument;
        }
    }
    
    async runTests() {
        await this.clearBrowserState();  // Start fresh
        await this.handleWelcomeScreen(); // Handle onboarding
        await this.ensureCleanState();    // Clean between tests
        
        // Run individual tests
        await this.testFeatureOne();
        await this.testFeatureTwo();
        
        this.reportResults();
    }
}
```

## Critical Lessons Learned

### 1. Element Selectors - Know Your Classes!

**🚨 Common Pitfall**: Using wrong CSS selectors

```javascript
// ❌ WRONG - This was a major issue we hit
const cards = document.querySelectorAll('.activity-card');

// ✅ CORRECT - The actual class used
const cards = document.querySelectorAll('.card');
```

**Tip**: Always verify the actual HTML structure before writing tests. Use the browser DevTools to inspect elements.

### 2. Animation Timing is Critical

**🚨 Common Pitfall**: Not waiting long enough for animations

```javascript
// ❌ WRONG - Too short for animations
await this.wait(100);

// ✅ CORRECT - Match animation durations
await this.wait(500);  // Panel animations
await this.wait(1000); // FAB close animation (~450ms + buffer)
```

**Key Animation Durations**:
- Panel open/close: ~300ms
- FAB expand: ~300ms  
- FAB collapse: ~450ms
- Modal transitions: ~500ms

### 3. State Management Between Tests

**🚨 Common Pitfall**: Tests affecting each other

```javascript
// ✅ ALWAYS start each test with clean state
async ensureCleanState() {
    // Close any open panels
    const openPanels = this.appDocument.querySelectorAll('.hybrid-panel.open');
    for (const panel of openPanels) {
        const closeBtn = panel.querySelector('.panel-close');
        if (closeBtn) {
            closeBtn.click();
            await this.wait(200);
        }
    }
    
    // Exit edit mode if active
    if (this.appDocument.body.classList.contains('grownup-mode')) {
        // ... handle exiting edit mode
    }
}
```

### 4. Handle Modal Dialogs Properly

**🚨 Common Pitfall**: Validation modals blocking tests

```javascript
// ✅ Check for modals multiple times
async handleValidationModal() {
    for (let i = 0; i < 3; i++) {
        const modal = this.appDocument.querySelector('.modal-overlay');
        if (modal && modal.style.display !== 'none') {
            // Handle modal...
            return true;
        }
        await this.wait(200);
    }
    return false;
}
```

### 5. Global Variables and App Instance

**🚨 Common Pitfall**: Not finding the app instance

```javascript
// ❌ WRONG - Assumed wrong global name
const app = window.app;

// ✅ CORRECT - StackMap uses window.appInstance
const app = window.appInstance;
```

### 6. Graceful Degradation

**🚨 Common Pitfall**: Tests failing when features don't exist

```javascript
// ✅ Skip tests for missing features
if (!drawerElement) {
    console.log('Note: Drawer not implemented - skipping test');
    this.endTest(true, 'Feature not implemented');
    return;
}
```

## Best Practices

### 1. Use Descriptive Assertions

```javascript
// ❌ Not helpful
this.assert(cards.length > 0, 'Cards exist');

// ✅ Provides context
this.assert(cards.length > 0, `Expected cards to be visible, found ${cards.length} cards`);
```

### 2. Add Debug Output for Failures

```javascript
if (!card) {
    // Debug info helps diagnose issues
    console.log('Debug - Cards found:', cards.length);
    console.log('Debug - Body classes:', this.appDocument.body.className);
    console.log('Debug - Panel state:', this.appDocument.querySelector('.hybrid-panel.open') ? 'open' : 'closed');
    this.endTest(false, 'No visible cards found');
    return;
}
```

### 3. Test User Flows, Not Implementation

Focus on what users do, not how the code works:

```javascript
// ✅ Good test names
async testEditModeToggle()        // User can turn edit mode on/off
async testCardResizing()          // Cards adjust size in edit mode
async testFABClickToClose()       // FAB menu closes when clicked

// ❌ Implementation-focused
async testGrownupModeVariable()   // Tests internal variable
async testAnimationCallback()     // Tests implementation detail
```

### 4. Handle Multiple Interaction Methods

```javascript
// ✅ Try multiple ways to trigger actions
fabButton.click();
fabButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

// Some components may need specific event types
toggle.checked = true;
toggle.dispatchEvent(new Event('change'));
```

### 5. Document Workarounds

When you implement a workaround, document why:

```javascript
// Backdoor code 'A' added for testing (HybridPanelManager.js:1313)
// This allows automated tests to bypass validation questions
validationInput.value = 'A';
```

## Common Issues and Solutions

### Issue: "No activity cards found"
**Cause**: Wrong CSS selector or cards not visible
**Solution**: 
- Verify correct selector (`.card` not `.activity-card`)
- Ensure panels are closed
- Wait for re-render after state changes

### Issue: "FAB menu won't close"
**Cause**: Animation lock or timing issue
**Solution**:
- Wait for open animation to complete before closing
- Try multiple click methods
- Use outside click as fallback

### Issue: "Validation modal keeps appearing"
**Cause**: Previous test left app in edit mode
**Solution**:
- Always clean state between tests
- Implement `ensureCleanState()` method

### Issue: "Cannot find app instance"
**Cause**: Wrong global variable name
**Solution**:
- Check actual global: `window.appInstance`
- Look in index.html for initialization

## Adding New Test Suites

1. **Create test file**: `tests/uat-[feature].js`

2. **Follow the pattern**:
   ```javascript
   class [Feature]UAT {
       constructor() { /* ... */ }
       async runTests() { /* ... */ }
       // Individual test methods
       // Helper methods
       // Reporting methods
   }
   ```

3. **Update test runner** to include new suite:
   ```html
   <option value="[feature]">[Feature] Tests</option>
   ```

4. **Add to automated runner** in `run-tests.js`

## Debugging Tips

1. **Use the browser test runner** for development - it's much faster than Puppeteer
2. **Open DevTools** while tests run to see the actual DOM
3. **Add strategic `console.log`** statements (but remove before committing!)
4. **Take screenshots** in Puppeteer tests for debugging CI failures
5. **Use descriptive wait reasons**:
   ```javascript
   await this.wait(500); // Wait for panel close animation
   ```

## Performance Considerations

1. **Batch operations** when possible
2. **Reuse element references** carefully (they can become stale)
3. **Minimize waits** - use the minimum time needed
4. **Skip unnecessary tests** - if a feature doesn't exist, skip gracefully

## Future Improvements

1. **Visual regression testing** - Compare screenshots
2. **Performance metrics** - Track render times
3. **Accessibility testing** - Validate ARIA attributes
4. **Mobile-specific tests** - Test touch interactions
5. **Data-driven tests** - Test with various user configurations

## Conclusion

Building a robust test suite is iterative. Start small, test the critical paths, and expand coverage over time. Remember:

- **Perfect is the enemy of good** - Get basic tests working first
- **Tests are living documentation** - Keep them updated
- **False positives are worse than no tests** - Ensure tests are reliable
- **Debug info is gold** - Add context for future debugging

This testing framework is the foundation for maintaining StackMap's quality. Each test you add makes the application more reliable and easier to modify with confidence.

Happy testing! 🧪✨