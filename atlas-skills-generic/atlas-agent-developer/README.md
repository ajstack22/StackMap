# Atlas Developer Agent - Generic Version

A portable, framework-agnostic developer agent skill for Atlas that implements features and fixes bugs while maintaining high quality standards.

## Overview

The developer agent is the first line of defense for code quality. It follows five core principles:

1. **Verify, Then Act** - Audit code before changing it
2. **Measure Everything** - Use the "Grep Test" for verifiable completion
3. **Eliminate, Don't Add** - Reduce complexity, don't increase it
4. **Production Code is Silent** - No unwrapped debug logs
5. **Own Your Quality** - Pass peer review on first attempt

## Quick Start

### 1. Install the Skill

Copy this directory to your Atlas project:

```bash
cp -r atlas-skills-generic/atlas-agent-developer /your-project/.atlas/skills/
```

### 2. Use the Agent

```
"Implement [feature description]. Use developer agent."
"Fix bug: [bug description]. Use developer agent."
```

The agent will:
- Research the codebase
- Plan the implementation
- Write clean, tested code
- Self-validate before submitting
- Provide verifiable evidence of completion

## Customization

The developer agent uses **generic best practices** by default. Customize for your project:

### Create `.atlas/conventions.md`

Document your project's specific conventions:

```markdown
# Project Conventions

## State Management
- Use Redux for global state
- Use Context API for theme/auth
- Local state for UI-only data

## Naming Standards
- Components: PascalCase (e.g., `UserProfile`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth`)
- Utilities: camelCase (e.g., `formatDate`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

## File Organization
- Group by feature, not by type
- Index files for public API only
- Test files colocated with source

## Code Style
- Max function length: 50 lines
- Max file length: 300 lines
- Prefer functional components
- Use TypeScript for all new files

## Testing
- Minimum 80% coverage
- Test file naming: `*.test.ts`
- Mock external dependencies
- Test edge cases (null, empty, error)
```

### Create `.atlas/verification.md`

Document grep tests for your conventions:

```markdown
# Verification Commands

## State Management
# Verify Redux actions are typed
grep -r "dispatch(" src/ | grep -v ": Action"
# Should return nothing

## Naming Conventions
# Verify components use PascalCase
grep -r "export.*function [a-z]" src/components/
# Should return nothing

# Verify hooks have 'use' prefix
grep -r "export.*function [a-z]\w*(" src/hooks/ | grep -v "^use"
# Should return nothing

## Imports
# Verify no deep relative imports (> 2 levels)
grep -r "from '\.\./\.\./\.\./'" src/
# Should return nothing

# Verify absolute imports used
grep -r "from '@/" src/ | wc -l
# Should be > 0

## Production Safety
# Verify no unwrapped console logs
grep -r "console\.log" src/ | grep -v "__DEV__"
# Should return nothing

# Verify no TODOs without dates
grep -r "TODO[^(]" src/
# Should return nothing
```

### Create `.atlas/platforms.md` (if multi-platform)

Document platform-specific rules:

```markdown
# Platform-Specific Rules

## Web
- Use semantic HTML
- Ensure keyboard accessibility
- Test in Chrome, Firefox, Safari
- Avoid browser-specific CSS

## Mobile (React Native)
- Use React Native components only
- No direct native modules in shared code
- Test on iOS and Android
- Use responsive layouts

## Gotchas
- iOS: AsyncStorage is slow, debounce writes
- Android: Back button handling required
- Web: Service workers for offline support
```

## Usage Patterns

### Bug Fix

```
"Fix bug: User profile crashes when avatar is missing. Use developer agent."
```

The agent will:
1. Audit all avatar usage with `grep -r "avatar" src/`
2. Add null checks where missing
3. Add test for null avatar case
4. Verify with grep test: `grep -rn "avatar\?" src/`

### Feature Implementation

```
"Implement dark mode toggle in settings. Use developer agent."
```

The agent will:
1. Research existing theme system
2. Plan: state management + UI + styling
3. Implement incrementally with tests
4. Verify conventions followed
5. Document in changelog

### Refactoring

```
"Refactor UserService to extract API calls. Use developer agent."
```

The agent will:
1. Verify tests cover existing behavior
2. Extract API calls to separate module
3. Keep tests passing throughout
4. Remove old code (not just add new)
5. Measure reduction: lines of code, complexity

## The Grep Test

Every change should be **verifiable** with command-line tools:

**Example: "Removed all console.log statements"**

```bash
# Verify completion
$ grep -r "console\.log" src/ | grep -v "__DEV__"
# Should return NOTHING
```

**Example: "Migrated to new API method"**

```bash
# Verify old method removed
$ grep -r "oldApiMethod" src/
# Should return NOTHING

# Verify new method used
$ grep -r "newApiMethod" src/
# Should find X files
```

See `resources/grep-test-guide.md` for complete guide.

## Standard Workflow

The developer agent follows a 5-step process:

### 1. Understand
- Read requirements completely
- Audit codebase with grep
- Identify affected areas
- Check conventions documentation

### 2. Implement
- Follow established patterns
- Write clean, single-responsibility code
- Apply project conventions
- Handle edge cases (null, empty, error)

### 3. Self-Validate
- Run type checking (`npm run typecheck`)
- Run all tests (`npm test`)
- Run linting (`npm run lint`)
- Run grep tests (custom conventions)
- Test edge cases manually

### 4. Document
- Update changelog/release notes
- Add inline comments (for complex logic only)
- Update feature documentation (if new feature)
- Add JSDoc for public APIs

### 5. Submit for Review
- Create PR with clear description
- Include grep test evidence
- Provide verification steps
- Show before/after metrics

## Integration with Atlas Workflows

### Standard Workflow (30-60 min)

```
"[TASK]. Use Atlas Standard workflow with developer agent."
```

Phases:
1. **Research** → Developer audits codebase
2. **Plan** → Developer creates implementation plan
3. **Implement** → Developer writes code
4. **Review** → Peer reviewer validates
5. **Deploy** → DevOps deploys

### Full Workflow (2-4 hours)

```
"[COMPLEX TASK]. Use Atlas Full workflow."
```

Developer agent participates in:
- Phase 1: Research
- Phase 3: Planning
- Phase 5: Implementation

## Resources

### Included Documentation

- `SKILL.md` - Complete developer agent specification
- `resources/grep-test-guide.md` - Verifiable completion methodology

### Create Your Own

- `.atlas/conventions.md` - Your project's conventions
- `.atlas/verification.md` - Your custom grep tests
- `.atlas/platforms.md` - Platform-specific rules (if applicable)

## Examples

### Example 1: Generic Bug Fix

**Before:**
```javascript
function UserProfile({ user }) {
  return <div>{user.name}</div>  // Crashes when user is null
}
```

**After:**
```javascript
function UserProfile({ user }) {
  const name = user?.name || 'Anonymous'
  return <div>{name}</div>
}

// Test added
test('renders with null user', () => {
  const { getByText } = render(<UserProfile user={null} />)
  expect(getByText('Anonymous')).toBeTruthy()
})
```

**Grep test:**
```bash
$ grep -rn "user\." src/components/UserProfile.js
# Shows optional chaining: user?.name
```

### Example 2: Generic Refactoring

**Before:** Duplicated logic in 3 components
```javascript
// ComponentA.js
const formatted = data.map(item => formatDate(item.date))

// ComponentB.js
const formatted = data.map(item => formatDate(item.date))

// ComponentC.js
const formatted = data.map(item => formatDate(item.date))
```

**After:** Extracted to hook
```javascript
// hooks/useFormattedData.js
export function useFormattedData(data) {
  return useMemo(
    () => data.map(item => ({ ...item, date: formatDate(item.date) })),
    [data]
  )
}

// Usage
const formatted = useFormattedData(data)
```

**Grep test:**
```bash
# Verify old pattern removed
$ grep -r "data\.map.*formatDate" src/components/
# Returns nothing

# Verify new hook used
$ grep -r "useFormattedData" src/components/
ComponentA.js:5:  const formatted = useFormattedData(data)
ComponentB.js:8:  const formatted = useFormattedData(data)
ComponentC.js:6:  const formatted = useFormattedData(data)
```

## Best Practices

### DO

✅ Audit code before changing (`grep -r "pattern" src/`)
✅ Verify completion with grep tests
✅ Remove old code when adding new patterns
✅ Wrap debug logs in `__DEV__` checks
✅ Test edge cases (null, empty, error)
✅ Include verification evidence in PRs

### DON'T

❌ Make unverifiable claims ("it works", "fixed bugs")
❌ Add new patterns without removing old ones
❌ Leave console.log in production code
❌ Skip testing edge cases
❌ Submit without running validation suite

## Troubleshooting

### "Tests failing after my changes"

1. Read the test failure message completely
2. Identify which test is failing
3. Understand what the test expects
4. Check if your change breaks the expectation
5. Either fix your code or update the test

### "Type checking fails"

1. Read the TypeScript error completely
2. Identify the file and line
3. Understand what type is expected
4. Add type annotation or fix the type mismatch

### "Reviewer found convention violations"

1. Check if `.atlas/conventions.md` exists
2. Run grep tests from `.atlas/verification.md`
3. Fix violations before resubmitting
4. Add grep test evidence to PR

## License

MIT License - Free to use and modify for your project.

## Support

For Atlas framework support:
- Atlas documentation: `/atlas/docs/`
- Workflow tiers: `/atlas/docs/WORKFLOW_TIERS.md`
- Agent workflow: `/atlas/docs/AGENT_WORKFLOW.md`

For this skill:
- See `SKILL.md` for detailed specification
- See `resources/grep-test-guide.md` for verification methodology
- Create `.atlas/conventions.md` for project-specific rules
