---
name: atlas-iterative
description: Iterative 3-phase workflow with peer review cycle for changes needing validation (15-30 min)
---

# Atlas Iterative Workflow

## When to Use This Skill

**Perfect for:**
- Styling improvements that need validation
- Simple UI tweaks requiring quality checks
- Straightforward refactors
- Changes where you know what to do but want peer eyes
- Modifications that don't need research/planning

**Time estimate**: 15-30 minutes (including review cycles)

**Success criteria**:
- Change validated in < 30 minutes
- Peer review approved
- Tests pass
- No major refactoring needed

## The 3 Phases

```
Phase 1: Make Change           → Implement change
Phase 2: Peer Review (Cycle)   → Review → Fix → Repeat until pass
Phase 3: Deploy                → Test + deploy
```

---

## Phase 1: Make Change

**Goal**: Implement the change you know needs to happen.

### Steps:

1. **Understand what needs changing**
   - The requirement is clear (no research needed)
   - You know which file(s) to change
   - Approach is straightforward

2. **Make the change**
   - Implement the modification
   - Follow project conventions
   - Add comments if needed

3. **Self-verify**
   - Visual check (if UI)
   - Logic check (if code)
   - Convention check (project-specific rules)

### Implementation Checklist:

- [ ] Change implemented in 1-2 files
- [ ] Project conventions followed (see `.atlas/conventions.md` if available)
- [ ] Change verified locally
- [ ] No debug statements left behind
- [ ] Code formatting consistent with project style

### Examples:

**Example 1: Button spacing**
```css
/* Before */
.button {
  padding: 8px;
  margin: 4px;
}

/* After (better spacing) */
.button {
  padding: 16px;
  margin: 8px;
}
```

**Example 2: Extract helper function**
```javascript
// Before (validation inline)
const isValid = email.includes('@') && email.length > 5

// After (extracted for reusability)
const validateEmail = (email) => {
  return email.includes('@') && email.length > 5
}
const isValid = validateEmail(email)
```

---

## Phase 2: Peer Review (Iterative Cycle)

**Goal**: Get peer feedback, address issues, repeat until approved.

### The Review Cycle:

```
1. Submit for review
2. Receive feedback
3. Address feedback
4. Re-submit
5. Repeat until PASS
```

### Steps:

1. **Self-review first**
   ```bash
   # Run your project's validation commands
   # Examples:
   npm run typecheck      # Type checking
   npm run lint           # Linting
   npm test               # Unit tests
   cargo test             # Rust tests
   pytest                 # Python tests
   ```

2. **Submit for peer review**
   - Explain what changed and why
   - Highlight areas you're uncertain about
   - Request specific feedback if needed

3. **Receive feedback**
   - Read all feedback carefully
   - Ask clarifying questions if unclear
   - Prioritize blocking issues

4. **Address feedback**
   - Fix all blocking issues
   - Consider suggestions
   - Update code based on feedback

5. **Re-submit**
   - Explain what you changed
   - Confirm all issues addressed
   - Run validation again

### Review Checklist:

**Before submitting:**
- [ ] Type checking/compilation passes
- [ ] Linting passes (or only warnings)
- [ ] Self-reviewed for obvious issues
- [ ] Project conventions verified
- [ ] No security vulnerabilities introduced

**During review:**
- [ ] Understand all feedback
- [ ] Track which issues addressed
- [ ] Test after each fix
- [ ] Document non-obvious decisions

**Review pass criteria:**
- [ ] No blocking issues
- [ ] Code quality acceptable
- [ ] Edge cases considered
- [ ] Project conventions followed
- [ ] Security concerns addressed

### Common Review Feedback:

**Feedback 1: Missing edge case**
```javascript
// Review: "What if the array is empty?"

// Before
const firstItem = items[0]

// After
const firstItem = items.length > 0 ? items[0] : null
if (!firstItem) return null
```

**Feedback 2: Convention violation**
```python
# Review: "Should use project's logging utility"

# Before
print("Debug info:", data)

# After
logger.debug("Processing data", extra={"data": data})
```

**Feedback 3: Performance concern**
```javascript
// Review: "This runs on every render - should be memoized"

// Before
const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name))

// After
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
)
```

### Using Peer-Reviewer Agent:

If the atlas-agent-peer-reviewer skill is available:

```
"Review my changes: [brief description]

Files changed:
- /path/to/file1.js
- /path/to/file2.js

What I changed:
[Explanation]

Please check for:
- Edge cases
- Project conventions
- Code quality
- Security concerns
"
```

The peer-reviewer agent will provide structured feedback with a verdict:
- 🔴 **REJECTED**: Must fix issues and resubmit
- ⚠️ **CONDITIONAL PASS**: Minor issues, can address after merge
- ✅ **PASS**: Approved, proceed to deploy

---

## Phase 3: Deploy

**Goal**: Deploy the approved changes.

### Steps:

1. **Final validation**
   ```bash
   # Run your project's pre-deploy checks
   # Examples:
   npm run typecheck && npm test
   make test
   ./scripts/validate.sh
   ```

2. **Update changelog/release notes**
   Follow your project's convention for documenting changes:
   ```markdown
   # If using CHANGELOG.md:
   ## [Unreleased]
   ### Changed
   - Improved button spacing for better UX

   # If using PENDING_CHANGES.md:
   ## Title: Improve button spacing for better UX
   ### Changes Made:
   - Updated button padding from 8px to 16px
   - Applied consistently across login and signup screens
   - Peer reviewed and approved

   # If using git commit messages:
   # Just ensure descriptive commit message
   ```

3. **Deploy using your project's process**
   ```bash
   # Examples - use your project's deployment method:
   ./scripts/deploy.sh dev           # Custom deployment script
   git push origin feature-branch    # Push for CI/CD pipeline
   npm run deploy:staging            # NPM script
   make deploy ENV=staging           # Makefile target
   ```

4. **Verify deployment**
   - Check deployment output
   - Test in target environment
   - Confirm change is live

### Deployment Checklist:

- [ ] Changelog/release notes updated
- [ ] All tests pass
- [ ] Type checking/compilation passes
- [ ] Peer review approved
- [ ] Deployed using project's process
- [ ] Change verified in environment

---

## Escalation Criteria

**Escalate to Standard workflow if:**
- Affects more than 2 files
- Tests fail (need new tests)
- Complex edge cases emerge
- Needs architectural decisions
- Uncertain about approach

**Escalate to Full workflow if:**
- Security implications discovered
- Cross-platform coordination needed
- Formal requirements become necessary

### How to Escalate:

```
"Escalating to Standard workflow. Found 4 files need changes and complex edge cases require planning."
```

Then restart from Phase 1 of Standard workflow.

---

## Common Iterative Workflow Tasks

### 1. Style/Layout Improvements

**Use case**: Adjust spacing, alignment, sizing for better UX

**Pattern**:
- Phase 1: Adjust styles
- Phase 2: Get visual feedback from reviewer
- Phase 3: Deploy

**Time**: 15-20 minutes

---

### 2. Component Refactoring

**Use case**: Extract logic, improve code organization

**Pattern**:
- Phase 1: Refactor code
- Phase 2: Reviewer checks for edge cases, naming
- Phase 3: Deploy

**Time**: 20-25 minutes

---

### 3. UI Tweaks

**Use case**: Update animations, transitions, visual effects

**Pattern**:
- Phase 1: Implement tweak
- Phase 2: Reviewer checks cross-platform compatibility (if applicable)
- Phase 3: Deploy

**Time**: 15-25 minutes

---

## Anti-Patterns (Don't Do This)

### ❌ Anti-Pattern 1: Skipping Review

```
"Change looks good to me, deploying immediately"
```

**Problem**: Purpose of Iterative is validation. Without review, use Quick workflow.

**Solution**: Complete the review cycle or use Quick workflow if validation not needed.

---

### ❌ Anti-Pattern 2: Ignoring Feedback

```
Reviewer: "Missing edge case"
You: "Looks fine to me, merging anyway"
```

**Problem**: Defeats purpose of peer review.

**Solution**: Address all blocking feedback or escalate to discuss with team.

---

### ❌ Anti-Pattern 3: Scope Creep

```
Started: "Adjust button padding"
Now doing: "Adjust padding + refactor button component + add new props"
```

**Problem**: No longer iterative, too complex.

**Solution**: Escalate to Standard workflow or split into multiple tasks.

---

## Iterative Workflow Checklist

### Phase 1: Make Change
- [ ] Requirement is clear (no research needed)
- [ ] Know which file(s) to change
- [ ] Change implemented in 1-2 files
- [ ] Self-verified (visual/logic check)
- [ ] Project conventions followed

### Phase 2: Peer Review (Cycle)
- [ ] Self-review first (typecheck, lint, tests)
- [ ] Submitted for peer review
- [ ] Received feedback
- [ ] Addressed all blocking issues
- [ ] Re-submitted if needed
- [ ] Received PASS verdict

### Phase 3: Deploy
- [ ] Final validation passed
- [ ] Changelog/release notes updated
- [ ] Deployed using project's process
- [ ] Verified in environment

### Red Flags (Escalate):
- ⚠️ Affects 3+ files
- ⚠️ Tests failing
- ⚠️ Review reveals architectural issues
- ⚠️ Approach uncertain
- ⚠️ Complex edge cases

---

## Example: Complete Iterative Workflow

### Task: "Improve card layout spacing for better visual hierarchy"

#### Phase 1: Make Change (10 minutes)

```css
/* File: src/components/Card.css */

/* Before */
.card {
  padding: 12px;
  margin: 8px;
}

.card-title {
  font-size: 16px;
  margin-bottom: 4px;
}

/* After (improved spacing) */
.card {
  padding: 16px;      /* More breathing room */
  margin: 12px;       /* Better separation between cards */
}

.card-title {
  font-size: 18px;    /* Larger, more prominent */
  margin-bottom: 8px; /* Better separation from subtitle */
}
```

**Self-verify**: Looks better visually ✅

#### Phase 2: Peer Review - Cycle 1 (5 minutes)

**Submit**: "Updated card spacing for better hierarchy. Please review."

**Feedback received**:
- ⚠️ "Check responsive breakpoints - might need adjustment on mobile"
- ⚠️ "Verify consistent with design system spacing scale"

**Address feedback**:
```css
/* Checked on mobile breakpoint - spacing scales well ✅ */
/* Verified: 4px base unit → 8px, 12px, 16px all match design system ✅ */
```

**Re-submit**: "Tested on mobile and verified design system compliance, all good."

#### Phase 2: Peer Review - Cycle 2 (3 minutes)

**Feedback received**:
- ✅ "PASS - Looks good, spacing is consistent"

#### Phase 3: Deploy (2 minutes)

**Update changelog**:
```markdown
## [Unreleased]
### Changed
- Improved card spacing for better visual hierarchy
  - Increased padding from 12px to 16px
  - Increased margin from 8px to 12px
  - Increased title font size from 16px to 18px
  - Increased title bottom margin from 4px to 8px
  - Tested on mobile breakpoints
  - Verified design system compliance
```

**Deploy**:
```bash
./scripts/deploy.sh staging
# ✅ Deployed successfully
```

**Total time: 20 minutes** ✅

---

## Success Indicators

### You've succeeded when:
- ✅ Completed in < 30 minutes
- ✅ Peer review approved
- ✅ Tests pass
- ✅ Change improves code/UX
- ✅ No scope creep

### You should have escalated if:
- ⚠️ Took > 30 minutes
- ⚠️ Multiple review cycles with blocking issues
- ⚠️ Affects 3+ files
- ⚠️ Architectural concerns raised

---

## Quick Reference

### Iterative Workflow Commands:
```bash
# Validation (adapt to your project)
npm run typecheck     # JavaScript/TypeScript
npm run lint          # Linting
npm test              # Unit tests
cargo test            # Rust
pytest                # Python
go test ./...         # Go

# Deploy (adapt to your project)
./scripts/deploy.sh staging
git push origin feature-branch
npm run deploy:dev
make deploy ENV=dev
```

### Time Allocation:
- **Phase 1**: 5-15 minutes (make change)
- **Phase 2**: 5-10 minutes (review cycles)
- **Phase 3**: 2-5 minutes (deploy)
- **Total**: 15-30 minutes

### Decision:
- **Know what to change, want validation** → Iterative ✅
- **Trivial, no validation needed** → Quick
- **Need research/planning** → Standard
- **Complex, formal process** → Full

---

## Project Customization

To adapt this workflow for your project, create these files in your repository:

### 1. `.atlas/conventions.md`

Document your project-specific rules that should be checked during Phase 2:

```markdown
# Project Conventions

## Code Quality Standards
- All functions must have JSDoc comments
- Maximum function length: 50 lines
- Cyclomatic complexity: < 10

## Naming Conventions
- Components: PascalCase (UserProfile.jsx)
- Utilities: camelCase (formatDate.js)
- Constants: UPPER_SNAKE_CASE (API_ENDPOINT)

## State Management
- Use Redux for global state
- Use useState for component-local state
- Never mutate state directly

## Testing Requirements
- Minimum 80% code coverage
- All public APIs must have unit tests
- Integration tests for critical paths

## Platform-Specific Rules (if applicable)
- Mobile: Avoid nested ScrollViews
- Web: Ensure keyboard navigation support
- iOS: Test on both iPhone and iPad simulators
- Android: Use percentage widths for multi-column layouts

## Security
- Never log sensitive data
- Validate all user inputs
- Use parameterized queries for database access
```

### 2. `.atlas/anti-patterns.sh`

Create automated checks for project-specific code smells:

```bash
#!/bin/bash

# Exit on first error
set -e

echo "Running project-specific anti-pattern checks..."

# Check for debug statements
if grep -r "console\.log\|debugger" src/ --exclude-dir=node_modules; then
  echo "❌ Debug statements found - remove before deploying"
  exit 1
fi

# Check for direct state mutations (if using Redux)
if grep -r "state\." src/ --exclude-dir=node_modules | grep "="; then
  echo "⚠️  Possible direct state mutation - verify immutability"
fi

# Check for missing error handling
if grep -r "fetch(" src/ --exclude-dir=node_modules | grep -v "catch"; then
  echo "⚠️  fetch() without error handling detected"
fi

# Check for hardcoded credentials
if grep -ri "password\|api_key\|secret" src/ --exclude-dir=node_modules | grep -v "placeholder"; then
  echo "❌ Possible hardcoded credentials found"
  exit 1
fi

echo "✅ Anti-pattern checks passed"
```

Make it executable: `chmod +x .atlas/anti-patterns.sh`

### 3. Configure Deployment in Phase 3

Update the "Deploy" phase to use your specific commands:

**Option A: Custom script**
```bash
./scripts/deploy.sh [environment]
```

**Option B: CI/CD pipeline**
```bash
git push origin feature-branch  # Triggers CI/CD
```

**Option C: Direct deployment**
```bash
npm run deploy:staging
make deploy ENV=staging
```

### 4. Changelog Format

Choose your project's changelog format:

**Option A: CHANGELOG.md (Keep a Changelog format)**
```markdown
## [Unreleased]
### Added
- New feature description

### Changed
- Improvement description

### Fixed
- Bug fix description
```

**Option B: PENDING_CHANGES.md (custom format)**
```markdown
## Title: [Descriptive title]
### Changes Made:
- Change 1
- Change 2
```

**Option C: Git commit messages only**
```
feat: add user authentication
fix: resolve login button spacing
refactor: extract validation logic
```

---

## Usage with Atlas

Atlas will automatically:
1. Check for `.atlas/conventions.md` and reference it during Phase 2 reviews
2. Run `.atlas/anti-patterns.sh` during self-review if it exists
3. Use your configured deployment commands in Phase 3

If these files don't exist, Atlas falls back to generic best practices.

---

## Summary

The Iterative workflow adds **peer validation** to simple changes. Use it when:
- You know what needs to change (no research)
- Approach is straightforward (no planning)
- But you want quality validation before deploying

**Key advantage**: Catches edge cases and convention violations early through structured review.

Remember: If review reveals complexity, **escalate to Standard workflow** rather than forcing it through Iterative.
