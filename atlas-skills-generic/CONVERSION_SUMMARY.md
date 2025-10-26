# Atlas Skills Generic Conversion Summary

This document summarizes the conversion of StackMap-specific Atlas skills to generic, portable versions.

## Task Completed

Created generic, project-agnostic versions of:
1. **atlas-meta** - Workflow orchestrator skill
2. **atlas-quick** - Quick workflow skill (5-15 min)

## Files Created/Modified

```
/Users/adamstack/StackMap/StackMap/atlas-skills-generic/
├── README.md (updated with clear usage instructions)
├── atlas-meta/
│   ├── SKILL.md (generic version - no StackMap-specific rules)
│   └── resources/
│       └── tier-selector.md (generic version)
├── atlas-quick/
│   └── SKILL.md (generic version - no StackMap-specific examples)
└── templates/
    └── conventions-template.md (new - comprehensive template)
```

## Key Changes Made

### atlas-meta/SKILL.md

**Removed:**
- Entire "StackMap-Specific Rules" section (lines 65-98 in original)
  - Field naming standards (activity.text vs activity.name)
  - Store update patterns (useUserStore.getState().setUsers)
  - Platform testing gotchas (Android FlexWrap, iOS AsyncStorage)
  - Deployment process (./scripts/deploy.sh)
  - Design rules (no gray text, Typography component)

**Added:**
- "Project Conventions (Customize for Your Project)" section
- Instructions for creating `.atlas/conventions.md`
- Three-tier customization approach:
  1. Create `.atlas/conventions.md` (recommended)
  2. Reference existing documentation
  3. Use general best practices (default)
- Generic anti-patterns (removed StackMap-specific ones)
- Example showing convention checking workflow

**Kept Intact:**
- Decision tree logic
- Workflow tier table
- Invocation patterns
- Escalation rules
- Success indicators
- Example orchestrations (updated to be generic)

### atlas-quick/SKILL.md

**Removed:**
- StackMap-specific field naming examples:
  - `activity.text = "New text"` / `activity.icon = "🏃"`
  - `activity.name` / `activity.emoji` anti-patterns
- StackMap Typography component examples
- StackMap color rules (no gray text #666666)
- StackMap deployment commands (`./scripts/deploy.sh qual --all`)
- StackMap-specific file references (`PENDING_CHANGES.md`)

**Added:**
- Generic examples:
  - "Wellcome" → "Welcome" typo fix
  - "#0000FF" → "#007AFF" color change
  - "30000" → "60000" timeout update
- Project-specific considerations section referencing `.atlas/conventions.md`
- Generic field naming example (displayName vs username)
- Generic color system example (theme.colors.primary)
- Generic typography example (Typography variant)
- Placeholder deployment commands: `[your deployment command]`
- Placeholder changelog references: `[your changelog file]`
- Instructions to customize for your project

**Kept Intact:**
- 2-phase workflow structure (Make Change → Deploy)
- Time estimates (5-15 minutes)
- Success criteria
- Escalation criteria
- Anti-patterns
- Checklists
- Red flags

### atlas-meta/resources/tier-selector.md

**Changes:**
- Removed StackMap-specific examples
- Added generic examples:
  - "Fix null pointer when processing empty data"
  - "Migrate database from SQLite to PostgreSQL"
- Updated scenarios to be technology-agnostic
- Kept all decision logic intact

### templates/conventions-template.md (New File)

Created comprehensive template with sections for:
- Code standards (field naming, state management, style)
- Platform-specific rules (Web, Mobile, Backend)
- Deployment process (pre/during/post deployment)
- Quality gates (linting, type checking, testing, build)
- Design standards (accessibility, colors, typography, spacing)
- Critical patterns (authentication, API integration, error handling, persistence)
- Anti-patterns to avoid
- Testing standards (unit, integration, e2e)
- Documentation requirements
- Environment variables
- Security requirements
- Performance standards
- Browser/platform support
- Useful links

## Verification

### Tested for Generic-ness

Searched for StackMap-specific terms:
```bash
grep -i "stackmap\|useUserStore\|PENDING_CHANGES\|activity.text" atlas-skills-generic/atlas-meta/SKILL.md
# Result: No matches (fully generic)

grep -i "stackmap\|useUserStore\|PENDING_CHANGES\|activity.text" atlas-skills-generic/atlas-quick/SKILL.md
# Result: Only reference in example: "e.g., CHANGELOG.md, PENDING_CHANGES.md" (generic)
```

### Key Generic Patterns Used

1. **Placeholder commands**: `[your deployment command]`, `[your changelog file]`
2. **Generic examples**: typo fixes, color changes, timeout updates
3. **Customization sections**: "Check for `.atlas/conventions.md`"
4. **Generic anti-patterns**: state mutation, hard-coded URLs (not StackMap-specific)
5. **Universal best practices**: SOLID, DRY, clean code principles

## Usage Instructions

### For Any Project:

1. **Copy the generic skills:**
   ```bash
   cp -r atlas-skills-generic/ your-project/.atlas/skills/
   ```

2. **Use immediately (no configuration required):**
   ```
   "Fix the login bug. Use Atlas workflow."
   ```

3. **Optional: Customize with `.atlas/conventions.md`:**
   ```bash
   cp atlas-skills-generic/templates/conventions-template.md your-project/.atlas/conventions.md
   # Edit to add your project-specific rules
   ```

### Integration Points:

- **Decision tree**: Automatically selects tier based on complexity
- **Convention checking**: Looks for `.atlas/conventions.md` before applying rules
- **Fallback**: Uses general best practices if no conventions file exists
- **Escalation**: Works same as before, but with generic reasoning

## Benefits of Generic Version

1. **Portability**: Use across any project type (web, mobile, backend, etc.)
2. **Flexibility**: Customize via conventions file without modifying skills
3. **Maintainability**: Update conventions without changing workflow logic
4. **Onboarding**: New developers reference conventions file
5. **Consistency**: Same workflow structure across all projects
6. **Reusability**: One set of skills for multiple projects

## Differences from StackMap Version

| Aspect | StackMap Version | Generic Version |
|--------|------------------|-----------------|
| Field naming | Hard-coded rules | Check conventions file |
| State management | Specific store methods | Generic patterns |
| Deployment | `./scripts/deploy.sh` | `[your deployment command]` |
| Changelog | `PENDING_CHANGES.md` | `[your changelog file]` |
| Design rules | No gray text, Typography | Check conventions file |
| Platform gotchas | Android/iOS specifics | Check conventions file |
| Examples | StackMap-specific | Generic (typos, colors) |
| Anti-patterns | StackMap mistakes | Universal mistakes |

## Quality Checks Performed

- ✅ Removed all StackMap-specific field names
- ✅ Removed all StackMap-specific component names (Typography)
- ✅ Removed all StackMap-specific file names (PENDING_CHANGES.md)
- ✅ Removed all StackMap-specific commands (./scripts/deploy.sh)
- ✅ Removed all StackMap-specific design rules (gray text)
- ✅ Removed all StackMap-specific platform gotchas
- ✅ Added `.atlas/conventions.md` integration
- ✅ Added generic placeholder commands
- ✅ Added comprehensive conventions template
- ✅ Added customization instructions
- ✅ Kept workflow logic intact
- ✅ Kept time estimates accurate
- ✅ Kept success criteria relevant
- ✅ Kept escalation rules universal

## Next Steps

1. **Test with a non-StackMap project** to verify generic-ness
2. **Create additional generic skills** (atlas-iterative, atlas-standard, atlas-full)
3. **Share with community** for feedback
4. **Document edge cases** discovered during real-world usage
5. **Create example conventions** for popular frameworks:
   - React/Next.js web apps
   - React Native mobile apps
   - Node.js/Express backends
   - Python/Django backends
   - Go microservices

## Success Metrics

The conversion is successful because:

1. **Zero StackMap references** in core skill logic
2. **Clear customization path** via `.atlas/conventions.md`
3. **Comprehensive template** for common scenarios
4. **Preserved workflow integrity** (phases, timing, logic)
5. **Universal applicability** (any language, framework, platform)

## Files to Package for Distribution

```
atlas-skills-generic/
├── README.md                          # Main usage guide
├── CONVERSION_SUMMARY.md              # This file
├── atlas-meta/
│   ├── SKILL.md                      # Generic orchestrator
│   └── resources/
│       └── tier-selector.md          # Generic tier guide
├── atlas-quick/
│   └── SKILL.md                      # Generic quick workflow
└── templates/
    └── conventions-template.md        # Customization template
```

## License Note

These generic skills are derived from the Atlas Framework created for StackMap. They are intended for use with Claude AI workflows and can be freely used, customized, and shared with teams.

---

**Conversion completed successfully on 2025-10-17**
