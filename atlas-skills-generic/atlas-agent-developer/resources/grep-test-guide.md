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

✅ **"Replaced all `oldFunction()` with `newFunction()`"**
```bash
$ grep -r "oldFunction" src/
# Returns nothing = verified complete
```

✅ **"Removed all console.log statements"**
```bash
$ grep -r "console\.log" src/ | grep -v "__DEV__"
# Returns nothing = verified complete
```

✅ **"Updated all components to use new API"**
```bash
$ grep -r "oldApi" src/components/
# Returns nothing = verified complete
```

## The Grep Test Categories

### 1. Code Pattern Verification

**Use case:** Verify a pattern was replaced everywhere

**Examples:**

**Verify function migration:**
```bash
# Find all old function calls (should be none)
$ grep -rn "oldFunction" src/

# Verify new function used
$ grep -rn "newFunction" src/ | wc -l
# Count should match expected usage
```

**Verify naming convention migration:**
```bash
# Find old naming pattern (should be none)
$ grep -rn "old_pattern" src/

# Verify new naming pattern used
$ grep -rn "newPattern" src/ | wc -l
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

**Verify naming conventions:**
```bash
# Find functions starting with uppercase (should be none)
$ grep -rn "^function [A-Z]" src/

# Find constants not in UPPER_CASE (custom check)
$ grep -rn "^const [a-z].*=" src/config/
```

**Verify import patterns:**
```bash
# Find relative imports beyond 2 levels (should use absolute)
$ grep -rn "from '\.\./\.\./\.\./'" src/

# Verify absolute imports used
$ grep -rn "from '@/" src/ | wc -l
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
$ grep -r "test\|it\|describe" tests/feature/ | wc -l

# Find test files
$ find tests/ -name "*feature*.test.js"

# Run tests
$ npm test -- tests/feature/
# Output shows X/X tests pass
```

**Verify specific test exists:**
```bash
# Find test by description
$ grep -rn "should handle null data" tests/

# Verify test actually tests the feature
$ grep -A10 "should handle null" tests/components/MyComponent.test.js
# Read test body to verify it's real test
```

### 4. Documentation Verification

**Use case:** Verify documentation exists and is updated

**Examples:**

**Verify changelog updated:**
```bash
# Check for recent changes
$ head -20 CHANGELOG.md

# Verify specific feature mentioned
$ grep -i "new feature" CHANGELOG.md
```

**Verify feature documentation exists:**
```bash
# Find documentation file
$ find docs/ -name "*feature-name*"

# Verify documentation updated recently
$ ls -lt docs/features/ | head -5
```

**Verify inline documentation:**
```bash
# Check for JSDoc comments on new functions
$ grep -B5 "function newFunction" src/utils/helper.js
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
$ npx tsc --noEmit src/utils/helper.ts
# No output = success
```

## Measurable Outcomes

### Before/After Metrics

**Good measurements:**

✅ **Code reduction:**
```bash
# Before
$ wc -l src/utils/helper.js
456 src/utils/helper.js

# After refactor
$ wc -l src/utils/helper.js
312 src/utils/helper.js

# Reduced by: 144 lines (31.5% reduction)
```

✅ **Pattern replacement:**
```bash
# Before
$ grep -r "oldPattern" src/ | wc -l
45

# After migration
$ grep -r "oldPattern" src/ | wc -l
0

# Migrated: 45 instances (100% completion)
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
src/components/MyComponent.js
src/utils/helper.js
tests/components/MyComponent.test.js
...
```

✅ **Files using pattern:**
```bash
# Count files using old pattern
$ grep -rl "oldPattern" src/ | wc -l
12

# Count files using new pattern
$ grep -rl "newPattern" src/ | wc -l
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

**Task:** "Fixed crash when data is null"

**Grep tests:**

```bash
# 1. Find all data usages
$ grep -rn "data\." src/components/MyComponent.js

# 2. Verify all have null checks
src/components/MyComponent.js:45:  const value = data?.value || defaultValue
src/components/MyComponent.js:89:  <div>{value}</div>

# 3. Verify test exists
$ grep -rn "null data" tests/components/MyComponent.test.js
tests/components/MyComponent.test.js:67:  test('renders with null data', () => {

# 4. Run test
$ npm test -- MyComponent.test.js
✅ Tests: 5 passed, 5 total
```

**Evidence:** All data usages have null checks, test added, tests pass.

### Feature Implementation Verification

**Task:** "Implemented search functionality"

**Grep tests:**

```bash
# 1. Verify search component exists
$ grep -rn "SearchInput\|search" src/components/Header.js
src/components/Header.js:45:  <SearchInput onChange={handleSearch} />

# 2. Verify debouncing used
$ grep -rn "useDebounce\|debounce" src/components/SearchInput.js
src/components/SearchInput.js:12:  const debouncedValue = useDebounce(value, 300)

# 3. Verify filter logic exists
$ grep -rn "filter.*search" src/hooks/useSearch.js
src/hooks/useSearch.js:23:  return items.filter(item => matches(item, searchTerm))

# 4. Verify tests exist
$ grep -rn "search" tests/components/SearchInput.test.js
tests/components/SearchInput.test.js:15:  test('filters results', () => {

# 5. Run tests
$ npm test -- SearchInput.test.js
✅ Tests: 8 passed, 8 total
```

**Evidence:** Search implemented with debouncing, tests added, all tests pass.

### Refactoring Verification

**Task:** "Extracted reusable data processing logic"

**Grep tests:**

```bash
# 1. Verify tests still pass (behavior unchanged)
$ npm test -- src/components/
✅ Tests: 25 passed, 25 total (same as before)

# 2. Measure code reduction
$ wc -l src/components/ComponentA.js
145 (was 220, reduced by 75 lines = 34%)

# 3. Verify old pattern removed
$ grep -rn "data\.map.*format" src/components/
(no results - moved to utility)

# 4. Verify new pattern used
$ grep -rn "useProcessedData" src/components/
src/components/ComponentA.js:12:  const processed = useProcessedData(data)
src/components/ComponentB.js:15:  const processed = useProcessedData(data)

# 5. Verify performance not regressed
$ time npm test
real 2.1s (was 2.3s, improved)
```

**Evidence:** Behavior unchanged (tests pass), code reduced, duplication removed, no violations.

### Convention Migration Verification

**Task:** "Migrated to absolute imports"

**Grep tests:**

```bash
# 1. Find remaining relative imports beyond 2 levels (should be none)
$ grep -rn "from '\.\./\.\./\.\./'" src/
(no results)

# 2. Count absolute imports
$ grep -rn "from '@/" src/ | wc -l
156

# 3. Verify builds successfully
$ npm run build
✅ Build successful

# 4. Verify tests pass
$ npm test
✅ Tests: 45 passed, 45 total
```

**Evidence:** 156 absolute imports, 0 deep relative imports, builds successfully.

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
grep -rn "console\.log" src/path/to/changed/file
```

**Continuous verification** catches issues early.

### Post-Implementation

After completing work:

```bash
# Run full validation suite
npm run typecheck
npm test
npm run lint

# Run project-specific grep tests (if defined)
# Check .atlas/verification.md for custom tests

# Compare metrics to baseline
grep -r "pattern" src/ | wc -l
# Compare to baseline from pre-implementation
```

**Final verification** before submitting.

### PR Submission

Include verification evidence:

```markdown
## Evidence of Completion

Old pattern removed:
$ grep -rn "oldPattern" src/
(no results)

New pattern used:
$ grep -rn "newPattern" src/ | wc -l
23 files

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

**Find assignments:**
```bash
# Simple assignment
grep -rn "variable\s*=" src/

# Any variable assignment
grep -rn "\w\+\s*=" src/

# Specific patterns
grep -rn "\(var\|let\|const\)\s\+\w\+" src/
```

**Find function calls:**
```bash
# Specific function
grep -rn "functionName\s*(" src/

# Any function starting with prefix
grep -rn "prefix\w\+\s*(" src/

# Method calls
grep -rn "\.\(get\|set\|update\)\w\+\s*(" src/
```

**Find imports:**
```bash
# Specific import
grep -rn "import.*ComponentName" src/

# Any import from file
grep -rn "import.*from ['\"].*utils" src/

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

**Example: Verify error handling:**
```bash
$ grep -rn -A2 "try" src/utils/api.js

src/utils/api.js:45:  try {
src/utils/api.js:46:    const result = await fetchData()
src/utils/api.js:47:    return result
```

### Inverted Matches

**Find files without pattern:**
```bash
# Files that don't import a module
grep -rl "import.*Module" src/ > with-module.txt
find src/ -name "*.js" | grep -vFf with-module.txt

# Lines without specific pattern
grep -rn "data\." src/ | grep -v "data\?"
```

### Multiple Patterns

**Combine patterns:**
```bash
# Either pattern
grep -rn "pattern1\|pattern2" src/

# Both patterns (using multiple grep)
grep -r "pattern1" src/ | grep "pattern2"

# Pattern but not another (exclude)
grep -rn "console\.log" src/ | grep -v "__DEV__"
```

## Project-Specific Grep Tests

Document your project's grep tests in `.atlas/verification.md`:

```markdown
# Project Verification Commands

## State Management
# Verify Redux actions are typed
grep -r "dispatch(" src/ | grep -v ": Action"
# Should return nothing

## Naming Conventions
# Verify components use PascalCase
grep -r "export.*function [a-z]" src/components/
# Should return nothing

## Import Rules
# Verify no deep relative imports
grep -r "from '\.\./\.\./\.\./'" src/
# Should return nothing
```

The developer agent will use these custom grep tests automatically.

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
   - "Fixed null pointer: grep shows all usages have null checks"

4. **Metrics show impact**
   - Before: 45 violations
   - After: 0 violations
   - Improvement: 100%

**If you can't grep for it, you can't verify it.**

**If you can't verify it, you're not done.**
