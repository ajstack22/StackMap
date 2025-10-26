# Verification Commands Template

Copy this file to `.atlas/verification.md` in your project and customize with your grep tests.

---

# Verification Commands

These commands verify that code follows project conventions. Run these before submitting PRs.

## State Management

**Verify [your state management approach]:**
```bash
# Example: Verify Redux actions are typed
grep -r "dispatch(" src/ | grep -v ": Action"
# Should return NOTHING

# Example: Verify no direct state mutations
grep -r "state\.\w\+\s*=" src/reducers/
# Should return NOTHING (use immutable updates)
```

## Naming Conventions

**Verify component naming:**
```bash
# Verify components use PascalCase
grep -r "^export.*function [a-z]" src/components/
# Should return NOTHING

# Verify component files are PascalCase
find src/components/ -name "[a-z]*.tsx" -o -name "[a-z]*.jsx"
# Should return NOTHING (except index files)
```

**Verify hook naming:**
```bash
# Verify hooks have 'use' prefix
grep -r "^export function [a-z]\w*(" src/hooks/ | grep -v "^export function use"
# Should return NOTHING
```

**Verify constant naming:**
```bash
# Verify constants use UPPER_SNAKE_CASE
grep -r "^export const [a-z]" src/config/
# Should return NOTHING (config should be UPPER_CASE)
```

## File Organization

**Verify file structure:**
```bash
# Verify no files in wrong directories
find src/components/ -name "*.api.ts" -o -name "*.service.ts"
# Should return NOTHING (services belong in src/services/)

# Verify test files are colocated
find src/ -name "*.test.ts" -o -name "*.test.tsx" | head -5
# Should show tests next to source files
```

## Import Conventions

**Verify absolute imports:**
```bash
# Verify no deep relative imports (> 2 levels)
grep -r "from '\.\./\.\./\.\./'" src/
# Should return NOTHING

# Verify absolute imports used
grep -r "from '@/" src/ | wc -l
# Should be > 0 (absolute imports preferred)
```

**Verify import order:**
```bash
# Verify React imports come first
grep -A5 "^import" src/components/Button.tsx | head -6
# Should show React import first
```

## TypeScript

**Verify type usage:**
```bash
# Verify no 'any' types
grep -r ": any" src/ | grep -v "test.ts"
# Should return NOTHING (or very few exceptions)

# Verify function parameters are typed
grep -r "function \w\+(\w\+)" src/ | head -5
# Should show types: function name(param: Type)
```

**Verify type imports:**
```bash
# Verify type imports use 'type' keyword
grep -r "^import type" src/ | wc -l
# Should be > 0 (use 'import type' for types)
```

## Testing

**Verify test coverage:**
```bash
# Run coverage report
npm run test:coverage
# Should show > 80% overall coverage

# Find files without tests
find src/components/ -name "*.tsx" ! -name "*.test.tsx" | while read f; do
  test_file="${f%.tsx}.test.tsx"
  [ ! -f "$test_file" ] && echo "Missing test: $f"
done
```

**Verify test structure:**
```bash
# Verify tests use describe/it
grep -r "test(" tests/ | wc -l
# Should be 0 (use 'it' instead of 'test')

# Verify meaningful test descriptions
grep -r "it('works'" tests/
# Should return NOTHING (descriptions should be specific)
```

## Production Safety

**Verify no debug logs:**
```bash
# Verify no unwrapped console statements
grep -rn "console\.\(log\|debug\|info\)" src/ | grep -v "__DEV__" | grep -v "\.test\."
# Should return NOTHING

# Verify proper error logging
grep -rn "console\.error" src/ | grep -v "__DEV__"
# Should return NOTHING (use error tracking service)
```

**Verify no commented code:**
```bash
# Find commented-out code
grep -rn "^\s*//.*=" src/ | head -10
# Should return NOTHING or very few (delete commented code)
```

**Verify TODOs have dates:**
```bash
# Find TODOs without dates
grep -rn "TODO[^(]" src/
# Should return NOTHING (format: TODO(YYYY-MM-DD, #issue): description)
```

## Error Handling

**Verify error handling:**
```bash
# Verify try/catch blocks have catch
grep -r "try {" src/ | wc -l > tries.txt
grep -r "catch" src/ | wc -l > catches.txt
# Should be equal (every try needs catch)

# Verify errors are handled
grep -A5 "catch (error)" src/ | grep -c "console.error\|throw\|showError"
# Should match number of catch blocks
```

## Accessibility

**Verify accessibility:**
```bash
# Verify buttons are semantic
grep -r "onClick" src/components/ | grep "<div"
# Should return NOTHING (use <button> not <div>)

# Verify images have alt text
grep -r "<img" src/components/ | grep -v "alt="
# Should return NOTHING (all images need alt)
```

## Security

**Verify no secrets:**
```bash
# Check for hardcoded secrets
grep -ri "api[_-]key\|password\|secret" src/ | grep -v "variable"
# Should return NOTHING

# Verify environment variables used
grep -r "process\.env\." src/config/
# Should show environment variable usage
```

**Verify input sanitization:**
```bash
# Verify dangerous HTML is sanitized
grep -r "dangerouslySetInnerHTML" src/
# Should return NOTHING or show sanitization
```

## Performance

**Verify optimization:**
```bash
# Check for inline object literals in render
grep -r "style={{" src/components/ | wc -l
# Should be low (use style constants or CSS modules)

# Verify heavy components are memoized
grep -r "React\.memo" src/components/ | wc -l
# Should be > 0 for complex components
```

## Build Verification

**Verify build passes:**
```bash
# Type checking
npm run typecheck
# Exit code 0 = success

# Linting
npm run lint
# Exit code 0 = success

# Tests
npm test
# All tests pass

# Build
npm run build
# Exit code 0 = success
```

## Custom Project Rules

**[Add your project-specific verifications here]:**

```bash
# Example: Verify API base URL is not hardcoded
grep -r "https://api.example.com" src/
# Should return NOTHING (use config)

# Example: Verify date formatting uses utility
grep -r "new Date()\.toLocaleString" src/
# Should return NOTHING (use formatDate utility)
```

---

## How to Use

### Before Committing

Run relevant checks for your changes:

```bash
# Quick validation
npm run typecheck && npm test && npm run lint

# Convention checks (customize for your changes)
grep -r "console\.log" src/path/to/changes | grep -v "__DEV__"
```

### In CI/CD

Add these checks to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Verify conventions
  run: |
    # No unwrapped console logs
    ! grep -rn "console\.log" src/ | grep -v "__DEV__"

    # No deep relative imports
    ! grep -r "from '\.\./\.\./\.\./'" src/

    # No any types
    ! grep -r ": any" src/ | grep -v "test.ts"
```

### In Pull Requests

Include verification evidence:

```markdown
## Verification

Console logs:
$ grep -r "console\.log" src/components/NewFeature | grep -v "__DEV__"
(no results)

Imports:
$ grep -r "from '@/'" src/components/NewFeature
src/components/NewFeature/index.tsx:import { Button } from '@/components/Button'

Tests:
$ npm test -- NewFeature.test.tsx
✅ All tests pass
```

---

## Maintenance

**Update this file when:**
- Adding new conventions to `conventions.md`
- Discovering common issues in code reviews
- Adopting new tools or patterns
- Changing project structure

**Review this file:**
- Monthly: Ensure checks are still relevant
- After major refactors: Update patterns
- When onboarding: Make sure it's up to date
