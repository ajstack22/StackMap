# Atlas Standard - File Index

Quick navigation guide for all files in the generic atlas-standard skill.

## Start Here

1. **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide
   - Get started in 5 minutes
   - Basic usage examples
   - Common workflows

2. **[README.md](README.md)** - Complete overview
   - What is Atlas Standard
   - Setup instructions
   - Customization guide
   - CI/CD integration

## Core Documentation

3. **[SKILL.md](SKILL.md)** - Complete workflow guide ⭐ **MAIN REFERENCE**
   - The 5 phases in detail
   - Checklists for each phase
   - Examples and best practices
   - Customization instructions

## Supporting Documentation

4. **[CHANGELOG.md](CHANGELOG.md)** - Version history
   - What's new
   - What changed from StackMap version
   - Migration guide

5. **[CONVERSION_SUMMARY.md](CONVERSION_SUMMARY.md)** - Technical details
   - Complete conversion summary
   - File-by-file breakdown
   - Features comparison

6. **[INDEX.md](INDEX.md)** - This file
   - Navigation guide

## Resources

7. **[resources/research-patterns.md](resources/research-patterns.md)** - Research techniques
   - Command references
   - Pattern-based strategies
   - Generic checklists
   - Advanced techniques

## Scripts

8. **[scripts/validate-standard.sh](scripts/validate-standard.sh)** - Validation script
   - Runs all quality checks
   - Loads custom validation
   - Color-coded output
   - CI/CD integration

## Examples (Templates)

9. **[examples/conventions.md](examples/conventions.md)** - Project conventions template
   - State management patterns
   - Naming conventions
   - Code quality standards
   - Copy to `.atlas/conventions.md`

10. **[examples/validation.sh](examples/validation.sh)** - Custom validation template
    - 15+ validation check examples
    - Security checks
    - Performance checks
    - Copy to `.atlas/validation.sh`

11. **[examples/deployment.md](examples/deployment.md)** - Deployment process template
    - Environment definitions
    - Deployment steps
    - Rollback procedures
    - Copy to `.atlas/deployment.md`

## File Tree

```
atlas-standard/
├── SKILL.md ⭐ (main reference)
├── README.md (setup & overview)
├── QUICK_START.md (5-min guide)
├── INDEX.md (this file)
├── CHANGELOG.md (version history)
├── CONVERSION_SUMMARY.md (technical details)
├── resources/
│   └── research-patterns.md (research techniques)
├── scripts/
│   └── validate-standard.sh (validation)
└── examples/
    ├── conventions.md (template)
    ├── validation.sh (template)
    └── deployment.md (template)
```

## Quick Links by Use Case

### I want to get started quickly
→ [QUICK_START.md](QUICK_START.md)

### I want complete documentation
→ [SKILL.md](SKILL.md)

### I want to customize for my project
→ [examples/conventions.md](examples/conventions.md)
→ [examples/validation.sh](examples/validation.sh)
→ [examples/deployment.md](examples/deployment.md)

### I want research techniques
→ [resources/research-patterns.md](resources/research-patterns.md)

### I want to run validation
→ [scripts/validate-standard.sh](scripts/validate-standard.sh)

### I want setup instructions
→ [README.md](README.md)

### I want to see what changed
→ [CHANGELOG.md](CHANGELOG.md)
→ [CONVERSION_SUMMARY.md](CONVERSION_SUMMARY.md)

## File Sizes

- **Total**: ~3,766 lines of code/documentation
- **Documentation**: ~83 KB
- **Core workflow**: SKILL.md (20 KB)
- **Examples**: 27 KB combined
- **Scripts**: 8 KB (validation)

## Typical Reading Order

**First Time:**
1. QUICK_START.md (5 min)
2. SKILL.md - Phase 1 & 2 (10 min)
3. Try on real task (40 min)
4. Review SKILL.md phases 3-5 as needed

**Setting Up:**
1. README.md - Setup section
2. examples/conventions.md - Copy & customize
3. examples/validation.sh - Copy & customize
4. scripts/validate-standard.sh - Run test

**Daily Use:**
1. SKILL.md - Reference for current phase
2. research-patterns.md - When stuck on research
3. scripts/validate-standard.sh - Before committing

## File Purposes

### Documentation Files

| File | Purpose | When to Read |
|------|---------|--------------|
| QUICK_START.md | Get started fast | First time |
| README.md | Complete overview | Setting up |
| SKILL.md | Main workflow guide | Every task |
| INDEX.md | Navigation | When lost |
| CHANGELOG.md | Version history | Upgrading |
| CONVERSION_SUMMARY.md | Technical details | Curious |

### Resource Files

| File | Purpose | When to Use |
|------|---------|-------------|
| research-patterns.md | Research techniques | Research phase |
| validate-standard.sh | Quality checks | Before commit |

### Template Files

| File | Purpose | Action |
|------|---------|--------|
| conventions.md | Document project patterns | Copy to `.atlas/` |
| validation.sh | Custom checks | Copy to `.atlas/` |
| deployment.md | Deployment process | Copy to `.atlas/` |

## Maintenance

### Keep Updated
- conventions.md - As patterns evolve
- validation.sh - As anti-patterns emerge
- deployment.md - As process changes

### Review Periodically
- SKILL.md - Ensure still following
- README.md - Update examples
- CHANGELOG.md - Document changes

## Support

**Questions about workflow?**
→ Read SKILL.md

**Questions about setup?**
→ Read README.md or QUICK_START.md

**Questions about research?**
→ Read research-patterns.md

**Questions about validation?**
→ Read scripts/validate-standard.sh comments

**Questions about customization?**
→ Read examples/*.md files

## Contributing

To improve these docs:
1. Keep it project-agnostic
2. Add real examples
3. Test instructions
4. Update INDEX.md if adding files

---

**Pro Tip**: Bookmark SKILL.md - it's your daily reference for the 5-phase workflow.
