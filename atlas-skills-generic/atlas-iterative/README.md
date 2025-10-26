# Atlas Iterative Workflow - Generic Version

A project-agnostic workflow for implementing changes that need peer validation (15-30 minutes).

## Overview

The Iterative workflow is a 3-phase approach for straightforward changes where you know what to do but want quality validation before deploying:

```
Phase 1: Make Change           → Implement the change
Phase 2: Peer Review (Cycle)   → Review → Fix → Repeat until pass
Phase 3: Deploy                → Test and deploy
```

**Perfect for:**
- Style/layout improvements
- Simple UI tweaks
- Straightforward refactors
- Changes needing validation but not research

**Time estimate**: 15-30 minutes (including review cycles)

## Quick Start

### 1. Install the Skill

Copy `skill.md` to your project's Atlas skills directory:

```bash
mkdir -p .atlas/skills/atlas-iterative
cp skill.md .atlas/skills/atlas-iterative/
```

### 2. Invoke the Workflow

```
"Improve button spacing. Use Atlas Iterative workflow."
```

Atlas will guide you through the 3 phases.

### 3. Customize for Your Project (Optional)

Create project-specific configuration files:

#### `.atlas/conventions.md`
Document your code quality standards, naming conventions, and platform-specific rules.

#### `.atlas/anti-patterns.sh`
Automated checks for project-specific code smells and convention violations.

See the "Project Customization" section in `skill.md` for templates.

## When to Use

| Scenario | Use Iterative? | Alternative |
|----------|----------------|-------------|
| Style tweak needing validation | ✅ Yes | - |
| Simple refactor | ✅ Yes | - |
| Trivial change (typo fix) | ❌ No | Use Quick workflow |
| Needs research/planning | ❌ No | Use Standard workflow |
| Complex feature | ❌ No | Use Full workflow |

**Rule of thumb**: Use Iterative when you know what to change but want peer eyes on it.

## Key Features

### Structured Review Cycle
- Self-review first (validation commands)
- Peer feedback
- Address issues
- Re-submit
- Repeat until approved

### Escalation Criteria
Clear signals for when to escalate to Standard or Full workflow:
- Affects 3+ files
- Tests failing
- Architectural issues emerge
- Complex edge cases

### Project-Agnostic
Works with any:
- Programming language
- Testing framework
- Deployment process
- Version control system

## Customization Guide

### Validation Commands

Update Phase 2 validation to match your project:

**JavaScript/TypeScript:**
```bash
npm run typecheck
npm run lint
npm test
```

**Python:**
```bash
mypy .
pylint src/
pytest
```

**Rust:**
```bash
cargo check
cargo clippy
cargo test
```

**Go:**
```bash
go vet ./...
golint ./...
go test ./...
```

### Deployment Commands

Update Phase 3 deployment to match your process:

**Custom script:**
```bash
./scripts/deploy.sh staging
```

**CI/CD pipeline:**
```bash
git push origin feature-branch
```

**Direct deployment:**
```bash
npm run deploy:dev
make deploy ENV=dev
kubectl apply -f k8s/staging/
```

### Changelog Format

Choose your changelog convention:

**Keep a Changelog:**
```markdown
## [Unreleased]
### Changed
- Improved button spacing
```

**Custom format:**
```markdown
## Title: Improve button spacing
### Changes Made:
- Increased padding from 8px to 16px
```

**Git commits only:**
```
refactor: improve button spacing for better UX
```

## Examples

### Example 1: CSS Spacing Update

**Task**: "Adjust card padding for better visual hierarchy"

**Phase 1 (10 min)**: Update CSS padding/margin values
**Phase 2 (5 min)**: Peer reviews, requests mobile breakpoint check
**Phase 3 (2 min)**: Deploy to staging

**Total**: 17 minutes ✅

### Example 2: Extract Helper Function

**Task**: "Extract email validation into reusable utility"

**Phase 1 (8 min)**: Create `validateEmail()` function, update callers
**Phase 2 (7 min)**: Peer reviews, requests null handling and tests
**Phase 3 (3 min)**: Add tests, deploy

**Total**: 18 minutes ✅

### Example 3: Refactor Component (Escalation)

**Task**: "Simplify UserProfile component"

**Phase 1 (15 min)**: Start refactoring, realize affects 4 files
**Escalation**: Switch to Standard workflow (needs planning)

**Total**: Escalated after 15 minutes ✅

## Anti-Patterns to Avoid

### ❌ Skipping Review
Don't deploy immediately without peer feedback. That's what Quick workflow is for.

### ❌ Ignoring Feedback
Don't dismiss peer concerns. Address them or escalate to discuss.

### ❌ Scope Creep
Don't expand the change beyond the original intent. Escalate if needed.

## Integration with Atlas

If using the full Atlas Framework, this skill integrates with:

- **atlas-agent-peer-reviewer**: Automated peer review with structured feedback
- **atlas-standard**: Escalation target when complexity emerges
- **atlas-quick**: De-escalation target when validation not needed
- **atlas-full**: Escalation target for complex requirements

## Success Metrics

Track these indicators to measure workflow effectiveness:

- **Completion time**: Should be < 30 minutes
- **Review cycles**: Should be 1-2 iterations
- **Escalation rate**: Should be < 20% of attempts
- **Bugs found post-deploy**: Should be minimal (review is working)

## Contributing

To improve this generic skill:

1. Test in your project environment
2. Document edge cases encountered
3. Suggest improvements to templates
4. Share customization examples

## License

This generic Atlas Iterative skill is project-agnostic and can be freely adapted for any codebase.

## Support

For questions or issues:
- Check the "Project Customization" section in `skill.md`
- Review the examples for common scenarios
- Ensure `.atlas/conventions.md` exists for project-specific rules

---

**Version**: 1.0.0
**Last Updated**: 2025-01-17
**Adapted From**: StackMap Atlas Iterative workflow
