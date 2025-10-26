---
name: atlas-standard
description: Standard 5-phase workflow for most development tasks - bugs, small features, refactors (30-60 min)
---

# Atlas Standard Workflow

## When to Use This Skill

**Perfect for (80% of tasks):**
- Bug fixes (2-5 files affected)
- Small features (clear requirements)
- Code refactoring
- Test additions
- Logic changes with moderate complexity

**Time estimate**: 30-60 minutes

**Success criteria**:
- Feature complete in < 2 hours
- All edge cases covered
- Tests pass
- Peer review approved

## The 5 Phases

```
Phase 1: Research      → Understand current implementation
Phase 2: Plan          → Design approach
Phase 3: Implement     → Make changes + tests
Phase 4: Review        → Edge cases + security
Phase 5: Deploy        → Full test suite + deployment
```

---

## Phase 1: Research

**Goal**: Understand the current implementation and identify all affected files.

### Steps:

1. **Find all related files**
   ```bash
   # Search for relevant code patterns
   grep -r "featureName" src/
   grep -r "ComponentName" src/

   # Find component/function usage
   grep -r "import.*ComponentName" src/
   ```

2. **Understand current implementation**
   - Read the main file(s) involved
   - Trace data flow
   - Identify dependencies
   - Note platform-specific code (if multi-platform)

3. **Check for existing patterns**
   - Look for similar implementations
   - Identify coding patterns to follow
   - Review related tests

4. **Identify potential impacts**
   - Which components use this code?
   - Are there platform-specific considerations?
   - What tests cover this area?

### Output:
- List of files to modify
- Understanding of current implementation
- Potential risks identified

### Research Checklist:

**For data/state changes:**
- [ ] Which state management system? (Redux, Zustand, Context, etc.)
- [ ] Which update pattern to use?
- [ ] Are there naming conventions to follow?
- [ ] Check for data normalization utilities

**For UI changes:**
- [ ] Platform-specific files? (if multi-platform)
- [ ] Component library conventions?
- [ ] Accessibility requirements?
- [ ] Design system rules?

**For API/integration changes:**
- [ ] Check authentication patterns
- [ ] Error handling conventions
- [ ] Data validation requirements

### Example Research Output:
```
Files to modify:
- /src/services/api/userService.js (main API logic)
- /src/store/userStore.js (state updates)
- /src/utils/validation.js (data validation)

Current implementation:
- API calls use fetch with manual error handling
- State updates use direct mutations
- No data validation on responses

Risks:
- Must preserve backward compatibility with existing API consumers
- Need to handle edge cases for malformed responses
```

---

## Phase 2: Plan

**Goal**: Design the approach and create a file-by-file implementation plan.

### Steps:

1. **Design the solution**
   - How will you fix the bug / implement the feature?
   - What's the cleanest approach?
   - Are there edge cases to handle?

2. **List file changes**
   - File 1: What changes?
   - File 2: What changes?
   - Tests: What new tests?

3. **Identify dependencies**
   - What order to make changes?
   - Any breaking changes?
   - Backwards compatibility needed?

4. **Plan testing approach**
   - What tests to add/modify?
   - How to verify manually?
   - Platform-specific testing needed?

### Output:
- Clear implementation plan
- File-by-file change list
- Testing strategy

### Planning Best Practices:

**State management strategy:**
- Identify which state containers to update
- Use project-specific update patterns
- Plan for optimistic updates if applicable

**Code organization:**
- Follow project file structure conventions
- Consider separating concerns (business logic vs UI)
- Plan for reusability

**Testing strategy:**
- Unit tests for business logic
- Integration tests for workflows
- Manual testing checklist

### Example Plan:
```
Solution Design:
- Refactor API error handling into reusable utility
- Add response validation layer
- Update state management to use immutable updates

File Changes:
1. /src/utils/apiHelpers.js
   - Create handleApiError() function
   - Create validateResponse() function
   - Add retry logic for network failures

2. /src/services/api/userService.js
   - Replace inline error handling with apiHelpers
   - Add response validation before state updates

3. /src/store/userStore.js
   - Update state mutations to use immutable patterns
   - Add error state management

4. /tests/services/api/userService.test.js
   - Add test: "handles API errors gracefully"
   - Add test: "validates response structure"
   - Add test: "retries failed requests"

Testing Approach:
- Unit tests for error handling utilities
- Integration test for full API flow
- Manual test: Simulate network failure scenarios
```

---

## Phase 3: Implement

**Goal**: Make the changes and update tests.

### Steps:

1. **Implement changes file-by-file**
   - Follow the plan from Phase 2
   - Use project conventions
   - Add code comments for complex logic

2. **Update/add tests**
   - Add tests for new functionality
   - Update existing tests if behavior changed
   - Ensure tests cover edge cases

3. **Verify locally**
   - Run tests: `npm test` (or your test command)
   - Run linting: `npm run lint` (or your lint command)
   - Test manually if UI changes

4. **Follow project conventions**
   - Use consistent naming patterns
   - Follow code style guidelines
   - Apply project-specific best practices

### Implementation Checklist:

**Before writing code:**
- [ ] Understand the pattern to follow (research phase complete)
- [ ] Know which update methods to use
- [ ] Naming conventions clear

**During implementation:**
- [ ] Use project-specific state update patterns
- [ ] Follow naming conventions
- [ ] Include proper error handling
- [ ] Remove debug logs or make them conditional
- [ ] Add comments for non-obvious logic

**After implementation:**
- [ ] All imports correct
- [ ] No debug statements left in code
- [ ] Tests added/updated
- [ ] Validation checks pass

### Code Quality Guidelines:

**State updates:**
```javascript
// Follow your project's state management pattern
// Examples:

// Redux pattern:
dispatch(updateUser(userData))

// Zustand pattern:
useStore.getState().updateUser(userData)

// Context pattern:
setUser(prevUser => ({ ...prevUser, ...userData }))
```

**Error handling:**
```javascript
// Consistent error handling
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  logger.error('Operation failed', error)
  throw new AppError('User-friendly message', error)
}
```

**Conditional debugging:**
```javascript
// Debug logs only in development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}

// Or use your project's logger
logger.debug('Debug info:', data)  // Won't log in production
```

### Example Implementation:
```javascript
// File: /src/utils/apiHelpers.js

/**
 * Handles API errors consistently across the application
 */
export const handleApiError = (error) => {
  // Log for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error)
  }

  // Extract user-friendly message
  const message = error.response?.data?.message ||
                  error.message ||
                  'An unexpected error occurred'

  // Return standardized error object
  return {
    type: 'API_ERROR',
    message,
    status: error.response?.status,
    originalError: error
  }
}

/**
 * Validates API response structure
 */
export const validateResponse = (response, schema) => {
  if (!response) {
    throw new Error('Response is null or undefined')
  }

  // Validate against expected schema
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in response)) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
  }

  return response
}
```

---

## Phase 4: Review

**Goal**: Peer review for edge cases and security check.

### Steps:

1. **Self-review first**
   - Re-read all changed files
   - Check for edge cases
   - Verify conventions followed
   - Confirm error handling added

2. **Run validation commands**
   ```bash
   npm run lint
   npm test
   npm run build  # Ensure it builds
   ```

3. **Invoke peer-reviewer** (if using Atlas agents)
   - Provide context: "Review my changes for [feature/bug]"
   - Address feedback
   - Re-run validation after fixes

4. **Security check** (if applicable)
   - Handling user data? Verify sanitization
   - External API calls? Verify authentication
   - User input? Verify validation
   - Secrets? Verify not hardcoded

### Review Checklist:

**Code quality:**
- [ ] Follows project coding standards
- [ ] No debugging statements
- [ ] Clear variable/function names
- [ ] Comments for complex logic
- [ ] No copy-paste duplication

**Project conventions:**
- [ ] State management patterns followed
- [ ] Naming conventions correct
- [ ] Error handling consistent
- [ ] Logging appropriate

**Platform compatibility** (if applicable):
- [ ] Cross-platform code works everywhere
- [ ] Platform-specific code properly isolated
- [ ] No platform-specific APIs in shared code

**Edge cases:**
- [ ] Null/undefined handling
- [ ] Empty array/object handling
- [ ] Backwards compatibility with old data
- [ ] Migration path for breaking changes

**Testing:**
- [ ] Tests cover main functionality
- [ ] Tests cover edge cases
- [ ] All tests pass
- [ ] Build succeeds

**Security:**
- [ ] No hardcoded secrets or credentials
- [ ] User input properly validated
- [ ] External data properly sanitized
- [ ] Authentication/authorization correct

### Common Review Issues:

**Issue 1: Inconsistent error handling**
```javascript
// Found during review
try {
  await operation()
} catch (e) {
  console.log(e)  // Inconsistent with project pattern
}

// Fixed
try {
  await operation()
} catch (error) {
  logger.error('Operation failed', error)
  throw new AppError('User-friendly message', error)
}
```

**Issue 2: Missing validation**
```javascript
// Found during review
const user = response.data
setUser(user)  // No validation!

// Fixed
const user = validateResponse(response.data, userSchema)
setUser(user)
```

**Issue 3: Edge case not handled**
```javascript
// Found during review
const firstItem = items[0]  // Crashes if empty

// Fixed
const firstItem = items.length > 0 ? items[0] : null
if (!firstItem) return null
```

---

## Phase 5: Deploy

**Goal**: Run full test suite and deploy via project process.

### Steps:

1. **Document changes** (follow your project's process)
   - Update changelog if applicable
   - Update version numbers if needed
   - Document breaking changes

2. **Run full validation**
   ```bash
   npm run lint
   npm test
   npm run build
   # Add any project-specific validation commands
   ```

3. **Deploy using project process**
   - Follow your deployment workflow
   - May involve: git push, CI/CD pipeline, manual deployment
   - Ensure you're deploying to the correct environment

4. **Verify deployment**
   - Check deployment output for errors
   - Verify changes in target environment
   - Monitor for issues

### Deployment Checklist:

**Pre-deployment:**
- [ ] Changes documented (changelog, release notes, etc.)
- [ ] All tests pass
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Working directory clean (if required)

**Deployment:**
- [ ] Use established deployment process
- [ ] Deploy to correct environment
- [ ] Follow environment-specific requirements

**Post-deployment:**
- [ ] Deployment succeeded (no errors)
- [ ] Changes visible in target environment
- [ ] No immediate issues detected
- [ ] Monitoring shows normal behavior

### Quality Gates:

Most projects enforce these automatically:
- All tests must pass
- Linting must pass
- Build must succeed
- Code review approved (if required)

**If checks fail:**
- Tests fail: Fix them, don't skip
- Linting fails: Fix violations
- Build fails: Debug and fix
- Never bypass quality gates without team approval

### Example Deployment:

```bash
# 1. Document changes (example: update CHANGELOG.md)
## [1.2.3] - 2025-01-15
### Fixed
- API error handling now consistently formats errors
- Added response validation to prevent malformed data
- Improved retry logic for network failures

### Added
- New apiHelpers utility module for reusable API functions
- Comprehensive test coverage for error scenarios

# 2. Run full validation
npm run lint     # Pass
npm test         # Pass (45/45 tests)
npm run build    # Success

# 3. Deploy via project process
git add .
git commit -m "Fix API error handling and add validation"
git push origin feature/api-error-handling

# Or use automated deployment:
npm run deploy:staging
# CI/CD pipeline runs, tests pass, deploys automatically

# 4. Verify
# Check deployment logs, test in staging environment
```

---

## Customizing for Your Project

Atlas Standard works with any codebase. Customize by creating project-specific configuration:

### Create `.atlas/conventions.md`

Document your project's conventions:

```markdown
# Project Conventions

## State Management
- Use Redux Toolkit for global state
- Use local state (useState) for component-only state
- Always use selectors, never access state directly

## Naming Conventions
- Components: PascalCase (UserProfile.jsx)
- Utilities: camelCase (apiHelpers.js)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL)

## Code Quality Standards
- No console.log in production code
- Use TypeScript strict mode
- Minimum 80% test coverage

## Platform Rules (if multi-platform)
- Web: Support Chrome, Firefox, Safari latest 2 versions
- Mobile: iOS 14+, Android 10+
- Use feature detection, not browser detection
```

### Create `.atlas/validation.sh`

Add project-specific validation:

```bash
#!/bin/bash

# Project-specific validation checks
check_project_antipatterns() {
    echo "Checking project anti-patterns..."

    # Example: Check for direct state mutations
    if grep -r "state\[" src/ | grep -v "node_modules"; then
        echo "Error: Direct state mutation found (use immutable updates)"
        return 1
    fi

    # Example: Check for hardcoded API URLs
    if grep -r "https://api.example.com" src/ | grep -v "config"; then
        echo "Error: Hardcoded API URL (use config)"
        return 1
    fi

    return 0
}

# Export for use by Atlas validation scripts
export -f check_project_antipatterns
```

### Create `.atlas/deployment.md`

Document deployment process:

```markdown
# Deployment Process

## Environments
- **Development**: Local development, any changes
- **Staging**: Pre-production testing, deployed from main branch
- **Production**: Live environment, deployed from release tags

## Deployment Steps

### To Staging
1. Ensure all tests pass: `npm test`
2. Merge to main branch
3. CI/CD automatically deploys to staging
4. Verify in staging environment

### To Production
1. Create release branch: `git checkout -b release/v1.2.3`
2. Update version: `npm version 1.2.3`
3. Create PR to main
4. After approval and merge, tag: `git tag v1.2.3`
5. Push tag: `git push origin v1.2.3`
6. CI/CD automatically deploys to production

## Release Checklist
- [ ] All tests passing
- [ ] Version updated
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] Security review (if needed)
- [ ] Stakeholders notified
```

### Using Custom Configuration

The Atlas validation script will automatically load your custom configuration:

```bash
# In scripts/validate-standard.sh
if [ -f .atlas/conventions.md ]; then
  echo "Loading project conventions..."
fi

if [ -f .atlas/validation.sh ]; then
  source .atlas/validation.sh
  check_project_antipatterns  # Run custom checks
fi
```

---

## Success Indicators

### You've succeeded when:
- Task completed in < 2 hours
- All 5 phases completed (no skipping)
- Tests pass
- Peer review approved (no major issues)
- Deployed without rollback
- Edge cases covered
- Project conventions followed

### You need to escalate to Full workflow if:
- Scope expanded to 6+ files
- Security concerns emerged
- Formal requirements needed
- Architectural changes needed

---

## Common Pitfalls

### Don't Do This:
- Skip research phase ("I know where the bug is")
- Skip planning ("I'll figure it out as I code")
- Skip review phase ("It's a small change")
- Bypass deployment process ("Manual deployment is faster")
- Ignore project conventions
- Leave debug statements in code
- Skip tests because "it's obvious it works"

### Do This Instead:
- Complete all 5 phases (they're quick for Standard tier)
- Follow project patterns consistently
- Use established state management patterns
- Remove debug statements or make them conditional
- Test thoroughly, including edge cases
- Use project deployment process

---

## Resources

- **Research patterns**: See `resources/research-patterns.md`
- **Validation script**: See `scripts/validate-standard.sh`
- **Project conventions**: See `.atlas/conventions.md` (create if needed)
- **Deployment process**: See `.atlas/deployment.md` (create if needed)

---

## Example: Full Standard Workflow

### Task: "Fix bug where API errors crash the application"

#### Phase 1: Research (10 min)
```bash
# Find API-related files
grep -r "fetch\|axios" src/services/
grep -r "error" src/services/api/

# Files found:
# - /src/services/api/userService.js (API calls)
# - /src/store/userStore.js (state management)
# - /src/utils/errorHandling.js (error utilities)
```

**Understanding:**
- API calls use fetch with minimal error handling
- Errors throw unhandled exceptions, crashing app
- No consistent error message formatting

#### Phase 2: Plan (5 min)
**Solution:**
1. Create centralized error handler in apiHelpers.js
2. Update all API calls to use error handler
3. Add error state to store
4. Display user-friendly error messages

**Files to change:**
- Create `/src/utils/apiHelpers.js` - error handling utilities
- Update `/src/services/api/userService.js` - use new error handler
- Update `/src/store/userStore.js` - add error state
- Add `/tests/utils/apiHelpers.test.js` - test error handling

#### Phase 3: Implement (20 min)
```javascript
// apiHelpers.js
export const handleApiError = (error) => {
  const message = error.response?.data?.message ||
                  'An unexpected error occurred'

  return {
    type: 'API_ERROR',
    message,
    status: error.response?.status
  }
}

// userService.js
export const fetchUser = async (id) => {
  try {
    const response = await fetch(`/api/users/${id}`)
    return await response.json()
  } catch (error) {
    const apiError = handleApiError(error)
    throw apiError
  }
}

// Add tests
test('handleApiError formats error correctly', () => {
  const error = { response: { data: { message: 'Not found' }, status: 404 } }
  const result = handleApiError(error)
  expect(result.message).toBe('Not found')
  expect(result.status).toBe(404)
})
```

#### Phase 4: Review (10 min)
**Self-review checklist:**
- Error handling consistent across all API calls
- User-friendly error messages
- Tests added
- No debug logs

**Run validation:**
```bash
npm run lint   # Pass
npm test       # Pass (12/12 tests)
```

#### Phase 5: Deploy (5 min)
```bash
# Update CHANGELOG.md
## [1.2.1] - 2025-01-15
### Fixed
- API errors now handled gracefully without crashing
- Added user-friendly error messages

# Run validation
npm test       # Pass
npm run build  # Success

# Deploy via project process
git add .
git commit -m "Fix API error handling"
git push origin main
# CI/CD deploys automatically
```

**Total time: ~50 minutes**

---

## Summary

The Standard workflow is your **daily driver** for most development tasks. It provides the right balance of:
- **Rigor**: All 5 phases ensure quality
- **Speed**: Completed in 30-60 minutes
- **Flexibility**: Can escalate to Full if needed

When in doubt, **choose Standard workflow** - it's correct for 80% of tasks.
