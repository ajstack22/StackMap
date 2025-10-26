# Atlas Iterative Workflow - Generic Version

**Version**: 1.0.0
**Created**: 2025-01-17
**Source**: StackMap Atlas Iterative workflow (converted to generic)

---

## Quick Start

1. Copy `skill.md` to your project's Atlas skills directory
2. Customize using templates in `examples/`
3. Invoke with: `"[Task]. Use Atlas Iterative workflow."`

**Time**: 15-30 minutes per task
**Perfect for**: Style improvements, simple refactors, UI tweaks needing validation

---

## File Structure

```
atlas-iterative/
├── skill.md                           (16KB) - Main workflow documentation
├── README.md                          (5.6KB) - Usage guide and quick start
├── INDEX.md                           (this file)
├── CONVERSION_NOTES.md                (10KB) - Detailed conversion notes
└── examples/
    ├── conventions.md                 (8.9KB) - Project conventions template
    ├── anti-patterns.sh               (10KB) - Automated checks script
    └── deployment-configs.md          (11KB) - Deployment examples
```

**Total**: 7 files, ~61KB documentation

---

## Core Files

### skill.md - Main Workflow Documentation
The complete Iterative workflow specification with:
- When to use (vs Quick/Standard/Full workflows)
- 3-phase process (Make Change → Peer Review → Deploy)
- Implementation checklist
- Review cycle guidance
- Escalation criteria
- Anti-patterns to avoid
- Complete example walkthrough
- Project customization instructions

**Use this**: Primary workflow reference

---

### README.md - Usage Guide
Quick start guide with:
- Overview of the workflow
- Installation instructions
- When to use decision matrix
- Customization guide
- Success metrics
- Support information

**Use this**: First-time setup and orientation

---

## Example Templates

### examples/conventions.md - Project Conventions
Comprehensive template for `.atlas/conventions.md` covering:
- Code quality standards
- Naming conventions (JavaScript, Python, Rust, Go)
- State management patterns
- API & data handling
- Testing requirements
- Platform-specific rules (mobile, web)
- Security guidelines
- Documentation standards
- Git conventions
- Deployment checklist

**How to use**:
1. Copy to `.atlas/conventions.md` in your project root
2. Remove sections not relevant to your project
3. Customize thresholds and rules to match your standards
4. Atlas will reference during Phase 2 peer reviews

---

### examples/anti-patterns.sh - Automated Checks
Bash script template for `.atlas/anti-patterns.sh` that checks:
- Debug statements (console.log, print, etc.)
- Commented-out code blocks
- Hardcoded credentials/secrets
- Untracked TODOs/FIXMEs
- Missing error handling
- State management anti-patterns
- Security vulnerabilities
- Performance anti-patterns
- Naming convention violations
- Test coverage

**How to use**:
1. Copy to `.atlas/anti-patterns.sh` in your project root
2. Make executable: `chmod +x .atlas/anti-patterns.sh`
3. Customize checks for your project's conventions
4. Run during Phase 2 self-review: `.atlas/anti-patterns.sh`

**Exit codes**:
- `0` - All checks passed
- `1` - Errors found (blocks deployment)

---

### examples/deployment-configs.md - Deployment Examples
Complete deployment configuration examples for:
1. **Simple Web App** - Static hosting (Netlify, Vercel)
2. **React/Vue/Angular** - CI/CD pipeline deployment
3. **Node.js Backend** - Docker deployment
4. **Python Service** - SSH-based deployment
5. **Mobile App** - React Native multi-platform
6. **Monorepo** - Multiple services deployment
7. **Serverless** - AWS Lambda deployment
8. **Kubernetes** - Container orchestration

Each example includes:
- Scenario description
- Phase 3 configuration
- Complete deploy scripts
- Verification steps
- Rollback procedures

**How to use**:
1. Find the scenario matching your infrastructure
2. Copy the deployment commands to Phase 3 of `skill.md`
3. Customize for your specific setup
4. Test in development environment first

---

## Documentation Files

### CONVERSION_NOTES.md - Detailed Conversion Notes
Technical documentation of the conversion process:
- What was removed (StackMap-specific content)
- What was added (generic equivalents)
- Workflow structure preservation
- Example transformations
- Quality assurance checklist
- Testing recommendations
- Maintenance guidelines

**Use this**: Understanding conversion decisions, maintaining the generic version

---

### INDEX.md - This File
Quick reference and navigation guide for all files in the skill.

---

## Workflow Overview

### The 3 Phases

```
┌─────────────────┐
│  Phase 1:       │  5-15 minutes
│  Make Change    │  - Understand requirement
│                 │  - Implement change
│                 │  - Self-verify
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Phase 2:       │  5-10 minutes (may cycle)
│  Peer Review    │  - Self-review (typecheck, lint, test)
│  (Cycle)        │  - Submit for peer review
│                 │  - Receive feedback
│                 │  - Address issues
│                 │  - Re-submit until PASS
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Phase 3:       │  2-5 minutes
│  Deploy         │  - Final validation
│                 │  - Update changelog
│                 │  - Deploy using project's process
│                 │  - Verify in environment
└─────────────────┘
```

**Total Time**: 15-30 minutes

---

## Decision Matrix: When to Use

| Scenario | Use Iterative? | Alternative |
|----------|----------------|-------------|
| Style improvement needing validation | ✅ YES | - |
| Simple refactor with peer review | ✅ YES | - |
| UI tweak requiring quality check | ✅ YES | - |
| Know what to change, want validation | ✅ YES | - |
| Typo fix, trivial change | ❌ NO | Quick workflow |
| Need research or planning | ❌ NO | Standard workflow |
| Complex feature or formal process | ❌ NO | Full workflow |
| Affects 3+ files | ❌ NO | Standard workflow |

---

## Integration with Atlas Framework

This skill integrates with:

- **atlas-quick** - De-escalate to if validation not needed
- **atlas-standard** - Escalate to if complexity emerges
- **atlas-full** - Escalate to if formal requirements needed
- **atlas-agent-peer-reviewer** - Automated peer review (if available)

---

## Customization Quick Reference

### Minimal Setup (5 minutes)
1. Copy `skill.md` to your project
2. Update Phase 3 deployment commands
3. Start using: `"[Task]. Use Atlas Iterative workflow."`

### Recommended Setup (30 minutes)
1. Copy `skill.md` to `.atlas/skills/atlas-iterative/`
2. Copy `examples/conventions.md` to `.atlas/conventions.md`
3. Customize conventions for your project
4. Update Phase 3 deployment commands
5. Test with a simple task

### Full Setup (1-2 hours)
1. Copy `skill.md` to `.atlas/skills/atlas-iterative/`
2. Copy and customize `.atlas/conventions.md`
3. Copy and customize `.atlas/anti-patterns.sh`
4. Configure deployment scripts
5. Test workflow with team
6. Gather feedback and iterate

---

## Language Support

This generic version supports any language/framework. Examples provided for:

**Languages**: JavaScript, TypeScript, Python, Rust, Go
**Frameworks**: React, Vue, Angular, Flask, Django, Express, Fastify
**Mobile**: React Native, Flutter
**Infrastructure**: Docker, Kubernetes, Serverless (AWS Lambda)
**Deployment**: CI/CD, SSH, Static hosting, Container registries

---

## Success Indicators

The workflow is working well when:
- ✅ Tasks complete in < 30 minutes
- ✅ Review cycles are 1-2 iterations (not 5+)
- ✅ Escalation rate < 20% (most tasks fit Iterative)
- ✅ Bugs found post-deploy are minimal
- ✅ Team follows conventions consistently

If any indicator fails, review:
- Are conventions clearly documented?
- Is the peer review process efficient?
- Are tasks appropriately scoped?
- Should some tasks use Quick or Standard workflow instead?

---

## Support & Maintenance

### Getting Help
1. Read `README.md` for quick start
2. Check `skill.md` for detailed workflow
3. Review `examples/` for templates
4. Read `CONVERSION_NOTES.md` for technical details

### Reporting Issues
If you find issues with the generic version:
1. Verify it's not project-specific (check `.atlas/conventions.md`)
2. Review the workflow phase where issue occurred
3. Check if the correct workflow tier was used
4. Document the issue with examples

### Contributing Improvements
To improve this generic skill:
1. Test in your project environment
2. Document what worked/didn't work
3. Propose improvements with examples
4. Share customizations that might help others

---

## Version History

### v1.0.0 (2025-01-17)
- Initial generic conversion from StackMap Atlas Iterative
- Removed all StackMap-specific content
- Added multi-language support
- Created comprehensive templates
- Added deployment configuration examples
- Professional documentation quality

---

## Next Steps

After reviewing this index:

1. **First time using?** → Start with `README.md`
2. **Want workflow details?** → Read `skill.md`
3. **Ready to customize?** → Check `examples/conventions.md`
4. **Need deployment setup?** → See `examples/deployment-configs.md`
5. **Understanding conversion?** → Read `CONVERSION_NOTES.md`

---

## File Sizes Summary

| File | Size | Purpose |
|------|------|---------|
| skill.md | 16KB | Main workflow specification |
| README.md | 5.6KB | Quick start guide |
| INDEX.md | (this file) | Navigation and reference |
| CONVERSION_NOTES.md | 10KB | Technical conversion details |
| examples/conventions.md | 8.9KB | Project conventions template |
| examples/anti-patterns.sh | 10KB | Automated checks script |
| examples/deployment-configs.md | 11KB | Deployment examples |
| **Total** | **~61KB** | Complete documentation set |

---

## Quick Commands

```bash
# Copy skill to your project
cp skill.md .atlas/skills/atlas-iterative/

# Setup conventions
cp examples/conventions.md .atlas/conventions.md

# Setup automated checks
cp examples/anti-patterns.sh .atlas/
chmod +x .atlas/anti-patterns.sh

# Test anti-patterns script
.atlas/anti-patterns.sh

# Use the workflow
# Just tell Atlas: "[Task]. Use Atlas Iterative workflow."
```

---

**Atlas Iterative Workflow - Generic Version v1.0.0**
*Professional, portable, project-agnostic workflow for structured peer review*

Ready to use in any codebase, any language, any infrastructure.
