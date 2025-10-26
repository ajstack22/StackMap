# The Grep Test: Verifiable Completion Guide

## What is the Grep Test?

The **Grep Test** is a principle: If you can't verify your work with a command-line tool (like `grep`, `find`, `npm test`), you're not done.

**Core idea:** Completion must be measurable, not subjective.

## Why the Grep Test Matters

### Problems with unverifiable claims:

❌ **"Fixed the bug"**
- Which bug?
- How was it fixed?
- How does reviewer know it's fixed?
- Can't verify with grep

❌ **"Improved code quality"**
- How? Where?
- What metrics improved?
- Can't measure improvement

❌ **"Follows conventions"**
- Which conventions?
- How verified?
- Can't check compliance

### Benefits of verifiable claims:

✅ **"Replaced all `activity.emoji` with `activity.icon`"**
```bash
$ grep -r "activity\.emoji\s*=" src/
# Returns nothing = verified complete
```

✅ **"Removed all console.log statements"**
```bash
$ grep -r "console\.log" src/ | grep -v "__DEV__"
# Returns nothing = verified complete
```

✅ **"Updated all store usage to use store-specific methods"**
```bash
$ grep -r "useAppStore.setState" src/components/
# Returns nothing = verified complete
```

## The Grep Test Categories

### 1. Code Pattern Verification

**Use case:** Verify a pattern was replaced everywhere

**Examples:**

**Verify store migration:**
```bash
# Find all direct setState usage (should be none)
$ grep -rn "useAppStore.setState" src/

# Verify store-specific methods used
$ grep -rn "setUsers\|updateSettings\|setLibrary" src/ | wc -l
# Count should match expected usage
```

**Verify field naming migration:**
```bash
# Find legacy field writes (should be none)
$ grep -rn "activity\.name\s*=" src/
$ grep -rn "activity\.emoji\s*=" src/
$ grep -rn "user\.emoji\s*=" src/

# Verify canonical field usage
$ grep -rn "activity\.text\s*=" src/ | wc -l
$ grep -rn "activity\.icon\s*=" src/ | wc -l
```

**Verify component migration:**
```bash
# Find old component usage (should be none after migration)
$ grep -rn "import.*OldComponent" src/

# Verify new component used
$ grep -rn "import.*NewComponent" src/
```

### 2. Convention Verification

**Use case:** Verify code follows project conventions

**Examples:**

**Verify no gray text:**
```bash
# Find gray colors (should be none)
$ grep -rn "color.*['\"]#[6-9a-fA-F]\{6\}" src/

# More specific (finds #666, #999, etc.)
$ grep -rn "color.*['\"]#[6-9]" src/
```

**Verify Typography usage:**
```bash
# Find direct fontWeight (should be none in new code)
$ grep -rn "fontWeight" src/ | grep -v "Typography"

# Verify Typography component used
$ grep -rn "import.*Typography" src/ | wc -l
```

**Verify no platform-specific APIs:**
```bash
# Find Alert.alert usage (web incompatible)
$ grep -rn "Alert\.alert" src/components/ src/services/

# Find NetInfo usage (causes freezes)
$ grep -rn "NetInfo\." src/

# Find window usage in shared code
$ grep -rn "window\." src/components/ | grep -v "\.web\.js"
```

**Verify production safety:**
```bash
# Find unwrapped console statements
$ grep -rn "console\.\(log\|debug\|info\)" src/ | grep -v "__DEV__"

# Find commented-out code
$ grep -rn "^\s*//.*=" src/

# Find TODO without timeline
$ grep -rn "TODO[^(]" src/
```

### 3. Test Verification

**Use case:** Verify tests exist and pass

**Examples:**

**Verify test coverage:**
```bash
# Count tests for a feature
$ grep -r "test\|it" tests/services/sync/ | wc -l

# Find test files
$ find tests/ -name "*sync*.test.js"

# Run tests
$ npm test -- src/services/sync/
# Output shows X/X tests pass
```

**Verify specific test exists:**
```bash
# Find test by description
$ grep -rn "should preserve icon during conflict" tests/

# Verify test actually tests the feature
$ grep -A10 "should preserve icon" tests/services/sync/syncService.test.js
# Read test body to verify it's real test
```

### 4. Documentation Verification

**Use case:** Verify documentation exists and is updated

**Examples:**

**Verify PENDING_CHANGES.md updated:**
```bash
# Check for recent changes
$ head -20 PENDING_CHANGES.md

# Verify specific feature mentioned
$ grep -i "icon preservation" PENDING_CHANGES.md
```

**Verify feature documentation exists:**
```bash
# Find documentation file
$ find docs/ -name "*dark-mode*"

# Verify documentation updated recently
$ ls -lt docs/features/ | head -5
```

**Verify inline documentation:**
```bash
# Check for JSDoc comments on new functions
$ grep -B5 "function newFunction" src/services/sync/syncService.js
# Should show comment block
```

### 5. Build Verification

**Use case:** Verify code builds successfully

**Examples:**

**Verify no build errors:**
```bash
# Type checking
$ npm run typecheck
# Exit code 0 = success

# Tests
$ npm test
# Output: X/X tests pass

# Linting
$ npm run lint
# Exit code 0 = success

# Build
$ npm run build
# Exit code 0 = success
```

**Verify specific file compiles:**
```bash
# Check TypeScript compilation
$ npx tsc --noEmit src/services/sync/syncService.js
# No output = success
```

## Measurable Outcomes

### Before/After Metrics

**Good measurements:**

✅ **Code reduction:**
```bash
# Before
$ wc -l src/services/sync/syncService.js
456 src/services/sync/syncService.js

# After refactor
$ wc -l src/services/sync/syncService.js
312 src/services/sync/syncService.js

# Reduced by: 144 lines (31.5% reduction)
```

✅ **Pattern replacement:**
```bash
# Before
$ grep -r "useAppStore.setState" src/ | wc -l
45

# After migration
$ grep -r "useAppStore.setState" src/ | wc -l
12

# Migrated: 33 instances (73% reduction)
```

✅ **Test coverage increase:**
```bash
# Before
$ npm test 2>&1 | grep "Tests:"
Tests: 15 passed, 15 total

# After adding tests
$ npm test 2>&1 | grep "Tests:"
Tests: 20 passed, 20 total

# Added: 5 tests (33% increase)
```

✅ **Performance improvement:**
```bash
# Before
$ time npm run build
real 2m45s

# After optimization
$ time npm run build
real 1m30s

# Improved by: 1m15s (45% faster)
```

### File Count Metrics

✅ **Files affected:**
```bash
# Count files changed
$ git diff --name-only main | wc -l
8

# List files changed
$ git diff --name-only main
src/services/sync/syncService.js
src/utils/dataNormalizer.js
tests/services/sync/syncService.test.js
...
```

✅ **Files using pattern:**
```bash
# Count files using old pattern
$ grep -rl "useAppStore.setState" src/ | wc -l
12

# Count files using new pattern
$ grep -rl "useUserStore.getState().setUsers" src/ | wc -l
8
```

## Anti-Patterns: Unverifiable Claims

### Vague Claims

❌ **"It works"**
- How do you know?
- What specifically works?
- How can reviewer verify?

❌ **"Tested it"**
- Tested what?
- How did you test?
- What were the results?

❌ **"Fixed bugs"**
- Which bugs?
- How were they fixed?
- How do we know they won't come back?

❌ **"Improved performance"**
- By how much?
- In what scenario?
- How measured?

❌ **"Follows best practices"**
- Which practices?
- How verified?
- Show me the grep test

### Unmeasurable Outcomes

❌ **"Better code structure"**
- Better how?
- Measured how?
- Show before/after metrics

❌ **"More maintainable"**
- Why more maintainable?
- Complexity reduced? (measure with wc -l)
- Duplication removed? (measure with grep)

❌ **"Cleaner implementation"**
- Define "cleaner"
- Lines reduced? (measure)
- Functions smaller? (measure)

## Grep Test Examples by Task Type

### Bug Fix Verification

**Task:** "Fixed crash when activity icon is null"

**Grep tests:**

```bash
# 1. Find all icon usages
$ grep -rn "activity\.icon" src/components/ActivityCard.js

# 2. Verify all have fallbacks
src/components/ActivityCard.js:45:  const icon = activity.icon || activity.emoji || '📋'
src/components/ActivityCard.js:89:  <Image source={{ uri: icon }} />

# 3. Verify test exists
$ grep -rn "null icon" tests/components/ActivityCard.test.js
tests/components/ActivityCard.test.js:67:  test('renders with null icon', () => {

# 4. Run test
$ npm test -- ActivityCard.test.js
✅ Tests: 5 passed, 5 total
```

**Evidence:** All icon usages have fallbacks, test added, tests pass.

### Feature Implementation Verification

**Task:** "Implemented dark mode toggle"

**Grep tests:**

```bash
# 1. Verify toggle exists
$ grep -rn "dark.*mode\|theme" src/screens/SettingsScreen.js
src/screens/SettingsScreen.js:89:  <Switch value={theme === 'dark'} />

# 2. Verify store method used
$ grep -rn "updateSettings" src/screens/SettingsScreen.js
src/screens/SettingsScreen.js:92:  useSettingsStore.getState().updateSettings({ theme })

# 3. Verify no gray text introduced
$ grep -rn "color.*#[6-9]" src/screens/SettingsScreen.js
(no results)

# 4. Verify Typography used
$ grep -rn "fontWeight" src/screens/SettingsScreen.js | grep -v "Typography"
(no results)

# 5. Verify tests exist
$ grep -rn "dark mode\|theme" tests/screens/SettingsScreen.test.js
tests/screens/SettingsScreen.test.js:45:  test('toggles theme', () => {

# 6. Run tests
$ npm test -- SettingsScreen.test.js
✅ Tests: 12 passed, 12 total
```

**Evidence:** Toggle implemented, conventions followed, tests added.

### Refactoring Verification

**Task:** "Refactored sync service for maintainability"

**Grep tests:**

```bash
# 1. Verify tests still pass (behavior unchanged)
$ npm test -- src/services/sync/
✅ Tests: 15 passed, 15 total (same as before)

# 2. Measure code reduction
$ wc -l src/services/sync/syncService.js
312 (was 456, reduced by 144 lines = 31.5%)

# 3. Verify function size reduction
$ grep -n "^function\|^async function" src/services/sync/syncService.js | wc -l
12 (was 8, broken into smaller functions)

# 4. Verify no new violations introduced
$ grep -rn "useAppStore.setState" src/services/sync/
(no results)

# 5. Verify performance not regressed
$ time npm test -- sync
real 2.3s (was 2.5s, improved)
```

**Evidence:** Behavior unchanged (tests pass), code reduced, functions smaller, no violations.

### Convention Migration Verification

**Task:** "Migrated all activity.emoji to activity.icon"

**Grep tests:**

```bash
# 1. Find remaining legacy writes (should be none)
$ grep -rn "activity\.emoji\s*=" src/
(no results)

# 2. Count canonical field writes
$ grep -rn "activity\.icon\s*=" src/ | wc -l
23

# 3. Verify fallbacks exist for reads
$ grep -rn "activity\.icon" src/ | grep -v "activity\.icon ||"
(few results - most have fallbacks)

# 4. Check specific files need fixing
$ grep -rn "activity\.icon[^|]" src/ | grep -v "\.icon\s*||"
src/components/OldCard.js:45:  <Image source={{ uri: activity.icon }} />

# 5. Verify tests updated
$ grep -rn "emoji" tests/ | grep "activity"
tests/utils/dataNormalizer.test.js:34:  // Legacy emoji test

# 6. Run tests
$ npm test
✅ Tests: 45 passed, 45 total
```

**Evidence:** 23 canonical writes, 0 legacy writes, tests pass.

## Building Verification Into Your Workflow

### Pre-Implementation

Before starting work:

```bash
# Understand current state
grep -r "pattern" src/

# Count current usage
grep -r "pattern" src/ | wc -l

# Find all affected files
grep -rl "pattern" src/
```

**Record baseline metrics** for comparison later.

### During Implementation

As you work:

```bash
# Verify each change
grep -rn "pattern" src/path/to/changed/file

# Run affected tests
npm test -- path/to/changed/file

# Check conventions
grep -rn "useAppStore.setState\|console\.log" src/path/to/changed/file
```

**Continuous verification** catches issues early.

### Post-Implementation

After completing work:

```bash
# Run full validation suite
npm run typecheck
npm test
npm run lint

# Run all grep tests
./scripts/verify-conventions.sh  # If you have one

# Compare metrics to baseline
grep -r "pattern" src/ | wc -l
# Compare to baseline from pre-implementation
```

**Final verification** before submitting.

### PR Submission

Include verification evidence:

```markdown
## Evidence of Completion

Store usage:
$ grep -rn "useAppStore.setState" src/components/
(no results)

Field naming:
$ grep -rn "activity\.emoji\s*=" src/
(no results)

Tests:
$ npm test
✅ Tests: 48 passed, 48 total

Type checking:
$ npm run typecheck
✅ No errors
```

**Reviewers can re-run** your grep tests to verify.

## Advanced Grep Patterns

### Regex Patterns

**Find field assignments:**
```bash
# Simple assignment
grep -rn "activity\.icon\s*=" src/

# Any activity field
grep -rn "activity\.\w\+\s*=" src/

# Specific fields
grep -rn "activity\.\(name\|emoji\|text\|icon\)\s*=" src/
```

**Find function calls:**
```bash
# Specific function
grep -rn "setState\s*(" src/

# Any set function
grep -rn "set\w\+\s*(" src/

# Store methods
grep -rn "\(setUsers\|updateSettings\|setLibrary\)\s*(" src/
```

**Find imports:**
```bash
# Specific import
grep -rn "import.*ComponentName" src/

# Any import from file
grep -rn "import.*from ['\"].*syncService" src/

# Default vs named imports
grep -rn "import \w\+ from" src/  # Default
grep -rn "import {.*} from" src/  # Named
```

### Context Lines

**Show context around matches:**
```bash
# Show 3 lines before and after
grep -rn -C3 "pattern" src/

# Show 5 lines after
grep -rn -A5 "pattern" src/

# Show 5 lines before
grep -rn -B5 "pattern" src/
```

**Example: Verify fallback logic:**
```bash
$ grep -rn -A2 "activity\.icon" src/components/ActivityCard.js

src/components/ActivityCard.js:45:  const icon = activity.icon || activity.emoji || '📋'
src/components/ActivityCard.js:46:  return (
src/components/ActivityCard.js:47:    <Image source={{ uri: icon }} />
```

### Inverted Matches

**Find files without pattern:**
```bash
# Files that don't import Typography
grep -rl "import.*Typography" src/ > with-typography.txt
find src/ -name "*.js" | grep -vFf with-typography.txt

# Lines without fallback
grep -rn "activity\.icon" src/ | grep -v "||"
```

### Multiple Patterns

**Combine patterns:**
```bash
# Either pattern
grep -rn "activity\.emoji\|user\.emoji" src/

# Both patterns (using multiple grep)
grep -r "activity\.icon" src/ | grep "activity\.text"

# Pattern but not another (exclude)
grep -rn "console\.log" src/ | grep -v "__DEV__"
```

## Summary

The Grep Test principle:

1. **Completion must be measurable**
   - Not subjective ("looks good")
   - Objective (command output)

2. **Evidence must be verifiable**
   - Reviewers can re-run commands
   - Results are reproducible

3. **Claims must be specific**
   - Not "fixed bugs"
   - "Fixed icon crash: grep shows all icons have fallbacks"

4. **Metrics show impact**
   - Before: 45 violations
   - After: 0 violations
   - Improvement: 100%

**If you can't grep for it, you can't verify it.**

**If you can't verify it, you're not done.**
