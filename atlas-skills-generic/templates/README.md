# Atlas Configuration Templates

This directory contains templates and examples for customizing Atlas to your project.

## Quick Start

### 1. Copy Templates to Your Project

```bash
cd /path/to/your/project
mkdir .atlas

# Copy the templates you need
cp /path/to/atlas-skills-generic/templates/conventions.md .atlas/
cp /path/to/atlas-skills-generic/templates/validation.sh .atlas/
chmod +x .atlas/validation.sh
```

### 2. Customize for Your Project

Edit the templates with your project's specific rules, patterns, and standards.

### 3. Use Atlas

```
"Add user authentication. Use Atlas workflow."
```

Atlas will automatically reference your `.atlas/` configuration!

## Available Templates

### Core Templates (Blank)

- **conventions.md** - Coding standards and patterns
- **validation.sh** - Custom anti-pattern checks
- **deployment.md** - Deployment process documentation
- **deployment-config.sh** - Deployment script configuration
- **story-template.md** - User story format (for Full workflow)
- **security-checklist.md** - Security validation checklist

### Example Configurations

- **examples/react-native-config/** - Complete React Native app configuration
- **examples/django-config/** - Complete Django backend configuration
- **examples/nextjs-config/** - Complete Next.js web app configuration

## Template Descriptions

### conventions.md (Coding Standards)

**Purpose:** Document your project's coding conventions, naming patterns, and anti-patterns.

**Sections:**
- Project overview
- State management patterns
- Naming conventions
- Code organization
- Platform-specific rules (if applicable)
- Testing requirements
- Deployment process
- Anti-patterns to avoid
- Examples (good vs bad)

**Used by:** All workflow tiers, all agents

### validation.sh (Custom Checks)

**Purpose:** Automated checks for project-specific anti-patterns.

**What to check:**
- State management patterns
- Field naming conventions
- Platform-specific anti-patterns
- Security issues
- Code formatting
- Missing tests or documentation

**Used by:** Review phase (Standard/Full workflow), deployment scripts

### deployment.md (Deployment Documentation)

**Purpose:** Document your deployment process, environments, and checklists.

**Sections:**
- Environments (dev, staging, production)
- Deployment commands
- Pre-deployment checklist
- Post-deployment verification
- Rollback process
- Changelog format
- Version bumping strategy

**Used by:** Deploy phase (all tiers), atlas-devops agent

### deployment-config.sh (Deployment Script Config)

**Purpose:** Shell script configuration for deployment automation.

**Variables:**
- Project information
- Build commands
- Test commands
- Environment URLs
- Quality gate settings
- Notification settings

**Used by:** Deployment scripts, CI/CD pipelines

### story-template.md (User Story Format)

**Purpose:** Template for creating structured user stories.

**Sections:**
- User story statement
- Acceptance criteria
- Technical requirements
- Edge cases
- Testing strategy
- Success metrics

**Used by:** Story phase (Full workflow), atlas-product-manager agent

### security-checklist.md (Security Validation)

**Purpose:** Comprehensive security validation checklist.

**Categories:**
- Authentication & authorization
- Input validation
- Data protection
- API security
- Frontend security
- Code security
- Infrastructure security
- Compliance

**Used by:** Validate phase (Full workflow), atlas-security agent

## Customization Levels

### Level 1: Minimal (15 minutes)
**What:** Just `conventions.md` with key rules
**Best for:** Small projects, prototypes, quick setups

```bash
cp templates/conventions.md .atlas/
# Edit conventions.md with your core rules
```

### Level 2: Standard (30-45 minutes)
**What:** Conventions + validation script
**Best for:** Most projects, teams establishing standards

```bash
cp templates/conventions.md .atlas/
cp templates/validation.sh .atlas/
chmod +x .atlas/validation.sh
# Customize both files
```

### Level 3: Full Integration (1-2 hours)
**What:** All templates + CI/CD integration
**Best for:** Large projects, enterprise teams

```bash
cp templates/*.md .atlas/
cp templates/*.sh .atlas/
chmod +x .atlas/*.sh
# Customize all files + integrate with CI/CD
```

### Level 4: Example-Based (30 minutes)
**What:** Copy complete example for your tech stack
**Best for:** Using supported tech stacks (React Native, Django, Next.js)

```bash
# For React Native project
cp templates/examples/react-native-config/* .atlas/

# For Django project
cp templates/examples/django-config/* .atlas/

# For Next.js project
cp templates/examples/nextjs-config/* .atlas/

# Then customize to your specific needs
```

## Example Configurations

### React Native Mobile App

**Location:** `examples/react-native-config/`

**Includes:**
- State management with Zustand
- Platform-specific rules (iOS, Android, Web)
- Field naming conventions
- Typography and design system
- Performance optimization rules
- Validation for state mutations, field naming, platform anti-patterns

**Best for:** React Native apps with multi-platform targets

### Django Backend Service

**Location:** `examples/django-config/`

**Includes:**
- Service layer pattern
- Django ORM optimization
- API design with DRF
- Security best practices
- Testing with pytest
- Validation for N+1 queries, raw SQL, business logic placement

**Best for:** Django REST API backends

### Next.js Web Application

**Location:** `examples/nextjs-config/`

**Includes:**
- App Router patterns
- Server/Client Component guidelines
- React Query for data fetching
- Performance optimization
- SEO and metadata
- Validation for 'use client' overuse, unoptimized images, hardcoded URLs

**Best for:** Next.js 13+ web applications

## Using Examples as Starting Points

### Option 1: Copy and Customize

```bash
# Copy entire example
cp -r templates/examples/react-native-config .atlas

# Customize to your project
# - Update project name and stack
# - Modify naming conventions
# - Adjust validation checks
# - Add project-specific patterns
```

### Option 2: Reference and Adapt

```bash
# Read the example for inspiration
cat templates/examples/nextjs-config/conventions.md

# Create your own from scratch
cp templates/conventions.md .atlas/

# Add patterns you liked from the example
```

## Integration with CI/CD

### GitHub Actions

```yaml
# .github/workflows/atlas-validation.yml
name: Atlas Validation

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup
        run: npm ci
      - name: Atlas Validation
        run: |
          if [ -f .atlas/validation.sh ]; then
            chmod +x .atlas/validation.sh
            ./.atlas/validation.sh
          fi
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

if [ -f .atlas/validation.sh ]; then
  ./.atlas/validation.sh || exit 1
fi
```

### GitLab CI

```yaml
# .gitlab-ci.yml
atlas-validation:
  stage: test
  script:
    - if [ -f .atlas/validation.sh ]; then ./.atlas/validation.sh; fi
```

## Testing Your Configuration

### 1. Run Validation Manually

```bash
cd /path/to/your/project
./.atlas/validation.sh
```

### 2. Test with Atlas

```
"Create a new component following our conventions. Use Atlas workflow."
```

Verify Atlas mentions your conventions in its process.

### 3. Check Configuration Loading

Atlas should reference your `.atlas/conventions.md` when working:

```
User: "Add a new feature. Use Atlas workflow."

Claude: "I'll use Atlas Standard workflow. Based on your .atlas/conventions.md,
I see you're using [your state management], so I'll follow that pattern..."
```

## Maintenance

### When to Update

Update your `.atlas/` configuration when:

1. **New patterns emerge** - Team establishes new best practices
2. **Anti-patterns discovered** - Bugs caused by specific code patterns
3. **Architecture changes** - Major refactors or new technologies
4. **Tool updates** - New linters, formatters, or testing frameworks
5. **Team feedback** - Developers find conventions unclear or outdated

### How to Update

```bash
# Review quarterly
# - Are conventions still current?
# - Any outdated patterns?
# - New tools or frameworks?

# Update incrementally
# - Don't change everything at once
# - Document why changes were made
# - Communicate changes to team

# Version your conventions
# Add version number and date to conventions.md
```

## Tips for Success

### Start Simple
- Don't try to document everything on day 1
- Begin with your most important 3-5 rules
- Expand as patterns emerge

### Make It Actionable
- Include concrete examples (good vs bad)
- Show, don't just tell
- Link to relevant documentation

### Keep It Current
- Review and update regularly
- Remove outdated patterns
- Add new discoveries

### Get Team Buy-In
- Collaborate on conventions
- Explain the "why" behind rules
- Make it easy to follow

### Automate What You Can
- Validate in CI/CD
- Use pre-commit hooks
- Integrate with linters and formatters

## Common Questions

**Q: Do I need all the templates?**
A: No! Start with just `conventions.md`. Add others as needed.

**Q: Can I modify the templates?**
A: Absolutely! These are starting points for your project.

**Q: Should I commit .atlas/ to git?**
A: Yes! Share conventions with your team via version control.

**Q: What if my tech stack isn't in examples?**
A: Use the blank templates and customize. Contribute back if you'd like!

**Q: How detailed should conventions.md be?**
A: Detailed enough to be useful, brief enough to be read. Aim for 1-2 pages initially.

**Q: Can I have multiple validation scripts?**
A: Yes! Source them from main validation.sh or run separately.

## Contributing

Found improvements to these templates? Have an example for a new tech stack?

1. Test your configuration thoroughly
2. Remove project-specific details
3. Document your changes
4. Submit a pull request

We welcome contributions for:
- New tech stack examples
- Improved validation checks
- Better template organization
- Documentation improvements

## License

These templates are provided as starting points for your project. Use freely, customize as needed, share with your team.
