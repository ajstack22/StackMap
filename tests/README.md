# StackMap Testing Framework

## Overview
This directory contains StackMap's comprehensive testing framework that includes:
- Story-based test requirements
- Unit and integration tests
- Pre-commit/pre-push validation
- CI/CD integration

## Test Structure

### Story-Based Tests (`/stories`)
User story driven tests that validate complete features from the user's perspective.

**Creating a new story test:**
1. Copy `story-template.md` to define the story
2. Create test file: `stories/story-XXX-feature-name.js`
3. Extend `StoryTestBase` class
4. Implement scenarios matching acceptance criteria

**Example:**
```javascript
class MyStoryTest extends StoryTestBase {
    constructor() {
        super('STORY-002', 'My Feature Story');
    }
    
    async runStory() {
        this.startScenario('Happy Path', [
            { description: 'User can do X', met: false },
            { description: 'System shows Y', met: false }
        ]);
        
        await this.step('Do action X', async () => {
            // Test implementation
            this.assert(condition, 'X completed', 0);
        });
        
        this.endScenario();
    }
}
```

### Integration Tests (`uat-*.js`)
Existing UAT tests that validate specific features:
- `uat-edit-mode-updated.js` - Edit mode functionality
- `uat-import-export-data.js` - Data import/export
- `uat-ui-timing.js` - UI performance
- `uat-drive-sync.js` - Google Drive sync

### Running Tests

**Local Development:**
```bash
# Run all tests
npm test

# Run enhanced test runner
node tests/test-runner-enhanced.js

# Run in browser (full UAT)
open tests/test-runner.html
```

**Git Hooks:**
- **Pre-commit**: Automatically runs tests, blocks commit on failure
- **Pre-push**: Full validation including deployment readiness

**CI/CD:**
Tests run automatically on:
- Push to main/develop branches
- Pull requests
- GitHub Actions workflow

## Test Reports

Reports are generated in `tests/reports/`:
- `latest.json` - Most recent test run
- `test-report-[timestamp].json` - Historical reports
- `push-validation-[timestamp].json` - Pre-push validation reports

**Report Structure:**
```json
{
  "timestamp": "2024-01-20T10:30:00Z",
  "summary": {
    "total": 25,
    "passed": 24,
    "failed": 1,
    "skipped": 0
  },
  "stories": [...],
  "unit": [...],
  "integration": [...]
}
```

## Writing Tests

### Best Practices
1. **Use Story Format**: Define user stories with clear acceptance criteria
2. **Test User Flows**: Focus on complete user interactions, not just functions
3. **Clean State**: Always start with clean browser state
4. **Handle UI**: Account for splash screens and initial setup
5. **Meaningful Assertions**: Use descriptive messages for debugging

### Common Helpers
```javascript
// Navigation
await this.enterEditMode();
await this.exitEditMode();
await this.openSettings();
await this.closeSettings();

// Waiting
await this.wait(500);
await this.waitFor(condition, timeout);
await this.waitForElement(selector);

// Assertions
this.assert(condition, message);
this.assert(condition, message, acceptanceCriteriaIndex);

// Test Flow
this.startScenario(name, acceptanceCriteria);
await this.step(description, action);
this.endScenario();
```

## Blocking Commits/Deployments

### Pre-commit Hook
Located at `.githooks/pre-commit`:
- Runs test suite automatically
- Blocks commit if tests fail
- Shows test summary

### Pre-push Hook  
Located at `.githooks/pre-push`:
- Full test validation
- Code quality checks
- Service worker version check
- Deployment readiness report

### GitHub Actions
Workflow at `.github/workflows/test-and-validate.yml`:
- Runs on push/PR
- Uploads test artifacts
- Comments on PRs with results
- Validates deployment readiness

## Debugging Failed Tests

1. **Check Reports**: Look at `tests/reports/latest.json`
2. **Run Locally**: Use `npm test` to reproduce
3. **Browser Tests**: Open `test-runner.html` for visual debugging
4. **Console Logs**: Tests output detailed step information
5. **Scenarios**: Failed scenarios show which acceptance criteria weren't met

## Adding New Tests

1. **Story Test**:
   ```bash
   # Create story definition
   cp tests/story-template.md tests/stories/story-XXX-description.md
   
   # Create test implementation
   touch tests/stories/story-XXX-feature.js
   ```

2. **Integration Test**:
   ```bash
   # Add to existing UAT file or create new
   touch tests/uat-new-feature.js
   ```

3. **Update Runner**:
   - Add test file to `test-runner-enhanced.js` if needed
   - Ensure test is included in appropriate category

## Maintenance

- **Update Dependencies**: Keep test framework current
- **Review Failed Tests**: Don't ignore intermittent failures
- **Clean Reports**: Periodically clean old reports from `tests/reports/`
- **Story Updates**: Keep stories aligned with product changes