# Atlas Agent: Peer Reviewer (Generic) - Index

Quick navigation guide for the generic peer-reviewer skill.

## Quick Start

1. **New to peer reviews?** Start here: [README.md](./README.md)
2. **Want to use the skill?** See: [SKILL.md - When to Invoke](#when-to-invoke-this-agent)
3. **Need to customize?** See: [README.md - Customization](#customization)

## Core Files

### [SKILL.md](./SKILL.md) (28 KB)
**Main skill definition - Read this to understand the adversarial protocol**

Key sections:
- **Core Mission** - What the peer reviewer does
- **When to Invoke This Agent** - Workflow integration
- **The Adversarial Protocol** - 5-step review process
- **Verdicts** - REJECTED, CONDITIONAL PASS, PASS explained
- **Automatic Rejection Criteria** - Instant blocking issues
- **Review Process** - Step-by-step review guide
- **Generic Review Checklist** - What to check in every review
- **Common Review Scenarios** - Bug fix, feature, refactoring examples
- **Example Reviews** - Excellent, needs work, minor issues examples
- **Anti-Patterns to Reject** - Common bad practices
- **Customizing for Your Project** - How to add project-specific rules

### [README.md](./README.md) (13 KB)
**Installation and usage guide - Start here if you're new**

Key sections:
- **Overview** - What the skill provides
- **Installation** - How to install in your project
- **Quick Start** - Basic and advanced usage
- **Customization** - Creating `.atlas/conventions.md` and `.atlas/rejection-criteria.md`
- **Example Usage** - Generic rules vs project-specific rules
- **Verdicts Explained** - When to use each verdict
- **The Adversarial Protocol** - High-level overview
- **Common Review Checks** - Automated and manual checks
- **Integration with CI/CD** - GitHub Actions example
- **Tips for Best Results** - For developers, reviewers, and teams
- **Model Selection: Why Opus?** - Rationale for using Opus

## Resources

### [resources/rejection-criteria.md](./resources/rejection-criteria.md) (20 KB)
**Comprehensive list of blocking issues - Reference during reviews**

Key sections:
- **Build & Tests** - Automatic rejection for failures
- **Generic Architectural Violations** - Code organization, state management, naming
- **Production Safety Violations** - Debug code, error handling, resource leaks
- **Security Violations** - Credentials, injection, auth/authz
- **Data Integrity Violations** - Null safety, migrations, state consistency
- **Documentation & Evidence Violations** - Missing proof, incomplete docs
- **Performance Violations** - Regressions, memory leaks, inefficiency
- **Platform-Specific Violations** - Multi-platform, web, mobile templates
- **Project-Specific Violations** - Load from `.atlas/rejection-criteria.md`
- **Summary: Instant Rejection Checklist** - Quick reference

## Examples

### [examples/conventions-react-typescript.md](./examples/conventions-react-typescript.md) (12 KB)
**Example conventions for React + TypeScript projects**

Covers:
- Naming conventions
- TypeScript patterns
- React patterns (components, hooks, props)
- Redux state management
- Error handling
- Testing
- Code organization
- Performance
- Accessibility
- Documentation
- Security
- Git workflow

### [examples/conventions-node-express.md](./examples/conventions-node-express.md) (16 KB)
**Example conventions for Node.js + Express projects**

Covers:
- Naming conventions
- Project structure
- RESTful API design
- Controller/Service pattern
- Error handling
- Security (auth, validation, rate limiting)
- Database patterns
- Testing
- Logging
- Environment configuration
- Performance
- Monitoring

## Documentation

### [CHANGELOG.md](./CHANGELOG.md) (4.1 KB)
**Version history and migration guide**

Includes:
- Version 1.0.0 release notes
- What's included
- Differences from StackMap version
- Migration guide
- Future enhancements

### [SUMMARY.md](./SUMMARY.md) (10 KB)
**Creation summary and key changes**

Includes:
- What was created
- Key changes from StackMap version
- Usage examples
- Customization examples
- File structure
- Success criteria

## Quick Reference

### The Adversarial Protocol (5 Steps)

1. **Assume Nothing** - Don't trust claims, verify everything
2. **Verify Everything** - Run validation suite, check code
3. **Trace the Logic** - Follow data flow, test edge cases
4. **Consult the Knowledge Base** - Check docs, enforce standards
5. **Issue a Verdict** - Evidence-based decision

### Three Verdicts

- **🔴 REJECTED** - Blocking issues, must fix all
- **⚠️ CONDITIONAL PASS** - Minor issues, can deploy
- **✅ PASS** - Perfect compliance, ready to merge

### Customization Files

Create these files to add project-specific rules:

1. **`.atlas/conventions.md`** - Your coding standards
2. **`.atlas/rejection-criteria.md`** - Your blocking issues

The peer reviewer will apply generic best practices + your project rules.

### Model

**Claude Opus** - Adversarial, thorough, finds edge cases

## File Sizes

```
SKILL.md                          28 KB   (main definition)
README.md                         13 KB   (usage guide)
SUMMARY.md                        10 KB   (creation summary)
CHANGELOG.md                      4.1 KB  (version history)
resources/rejection-criteria.md   20 KB   (blocking issues)
examples/conventions-react-*.md   12 KB   (React example)
examples/conventions-node-*.md    16 KB   (Node.js example)
```

**Total:** ~103 KB

## Typical Workflow

### For Developers

1. Make changes to code
2. Run local checks (`npm test`, `npm run lint`, etc.)
3. Create pull request with evidence
4. Peer reviewer validates
5. Fix issues if REJECTED
6. Merge when PASS

### For Reviewers

1. Read requirements and PR description
2. Run automated checks (build, test, lint)
3. Review changed files
4. Verify project conventions
5. Trace data flow and test edge cases
6. Issue verdict with evidence

### For Teams

1. Create `.atlas/conventions.md` with team standards
2. Create `.atlas/rejection-criteria.md` with blocking issues
3. Use peer reviewer in Atlas workflows
4. Track metrics (rejection rate, review time)
5. Update conventions as team learns

## Common Tasks

### Task: Review a bug fix

1. Reproduce the bug in old code
2. Verify fix addresses root cause
3. Check for new bugs introduced
4. Verify tests added
5. Issue verdict

**See:** [SKILL.md - Scenario 1: Bug Fix Review](./SKILL.md#scenario-1-bug-fix-review)

### Task: Review a feature

1. Trace data flow
2. Test edge cases
3. Check error handling
4. Verify documentation updated
5. Issue verdict

**See:** [SKILL.md - Scenario 2: Feature Implementation Review](./SKILL.md#scenario-2-feature-implementation-review)

### Task: Review a refactoring

1. Verify tests pass (behavior unchanged)
2. Check code complexity reduced
3. Verify no performance regression
4. Issue verdict

**See:** [SKILL.md - Scenario 3: Refactoring Review](./SKILL.md#scenario-3-refactoring-review)

### Task: Add project-specific rules

1. Create `.atlas/conventions.md`
2. Add coding standards
3. Create `.atlas/rejection-criteria.md`
4. Add blocking issues
5. Test with peer reviewer

**See:** [README.md - Customization](./README.md#customization)

## Support

For issues or questions:

1. Check [SKILL.md](./SKILL.md) for protocol details
2. Check [resources/rejection-criteria.md](./resources/rejection-criteria.md) for blocking issues
3. Check [README.md](./README.md) for usage guide
4. Check [examples/](./examples/) for tech stack examples
5. Open issue in Atlas Framework repository

## License

Part of the Atlas Framework. Same license as Atlas.

---

**Remember:** The peer reviewer is the last line of defense. Every issue caught in review is an issue that won't affect users.
