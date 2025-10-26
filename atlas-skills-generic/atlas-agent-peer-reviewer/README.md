# Atlas Skill: Peer Reviewer (Generic)

A portable, adversarial code review agent that enforces quality gates before code reaches users.

## Overview

This skill provides a generic peer reviewer agent that:
- Follows the **Adversarial Protocol** (5 steps: Assume Nothing, Verify Everything, Trace Logic, Consult Knowledge Base, Issue Verdict)
- Uses **Claude Opus** for deep analysis and edge case discovery
- Issues three types of verdicts: **REJECTED**, **CONDITIONAL PASS**, or **PASS**
- Enforces both generic best practices and project-specific rules

## Key Features

- **Model**: Uses **Opus** for adversarial, thorough reviews
- **Evidence-based**: All rejections must include proof (command output, code snippets)
- **Customizable**: Load project-specific rules from `.atlas/conventions.md` and `.atlas/rejection-criteria.md`
- **Zero assumptions**: Verifies developer claims rather than trusting them
- **Blocking issues**: Automatic rejection for critical violations (security, build failures, tests)

## Installation

1. Copy this directory to your project's Atlas skills folder:
   ```bash
   cp -r atlas-skills-generic/atlas-agent-peer-reviewer /your-project/.atlas/skills/
   ```

2. Create project-specific configuration files (optional but recommended):
   ```bash
   mkdir -p .atlas
   touch .atlas/conventions.md
   touch .atlas/rejection-criteria.md
   ```

## Quick Start

### Basic Usage

Invoke the peer reviewer in your Atlas workflows:

```
"Review my changes for user authentication feature"
"Adversarial review of PR #123"
"Deep review of performance optimization"
```

### In Atlas Workflows

**Standard Workflow** (Phase 4 - Review):
```
Phase 4: Review
- Peer reviewer validates implementation
- Issues PASS, CONDITIONAL PASS, or REJECTED verdict
- Developer fixes issues if REJECTED
```

**Full Workflow** (Phase 6 - Validate):
```
Phase 6: Validate
- Peer reviewer validates after testing
- Ensures all quality gates met
- Checks documentation and evidence
```

**Iterative Workflow**:
```
After each iteration:
- Peer reviewer validates changes
- PASS = continue, REJECTED = fix and retry
```

## Customization

### 1. Create `.atlas/conventions.md`

Document your project's coding standards:

```markdown
# Project Coding Conventions

## Naming Conventions
- Functions: camelCase (e.g., `getUserData`)
- Classes: PascalCase (e.g., `UserService`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- Files: kebab-case (e.g., `user-service.js`)

## State Management
- Use Redux action creators (not direct dispatch)
- Use selectors for derived state
- Keep reducers pure (no side effects)
- Action types as constants

## Error Handling
- All async functions must have try/catch
- Log errors with context (not just error message)
- Show user-friendly error messages
- Use Error subclasses for different error types

## Testing
- Test file names: `*.test.js` or `*.spec.js`
- Coverage requirement: 80% minimum
- Mock external dependencies (API calls, etc.)
- Use descriptive test names (should/when pattern)

## Code Organization
- Feature-based folder structure
- Max function length: 50 lines
- Max file length: 300 lines
- Single responsibility per module

## Documentation
- JSDoc for public APIs
- Comments for complex logic (not obvious code)
- Update CHANGELOG.md for all user-facing changes
- Update README.md for new features

## Imports
- Sort imports: external libs, internal libs, local files
- No unused imports
- Use named imports (not default) where possible
```

### 2. Create `.atlas/rejection-criteria.md`

Define blocking issues specific to your project:

```markdown
# Project Rejection Criteria

## Architectural Violations

### State Management (Critical)
- ❌ Direct state mutation (must use immutable updates)
  ```javascript
  // ❌ Wrong
  state.users.push(newUser)

  // ✅ Correct
  state = { ...state, users: [...state.users, newUser] }
  ```

- ❌ Business logic in React components (must be in services)
  ```javascript
  // ❌ Wrong: Business logic in component
  function UserProfile() {
    const calculateDiscount = (user) => {
      // Complex business logic here
    }
  }

  // ✅ Correct: Business logic in service
  function UserProfile() {
    const discount = userService.calculateDiscount(user)
  }
  ```

- ❌ Circular dependencies between modules
  - Module A imports B, B imports A = REJECTED

### API Design (Critical)
- ❌ REST endpoints not following REST conventions
- ❌ Missing API versioning (must use /v1/, /v2/, etc.)
- ❌ No rate limiting on public endpoints
- ❌ Inconsistent error response format

### Database (Critical)
- ❌ Queries without proper indexes (check EXPLAIN PLAN)
- ❌ N+1 query problems (must use joins or batch loading)
- ❌ Missing database migrations (must include migration file)
- ❌ Queries without LIMIT clause (must protect against large result sets)

### Authentication (Critical)
- ❌ API endpoints without authentication
- ❌ Client-side only authorization checks
- ❌ Tokens stored in localStorage (use httpOnly cookies)
- ❌ No rate limiting on auth endpoints

## Platform-Specific (Web)

### Accessibility (Critical)
- ❌ Interactive elements without keyboard support
- ❌ Images without alt text
- ❌ Form inputs without labels
- ❌ Color as only means of conveying information

### Performance (Critical)
- ❌ Bundle size over 500KB (must code-split)
- ❌ No lazy loading for large images
- ❌ No virtualization for long lists (>100 items)

## Team Conventions

### Git (Critical)
- ❌ Direct commits to main/master branch
- ❌ Commit messages not following format: "type(scope): message"
- ❌ Large files (>1MB) without Git LFS
- ❌ Merge commits (use rebase)

### Documentation (Critical)
- ❌ Breaking changes without CHANGELOG.md update
- ❌ New environment variables without .env.example update
- ❌ New npm scripts without package.json documentation
```

### 3. Enable in Reviews

The peer reviewer will automatically:
1. Load conventions from `.atlas/conventions.md`
2. Load rejection criteria from `.atlas/rejection-criteria.md`
3. Apply generic best practices (from `SKILL.md`)
4. Apply your project-specific rules
5. Issue verdict based on combined criteria

## Example Usage

### Example 1: Review with Generic Rules Only

If you haven't created custom files, the reviewer uses generic best practices:

```bash
# Review validates:
- Build passes
- Tests pass
- No security issues
- No hardcoded credentials
- Proper error handling
- No resource leaks
- Proper null checks
```

### Example 2: Review with Project-Specific Rules

With `.atlas/conventions.md` and `.atlas/rejection-criteria.md`:

```bash
# Review validates all generic rules PLUS:
- Your naming conventions
- Your state management patterns
- Your API design rules
- Your testing requirements
- Your documentation standards
```

### Example 3: Full Review Output

```
✅ PASS

Verification Summary:
- Tests: ✅ Pass (24/24)
- Type Checking: ✅ Pass
- Build: ✅ Success
- Linting: ✅ Pass
- Project Conventions: ✅ Followed
  - Naming: camelCase for functions (per conventions.md)
  - State: Redux action creators used (per conventions.md)
  - Error handling: try/catch with logging (per conventions.md)
  - No debug code
- Edge Cases: ✅ Covered
- Documentation: ✅ Updated
- Security: ✅ No concerns

Review Notes:
Excellent implementation following all project standards.

Approved for merge and deployment.
```

## Verdicts Explained

### 🔴 REJECTED (Blocking)
**Use when:**
- Build broken
- Tests fail
- Security vulnerability
- Critical architectural violation
- Performance regression

**Developer must:**
- Fix ALL issues
- Resubmit for review

### ⚠️ CONDITIONAL PASS (Non-blocking)
**Use when:**
- Minor documentation missing
- Code style could be better
- Minor test coverage gaps
- TODO without timeline

**Developer can:**
- Deploy now
- Address conditions in follow-up

### ✅ PASS (Ready)
**Use when:**
- All validation passes
- All conventions followed
- Edge cases handled
- Documentation updated

**Developer can:**
- Merge and deploy immediately

## The Adversarial Protocol

The peer reviewer follows a strict 5-step protocol:

### 1. Assume Nothing
- Don't trust PR descriptions
- Verify all claims
- Reproduce bugs before accepting fixes

### 2. Verify Everything
- Run all validation commands
- Check architectural patterns
- Review every changed line

### 3. Trace the Logic
- Follow data flow
- Test edge cases
- Verify error handling

### 4. Consult the Knowledge Base
- Check project documentation
- Enforce conventions
- Apply rejection criteria

### 5. Issue a Verdict
- Evidence-based decision
- Clear, actionable feedback
- Specific file/line references

## Common Review Checks

### Automatic Checks (Always Run)
```bash
# Build verification
npm run build

# Test verification
npm test

# Type checking (if applicable)
npm run typecheck

# Linting
npm run lint
```

### Project Convention Checks
```bash
# Naming conventions (example from conventions.md)
grep -rn "function [A-Z]" src/  # Functions should be camelCase

# Debug code (example from rejection-criteria.md)
grep -rn "console.log" src/ | grep -v "if.*dev"

# TODOs without dates
grep -rn "TODO[^(]" src/
```

### Security Checks
```bash
# Hardcoded secrets
grep -rni "api[_-]key.*=.*['\"]" src/
grep -rni "password.*=.*['\"]" src/

# Sensitive data in logs
grep -rn "console.log.*password\|ssn\|creditCard" src/
```

## Integration with CI/CD

The peer reviewer can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions
name: Peer Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Atlas Peer Review
        run: atlas invoke peer-reviewer --pr ${{ github.event.pull_request.number }}
      - name: Check Verdict
        run: |
          if grep -q "🔴 REJECTED" review-output.txt; then
            echo "Review REJECTED"
            exit 1
          fi
```

## Tips for Best Results

### For Developers
1. **Provide evidence**: Include test output, screenshots, command results
2. **Document changes**: Update changelog, README, API docs
3. **Run checks locally**: Don't wait for reviewer to find obvious issues
4. **Be specific in PR**: Clear description, acceptance criteria, testing done

### For Reviewers
1. **Be thorough**: Check every changed line
2. **Be specific**: File, line number, exact fix needed
3. **Be fair**: Reject only blocking issues, not preferences
4. **Be helpful**: Explain why (not just what)

### For Teams
1. **Document standards**: Keep `.atlas/conventions.md` updated
2. **Review conventions**: Update as team learns and grows
3. **Automate checks**: Add linting, formatting, security scanning
4. **Learn from reviews**: Track common issues, update standards

## Model Selection: Why Opus?

This skill uses **Claude Opus** for peer reviews because:

- **Adversarial thinking**: Better at finding edge cases and potential issues
- **Deep analysis**: More thorough examination of code paths
- **Security focus**: Better at identifying vulnerabilities
- **Evidence gathering**: More comprehensive proof collection
- **Quality over speed**: Reviews are blocking operations where quality matters

For faster, less critical reviews, consider using Sonnet with a lighter checklist.

## Maintenance

### Updating the Skill

When Atlas releases updates to this skill:

```bash
# Backup your custom files
cp .atlas/conventions.md .atlas/conventions.md.backup
cp .atlas/rejection-criteria.md .atlas/rejection-criteria.md.backup

# Update the skill
cp -r atlas-skills-generic/atlas-agent-peer-reviewer /your-project/.atlas/skills/

# Your custom files are preserved (they're in .atlas/, not the skill folder)
```

### Monitoring Review Quality

Track metrics:
- **Rejection rate**: Too high? Standards too strict or code quality issue
- **Issues found in production**: Reviewer missed something
- **Review time**: Too long? Simplify checklist or use parallel reviews
- **Developer satisfaction**: Feedback helpful or nitpicky?

## Examples

See `examples/` directory (if included) for:
- Example `.atlas/conventions.md` files for different tech stacks
- Example `.atlas/rejection-criteria.md` files for common patterns
- Sample review outputs for PASS/CONDITIONAL PASS/REJECTED

## Support

For issues or questions:
1. Check the main SKILL.md for protocol details
2. Review resources/rejection-criteria.md for comprehensive blocking issues
3. Consult Atlas documentation for workflow integration
4. Open an issue in the Atlas framework repository

## License

This skill is part of the Atlas Framework and follows the same license.

---

**Remember**: The peer reviewer is the last line of defense. Every issue caught in review is an issue that won't affect users.
