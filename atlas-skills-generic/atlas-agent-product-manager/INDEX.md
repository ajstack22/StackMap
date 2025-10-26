# Atlas Agent: Product Manager (Generic) - File Index

Complete documentation for the generic, portable Product Manager agent skill.

---

## Quick Navigation

**New User?** Start here:
1. `QUICK_START.md` - Get started in 5 minutes
2. `README.md` - Complete usage guide
3. `SKILL.md` - Full agent specification

**Need Examples?** Go here:
- `resources/story-template.md` - Generic template with examples
- `resources/acceptance-criteria-guide.md` - Writing testable criteria

**Migrating from StackMap?** Read this:
- `CHANGES_FROM_STACKMAP.md` - What changed and how to migrate

---

## File Descriptions

### Core Documentation

#### `SKILL.md` (22 KB, 735 lines)
**The complete PM agent specification.**

Contains:
- Core responsibilities (Backlog, Stories, Quality, Process, Release)
- Core principles (Clarity is Kindness, Trust but Verify, Enforce Contract, Clean State)
- Generic user story format
- INVEST principles for story quality
- Validation checklists (pre/post implementation, deployment)
- Communication templates
- Integration with Atlas workflows

**Read if:** You want to understand the PM agent's full capabilities and responsibilities.

**Key sections:**
- Lines 1-47: Core responsibility and invocation
- Lines 49-139: Key responsibilities (5 areas)
- Lines 141-284: Core principles (4 principles)
- Lines 286-374: Generic user story format
- Lines 376-423: Customizing for your project
- Lines 425-513: INVEST principles
- Lines 515-632: Validation checklists
- Lines 634-735: Communication templates

---

#### `README.md` (10 KB, 416 lines)
**Complete usage and customization guide.**

Contains:
- Overview of what's included
- How to copy and customize for your project
- Customization examples (E-commerce, Healthcare, SaaS, Mobile)
- Generic story format
- Benefits of generic approach
- Integration with Atlas workflows

**Read if:** You want to understand how to use and customize the PM agent for your project.

**Key sections:**
- Lines 1-50: Overview and what's included
- Lines 51-150: How to use (copy, customize, invoke)
- Lines 151-250: Customization examples by domain
- Lines 251-300: Generic story format
- Lines 301-350: Benefits and principles
- Lines 351-416: Atlas workflow integration

---

#### `QUICK_START.md` (10 KB, 310 lines)
**Get started in 5 minutes.**

Contains:
- 4-step quick start (copy, customize, use, optional)
- Minimal customization requirements
- Common use cases
- Example workflows
- Tips for success
- Examples by project type

**Read if:** You want to start using the PM agent RIGHT NOW.

**Key sections:**
- Lines 1-30: Copy to your project (30 seconds)
- Lines 31-70: Create basic customizations (2 minutes)
- Lines 71-85: Use the PM agent (30 seconds)
- Lines 86-130: Optional advanced customizations (2 minutes)
- Lines 131-200: What you get (story format, validation, quality gates)
- Lines 201-310: Use cases, workflows, tips, examples

---

#### `CHANGES_FROM_STACKMAP.md` (15 KB, 557 lines)
**Detailed comparison of what changed from StackMap-specific to generic.**

Contains:
- Summary of what was removed, generalized, added
- Detailed section-by-section comparison
- Before/after examples
- Migration path for existing StackMap users
- Benefits of generic version

**Read if:** You're migrating from StackMap-specific PM agent or want to understand what changed.

**Key sections:**
- Lines 1-100: Summary of changes (removed/generalized/added)
- Lines 101-250: Detailed comparison of SKILL.md changes
- Lines 251-350: story-template.md changes
- Lines 351-450: acceptance-criteria-guide.md changes
- Lines 451-520: Migration path for StackMap users
- Lines 521-557: Benefits of generic version

---

### Resource Files

#### `resources/story-template.md` (12 KB, 405 lines)
**Generic user story template with comprehensive sections.**

Contains:
- Complete story template
- Technical considerations checklist (Database, API, UI/UX, Security, Performance)
- Quality gates and success metrics
- Customization guide with domain examples
- Notes for story creators
- Example completed story

**Use this:** As starting point for creating stories or as reference for what to include.

**Key sections:**
- Lines 1-100: Generic story template structure
- Lines 101-180: Technical considerations (comprehensive checklist)
- Lines 181-220: Quality gates and deployment strategy
- Lines 221-250: Success metrics
- Lines 251-350: Customization guide and domain examples (E-commerce, Healthcare, SaaS)
- Lines 351-405: Example completed story (User profile image upload)

---

#### `resources/acceptance-criteria-guide.md` (17 KB, 563 lines)
**Complete guide to writing testable acceptance criteria.**

Contains:
- INVEST framework explanation
- How to write measurable criteria
- Good vs bad examples (domain-agnostic)
- Domain-specific examples (E-commerce, SaaS, Mobile)
- Common mistakes to avoid
- Templates by story type (UI, API, Data Migration, Bug Fix)
- Testing scenarios template

**Use this:** When writing acceptance criteria or reviewing criteria quality.

**Key sections:**
- Lines 1-60: INVEST framework (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- Lines 61-150: Writing testable criteria (measurable language, edge cases, error handling)
- Lines 151-350: Good vs bad examples (UI, API, Data Migration)
- Lines 351-450: Domain-specific examples (E-commerce, SaaS, Mobile)
- Lines 451-500: Common mistakes to avoid
- Lines 501-563: Templates and testing scenarios

---

## File Statistics

```
Total Files: 6 markdown files (5 core + 2 resources)
Total Size: 85.7 KB
Total Lines: 2,676 lines

Breakdown:
- SKILL.md:                      22 KB (735 lines)
- CHANGES_FROM_STACKMAP.md:      15 KB (557 lines)
- acceptance-criteria-guide.md:  17 KB (563 lines)
- story-template.md:             12 KB (405 lines)
- README.md:                     10 KB (416 lines)
- QUICK_START.md:                10 KB (310 lines)
```

---

## Recommended Reading Order

### For New Users (30 minutes)

1. **QUICK_START.md** (5 min) - Get basic understanding
2. **README.md** (10 min) - Understand customization approach
3. **resources/story-template.md** (10 min) - See template structure
4. **resources/acceptance-criteria-guide.md** (5 min) - Skim examples
5. **Start using it!**

### For Deep Understanding (2 hours)

1. **QUICK_START.md** (5 min)
2. **README.md** (15 min)
3. **SKILL.md** (45 min) - Read entire specification
4. **resources/story-template.md** (20 min) - Study all sections
5. **resources/acceptance-criteria-guide.md** (35 min) - Read all examples

### For Customization (1 hour)

1. **QUICK_START.md** (5 min) - Basic setup
2. **README.md** (15 min) - Customization patterns
3. **resources/story-template.md** (20 min) - Domain examples
4. **Create your .atlas/ files** (20 min)

### For Migration from StackMap (45 minutes)

1. **CHANGES_FROM_STACKMAP.md** (30 min) - Understand changes
2. **Extract customizations** (10 min) - Create .atlas/ files
3. **Verify with example** (5 min) - Test with one story

---

## File Relationships

```
INDEX.md (you are here)
├── QUICK_START.md ────────► Start here if new
├── README.md ─────────────► Read second for details
├── SKILL.md ──────────────► Complete specification
│   ├── References: resources/story-template.md
│   └── References: resources/acceptance-criteria-guide.md
├── CHANGES_FROM_STACKMAP.md ─► Migration guide
└── resources/
    ├── story-template.md ─────► Use when creating stories
    └── acceptance-criteria-guide.md ─► Use when writing criteria
```

---

## Customization Files (Create in Your Project)

These files don't exist yet - you create them in your project:

```
your-project/
└── .atlas/
    ├── story-template.md ─────► Your project-specific sections
    ├── conventions.md ────────► Your non-negotiable standards
    ├── story-examples.md ─────► Your domain examples
    └── quality-gates.md ──────► Your quality requirements
```

**See README.md and QUICK_START.md for how to create these.**

---

## Usage Patterns

### Pattern 1: Quick Story Creation
```
User → QUICK_START.md → Create .atlas/conventions.md → Use PM agent
```

### Pattern 2: Comprehensive Customization
```
User → README.md → Study domain examples → Create all .atlas/ files → Use PM agent
```

### Pattern 3: Migration from StackMap
```
StackMap User → CHANGES_FROM_STACKMAP.md → Extract customizations → Create .atlas/ files → Use PM agent
```

### Pattern 4: Learn by Example
```
User → resources/story-template.md → See example story → Copy structure → Create own story
```

### Pattern 5: Master Acceptance Criteria
```
User → resources/acceptance-criteria-guide.md → Study examples → Practice with own stories → Improve quality
```

---

## Quick Reference

### Creating a Story
1. Reference: `resources/story-template.md`
2. Use generic format as baseline
3. Add project-specific sections from `.atlas/story-template.md`
4. Validate with INVEST principles (in `SKILL.md`)

### Writing Acceptance Criteria
1. Reference: `resources/acceptance-criteria-guide.md`
2. Make them specific and measurable
3. Include edge cases and error handling
4. Follow INVEST framework

### Enforcing Quality
1. Reference: `SKILL.md` validation checklists
2. Pre-implementation: Validate story completeness
3. Post-implementation: Validate acceptance criteria met
4. Deployment: Validate quality gates passed

### Customizing for Your Project
1. Reference: `README.md` customization section
2. Create `.atlas/conventions.md` (minimum)
3. Create `.atlas/story-template.md` (domain sections)
4. Create `.atlas/story-examples.md` (optional)
5. Create `.atlas/quality-gates.md` (optional)

---

## Support and Troubleshooting

**Q: Where do I start?**
A: `QUICK_START.md` - Get started in 5 minutes

**Q: How do I customize for my project?**
A: `README.md` - Complete customization guide

**Q: What acceptance criteria should I write?**
A: `resources/acceptance-criteria-guide.md` - Examples and templates

**Q: How do I create a story?**
A: `resources/story-template.md` - Generic template with examples

**Q: What are the PM agent's responsibilities?**
A: `SKILL.md` - Complete specification

**Q: I'm migrating from StackMap version, what changed?**
A: `CHANGES_FROM_STACKMAP.md` - Detailed comparison

---

## Version Information

**Version:** Generic v1.0
**Source:** Adapted from StackMap-specific PM agent
**Created:** October 2025
**Compatibility:** Atlas Framework (any version)
**Platform:** Domain-agnostic, works with any project

---

## Contributing

To improve this generic PM agent skill:

1. **Keep it domain-agnostic** - Don't add project-specific content
2. **Provide diverse examples** - Show multiple domains (e-commerce, healthcare, SaaS, etc.)
3. **Document customization patterns** - Help users adapt to their needs
4. **Test with different projects** - Ensure it works across domains

---

## License

This generic PM agent skill is part of the Atlas framework and follows the same license as your project.

---

**Next Step:** Read `QUICK_START.md` to get started in 5 minutes!
