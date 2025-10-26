# Quick Start Guide - Generic PM Agent

Get started with the generic Product Manager agent in 5 minutes.

---

## 1. Copy to Your Project (30 seconds)

```bash
# Copy generic PM skill to your project
cp -r atlas-skills-generic/atlas-agent-product-manager /your-project/atlas-skills/

# Or if you're in your project root:
cp -r /path/to/atlas-skills-generic/atlas-agent-product-manager ./atlas-skills/
```

---

## 2. Create Basic Customizations (2 minutes)

### Minimum Required: `.atlas/conventions.md`

```bash
# Create .atlas directory in your project root
mkdir -p .atlas
```

Create `.atlas/conventions.md`:

```markdown
# Project Conventions

## Code Standards
- Linting: ESLint with airbnb config
- Type checking: TypeScript strict mode
- Testing: Jest with 80% coverage minimum

## Naming Conventions
- Variables: camelCase
- Functions: camelCase (verbs)
- Classes: PascalCase (nouns)
- Constants: UPPER_SNAKE_CASE

## Git Workflow
- Branch naming: feature/* or bugfix/*
- Commit messages: Conventional Commits
- Pull requests: Required
- Code review: 1 approval minimum

## Quality Gates
- [ ] All tests pass
- [ ] Linting passes
- [ ] Coverage > 80%
- [ ] Build succeeds
```

**That's it!** You can now use the PM agent with these basic conventions.

---

## 3. Use the PM Agent (30 seconds)

In your Atlas workflow:

```
"Create a user story for [feature]. Use Atlas Standard workflow with product-manager agent."
```

The PM agent will:
1. ✅ Use generic story format
2. ✅ Enforce your conventions from `.atlas/conventions.md`
3. ✅ Apply INVEST principles
4. ✅ Generate testable acceptance criteria

---

## 4. Optional: Add More Customizations (2 minutes)

### Add Project-Specific Story Sections

Create `.atlas/story-template.md` with YOUR domain sections:

**E-Commerce Example:**
```markdown
## Inventory Impact
- [ ] Product catalog changes?
- [ ] Stock management affected?

## Payment Processing
- [ ] Payment gateway changes?
- [ ] Transaction handling secure?
```

**SaaS Example:**
```markdown
## Multi-Tenancy
- [ ] Tenant isolation maintained?
- [ ] Cross-tenant data leakage prevented?

## Billing Impact
- [ ] Usage metering affected?
- [ ] Subscription tiers impacted?
```

**Healthcare Example:**
```markdown
## HIPAA Compliance
- [ ] PHI secured?
- [ ] Audit logging implemented?

## Clinical Workflows
- [ ] Provider workflows affected?
- [ ] Patient workflows affected?
```

### Add Domain Examples

Create `.atlas/story-examples.md`:

```markdown
# Story Examples from Our Project

## Example: [Common Feature in Your Domain]

# User Story: [Title]

**Priority:** P1
**Workflow Tier:** Standard
**Platform Scope:** All

## Story
As a [your user type],
I want [common goal in your domain],
So that [common benefit in your domain].

## Acceptance Criteria
1. [Domain-specific criterion]
2. [Domain-specific criterion]
...
```

---

## What You Get

### Generic Story Format
```markdown
# User Story: [Title]

**Priority:** P0/P1/P2/P3
**Workflow Tier:** Quick/Iterative/Standard/Full
**Platform Scope:** [Your platforms]

## Story
As a [user],
I want [goal],
So that [benefit].

## Acceptance Criteria
1. [Testable criterion]
2. [Testable criterion]

## Technical Considerations
- [ ] Database changes?
- [ ] API changes?
- [ ] Security implications?
- [ ] Performance impact?

[+ YOUR sections from .atlas/story-template.md]

## Quality Gates
- [ ] All criteria met
- [ ] Tests pass
- [ ] Documentation updated

[+ YOUR gates from .atlas/conventions.md]

## Success Metrics
- [Metric 1]
- [Metric 2]
```

### INVEST Validation
- ✅ Independent stories
- ✅ Negotiable implementation
- ✅ Valuable to users
- ✅ Estimable effort
- ✅ Small scope
- ✅ Testable criteria

### Quality Gatekeeping
- ✅ Pre-implementation validation
- ✅ Post-implementation checks
- ✅ Deployment readiness
- ✅ Convention enforcement

---

## Common Use Cases

### Use Case 1: Quick Feature Story (Standard Workflow)

```
"Create a user story for adding user profile image upload. Use Atlas Standard workflow."
```

**Result:** Complete story with:
- User story format (As a... I want... So that...)
- Testable acceptance criteria
- Technical considerations checklist
- Quality gates
- Success metrics

### Use Case 2: Bug Fix Story

```
"Create a user story for fixing the login timeout bug. Priority P0."
```

**Result:** Bug fix story with:
- Problem description
- Root cause (if known)
- Acceptance criteria for fix
- Regression test requirements
- Deployment strategy

### Use Case 3: Complex Feature (Full Workflow)

```
"Create a user story for implementing multi-factor authentication. Use Atlas Full workflow."
```

**Result:** Comprehensive story with:
- Detailed acceptance criteria
- Security considerations
- Testing requirements (unit, integration, E2E)
- Documentation requirements
- Phased deployment strategy

---

## Customization Levels

### Level 1: Minimal (5 min)
- ✅ `.atlas/conventions.md` only
- ✅ Use generic story format as-is
- ✅ Enforce basic quality gates

**Good for:** Getting started quickly, small projects

### Level 2: Basic (15 min)
- ✅ `.atlas/conventions.md` - Standards
- ✅ `.atlas/story-template.md` - 2-3 domain sections
- ✅ Use generic format + domain sections

**Good for:** Most projects, domain-specific needs

### Level 3: Complete (30 min)
- ✅ `.atlas/conventions.md` - Full standards
- ✅ `.atlas/story-template.md` - All domain sections
- ✅ `.atlas/story-examples.md` - 3+ examples
- ✅ `.atlas/quality-gates.md` - Detailed gates

**Good for:** Large projects, strict compliance needs, onboarding new teams

---

## Example Workflows

### Workflow 1: Create Story → Implement → Deploy

```bash
# 1. PM Agent: Create story
"Create user story for password reset feature"

# 2. Developer Agent: Implement
"Implement password reset feature from story #123"

# 3. Peer Reviewer Agent: Review
"Review PR #456 for password reset feature"

# 4. PM Agent: Validate
"Validate password reset feature meets acceptance criteria"

# 5. DevOps Agent: Deploy
"Deploy password reset feature to staging"
```

### Workflow 2: Backlog Grooming

```bash
# PM Agent: Prioritize backlog
"Review and prioritize backlog items in /docs/backlog/"

# Output: Organized backlog by P0/P1/P2/P3
# - P0 items have clear acceptance criteria
# - P1 items ready for implementation
# - P2/P3 items documented for future
```

### Workflow 3: Release Coordination

```bash
# PM Agent: Prepare release
"Review stories completed this sprint and create release notes"

# Output:
# - Release notes with features/fixes/improvements
# - Deployment checklist
# - Rollback plan
# - Success metrics to monitor
```

---

## Tips for Success

### 1. Start Generic, Add Specifics
- ✅ Use generic format first
- ✅ Add domain sections when needed
- ✅ Don't over-customize too early

### 2. Enforce Conventions Consistently
- ✅ Document non-negotiables in `.atlas/conventions.md`
- ✅ PM agent enforces them automatically
- ✅ No exceptions for speed

### 3. Use Examples from Your Domain
- ✅ Add 2-3 real examples in `.atlas/story-examples.md`
- ✅ Show good and bad patterns
- ✅ Reference in story creation

### 4. Iterate on Quality Gates
- ✅ Start with basic gates (tests, linting, build)
- ✅ Add domain-specific gates over time
- ✅ Document in `.atlas/quality-gates.md`

### 5. Keep Stories Small
- ✅ Use workflow tiers (Quick/Standard/Full)
- ✅ Break large features into slices
- ✅ Each story deliverable in one tier

---

## Next Steps

1. **Read SKILL.md** - Understand PM responsibilities and principles
2. **Read story-template.md** - See full generic template
3. **Read acceptance-criteria-guide.md** - Learn to write testable criteria
4. **Customize for your project** - Create `.atlas/` files
5. **Use the agent** - Start creating stories!

---

## Need Help?

### Documentation
- `SKILL.md` - Complete PM agent specification
- `README.md` - Detailed usage and customization guide
- `resources/story-template.md` - Generic story template
- `resources/acceptance-criteria-guide.md` - Writing criteria
- `CHANGES_FROM_STACKMAP.md` - What changed from original

### Common Questions

**Q: Do I need to customize everything?**
A: No! Start with just `.atlas/conventions.md`. Add more as needed.

**Q: Can I use the generic format without customization?**
A: Yes! Generic format works for any project. Customization is optional.

**Q: How do I enforce project-specific requirements?**
A: Add them to `.atlas/conventions.md` and `.atlas/story-template.md`. PM agent will include them automatically.

**Q: Can I use this with my existing workflow?**
A: Yes! PM agent integrates with Atlas workflows (Quick/Standard/Full) but works standalone too.

**Q: What if my project is unique?**
A: That's what customization is for! Add YOUR sections to `.atlas/story-template.md`.

---

## Examples by Project Type

### Web Application
```markdown
# .atlas/story-template.md

## Browser Compatibility
- [ ] Chrome/Firefox/Safari/Edge tested?
- [ ] Responsive design (mobile/tablet/desktop)?

## SEO Impact
- [ ] Meta tags updated?
- [ ] Sitemap affected?

## Analytics
- [ ] Tracking events added?
- [ ] Conversion funnels updated?
```

### Mobile Application
```markdown
# .atlas/story-template.md

## Platform Support
- [ ] iOS requirements?
- [ ] Android requirements?
- [ ] App store guidelines followed?

## Offline Support
- [ ] Works offline?
- [ ] Data sync strategy?

## Performance
- [ ] App size impact?
- [ ] Battery consumption?
```

### Backend API
```markdown
# .atlas/story-template.md

## API Design
- [ ] RESTful principles followed?
- [ ] Versioning strategy?
- [ ] OpenAPI spec updated?

## Scalability
- [ ] Load testing performed?
- [ ] Database indexing optimal?
- [ ] Caching strategy?

## Monitoring
- [ ] Logging added?
- [ ] Metrics tracked?
- [ ] Alerts configured?
```

---

**Ready to start? Copy the skill to your project and create `.atlas/conventions.md`!**
