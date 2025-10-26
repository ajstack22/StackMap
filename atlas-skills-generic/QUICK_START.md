# Atlas Generic Skills - Quick Start Guide

Get up and running with Atlas in under 5 minutes.

## Step 1: Copy Skills (30 seconds)

Copy the generic skills to your project:

```bash
# Option A: Copy to your project
cp -r atlas-skills-generic/ your-project/.atlas/skills/

# Option B: Use in any directory (no copying needed)
# Just reference the skills when talking to Claude
```

## Step 2: Use Immediately (No Configuration Required!)

Start using Atlas right away with generic best practices:

```
"Fix the bug where users can't login. Use Atlas workflow."
```

Claude will:
- Automatically select the right workflow tier (Standard for most tasks)
- Apply general software development best practices
- Guide you through each phase
- Run quality checks

**That's it!** Atlas works immediately without any setup.

---

## Step 3: Customize (Optional - 5 minutes)

Want to add your project-specific rules? Create a conventions file:

```bash
# Copy the template
cp .atlas/skills/templates/conventions-template.md .atlas/conventions.md

# Edit to add your rules
vim .atlas/conventions.md  # or use your editor
```

### Minimal Example:

```markdown
# Project Atlas Conventions

## Deployment
- Command: `npm run deploy:dev`
- Update: `CHANGELOG.md` before deploying

## Code Standards
- State updates: Use `useState` and `useReducer` (not direct mutation)
- Field naming: camelCase for JS, snake_case for database

## Quality Gates
- Linting: `npm run lint` (must pass)
- Tests: `npm test` (must pass)
```

Now Atlas will automatically follow your project's rules!

---

## Common Usage Patterns

### Pattern 1: Let Atlas Choose the Tier (Recommended)

```
"Add user profile editing. Use Atlas workflow."
```

Atlas analyzes and picks the right tier automatically.

### Pattern 2: Specify a Tier

```
"Fix typo in welcome message. Use Atlas Quick workflow."
"Implement photo uploads. Use Atlas Full workflow."
```

### Pattern 3: Use with Agents

```
"Design the payment system. Use Atlas Full workflow with atlas-security agent."
```

---

## The 4 Workflow Tiers

### Quick (5-15 min) - Trivial Changes
**When:** Typo fix, color change, single value update
**Phases:** Make change → Deploy

```
"Change button color to blue. Use Atlas Quick."
```

### Iterative (15-30 min) - Simple with Validation
**When:** Style tweaks, simple refactors, need peer review
**Phases:** Make change → Peer review → Deploy

```
"Improve button spacing. Use Atlas Iterative."
```

### Standard (30-60 min) - Most Tasks (DEFAULT)
**When:** Bug fixes, small features, refactoring
**Phases:** Research → Plan → Implement → Review → Deploy

```
"Fix the race condition in sync. Use Atlas workflow."
```

### Full (2-4 hours) - Complex Features
**When:** New modules, security changes, major refactors
**Phases:** Research → Story → Plan → Adversarial Review → Implement → Test → Validate → Cleanup → Deploy

```
"Add two-factor authentication. Use Atlas Full workflow."
```

---

## Quick Tier Selection

Ask yourself:

1. **How many files affected?**
   - 1 file → Quick or Iterative
   - 2-5 files → Standard
   - 6+ files → Full

2. **Need research?**
   - No → Quick or Iterative
   - Yes → Standard or Full

3. **Security-critical?**
   - No → Quick/Iterative/Standard
   - Yes → Standard or Full

**When in doubt:** Use Standard (it's right for 80% of tasks)

---

## Example Session

```
You: "The login form crashes when email is empty. Use Atlas workflow."

Claude: "I'll use the Atlas Standard workflow for this bug fix.

RESEARCH PHASE
[Checks for .atlas/conventions.md]
[Analyzes codebase, finds missing validation]

PLAN PHASE
[Plans fix: add email validation before submit]

IMPLEMENT PHASE
[Adds validation with proper error message]

REVIEW PHASE
[Runs linting, tests, type checking]

DEPLOY PHASE
[Guides deployment using your project's command]

✅ Bug fixed, tested, and ready to deploy!"
```

---

## Customization Levels

### Level 0: No Customization (Works Immediately)
- Generic best practices
- Universal quality checks
- Standard deployment guidance

**Best for:** Quick projects, prototypes, learning

### Level 1: Minimal Conventions (5 min setup)
- Deployment command
- Key code patterns
- Basic quality gates

**Best for:** Small teams, simple projects

### Level 2: Full Conventions (1-2 hour setup)
- Complete coding standards
- Platform-specific rules
- Deployment checklists
- Security requirements
- Performance targets

**Best for:** Production apps, larger teams

---

## Tips for Success

1. **Start Generic**: Use Atlas immediately without customization
2. **Add Rules Gradually**: Create conventions as patterns emerge
3. **Trust the Process**: Don't skip phases (each catches different issues)
4. **Default to Standard**: When unsure, Standard workflow works for 80% of tasks
5. **Document Decisions**: Add to conventions file when you establish new patterns

---

## Troubleshooting

**"Atlas isn't finding my conventions file"**
- Check file is at `.atlas/conventions.md` (relative to project root)
- Verify file isn't empty
- Try: "Use my project conventions" in your request

**"Workflow is too slow for simple changes"**
- Use Quick tier: "Use Atlas Quick workflow"
- Quick is designed for 5-15 minute changes

**"I need a phase that's not in my tier"**
- Use a higher tier (more phases)
- Or request specific phase: "Include security review"

---

## Next Steps

1. **Try it**: Run through a simple task using Atlas
2. **Customize**: Add your project rules to `.atlas/conventions.md`
3. **Iterate**: Refine conventions as you find patterns
4. **Share**: Show your team how Atlas improves consistency

---

## Getting Help

- **Full Documentation**: See `README.md`
- **Customization Guide**: See `CUSTOMIZATION_GUIDE.md`
- **Convention Template**: See `templates/conventions-template.md`
- **Conversion Details**: See `CONVERSION_SUMMARY.md`

---

## Your First Atlas Task

Ready to try? Start with:

```
"Help me understand my codebase structure. Use Atlas workflow."
```

Atlas will guide you through research, analysis, and documentation!

---

**Welcome to Atlas!** Structured workflows for better software development.
