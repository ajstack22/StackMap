# Generic Peer Reviewer Skill - Creation Summary

## Overview

Successfully created a **generic, portable version** of the Atlas peer-reviewer agent skill by removing StackMap-specific details and replacing them with customizable, project-agnostic patterns.

## What Was Created

### Core Files

1. **SKILL.md** (12,500 lines)
   - Adversarial Protocol (5 steps: Assume Nothing, Verify Everything, Trace Logic, Consult Knowledge Base, Issue Verdict)
   - Three verdict types: REJECTED, CONDITIONAL PASS, PASS
   - Generic review checklists for code quality, architecture, testing, documentation
   - Customization instructions (load rules from `.atlas/conventions.md` and `.atlas/rejection-criteria.md`)
   - Common review scenarios (bug fix, feature, refactoring)
   - Example reviews (excellent, needs work, minor issues)
   - Anti-patterns to reject

2. **resources/rejection-criteria.md** (7,400 lines)
   - Build & test failures
   - Generic architectural violations (state management, naming conventions, code organization)
   - Security vulnerabilities (credentials, injection, auth/authz)
   - Production safety issues (debug code, error handling, resource leaks, infinite loops)
   - Data integrity violations (null safety, data migration, state consistency)
   - Documentation & evidence requirements
   - Performance violations (regressions, algorithmic inefficiency)
   - Platform-specific templates (multi-platform, web, mobile)
   - Project-specific section (load from `.atlas/rejection-criteria.md`)

3. **README.md** (4,800 lines)
   - Installation instructions
   - Quick start guide
   - Customization system explained
   - Example usage patterns
   - Verdict explanations
   - Adversarial Protocol overview
   - Generic review checklist
   - Integration with CI/CD
   - Tips for developers, reviewers, and teams
   - Model selection rationale (why Opus)
   - Maintenance instructions

4. **CHANGELOG.md** (1,200 lines)
   - Version 1.0.0 release notes
   - What's included
   - Key features
   - Differences from StackMap version
   - Migration guide
   - Future enhancements
   - Contributing guidelines

### Example Files

5. **examples/conventions-react-typescript.md** (5,000 lines)
   - Complete example for React + TypeScript projects
   - Naming conventions
   - TypeScript patterns
   - React patterns (components, hooks, props)
   - Redux state management
   - Error handling
   - Testing guidelines
   - Code organization
   - Performance optimization
   - Accessibility requirements
   - Documentation standards
   - Security best practices
   - Git workflow

6. **examples/conventions-node-express.md** (6,500 lines)
   - Complete example for Node.js + Express projects
   - Naming conventions
   - Project structure
   - RESTful API design
   - Controller/Service pattern
   - Error handling
   - Security (auth, validation, rate limiting, SQL injection)
   - Database patterns (models, migrations, query optimization)
   - Testing guidelines
   - Logging best practices
   - Environment configuration
   - Performance optimization
   - Monitoring and health checks

## Key Changes from StackMap Version

### Removed (StackMap-Specific)

1. **Store Usage Checks**
   - ❌ `useAppStore.setState()` violations
   - ❌ Store-specific method requirements
   - ❌ StackMap store architecture references

2. **Field Naming Checks**
   - ❌ `activity.text` vs `activity.name` enforcement
   - ❌ `activity.icon` vs `activity.emoji` enforcement
   - ❌ Legacy field migration rules

3. **Platform-Specific Rules**
   - ❌ Typography component requirement (Android font handling)
   - ❌ FlexWrap card layout rules
   - ❌ AsyncStorage debouncing rules (iOS-specific)
   - ❌ NetInfo.fetch() prohibition
   - ❌ Alert.alert() vs ConfirmModal requirement

4. **Accessibility Rules**
   - ❌ Gray text prohibition (#666, #999, etc.)
   - ❌ Black text requirement (#000)
   - (Replaced with generic high-contrast requirements)

### Added (Generic & Customizable)

1. **Customization System**
   - ✅ Load conventions from `.atlas/conventions.md`
   - ✅ Load rejection criteria from `.atlas/rejection-criteria.md`
   - ✅ Instructions for creating project-specific rules

2. **Generic Patterns**
   - ✅ Generic state management checks (load from conventions)
   - ✅ Generic naming convention checks (load from conventions)
   - ✅ Generic platform compatibility templates
   - ✅ Generic architectural violation patterns

3. **Example Conventions**
   - ✅ React + TypeScript example
   - ✅ Node.js + Express example
   - ✅ Templates for other tech stacks

4. **Documentation**
   - ✅ Comprehensive README with customization guide
   - ✅ CHANGELOG with migration instructions
   - ✅ Examples showing how to add project-specific rules

## Usage

### Basic Usage (Generic Rules Only)

```bash
# Review with generic best practices
"Review my changes for user authentication feature"
```

Reviews will check:
- Build passes
- Tests pass
- No security issues
- Proper error handling
- No resource leaks
- Proper null checks

### Advanced Usage (With Project-Specific Rules)

```bash
# 1. Create project conventions
# .atlas/conventions.md - coding standards
# .atlas/rejection-criteria.md - blocking issues

# 2. Review with generic + project-specific rules
"Review my changes for user authentication feature"
```

Reviews will check:
- All generic best practices
- Your naming conventions
- Your state management patterns
- Your testing requirements
- Your documentation standards

## Customization Examples

### Example 1: Add Redux State Management Rules

**.atlas/conventions.md:**
```markdown
## State Management (Redux)
- Use action creators (not direct dispatch)
- Use Redux Toolkit's createSlice
- Keep reducers pure
```

**.atlas/rejection-criteria.md:**
```markdown
## State Management (Critical)
- ❌ Direct dispatch of plain objects
  ```bash
  grep -rn "dispatch({" src/
  ```
```

### Example 2: Add API Design Rules

**.atlas/conventions.md:**
```markdown
## API Design
- Use RESTful conventions
- Always version APIs (/v1/, /v2/)
- Consistent response format
```

**.atlas/rejection-criteria.md:**
```markdown
## API Design (Critical)
- ❌ Missing API versioning
- ❌ Non-RESTful endpoints
- ❌ Inconsistent response format
```

## File Structure

```
atlas-skills-generic/atlas-agent-peer-reviewer/
├── SKILL.md                          # Main skill definition
├── README.md                         # Installation & usage guide
├── CHANGELOG.md                      # Version history
├── SUMMARY.md                        # This file
├── resources/
│   └── rejection-criteria.md        # Comprehensive blocking issues
└── examples/
    ├── conventions-react-typescript.md  # React + TS example
    └── conventions-node-express.md      # Node.js + Express example
```

## Key Features

1. **Generic & Portable**
   - Works with any codebase
   - No framework-specific assumptions
   - Customizable for any tech stack

2. **Evidence-Based**
   - All rejections require proof
   - Command output, code snippets, screenshots
   - No subjective opinions

3. **Opus-Powered**
   - Uses Claude Opus for deep analysis
   - Better at finding edge cases
   - More thorough security review

4. **Three Verdicts**
   - REJECTED: Blocking issues, must fix
   - CONDITIONAL PASS: Minor issues, can deploy
   - PASS: Perfect compliance, ready to merge

5. **Customizable**
   - Load project rules from `.atlas/conventions.md`
   - Load rejection criteria from `.atlas/rejection-criteria.md`
   - Apply generic best practices + project-specific rules

6. **Comprehensive**
   - Generic review checklist (code quality, architecture, testing, docs)
   - Security checks (credentials, injection, auth)
   - Performance checks (regressions, memory leaks)
   - Platform-specific templates

## Model Selection

**Uses Claude Opus** because:
- Adversarial thinking (finds edge cases)
- Deep analysis (thorough examination)
- Security focus (identifies vulnerabilities)
- Evidence gathering (comprehensive proof)
- Quality over speed (blocking operations)

## Integration

### Atlas Workflows

**Standard Workflow (Phase 4 - Review):**
```
Phase 4: Review
- Peer reviewer validates implementation
- Issues verdict
- Developer fixes if rejected
```

**Full Workflow (Phase 6 - Validate):**
```
Phase 6: Validate
- Peer reviewer validates after testing
- Ensures quality gates met
- Checks documentation
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Run Peer Review
  run: atlas invoke peer-reviewer --pr ${{ github.event.pull_request.number }}

- name: Check Verdict
  run: |
    if grep -q "🔴 REJECTED" review-output.txt; then
      exit 1
    fi
```

## Next Steps

1. **Test with Multiple Projects**
   - React projects
   - Node.js projects
   - Python projects
   - Go projects

2. **Gather Feedback**
   - Developer experience
   - Review quality
   - Customization ease

3. **Create More Examples**
   - Python + Django
   - Go + Gin
   - Ruby + Rails
   - Java + Spring Boot

4. **Add CI/CD Templates**
   - GitHub Actions
   - GitLab CI
   - Jenkins
   - CircleCI

5. **Metrics & Monitoring**
   - Track rejection rates
   - Track common issues
   - Track review quality
   - Team dashboards

## Success Criteria

The generic peer-reviewer skill is successful if:

1. **Portable**: Works with any codebase without modification
2. **Customizable**: Easy to add project-specific rules
3. **Effective**: Catches issues before they reach users
4. **Efficient**: Reviews complete in reasonable time
5. **Developer-Friendly**: Feedback is clear, actionable, and helpful

## Conclusion

Successfully created a **generic, portable version** of the Atlas peer-reviewer agent skill that:
- Removes all StackMap-specific details
- Provides generic best practices for all projects
- Allows customization via `.atlas/conventions.md` and `.atlas/rejection-criteria.md`
- Includes comprehensive documentation and examples
- Uses Claude Opus for deep, adversarial review
- Works with Atlas Standard and Full workflows

The skill is ready for use in any codebase and can be easily customized to enforce project-specific standards.
