# Customizing Atlas for Your Project

This guide shows you how to adapt Atlas workflows to your project's specific conventions, standards, and processes.

## Table of Contents

- [Quick Customization (15 minutes)](#quick-customization-15-minutes)
- [Full Customization (1-2 hours)](#full-customization-1-2-hours)
- [Configuration Files](#configuration-files)
- [Examples by Project Type](#examples-by-project-type)
- [Advanced Customization](#advanced-customization)
- [Testing Your Configuration](#testing-your-configuration)

## Quick Customization (15 minutes)

The fastest way to make Atlas project-aware:

### Step 1: Create .atlas Directory

```bash
cd /path/to/your/project
mkdir .atlas
```

### Step 2: Copy Convention Template

```bash
cp /path/to/atlas-skills-generic/templates/conventions.md .atlas/
```

### Step 3: Edit Your Conventions

Open `.atlas/conventions.md` and fill in your project's key rules:

```markdown
# Project Conventions

## State Management
- Library: Redux Toolkit
- Update pattern: `dispatch(updateUser(userData))`
- Anti-pattern: `state.user.name = "John"` (direct mutation)

## Naming Conventions
- Components: PascalCase (e.g., UserProfile.tsx)
- Functions: camelCase with verb prefix (e.g., getUserData)
- Constants: UPPER_SNAKE_CASE (e.g., API_BASE_URL)

## Testing
- Framework: Jest + React Testing Library
- Coverage target: 80%
- Test location: __tests__ directory next to file
```

### Step 4: Use Atlas

That's it! Atlas now knows your project rules:

```
"Add a new user profile component. Use Atlas workflow."
```

Claude will automatically:
- Follow your naming conventions
- Use your state management pattern
- Apply your testing standards
- Avoid your documented anti-patterns

## Full Customization (1-2 hours)

For complete project integration, create all configuration files:

```bash
cd /path/to/your/project
mkdir .atlas

# Copy all templates
cp atlas-skills-generic/templates/conventions.md .atlas/
cp atlas-skills-generic/templates/validation.sh .atlas/
cp atlas-skills-generic/templates/deployment.md .atlas/
cp atlas-skills-generic/templates/deployment-config.sh .atlas/
cp atlas-skills-generic/templates/story-template.md .atlas/
cp atlas-skills-generic/templates/security-checklist.md .atlas/

# Make scripts executable
chmod +x .atlas/validation.sh
chmod +x .atlas/deployment-config.sh
```

Now customize each file for your project (see Configuration Files section below).

## Configuration Files

### .atlas/conventions.md (Coding Standards)

**Purpose:** Document your project's coding conventions, patterns, and anti-patterns.

**Used by:** All workflow tiers, all agents

**Template:**

```markdown
# Project Conventions

## Project Overview
- Name: [Your Project]
- Stack: [Technology stack]
- Architecture: [MVC/MVVM/Microservices/etc.]

## State Management
- Library: [Redux/MobX/Context/Zustand/Pinia/etc.]
- Update pattern: [Show correct way]
- Anti-pattern: [Show what to avoid]

## Naming Conventions
- Variables: [convention with example]
- Functions: [convention with example]
- Classes/Components: [convention with example]
- Files: [convention with example]
- Constants: [convention with example]

## Code Organization
- File structure: [Describe structure]
- Import order: [Describe order]
- Max file length: [Number of lines]

## Code Quality
- Linting: [ESLint/Pylint/etc.]
- Formatting: [Prettier/Black/etc.]
- Type checking: [TypeScript/Flow/mypy/etc.]
- Testing framework: [Jest/Vitest/pytest/etc.]
- Coverage target: [Percentage]

## Error Handling
- Pattern: [try/catch, Either, Result, etc.]
- Logging: [How to log errors]
- User-facing errors: [How to display]

## Comments & Documentation
- When to comment: [Guidelines]
- JSDoc/docstrings: [Required? Format?]
- README updates: [When required]

## Performance
- Bundle size target: [Size]
- Render optimization: [Memoization, etc.]
- API call patterns: [Caching, debouncing, etc.]

## Accessibility
- ARIA labels: [Required where?]
- Keyboard navigation: [Standards]
- Color contrast: [Minimum ratio]

## Platform-Specific (if applicable)

### iOS
- [iOS-specific rules]

### Android
- [Android-specific rules]

### Web
- [Web-specific rules]

## Security
- Authentication: [Method]
- Authorization: [Pattern]
- Data validation: [Where and how]
- Sensitive data: [How to handle]

## Data Flow
- API integration: [Pattern]
- Data normalization: [How to handle]
- Caching strategy: [Pattern]

## Deployment
- Changelog file: [Location and format]
- Version bumping: [Manual or automatic]
- Deployment command: [Command]
- Environments: [List with descriptions]

## Anti-Patterns (AVOID)
- [Anti-pattern 1]: [Why it's bad]
- [Anti-pattern 2]: [Why it's bad]
- [Anti-pattern 3]: [Why it's bad]

## Examples

### Good Example
\`\`\`javascript
// Correct way to update user state
dispatch(updateUser({
  id: userId,
  name: userName
}));
\`\`\`

### Bad Example (Anti-pattern)
\`\`\`javascript
// WRONG: Direct state mutation
state.user.name = userName;
\`\`\`
```

### .atlas/validation.sh (Custom Quality Checks)

**Purpose:** Project-specific anti-pattern detection and validation.

**Used by:** Review phase (all tiers except Quick), deployment scripts

**Template:**

```bash
#!/bin/bash
# Project-Specific Validation
# This script checks for project-specific anti-patterns

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function: Check for direct state mutation (example for Redux)
check_direct_state_mutation() {
  echo "Checking for direct state mutation..."

  if grep -r "state\.[a-zA-Z]*\s*=" src/ --include="*.js" --include="*.ts" 2>/dev/null; then
    echo -e "${RED}❌ Direct state mutation found${NC}"
    echo "Use dispatch(action) instead of mutating state directly"
    return 1
  fi

  echo -e "${GREEN}✅ No direct state mutation${NC}"
  return 0
}

# Function: Check for console.log in production code (example)
check_console_logs() {
  echo "Checking for console.log statements..."

  # Allow console.log in development files
  if grep -r "console\.log" src/ --include="*.js" --include="*.ts" \
     --exclude-dir="__tests__" --exclude="*.test.*" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Console.log statements found${NC}"
    echo "Consider using proper logging or removing debug statements"
    # Return warning (0) not error for this check
  fi

  return 0
}

# Function: Check for proper error handling (example)
check_error_handling() {
  echo "Checking for unhandled promises..."

  # Look for .then() without .catch()
  if grep -r "\.then(" src/ --include="*.js" --include="*.ts" | grep -v "\.catch(" 2>/dev/null; then
    echo -e "${RED}❌ Promise without .catch() found${NC}"
    echo "Always handle promise rejections with .catch() or try/catch"
    return 1
  fi

  echo -e "${GREEN}✅ Promise error handling looks good${NC}"
  return 0
}

# Function: Check naming conventions (example)
check_naming_conventions() {
  echo "Checking naming conventions..."

  # Check for snake_case in JavaScript/TypeScript files
  if grep -r "^const [a-z_]*_[a-z_]* =" src/ --include="*.js" --include="*.ts" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  snake_case variables found (use camelCase)${NC}"
  fi

  return 0
}

# Function: Check for TODO/FIXME comments (example)
check_todo_comments() {
  echo "Checking for TODO/FIXME comments..."

  local count=$(grep -r "TODO\|FIXME" src/ --include="*.js" --include="*.ts" 2>/dev/null | wc -l)

  if [ $count -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $count TODO/FIXME comments${NC}"
    echo "Consider creating issues for these items"
  fi

  return 0
}

# Function: Check file size (example)
check_file_size() {
  echo "Checking for large files..."

  # Find files over 500 lines
  local large_files=$(find src/ -name "*.js" -o -name "*.ts" | xargs wc -l | awk '$1 > 500 {print $2}')

  if [ -n "$large_files" ]; then
    echo -e "${YELLOW}⚠️  Large files found (>500 lines):${NC}"
    echo "$large_files"
    echo "Consider breaking these into smaller modules"
  fi

  return 0
}

# Main validation function
check_project_antipatterns() {
  echo ""
  echo "========================================="
  echo "Running Project-Specific Validation"
  echo "========================================="
  echo ""

  local failed=0

  # Run all checks
  check_direct_state_mutation || failed=1
  check_console_logs || failed=1
  check_error_handling || failed=1
  check_naming_conventions || failed=1
  check_todo_comments || failed=1
  check_file_size || failed=1

  echo ""
  if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ All project validations passed${NC}"
    return 0
  else
    echo -e "${RED}❌ Some validations failed${NC}"
    return 1
  fi
}

# Export function so it can be sourced by other scripts
export -f check_project_antipatterns

# If script is run directly (not sourced), run validation
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
  check_project_antipatterns
fi
```

**Customization Tips:**
- Add checks specific to your tech stack
- Adjust severity (error vs warning)
- Include performance checks (bundle size, etc.)
- Check for deprecated APIs or patterns

### .atlas/deployment.md (Deployment Process)

**Purpose:** Document your deployment process and commands.

**Used by:** Deploy phase (all tiers), atlas-devops agent

**Template:**

```markdown
# Deployment Process

## Overview
- Deployment tool: [Manual/Jenkins/GitHub Actions/etc.]
- Environments: [List]
- Frequency: [How often each environment is deployed]

## Prerequisites
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Changelog updated
- [ ] Version bumped (if applicable)
- [ ] Environment variables configured

## Environments

### Development
- URL: [dev URL]
- Database: [dev database]
- Deployment: Automatic on merge to `develop`
- Access: All developers

### Staging
- URL: [staging URL]
- Database: [staging database]
- Deployment: Manual via `npm run deploy:staging`
- Access: Internal team only

### Production
- URL: [production URL]
- Database: [production database]
- Deployment: Manual via `npm run deploy:prod`
- Access: Public

## Deployment Commands

### Web Application
\`\`\`bash
# Development
npm run deploy:dev

# Staging
npm run deploy:staging

# Production
npm run deploy:prod
\`\`\`

### Mobile Application
\`\`\`bash
# iOS TestFlight
npm run deploy:ios:beta

# Android Beta
npm run deploy:android:beta

# Production release
npm run deploy:mobile:prod
\`\`\`

## Pre-Deployment Checklist
- [ ] Run tests: `npm test`
- [ ] Run linter: `npm run lint`
- [ ] Check build: `npm run build`
- [ ] Update CHANGELOG.md
- [ ] Bump version in package.json
- [ ] Create git tag: `git tag v1.2.3`

## Post-Deployment Checklist
- [ ] Verify deployment in environment
- [ ] Check error monitoring (Sentry/etc.)
- [ ] Smoke test critical paths
- [ ] Notify team in Slack/etc.
- [ ] Monitor for 15 minutes

## Rollback Process
If deployment fails or critical bug discovered:

\`\`\`bash
# Quick rollback to previous version
npm run rollback:prod

# Or manual rollback
git revert HEAD
npm run deploy:prod
\`\`\`

## Changelog Format
We use CHANGELOG.md in the root directory:

\`\`\`markdown
## [Unreleased]
### Added
- New feature description

### Changed
- Updated feature description

### Fixed
- Bug fix description

## [1.2.3] - 2025-01-15
### Added
- Feature that was added
\`\`\`

## Version Bumping
- Patch (1.2.3 → 1.2.4): Bug fixes
- Minor (1.2.3 → 1.3.0): New features
- Major (1.2.3 → 2.0.0): Breaking changes

Command: `npm version [patch|minor|major]`

## Environment Variables
- Development: `.env.development`
- Staging: `.env.staging`
- Production: `.env.production`

Never commit `.env` files! Use `.env.example` as template.

## Monitoring
- Error tracking: [Sentry/Rollbar/etc.]
- Performance: [New Relic/DataDog/etc.]
- Uptime: [Pingdom/UptimeRobot/etc.]

## Support Contacts
- DevOps lead: [Name/Email]
- On-call rotation: [Link to schedule]
- Incident response: [Process/Link]
```

### .atlas/deployment-config.sh (Deployment Script Configuration)

**Purpose:** Shell script configuration for deployment automation.

**Used by:** Deployment scripts, CI/CD pipelines

**Template:**

```bash
#!/bin/bash
# Deployment Configuration
# Source this file in deployment scripts

# Project Information
export PROJECT_NAME="YourProject"
export PROJECT_TYPE="web"  # web, mobile, backend, etc.

# Version Configuration
export VERSION_FILE="package.json"  # or version.txt, setup.py, etc.
export CHANGELOG_FILE="CHANGELOG.md"

# Build Configuration
export BUILD_COMMAND="npm run build"
export TEST_COMMAND="npm test"
export LINT_COMMAND="npm run lint"

# Environment Configuration
export ENVIRONMENTS=("dev" "staging" "prod")
export DEFAULT_ENVIRONMENT="dev"

# Development Environment
export DEV_URL="https://dev.yourproject.com"
export DEV_DEPLOY_COMMAND="npm run deploy:dev"
export DEV_BRANCH="develop"

# Staging Environment
export STAGING_URL="https://staging.yourproject.com"
export STAGING_DEPLOY_COMMAND="npm run deploy:staging"
export STAGING_BRANCH="main"

# Production Environment
export PROD_URL="https://yourproject.com"
export PROD_DEPLOY_COMMAND="npm run deploy:prod"
export PROD_BRANCH="main"

# Quality Gates
export REQUIRE_TESTS="true"
export REQUIRE_LINT="true"
export REQUIRE_CHANGELOG="true"
export MIN_TEST_COVERAGE="80"

# Notification Configuration
export SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
export DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
export NOTIFICATION_ENABLED="false"

# Rollback Configuration
export ENABLE_ROLLBACK="true"
export KEEP_PREVIOUS_BUILDS="3"

# Logging
export LOG_DIRECTORY="logs"
export LOG_LEVEL="info"  # debug, info, warn, error

# Functions
get_current_version() {
  if [ -f "$VERSION_FILE" ]; then
    if [[ "$VERSION_FILE" == *.json ]]; then
      grep -o '"version": *"[^"]*"' "$VERSION_FILE" | cut -d'"' -f4
    else
      cat "$VERSION_FILE"
    fi
  else
    echo "unknown"
  fi
}

bump_version() {
  local bump_type=$1  # patch, minor, major

  case "$PROJECT_TYPE" in
    web|mobile)
      npm version "$bump_type" --no-git-tag-version
      ;;
    python)
      # Use bump2version or similar
      bump2version "$bump_type"
      ;;
    *)
      echo "Unknown project type for version bumping"
      return 1
      ;;
  esac
}

send_notification() {
  local message=$1
  local environment=$2

  if [ "$NOTIFICATION_ENABLED" != "true" ]; then
    return 0
  fi

  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"[$environment] $message\"}"
  fi
}

export -f get_current_version
export -f bump_version
export -f send_notification
```

### .atlas/story-template.md (User Story Format)

**Purpose:** Template for creating user stories in Full workflow.

**Used by:** Story phase (Full workflow), atlas-product-manager agent

**Template:**

```markdown
# User Story Template

## Story Title
[One-line description of the feature from user perspective]

## User Story
As a [type of user],
I want [goal/desire],
so that [benefit/value].

## Background & Context
[Why is this story needed? What problem does it solve?]

## Acceptance Criteria
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] [Specific, testable criterion 3]

## Technical Requirements
- [Technical detail 1]
- [Technical detail 2]
- [Technical detail 3]

## Edge Cases
- [Edge case 1 and how to handle it]
- [Edge case 2 and how to handle it]

## UI/UX Requirements
- [Design requirement 1]
- [Interaction requirement 2]
- [Accessibility requirement 3]

## Dependencies
- [Dependency 1: other stories, APIs, services]
- [Dependency 2]

## Out of Scope
- [What is explicitly NOT included in this story]

## Testing Strategy
- Unit tests: [What to test]
- Integration tests: [What to test]
- E2E tests: [What to test]

## Success Metrics
- [How will we measure success?]
- [What metrics should improve?]

## Risks & Mitigations
- Risk: [Potential risk 1]
  - Mitigation: [How to address it]
- Risk: [Potential risk 2]
  - Mitigation: [How to address it]

## Estimates
- Story points: [Number]
- Time estimate: [Hours/days]

## Notes
[Any additional context, links, screenshots, etc.]
```

### .atlas/security-checklist.md (Security Requirements)

**Purpose:** Security validation checklist for security-critical features.

**Used by:** Validate phase (Full workflow), atlas-security agent

**Template:**

```markdown
# Security Checklist

## Authentication & Authorization
- [ ] Authentication required for sensitive operations
- [ ] Authorization checks in place (user permissions)
- [ ] Session management secure (timeout, secure cookies)
- [ ] Password requirements met (length, complexity)
- [ ] Multi-factor authentication available (if applicable)
- [ ] Brute force protection in place

## Input Validation
- [ ] All user input validated on server-side
- [ ] Input sanitized to prevent XSS
- [ ] SQL injection prevention (parameterized queries)
- [ ] File upload validation (type, size, content)
- [ ] URL validation and sanitization
- [ ] JSON/XML parsing safety

## Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] Sensitive data encrypted in transit (HTTPS)
- [ ] PII handled according to privacy policy
- [ ] Credentials never logged or displayed
- [ ] API keys/secrets in environment variables
- [ ] Database backups encrypted

## API Security
- [ ] Rate limiting implemented
- [ ] CORS configured correctly
- [ ] API authentication required
- [ ] Request size limits enforced
- [ ] Error messages don't leak sensitive info
- [ ] API versioning in place

## Frontend Security
- [ ] No sensitive data in client-side code
- [ ] XSS prevention (content sanitization)
- [ ] CSRF protection in place
- [ ] Secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] Content Security Policy configured
- [ ] Subresource Integrity for CDN resources

## Code Security
- [ ] No hardcoded secrets or credentials
- [ ] Dependencies up to date (no known vulnerabilities)
- [ ] Code reviewed for security issues
- [ ] Minimal permissions principle followed
- [ ] Error handling doesn't expose stack traces
- [ ] Debug mode disabled in production

## Infrastructure Security
- [ ] HTTPS enforced (no HTTP)
- [ ] Security headers configured (HSTS, etc.)
- [ ] Database access restricted
- [ ] Firewall rules configured
- [ ] Environment variables secured
- [ ] Logs don't contain sensitive data

## Compliance
- [ ] GDPR compliance (if applicable)
- [ ] CCPA compliance (if applicable)
- [ ] HIPAA compliance (if applicable)
- [ ] SOC 2 requirements met (if applicable)
- [ ] Privacy policy updated
- [ ] Terms of service updated

## Testing
- [ ] Security tests written and passing
- [ ] Penetration testing completed (for critical features)
- [ ] Vulnerability scanning run
- [ ] Dependencies scanned for vulnerabilities
- [ ] Authentication flow tested
- [ ] Authorization edge cases tested

## Incident Response
- [ ] Security incident plan in place
- [ ] Logging configured for security events
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
- [ ] Incident contacts identified

## Documentation
- [ ] Security considerations documented
- [ ] Threat model created (for critical features)
- [ ] Security review completed
- [ ] Known limitations documented
```

## Examples by Project Type

### React Native Mobile App

**Conventions Example (.atlas/conventions.md):**

```markdown
# Mobile App Conventions

## State Management
- Library: Redux Toolkit
- Update pattern: `dispatch(updateUser(userData))`
- Async: Redux Thunk
- Anti-pattern: Direct state mutation

## Naming Conventions
- Components: PascalCase (UserProfile.tsx)
- Screens: PascalCase + Screen suffix (HomeScreen.tsx)
- Hooks: camelCase with 'use' prefix (useUserData.ts)
- Utilities: camelCase (formatDate.ts)

## Component Structure
\`\`\`
src/
  components/        # Reusable components
  screens/          # Screen components
  navigation/       # Navigation config
  store/            # Redux store
  hooks/            # Custom hooks
  utils/            # Utility functions
  services/         # API services
\`\`\`

## Platform-Specific Rules

### iOS
- Use Platform.select() for platform-specific code
- Test on iOS Simulator before deployment
- Handle safe area insets

### Android
- Test on Android Emulator before deployment
- Handle back button behavior
- Request permissions properly

## Testing
- Framework: Jest + React Native Testing Library
- Coverage: 70% minimum
- Test files: __tests__/ComponentName.test.tsx

## Performance
- Use React.memo for expensive components
- Implement FlatList for long lists
- Avoid anonymous functions in render
- Optimize images (use FastImage)
```

See `templates/examples/react-native-config/` for full example.

### Django Backend Service

**Conventions Example (.atlas/conventions.md):**

```markdown
# Django Backend Conventions

## Code Style
- Follow PEP 8
- Line length: 88 characters (Black formatter)
- Type hints required for public functions

## Naming Conventions
- Models: PascalCase (UserProfile)
- Views: snake_case (get_user_profile)
- URLs: kebab-case (user-profile/)
- Variables: snake_case (user_data)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL)

## Project Structure
\`\`\`
app/
  models/           # Database models
  views/            # View functions/classes
  serializers/      # DRF serializers
  services/         # Business logic
  tests/            # Test files
  urls.py           # URL routing
\`\`\`

## Database
- Migrations: Always create migrations for model changes
- Queries: Use select_related/prefetch_related for optimization
- Transactions: Use atomic() for multi-step operations

## API Design
- Framework: Django REST Framework
- Authentication: JWT tokens
- Pagination: Required for list endpoints
- Versioning: URL versioning (/api/v1/)

## Testing
- Framework: pytest + pytest-django
- Coverage: 80% minimum
- Test files: test_*.py in tests/ directory
- Fixtures: Use pytest fixtures

## Security
- CSRF protection enabled
- SQL injection prevention (ORM)
- XSS prevention (template escaping)
- Rate limiting on API endpoints
```

See `templates/examples/django-config/` for full example.

### Next.js Web Application

**Conventions Example (.atlas/conventions.md):**

```markdown
# Next.js Web App Conventions

## State Management
- Server state: React Query (TanStack Query)
- Client state: Zustand
- URL state: Next.js router

## Naming Conventions
- Pages: kebab-case (user-profile.tsx)
- Components: PascalCase (UserCard.tsx)
- Utilities: camelCase (formatDate.ts)
- API routes: kebab-case (user-data.ts)

## Project Structure
\`\`\`
src/
  app/              # App router pages
  components/       # React components
  lib/              # Utilities and helpers
  hooks/            # Custom hooks
  styles/           # CSS/Tailwind
  types/            # TypeScript types
\`\`\`

## Routing
- Use App Router (not Pages Router)
- Server Components by default
- Client Components only when needed ('use client')

## Data Fetching
- Server Components: Direct database/API calls
- Client Components: React Query
- Revalidation: Use revalidatePath/revalidateTag

## Styling
- Framework: Tailwind CSS
- Custom styles: CSS modules
- Dark mode: CSS variables + next-themes

## Performance
- Images: Use Next.js Image component
- Fonts: Use next/font
- Code splitting: Dynamic imports for large components
- Bundle analysis: Run before major releases

## Testing
- Framework: Jest + React Testing Library
- E2E: Playwright
- Coverage: 75% minimum

## SEO
- Metadata API for all pages
- Open Graph images
- Structured data (JSON-LD)
```

See `templates/examples/nextjs-config/` for full example.

## Advanced Customization

### Creating Custom Validation Functions

Add reusable validation functions to `.atlas/validation.sh`:

```bash
# Function: Check for specific pattern in codebase
check_specific_pattern() {
  local pattern=$1
  local description=$2
  local files=$3

  echo "Checking for: $description..."

  if grep -r "$pattern" $files 2>/dev/null; then
    echo -e "${RED}❌ Found: $description${NC}"
    return 1
  fi

  echo -e "${GREEN}✅ No issues found${NC}"
  return 0
}

# Use it in main validation
check_project_antipatterns() {
  check_specific_pattern "\.innerHTML\s*=" "innerHTML usage (XSS risk)" "src/"
  check_specific_pattern "eval(" "eval() usage (security risk)" "src/"
}
```

### Integrating with CI/CD

**GitHub Actions Example:**

```yaml
# .github/workflows/atlas-validation.yml
name: Atlas Validation

on:
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Atlas validation
        run: |
          if [ -f .atlas/validation.sh ]; then
            chmod +x .atlas/validation.sh
            ./.atlas/validation.sh
          fi

      - name: Run tests
        run: npm test

      - name: Run linter
        run: npm run lint
```

**GitLab CI Example:**

```yaml
# .gitlab-ci.yml
atlas-validation:
  stage: test
  script:
    - if [ -f .atlas/validation.sh ]; then
        chmod +x .atlas/validation.sh;
        ./.atlas/validation.sh;
      fi
    - npm test
    - npm run lint
  only:
    - merge_requests
```

### Adding Custom Deployment Checks

Extend `.atlas/deployment-config.sh` with custom checks:

```bash
# Custom pre-deployment check
pre_deployment_check() {
  local environment=$1

  echo "Running pre-deployment checks for $environment..."

  # Check environment-specific requirements
  case "$environment" in
    prod)
      # Production requires changelog update
      if ! grep -q "## \[Unreleased\]" "$CHANGELOG_FILE"; then
        echo "❌ Changelog not updated"
        return 1
      fi

      # Production requires version tag
      if ! git describe --exact-match HEAD 2>/dev/null; then
        echo "❌ No version tag on current commit"
        return 1
      fi
      ;;

    staging)
      # Staging requires tests to pass
      if [ "$REQUIRE_TESTS" = "true" ]; then
        npm test || return 1
      fi
      ;;
  esac

  echo "✅ Pre-deployment checks passed"
  return 0
}

export -f pre_deployment_check
```

### Custom Agent Prompts

You can create project-specific agent prompts by adding context to your requests:

```
"Implement user authentication using our conventions in .atlas/conventions.md.
Use Atlas Full workflow with atlas-security agent."
```

The agent will automatically read your `.atlas/` configuration and apply it.

## Testing Your Configuration

### 1. Test Validation Script

```bash
# Run validation manually
cd /path/to/your/project
./.atlas/validation.sh

# Should output pass/fail for each check
```

### 2. Test with Atlas

```bash
# Test Quick workflow
"Fix typo in README. Use Atlas Quick workflow."

# Test Standard workflow
"Add input validation to user form. Use Atlas workflow."

# Verify Atlas reads your conventions
"Create a new component following our naming conventions. Use Atlas workflow."
```

### 3. Verify Configuration Loading

Atlas should mention your conventions in its responses:

```
User: "Add a new API endpoint. Use Atlas workflow."

Claude: "I'll use Atlas Standard workflow. I see you're using Django REST Framework
with JWT authentication (from .atlas/conventions.md)..."
```

### 4. Test Deployment Integration

```bash
# Test deployment config
source .atlas/deployment-config.sh
get_current_version  # Should output current version
echo $DEV_URL        # Should output dev URL
```

## Common Customization Patterns

### Pattern 1: Minimal (Single File)
**Best for:** Small projects, prototypes
**Setup:** Just `.atlas/conventions.md` with core rules
**Time:** 15 minutes

### Pattern 2: Standard (Conventions + Validation)
**Best for:** Most projects
**Setup:** `.atlas/conventions.md` + `.atlas/validation.sh`
**Time:** 30-45 minutes

### Pattern 3: Full Integration
**Best for:** Large teams, production apps
**Setup:** All `.atlas/` files + CI/CD integration
**Time:** 1-2 hours

### Pattern 4: Security-Critical
**Best for:** FinTech, healthcare, sensitive data
**Setup:** Full integration + enhanced security checklist
**Time:** 2-3 hours

## Maintenance

### Updating Configuration

```bash
# Review conventions quarterly
# - Remove outdated patterns
# - Add new established patterns
# - Update examples

# Review validation annually
# - Update for new anti-patterns discovered
# - Remove checks for deprecated code
# - Optimize performance of checks
```

### Sharing with Team

```bash
# Commit .atlas/ to version control
git add .atlas/
git commit -m "Add Atlas project configuration"
git push

# Team members automatically get configuration
# when they pull the repository
```

### Versioning Configuration

Consider versioning your `.atlas/` configuration:

```markdown
# .atlas/conventions.md

# Version: 2.1.0
# Last updated: 2025-01-15
# Breaking changes: Migrated from Redux to Zustand

...
```

## Troubleshooting

**Problem:** Atlas ignoring my conventions
- **Solution:** Verify `.atlas/conventions.md` exists and has content
- Mention conventions explicitly: "Following .atlas/conventions.md, add feature X"

**Problem:** Validation script not running
- **Solution:** Check script is executable: `chmod +x .atlas/validation.sh`
- Verify no syntax errors: `bash -n .atlas/validation.sh`

**Problem:** Too many false positives in validation
- **Solution:** Adjust regex patterns to be more specific
- Add exclusions for test files or legacy code

**Problem:** Team not following conventions
- **Solution:** Integrate validation into CI/CD (fails PR if validation fails)
- Add pre-commit hooks to run validation locally

## Next Steps

1. Start with Quick Customization (15 minutes)
2. Use Atlas on a few tasks
3. Add validation checks as patterns emerge
4. Gradually expand to full customization
5. Integrate with CI/CD when stable

Remember: **Perfect is the enemy of good.** Start simple and iterate!

---

**Questions?** See README.md for FAQ or create an issue for support.
