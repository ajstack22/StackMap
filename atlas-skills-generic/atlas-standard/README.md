# Atlas Standard Workflow - Generic Version

A portable, project-agnostic implementation of the Atlas Standard workflow for professional software development.

## What is Atlas Standard?

Atlas Standard is a structured 5-phase workflow designed for 80% of development tasks:
- Bug fixes (2-5 files)
- Small features (clear requirements)
- Code refactoring
- Test additions
- Moderate complexity changes

**Time estimate**: 30-60 minutes per task

## The 5 Phases

1. **Research** - Understand current implementation
2. **Plan** - Design approach and create file-by-file plan
3. **Implement** - Make changes and add tests
4. **Review** - Check for edge cases and quality issues
5. **Deploy** - Run full validation and deploy

## Getting Started

### 1. Copy to Your Project

```bash
# Copy the skill to your project
cp -r atlas-standard /your-project/.atlas/skills/

# Or use as a reference
ln -s /path/to/atlas-standard /your-project/.atlas/skills/atlas-standard
```

### 2. Customize for Your Project

Create project-specific configuration:

#### `.atlas/conventions.md`

Document your project's conventions:

```markdown
# Project Conventions

## State Management
[Your state management patterns]

## Naming Conventions
[Your naming conventions]

## Code Quality Standards
[Your quality standards]

## Platform Rules
[Platform-specific rules if applicable]
```

#### `.atlas/validation.sh`

Add project-specific validation:

```bash
#!/bin/bash

check_project_antipatterns() {
    echo "Checking project anti-patterns..."

    # Add your project-specific checks here
    # Example: Check for direct state mutations
    if grep -r "state\[" src/ | grep -v "node_modules"; then
        echo "Error: Direct state mutation found"
        return 1
    fi

    return 0
}

export -f check_project_antipatterns
```

#### `.atlas/deployment.md`

Document your deployment process:

```markdown
# Deployment Process

## Environments
[Your environments]

## Deployment Steps
[Your deployment process]

## Release Checklist
[Your checklist]
```

### 3. Run Validation

```bash
# Run the validation script
./atlas-standard/scripts/validate-standard.sh

# Or add to package.json
{
  "scripts": {
    "validate": "./atlas-standard/scripts/validate-standard.sh"
  }
}
```

## What's Included

### Files

- **SKILL.md** - Complete workflow documentation
  - When to use Standard workflow
  - Detailed 5-phase process
  - Checklists for each phase
  - Example workflows
  - Customization guide

- **resources/research-patterns.md** - Research techniques
  - Quick command reference
  - Pattern-based research strategies
  - Generic research checklists
  - Advanced techniques

- **scripts/validate-standard.sh** - Validation script
  - Runs linting, type checking, tests
  - Checks for common anti-patterns
  - Loads project-specific checks
  - Provides clear pass/fail output

### Features

#### Fully Generic
- No hardcoded project names
- No project-specific patterns
- Works with any tech stack
- Adaptable conventions

#### Customizable
- Load project conventions from `.atlas/`
- Add custom validation checks
- Define project-specific anti-patterns
- Document deployment process

#### Production-Ready
- Clear validation with color output
- Detailed error messages
- Helpful suggestions
- Exit codes for CI/CD integration

## Usage

### Basic Workflow

1. **Choose Atlas Standard for your task**
   - Bug fix, small feature, or refactor
   - 2-5 files affected
   - Clear requirements

2. **Follow the 5 phases** (see SKILL.md)
   - Research: Understand the code
   - Plan: Design your approach
   - Implement: Make changes + tests
   - Review: Check quality and edge cases
   - Deploy: Validate and deploy

3. **Run validation before deploying**
   ```bash
   ./atlas-standard/scripts/validate-standard.sh
   ```

### With Atlas Agent System

If using the Atlas agent system, invoke with:

```
"Fix the login bug. Use Atlas Standard workflow."
```

The agent will:
1. Research the bug systematically
2. Create an implementation plan
3. Make the changes with tests
4. Run peer review
5. Validate and deploy

## Validation Script Details

The validation script runs:

1. **Linting** - Code style checks
2. **Type checking** - TypeScript or similar
3. **Tests** - Unit/integration tests
4. **Build** - Verify project builds
5. **Anti-patterns** - Check for common issues
6. **Documentation** - Verify docs exist
7. **Security** - Basic security checks

### Exit Codes

- `0` - All checks passed
- `1` - One or more checks failed

### CI/CD Integration

```yaml
# Example GitHub Actions
- name: Validate changes
  run: ./atlas-standard/scripts/validate-standard.sh
```

## Customization Examples

### Add Custom Anti-Pattern Check

In `.atlas/validation.sh`:

```bash
check_project_antipatterns() {
    # Example: Check for forbidden imports
    if grep -r "import.*dangerousLibrary" src/; then
        echo "Error: dangerousLibrary is forbidden"
        return 1
    fi

    # Example: Check for required patterns
    if ! grep -r "export default" src/components/*.jsx; then
        echo "Error: Components must use default export"
        return 1
    fi

    return 0
}
```

### Add Required Files Check

In `.atlas/validation.sh`:

```bash
check_project_antipatterns() {
    # Check for required documentation
    if [ ! -f "docs/ARCHITECTURE.md" ]; then
        echo "Error: ARCHITECTURE.md is required"
        return 1
    fi

    return 0
}
```

### Add Performance Checks

In `.atlas/validation.sh`:

```bash
check_project_antipatterns() {
    # Check for large bundle size
    if [ -f "dist/bundle.js" ]; then
        SIZE=$(wc -c < dist/bundle.js)
        if [ $SIZE -gt 500000 ]; then
            echo "Warning: Bundle size exceeds 500KB"
        fi
    fi

    return 0
}
```

## Differences from StackMap Version

This generic version removes:
- StackMap-specific store references (useUserStore, useAppStore, etc.)
- StackMap field naming conventions (activity.text/icon)
- StackMap deployment scripts (./scripts/deploy.sh)
- Platform-specific gotchas (Android FlexWrap, iOS AsyncStorage, etc.)
- PENDING_CHANGES.md requirement

And adds:
- Generic state management guidance
- Customizable conventions via .atlas/ directory
- Flexible deployment process
- Project-agnostic validation
- Broader applicability

## When to Use Other Workflows

**Atlas Quick** (5-15 min):
- Trivial changes
- Single line fixes
- Color/text updates

**Atlas Iterative** (15-30 min):
- Changes needing validation
- Style improvements
- Simple UI tweaks

**Atlas Full** (2-4 hours):
- Complex features (6+ files)
- Security changes
- Major refactors
- Architectural changes

## Support

For issues or questions:
1. Check SKILL.md for detailed guidance
2. Review research-patterns.md for research techniques
3. Customize validation.sh for project needs
4. Consult your team's conventions

## License

This is a generic, portable version of the Atlas Standard workflow. Adapt freely for your project's needs.

## Contributing

To improve this generic version:
1. Keep it project-agnostic
2. Focus on universal best practices
3. Make it easy to customize
4. Provide clear examples

---

**Remember**: Atlas Standard is your daily driver. Use it for 80% of tasks. It balances rigor, speed, and flexibility.
