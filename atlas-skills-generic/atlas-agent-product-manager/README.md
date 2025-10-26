# Atlas Agent: Product Manager (Generic)

A portable, domain-agnostic Product Manager agent skill for the Atlas workflow framework.

## Overview

This generic PM agent provides:
- User story creation with testable acceptance criteria
- Backlog management and prioritization
- Quality gatekeeping and validation
- Release coordination and deployment readiness
- INVEST principle adherence

**This is a GENERIC skill** - it provides a foundation that you customize for your specific project.

## What's Included

### Core Files

- **`SKILL.md`** - Complete PM agent specification
  - Core responsibilities and principles
  - Generic story format
  - Quality gates and validation checklists
  - Communication templates

### Resource Files

- **`resources/story-template.md`** - Generic user story template
  - Customizable technical consideration sections
  - Platform scope definitions
  - Quality gates and success metrics

- **`resources/acceptance-criteria-guide.md`** - Writing testable criteria
  - INVEST framework
  - Domain-agnostic examples (UI, API, data migration, bug fixes)
  - Common mistakes and how to avoid them
  - Testing scenario templates

## How to Use

### 1. Copy to Your Project

```bash
# Copy generic skill to your project's atlas directory
cp -r atlas-skills-generic/atlas-agent-product-manager /your-project/atlas-skills/
```

### 2. Customize for Your Project

Create these files in your project to customize the PM agent:

#### `.atlas/story-template.md` - Project-Specific Story Sections

Define your project's unique story requirements:

```markdown
# Project-Specific Story Sections

## [Your Domain Considerations]

**Example for E-Commerce:**
## Inventory Impact
- [ ] Product catalog changes?
- [ ] Stock management affected?
- [ ] Pricing rules modified?

**Example for Healthcare:**
## HIPAA Compliance
- [ ] PHI (Protected Health Information) secured?
- [ ] Audit logging implemented?
- [ ] Access controls verified?

**Example for SaaS:**
## Multi-Tenancy
- [ ] Tenant isolation maintained?
- [ ] Cross-tenant data leakage prevented?
- [ ] Per-tenant configuration supported?
```

#### `.atlas/conventions.md` - Non-Negotiable Standards

Document your project's working agreements:

```markdown
# Project Conventions

## Code Standards
- Linting: [Your linter + config]
- Formatting: [Your formatter + config]
- Type checking: [TypeScript/Flow/JSDoc/None]

## Testing Standards
- Coverage minimum: [X%]
- Required tests: [Unit/Integration/E2E]
- Test framework: [Jest/Mocha/Vitest/etc]

## Naming Conventions
- Variables: [camelCase/snake_case]
- Functions: [camelCase/snake_case]
- Classes: [PascalCase]
- Constants: [UPPER_SNAKE_CASE]

## Git Workflow
- Branch naming: [pattern]
- Commit messages: [conventional/semantic/custom]
- Pull requests: [required/optional]
- Code review: [required approvals]

## Documentation Requirements
- API endpoints: [OpenAPI/Swagger/other]
- Components: [JSDoc/TypeDoc/inline]
- Architecture: [ADRs/diagrams/wiki]
```

#### `.atlas/story-examples.md` - Domain Examples

Provide examples from your actual project:

```markdown
# Story Examples from Our Project

## Example 1: [Common Feature Type in Your Domain]
[Complete story using your conventions]

## Example 2: [Another Common Pattern]
[Complete story showing typical structure]

## Anti-Patterns to Avoid
- [Common mistake 1 specific to your project]
- [Common mistake 2]
```

#### `.atlas/quality-gates.md` - Quality Requirements

Define your project's quality gates:

```markdown
# Quality Gates

## Code Quality
- [ ] Linting passes (npm run lint)
- [ ] Type checking passes (npm run typecheck)
- [ ] Tests pass (npm test)
- [ ] Coverage > [X%]

## Security
- [ ] No vulnerabilities (npm audit / snyk)
- [ ] Secrets not committed
- [ ] Input validation implemented

## Performance
- [ ] Bundle size increase < [X%]
- [ ] No performance regressions
- [ ] Load time < [X seconds]

## Documentation
- [ ] API docs updated
- [ ] README updated (if needed)
- [ ] Changelog updated
```

### 3. Use the PM Agent

Once customized, invoke the PM agent in your Atlas workflows:

```
"Create a user story for [feature]. Use Atlas Standard workflow with product-manager agent."
```

The PM agent will:
1. Use the **generic story format** as baseline
2. Include your **project-specific sections** from `.atlas/story-template.md`
3. Enforce your **conventions** from `.atlas/conventions.md`
4. Reference your **examples** from `.atlas/story-examples.md`
5. Validate against your **quality gates** from `.atlas/quality-gates.md`

## Customization Examples

### Example 1: E-Commerce Project

```markdown
# .atlas/story-template.md

## Inventory Impact
- [ ] Product catalog changes?
- [ ] Stock management affected?
- [ ] Pricing rules modified?

## Payment Processing
- [ ] Payment gateway changes?
- [ ] Transaction handling secure?
- [ ] Refund logic affected?

## Compliance
- [ ] PCI-DSS requirements met?
- [ ] GDPR compliance verified?
- [ ] Tax calculation correct?
```

### Example 2: Healthcare Project

```markdown
# .atlas/story-template.md

## HIPAA Compliance
- [ ] PHI (Protected Health Information) secured?
- [ ] Audit logging implemented?
- [ ] Access controls verified?
- [ ] Encryption at rest and in transit?

## Clinical Workflows
- [ ] Provider workflows affected?
- [ ] Patient workflows affected?
- [ ] Clinical decision support impact?

## Interoperability
- [ ] HL7/FHIR standards followed?
- [ ] EHR integration tested?
- [ ] Data exchange validated?
```

### Example 3: Mobile App Project

```markdown
# .atlas/story-template.md

## Platform Support
- [ ] iOS requirements?
- [ ] Android requirements?
- [ ] Platform-specific APIs used?
- [ ] App store guidelines followed?

## Offline Support
- [ ] Offline functionality needed?
- [ ] Data sync strategy defined?
- [ ] Conflict resolution handled?

## Performance
- [ ] App size impact?
- [ ] Battery consumption evaluated?
- [ ] Network usage optimized?
```

## Generic Story Format

The PM agent uses this format by default:

```markdown
# User Story: [Title]

**Priority:** P0/P1/P2/P3
**Workflow Tier:** Quick/Iterative/Standard/Full
**Platform Scope:** [Your platforms]

## Story
As a [user type],
I want [goal],
So that [benefit].

## Acceptance Criteria
1. [Testable criterion 1]
2. [Testable criterion 2]
...

## Technical Considerations
- [ ] Database changes needed?
- [ ] API changes needed?
- [ ] UI/UX updates?
- [ ] Third-party integrations?
- [ ] Security implications?
- [ ] Performance impact?

[+ Your project-specific sections from .atlas/story-template.md]

## Quality Gates
- [ ] All acceptance criteria met
- [ ] Tests pass
- [ ] Documentation updated

[+ Your project-specific gates from .atlas/quality-gates.md]

## Success Metrics
- [Quantitative metric]
- [Qualitative metric]
- [Adoption metric]
```

## Benefits of Generic Approach

### Portability
- Works with any project type (web, mobile, backend, full-stack)
- Works with any domain (e-commerce, healthcare, SaaS, etc.)
- Works with any tech stack (React, Vue, Node, Python, etc.)

### Flexibility
- Customize technical consideration sections
- Define your own quality gates
- Enforce your own conventions
- Provide domain-specific examples

### Consistency
- Generic format ensures baseline consistency
- Project customizations add domain specificity
- Examples guide team on expected patterns

### Maintainability
- Generic skill updated independently
- Project customizations stay in your repo
- Easy to evolve conventions over time

## Core Principles (Universal)

These principles apply to ANY project:

### 1. Clarity is Kindness
Ambiguous requirements waste time and cause incorrect implementations.

**Always:**
- Write testable acceptance criteria
- Use concrete examples
- Specify edge cases
- Define success metrics

### 2. Trust but Verify
Trust the team to implement, but verify results with high-level checks.

**Trust:**
- Let developers choose implementation details
- Respect technical expertise

**Verify:**
- Check acceptance criteria are met
- Validate conventions followed
- Ensure tests cover criteria

### 3. Enforce the Contract
Uphold non-negotiable working agreements without exception.

**Non-Negotiable:**
- Code quality standards
- Testing requirements
- Documentation updates
- Quality gates

### 4. Maintain a Clean State
Proactively manage project hygiene to prevent technical debt.

**Regular Cleanup:**
- Archive completed work
- Update documentation
- Remove dead code
- Groom backlog

## Integration with Atlas Workflows

The PM agent integrates with Atlas workflow tiers:

### Quick Workflow (5-15 min)
- Simple validation before deploy
- Minimal story documentation

### Iterative Workflow (15-30 min)
- Coordinate peer review cycles
- Validate acceptance criteria

### Standard Workflow (30-60 min)
- Create formal user story
- Validate quality gates
- Review release readiness

### Full Workflow (2-4 hours)
- Phase 2: Create detailed story
- Phase 9: Validate deployment readiness
- All checkpoints in between

## Resources

### In This Package
- `SKILL.md` - Complete PM agent spec
- `resources/story-template.md` - Generic story template
- `resources/acceptance-criteria-guide.md` - Writing testable criteria

### Atlas Framework
- See `atlas/docs/WORKFLOW_TIERS.md` for workflow details
- See `atlas/docs/AGENT_WORKFLOW.md` for 9-phase process
- See `atlas/README.md` for framework overview

### Your Project
- Create `.atlas/story-template.md` for project sections
- Create `.atlas/conventions.md` for standards
- Create `.atlas/story-examples.md` for examples
- Create `.atlas/quality-gates.md` for gates

## License

This generic PM agent skill is part of the Atlas framework and follows the same license as your project.

## Contributing

To improve this generic skill:
1. Ensure changes remain domain-agnostic
2. Provide examples from multiple domains
3. Document customization patterns
4. Test with different project types

## Support

For questions or issues:
- Review `SKILL.md` for PM responsibilities
- Check `resources/` for guides and templates
- Create project-specific customizations in `.atlas/`
- Refer to Atlas framework documentation

---

**Remember:** This is a GENERIC foundation. Customize it for your project by creating `.atlas/` configuration files with your domain-specific requirements.
