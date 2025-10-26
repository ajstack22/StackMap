# Atlas Full Workflow - Generic Version

A comprehensive, portable 9-phase workflow for complex features, epics, and security-critical changes.

## Overview

The Atlas Full Workflow is designed for complex projects that require:
- Formal requirements and acceptance criteria
- Security audits and adversarial thinking
- Comprehensive testing across all scenarios
- Complete documentation and knowledge transfer
- Staged rollout with monitoring

**Time estimate**: 2-4 hours
**Suitable for**: ~5% of work (major features, new modules, security-critical changes)

## The 9 Phases

1. **Research** (20-30 min) - Deep exploration, feasibility analysis
2. **Story Creation** (15-20 min) - Formal requirements, acceptance criteria
3. **Planning** (20-30 min) - Technical design, architecture
4. **Adversarial Review** (15-20 min) - Security audit, edge case analysis
5. **Implementation** (60-90 min) - Parallel coding, incremental builds
6. **Testing** (30-45 min) - Comprehensive validation
7. **Validation** (15-20 min) - Acceptance criteria verification
8. **Clean-up** (15-20 min) - Documentation, artifacts, debt log
9. **Deployment** (15-20 min per stage) - Quality gates, staged rollout

## Quick Start

### 1. Read the Main Guide

Start with `SKILL.md` for complete instructions on all 9 phases.

### 2. Use the Templates

- **Story Template**: `resources/story-template.md` - Create formal user stories
- **Adversarial Checklist**: `resources/adversarial-checklist.md` - Security & edge case review
- **Quality Gates Script**: `scripts/quality-gates.sh` - Pre-deployment validation

### 3. Customize for Your Project

This is a **generic, portable version**. Customize for your needs:

#### Customize SKILL.md:
- Replace generic examples with domain-specific examples
- Add platform-specific sections (if you have multiple platforms)
- Adjust time allocations for your team's pace
- Add project-specific conventions

#### Customize story-template.md:
- Add/remove sections based on your domain
- Customize platform sections (iOS/Android/Web → Windows/Mac/Linux, etc.)
- Add domain-specific fields (e.g., compliance requirements, data migration)
- Adjust success metrics for your business

#### Customize adversarial-checklist.md:
- Add domain-specific security concerns (PCI, HIPAA, SOX, etc.)
- Add platform-specific checks for your stack
- Add project-specific anti-patterns to watch for
- Adjust thresholds (performance, coverage, etc.)

#### Customize quality-gates.sh:
```bash
# Edit these variables at the top of the script:
COVERAGE_TARGET=80              # Your test coverage target
COVERAGE_MIN_ACCEPTABLE=60      # Minimum acceptable coverage
BUNDLE_SIZE_WARNING=1024        # Bundle size warning (KB)
CHANGE_FILE="CHANGELOG.md"      # Your change tracking file

# Update npm script names to match your project:
# - npm run typecheck
# - npm run lint
# - npm test
# - npm run test:coverage
# - npm run build

# Add project-specific anti-pattern checks in Section 8
# Add project-specific security checks in Section 9
```

## File Structure

```
atlas-full/
├── SKILL.md                              # Main workflow guide (all 9 phases)
├── README.md                             # This file
├── resources/
│   ├── story-template.md                 # User story template
│   └── adversarial-checklist.md          # Security & edge case checklist
└── scripts/
    └── quality-gates.sh                  # Pre-deployment validation script
```

## When to Use Full vs Other Workflows

### Use Full Workflow When:
- 6+ files affected
- Security is critical
- Formal requirements needed
- Stakeholder sign-off required
- Epic-level work
- Comprehensive testing needed

### Use Standard Workflow When:
- 2-5 files affected
- Bug fixes or small features
- Standard testing sufficient
- No formal requirements needed

### Use Iterative Workflow When:
- Style improvements
- Simple UI tweaks
- Changes needing peer review
- Quick validation cycles

### Use Quick Workflow When:
- Color changes
- Text updates
- Typo fixes
- Single-line changes

## Integration with Your Project

### Option 1: Copy and Customize
1. Copy `atlas-skills-generic/atlas-full/` to your project
2. Customize all files for your domain
3. Update references to your project conventions
4. Train team on the workflow

### Option 2: Reference Generic Version
1. Keep generic version as reference
2. Create project-specific overlay documents
3. Link to generic templates from your docs
4. Add project-specific examples

### Option 3: Fork and Evolve
1. Fork this generic version
2. Gradually adapt for your domain
3. Share improvements back to generic version
4. Maintain your own version over time

## Example Workflow Execution

```bash
# Phase 1: Research
grep -r "related_feature" src/
git log --grep="similar feature" --oneline

# Phase 2: Story Creation
# Use resources/story-template.md

# Phase 3: Planning
# Create implementation plan

# Phase 4: Adversarial Review
# Use resources/adversarial-checklist.md

# Phase 5-7: Implementation, Testing, Validation
npm run lint
npm test
npm run build

# Phase 8: Clean-up
# Remove debug logs, update docs

# Phase 9: Deployment
./scripts/quality-gates.sh
# Then deploy according to your process
```

## Success Criteria

You've succeeded with Full Workflow when:
- ✅ 100% of acceptance criteria met
- ✅ Zero critical defects in first week
- ✅ All success metrics targets met
- ✅ Complete documentation and evidence
- ✅ Full test coverage for critical paths
- ✅ Security audit passed (if applicable)
- ✅ Smooth deployment (no rollbacks)

## Common Pitfalls

❌ **Don't:**
- Skip phases (they're fast and valuable)
- Implement everything at once without testing
- Skip documentation
- Deploy to production without staging

✅ **Do:**
- Complete all 9 phases systematically
- Implement iteratively with testing
- Document while context is fresh
- Use staged rollout

## Resources

### Generic Resources:
- `SKILL.md` - Complete workflow guide
- `resources/story-template.md` - User story template
- `resources/adversarial-checklist.md` - Security & edge case checklist
- `scripts/quality-gates.sh` - Quality gates automation

### Additional Reading:
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Test Coverage Best Practices
- Deployment Strategy Patterns
- Technical Debt Management

## Contributing

This is a generic, portable version designed to work for any project. Contributions should:
- Remain project-agnostic
- Be broadly applicable
- Not reference specific tools/frameworks (unless as examples)
- Include clear customization instructions

## License

This workflow is provided as-is for use in any project. Adapt freely for your needs.

## Version

**Version**: 1.0.0 (Generic)
**Last Updated**: 2025
**Origin**: Adapted from StackMap project workflow

---

**Remember**: The Full workflow ensures **100% acceptance, zero defects, and complete evidence**. It's rigorous because the stakes are high. Take the time to do it right. 🚀
