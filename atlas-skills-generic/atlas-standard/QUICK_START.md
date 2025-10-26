# Atlas Standard - Quick Start Guide

Get started with Atlas Standard in 5 minutes.

## What is Atlas Standard?

A structured 5-phase workflow for 80% of development tasks:
- **Phase 1**: Research (understand current code)
- **Phase 2**: Plan (design approach)
- **Phase 3**: Implement (make changes + tests)
- **Phase 4**: Review (check quality + edge cases)
- **Phase 5**: Deploy (validate + deploy)

**Time**: 30-60 minutes per task

## Who Should Use This?

Use Atlas Standard for:
- Bug fixes (2-5 files)
- Small features (clear requirements)
- Code refactoring
- Test additions

Don't use for:
- Trivial changes (use Quick workflow)
- Complex features (use Full workflow)
- Architectural changes (use Full workflow)

## 5-Minute Setup

### 1. Copy Files (30 seconds)

```bash
# Copy to your project
cp -r atlas-standard /your-project/.atlas/skills/

# Or clone if using git
git clone [repo] /your-project/.atlas/skills/atlas-standard
```

### 2. Create Conventions (2 minutes)

```bash
# Create .atlas directory
mkdir -p /your-project/.atlas

# Copy example conventions
cp atlas-standard/examples/conventions.md /your-project/.atlas/

# Edit to match your project
vim /your-project/.atlas/conventions.md
```

**Minimum required:**
- State management pattern
- Naming conventions
- Testing standards

### 3. Add Validation (2 minutes)

```bash
# Copy example validation
cp atlas-standard/examples/validation.sh /your-project/.atlas/

# Add project-specific checks
vim /your-project/.atlas/validation.sh
```

**Minimum required:**
- One project anti-pattern check

### 4. Test It (30 seconds)

```bash
# Run validation
./atlas-standard/scripts/validate-standard.sh

# Should run:
# ✅ Linting
# ✅ Type checking (if configured)
# ✅ Tests
# ✅ Build
# ✅ Anti-pattern checks
```

## First Use

### Example Task: "Fix login validation bug"

#### Phase 1: Research (5 min)

```bash
# Find login code
grep -r "login\|Login" src/

# Find validation code
grep -r "validation\|validate" src/

# Result: Found LoginForm.jsx and validators.js
```

#### Phase 2: Plan (5 min)

```
Files to change:
1. src/components/LoginForm.jsx
   - Update email validation regex

2. src/utils/validators.js
   - Fix validateEmail() function

3. src/components/LoginForm.test.js
   - Add test for edge case
```

#### Phase 3: Implement (15 min)

```javascript
// validators.js
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// LoginForm.test.js
test('validates email with plus sign', () => {
  expect(validateEmail('user+test@example.com')).toBe(true)
})
```

#### Phase 4: Review (10 min)

```bash
# Self-review
- ✅ Regex handles edge cases
- ✅ Test added
- ✅ No console.logs

# Run validation
npm test  # Pass
```

#### Phase 5: Deploy (5 min)

```bash
# Run full validation
./atlas-standard/scripts/validate-standard.sh

# Deploy via your process
git add .
git commit -m "fix: email validation with plus signs"
git push
```

**Total: 40 minutes** ✅

## Common Workflows

### Bug Fix

1. **Research**: Find the bug location
2. **Plan**: Identify fix approach
3. **Implement**: Fix + add test for bug
4. **Review**: Check edge cases
5. **Deploy**: Validate + deploy

### Small Feature

1. **Research**: Find similar features
2. **Plan**: Design following existing patterns
3. **Implement**: Build + tests
4. **Review**: Check integration points
5. **Deploy**: Validate + deploy

### Refactoring

1. **Research**: Map current structure
2. **Plan**: Design new structure
3. **Implement**: Refactor + update tests
4. **Review**: Verify no behavior changes
5. **Deploy**: Validate + deploy

## Key Commands

### Research Phase

```bash
# Find files
find src/ -name "*pattern*"

# Find code
grep -r "functionName" src/

# Find usage
grep -r "import.*Module" src/
```

### Validation

```bash
# Run validation script
./atlas-standard/scripts/validate-standard.sh

# Or individual checks
npm run lint
npm test
npm run build
```

### Get Help

```bash
# Read full documentation
cat atlas-standard/SKILL.md

# Check research patterns
cat atlas-standard/resources/research-patterns.md

# Review examples
ls atlas-standard/examples/
```

## Customization

### Add Custom Check

Edit `.atlas/validation.sh`:

```bash
check_project_antipatterns() {
    # Check for your project's anti-patterns
    if grep -r "forbiddenPattern" src/; then
        echo "Error: forbiddenPattern found"
        return 1
    fi
    return 0
}
```

### Document Convention

Edit `.atlas/conventions.md`:

```markdown
## Our Convention
- Use Redux for state
- Components in PascalCase
- Tests co-located with source
```

### Document Deployment

Edit `.atlas/deployment.md`:

```markdown
## Deploy to Production
1. Create tag: git tag v1.2.3
2. Push: git push origin v1.2.3
3. CI/CD auto-deploys
```

## Tips for Success

### Do This:
- Complete all 5 phases (they're quick!)
- Follow your project conventions
- Add tests for every change
- Run validation before committing

### Don't Do This:
- Skip research ("I know where it is")
- Skip planning ("I'll figure it out")
- Skip review ("It's a small change")
- Skip validation ("It obviously works")

## When to Use Other Workflows

**Switch to Quick** (5-15 min) if:
- Change is trivial (color, text, typo)
- Single line change
- No testing needed

**Switch to Full** (2-4 hours) if:
- 6+ files affected
- Architectural changes
- Security implications
- Complex requirements

## Troubleshooting

### Validation Fails

```bash
# Check specific failures
cat /tmp/atlas-lint.log
cat /tmp/atlas-test.log
cat /tmp/atlas-typecheck.log

# Fix issues
npm run lint -- --fix
npm test -- --watch
```

### Missing Commands

If validation skips checks:

```bash
# Add to package.json
{
  "scripts": {
    "lint": "eslint src/",
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "build": "webpack"
  }
}
```

### Custom Checks Not Running

```bash
# Ensure validation.sh is:
# 1. In .atlas/ directory
# 2. Executable
# 3. Exports functions

chmod +x .atlas/validation.sh
```

## Next Steps

1. **Read SKILL.md** for detailed workflow guide
2. **Customize** conventions, validation, deployment docs
3. **Use it** for your next task
4. **Iterate** based on team feedback

## Resources

- **SKILL.md** - Complete workflow documentation
- **README.md** - Detailed setup and customization
- **research-patterns.md** - Research techniques
- **examples/** - Templates for customization

## Questions?

Check the documentation:
1. SKILL.md - Workflow details
2. README.md - Setup and customization
3. examples/ - Template files

---

**Remember**: Atlas Standard is your daily driver. Use it for 80% of tasks. It's the right balance of rigor and speed.
