# StackMap Testing Protocol

## Testing Philosophy

"Start with the test, then fix the bug" - This ensures we never regress on fixed issues.

## Test-Driven Bug Fix Process

1. **Reproduce the bug** in a test FIRST
2. **Watch the test fail** to confirm it catches the issue
3. **Fix the bug** in the source code
4. **Watch the test pass** to confirm the fix
5. **Add the test** to the appropriate suite
6. **Document** the fix and test

## Running Tests

### Quick Commands
```bash
# Browser (best for development)
open tests/test-runner.html

# Command line
npm test

# Pre-deployment validation
./scripts/pre-deploy-check.sh
```

## Critical Testing Knowledge

### 1. CSS Selectors Are Everything
The #1 cause of test failures is wrong selectors. ALWAYS verify in DevTools first.

Common mistakes:
- `.activity-card` → Actually `.card`
- `.modal` → Actually `.modal-overlay`
- `#app` → Actually `#mainContainer`

### 2. Timing Is Critical
JavaScript animations must complete before assertions.

Standard wait times:
```javascript
await this.wait(300);   // Panel animations
await this.wait(500);   // Modal transitions  
await this.wait(1000);  // FAB animations
await this.wait(1500);  // Complex state changes
```

### 3. Clean State Between Tests
```javascript
async ensureCleanState() {
    // Close all panels
    // Exit edit mode
    // Clear any modals
    // Reset to baseline
}
```

### 4. The Global App Instance
```javascript
window.appInstance  // NOT window.app
window.appInstance.grownupMode  // Edit mode state
window.appInstance.appState  // State manager
```

## Test Structure Pattern

```javascript
class FeatureUAT {
    constructor() {
        // Setup app window/document references
        // Handle iframe context
    }
    
    async runTests() {
        // 1. Clear browser state
        await this.clearBrowserState();
        
        // 2. Handle welcome screens
        await this.handleWelcomeScreen();
        
        // 3. Run each test
        await this.testFeatureOne();
        await this.testFeatureTwo();
        
        // 4. Report results
        this.reportResults();
    }
    
    async testFeatureOne() {
        this.startTest('Feature One');
        
        try {
            await this.ensureCleanState();
            
            // Test logic here
            this.assert(condition, 'Descriptive failure message');
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }
}
```

## Common Patterns

### Opening Settings Panel
```javascript
async openSettingsPanel() {
    const settingsButton = Array.from(this.appDocument.querySelectorAll('.material-icons'))
        .find(el => el.textContent === 'settings')?.parentElement;
    
    if (settingsButton) {
        settingsButton.click();
        await this.wait(300);
        return true;
    }
    return false;
}
```

### Handling Validation Modal
```javascript
async handleValidationModal() {
    const modal = this.appDocument.querySelector('.modal-overlay');
    if (modal && modal.style.display !== 'none') {
        const input = this.appDocument.querySelector('#validationInput');
        if (input) {
            input.value = 'A';  // Backdoor code
            input.dispatchEvent(new Event('input'));
            // Click submit...
        }
    }
}
```

### Finding Visible Elements
```javascript
// Don't just check existence, check visibility
const cards = this.appDocument.querySelectorAll('.card');
let visibleCard = null;

for (let card of cards) {
    const rect = card.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        visibleCard = card;
        break;
    }
}
```

## Debugging Failed Tests

### 1. Add Debug Output
```javascript
if (!element) {
    console.log('Debug - Element not found');
    console.log('Debug - Body classes:', document.body.className);
    console.log('Debug - Available elements:', document.querySelectorAll('[class*="card"]').length);
}
```

### 2. Use Browser Test Runner
- Open DevTools while tests run
- Set breakpoints in test code
- Inspect DOM state at failure point

### 3. Check Animation States
Many failures are timing-related. Try:
- Increasing wait times
- Checking CSS transition durations
- Looking for `isAnimating` flags

### 4. Verify Feature Implementation
Some features may not exist. Always:
- Check if element exists before testing
- Skip gracefully if not implemented
- Log informative messages

## Adding New Tests

### 1. Create Test File
`tests/uat-[feature].js`

### 2. Add to Test Runner
Update `test-runner.html`:
```html
<option value="feature">Feature Tests</option>
```

### 3. Implement Test Class
Follow the pattern above

### 4. Update Automation
Add to `run-tests.js` if needed

## Best Practices

1. **Test user actions, not code**
   - "User can toggle edit mode" ✓
   - "grownupMode variable changes" ✗

2. **Make assertions descriptive**
   ```javascript
   // Bad
   this.assert(cards.length > 0, 'Cards exist');
   
   // Good  
   this.assert(cards.length > 0, `Expected cards to be visible, found ${cards.length}`);
   ```

3. **Handle all states**
   - Feature exists/doesn't exist
   - Animation in progress
   - Modal interruptions
   - Network delays

4. **Document workarounds**
   ```javascript
   // FAB doesn't respond to second click due to animation lock
   // Workaround: Wait 500ms after expand before attempting close
   await this.wait(500);
   ```

## Performance Tips

1. **Batch similar operations**
2. **Reuse element references carefully** (can go stale)
3. **Use minimum necessary wait times**
4. **Run tests in parallel when possible**

## Validation Modal Backdoor

For testing purposes, entering 'A' as the answer to any validation question will bypass it. This is implemented in:
- `HybridPanelManager.js` line 1313
- Allows automated testing of edit mode features

## Remember

- **False positives are worse than no tests**
- **Start simple, expand coverage gradually**
- **Every bug fix needs a test**
- **Tests are documentation**
- **Debug output is temporary** (remove before commit)

When in doubt, open the browser test runner and watch what actually happens!