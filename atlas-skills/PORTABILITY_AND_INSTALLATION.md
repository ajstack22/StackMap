# Atlas Skills - Portability & Installation Guide

## Current State: StackMap-Specific

### The Problem

The Atlas Skills system was built **with StackMap conventions embedded throughout**, making them currently **NOT easily portable** to other projects. Examples:

**StackMap-specific rules in every skill**:
- Field naming: `text`/`icon` (not `name`/`emoji`)
- Store updates: `useUserStore.getState().setUsers()`
- Platform gotchas: Android FlexWrap 48% widths
- Deployment: `PENDING_CHANGES.md` → `./scripts/deploy.sh`
- Design rules: No gray text (#000 only)

**Hardcoded references**:
- `/src/utils/dataNormalizer.js`
- `./scripts/deploy.sh [qual|stage|beta|prod]`
- Four-tier deployment (QUAL → STAGE → BETA → PROD)
- Typography component
- Specific store architecture

---

## Solution: Two-Tier Architecture

### Option 1: Generic Core + Project-Specific Overlay (Recommended)

Create **two versions** of Atlas Skills:

#### 1. Generic Atlas Skills (Portable)
```
atlas-skills-core/
├── atlas-meta/              # Generic orchestrator
├── atlas-quick/             # Generic 2-phase workflow
├── atlas-iterative/         # Generic 3-phase workflow
├── atlas-standard/          # Generic 5-phase workflow
├── atlas-full/              # Generic 9-phase workflow
└── atlas-agent-*/           # Generic agent skills
```

**Generic skills contain**:
- Universal workflow phases
- Common software development patterns
- Placeholder sections for project-specific rules
- No hardcoded paths or conventions

#### 2. Project-Specific Configuration
```
atlas-skills-stackmap/
├── config/
│   ├── conventions.md       # StackMap conventions
│   ├── deployment.md        # Four-tier deployment
│   ├── platform-gotchas.md  # iOS/Android/Web specifics
│   └── validation.sh        # Project-specific checks
└── README.md                # How to use with StackMap
```

**Usage**:
- Generic skills loaded first
- Project config injected via `<project-conventions>` section
- Skills reference: "See project conventions for field naming rules"

---

### Option 2: Parameterized Skills (Future Claude Feature)

If Claude Skills support parameters in the future:

```yaml
---
name: atlas-standard
description: 5-phase workflow for most tasks
parameters:
  project_conventions: ./config/stackmap-conventions.md
  deployment_script: ./scripts/deploy.sh
  validation_rules: ./config/validation-rules.md
---
```

Skills load conventions dynamically based on parameters.

---

### Option 3: Fork and Customize (Current Workaround)

**For now**, other projects should:

1. **Copy the atlas-skills/ directory**
2. **Find and replace StackMap-specific rules**:
   ```bash
   # Find all StackMap references
   grep -r "StackMap" atlas-skills/
   grep -r "PENDING_CHANGES.md" atlas-skills/
   grep -r "useUserStore\|useAppStore" atlas-skills/
   grep -r "./scripts/deploy.sh" atlas-skills/
   ```

3. **Replace with their conventions**:
   - Field naming → their naming conventions
   - Store updates → their state management
   - Deployment → their deployment process
   - Platform rules → their platform gotchas

4. **Update validation scripts**:
   - `validate-standard.sh` → check their patterns
   - `quality-gates.sh` → enforce their rules

---

## Installation Options

### Where Should Skills Be Installed?

Claude Skills can be installed in **two locations**:

#### Option 1: Project Directory (Current Approach) ✅

```
/Users/adamstack/StackMap/StackMap/atlas-skills/
```

**Pros**:
- ✅ Skills versioned with project (git)
- ✅ Team members get skills automatically
- ✅ Project-specific customizations easy
- ✅ Can have different versions per project
- ✅ No global Claude config needed

**Cons**:
- ❌ Not available to other projects
- ❌ Duplicated if multiple projects use Atlas
- ❌ Claude may need explicit path reference

**Best for**: Project-specific workflows (StackMap's current setup)

---

#### Option 2: Global Claude Skills Directory

```
~/.claude/skills/atlas-skills/
```

**Pros**:
- ✅ Available to all projects
- ✅ Single source of truth
- ✅ Easier to discover (Claude UI)
- ✅ Automatic loading by Claude

**Cons**:
- ❌ Project-specific rules don't work
- ❌ Needs to be generic/parameterized
- ❌ Manual installation per machine
- ❌ Not version controlled with project

**Best for**: Generic, reusable workflows

---

#### Option 3: Hybrid Approach (Recommended for Future)

**Generic skills** in global directory:
```
~/.claude/skills/
├── atlas-meta/
├── atlas-quick/
├── atlas-standard/
└── atlas-full/
```

**Project-specific config** in project:
```
/Users/adamstack/StackMap/StackMap/.atlas/
├── conventions.md
├── deployment.md
└── validation.sh
```

**Skills reference project config**:
```markdown
## Project Conventions

Load conventions from: `.atlas/conventions.md` (if exists)

Otherwise, use generic defaults:
- Field naming: Use consistent naming
- State management: Use appropriate patterns
- Deployment: Follow project deployment process
```

---

## Making Atlas Skills Portable (Action Plan)

### Phase 1: Create Generic Core (2-3 hours)

**Task**: Extract generic workflow from StackMap-specific skills

**Changes needed**:

1. **atlas-meta/SKILL.md**:
   ```diff
   - ## StackMap-Specific Rules
   + ## Project Conventions
   +
   + Atlas works with any project. Load project-specific conventions from:
   + - `.atlas/conventions.md` (if exists)
   + - Or use generic software development best practices
   ```

2. **atlas-standard/SKILL.md**:
   ```diff
   - ### StackMap-Specific Implementation Rules:
   - **Store updates (CRITICAL):**
   - useUserStore.getState().setUsers(newUsers)
   + ### Project-Specific Rules:
   +
   + Check your project's conventions for:
   + - State management patterns
   + - Field naming conventions
   + - Platform-specific gotchas
   + - Deployment process
   ```

3. **Validation scripts**:
   ```diff
   - # Check for useAppStore.setState usage
   - grep -r "useAppStore\.setState" src/
   + # Check for project-specific anti-patterns
   + if [ -f .atlas/anti-patterns.sh ]; then
   +   source .atlas/anti-patterns.sh
   + fi
   ```

4. **Create template project config**:
   ```
   atlas-skills/examples/project-config-template/
   ├── conventions.md          # Template for field naming, etc.
   ├── deployment.md           # Template for deployment process
   ├── anti-patterns.sh        # Template for validation
   └── README.md               # How to customize
   ```

---

### Phase 2: Document Customization (1 hour)

**Create**: `atlas-skills/CUSTOMIZATION_GUIDE.md`

**Content**:
- How to adapt Atlas to your project
- What to customize (conventions, deployment, validation)
- Examples of customizations
- Project config template

**Create**: `atlas-skills/examples/`
```
examples/
├── react-native-project/    # StackMap-style config
├── web-app-project/         # Web-only config
├── django-project/          # Backend config
└── mobile-only-project/     # Mobile-only config
```

---

### Phase 3: Publish Generic Version (1 hour)

**Repository structure**:
```
atlas-skills/                 # Generic version (MIT license)
├── README.md
├── CUSTOMIZATION_GUIDE.md
├── atlas-meta/
├── atlas-quick/
├── atlas-standard/
├── atlas-full/
├── atlas-agent-*/
└── examples/
    └── project-config-template/
```

**Publish to**:
- GitHub: `github.com/stackmap/atlas-skills`
- Claude Skills Registry (if/when available)
- npm (as templates): `npm install -g @atlas/skills-cli`

---

## Current Recommendation for StackMap

### Keep Skills in Project Directory

**Why**:
1. **StackMap-specific** - Rules are deeply integrated
2. **Team alignment** - Everyone gets same workflow
3. **Version control** - Skills versioned with code
4. **Evolution** - Skills can evolve with project needs

**Installation**: Already installed at `/Users/adamstack/StackMap/StackMap/atlas-skills/`

**Usage**:
```
"Fix sync bug. Use Atlas workflow."
```

Claude will find skills in project directory (if configured to look there).

---

### For Other Projects: Wait for Generic Version

**Current state**: Skills are StackMap-specific
**Timeline**:
- Phase 1 (Generic core): 2-3 hours
- Phase 2 (Documentation): 1 hour
- Phase 3 (Publish): 1 hour
- **Total**: ~5 hours to create portable version

**Alternative (immediate)**:
- Copy `atlas-skills/` directory
- Find/replace StackMap conventions
- Customize for your project

---

## Installation Instructions (Current Setup)

### StackMap Team Members

**Already installed** - Skills are in the project repo:
```
/Users/adamstack/StackMap/StackMap/atlas-skills/
```

**To use**:
1. Pull latest from git
2. Verify skills directory exists: `ls atlas-skills/`
3. Use in Claude: `"Fix bug X. Use Atlas workflow."`

**Note**: Claude Code may need configuration to recognize project skills. Check `.claude/` directory for skill references.

---

### External Projects (Waiting for Generic Version)

**Option 1: Wait** (recommended)
- Generic Atlas Skills will be released soon
- Easy customization guide included
- No StackMap-specific rules

**Option 2: Fork Now** (advanced)
1. Copy `atlas-skills/` directory
2. Replace StackMap conventions:
   ```bash
   cd atlas-skills/

   # Find StackMap references
   grep -r "StackMap" . > stackmap-refs.txt
   grep -r "useUserStore\|useAppStore" . > store-refs.txt
   grep -r "PENDING_CHANGES.md" . > deploy-refs.txt

   # Replace with your conventions (manual editing)
   ```
3. Update validation scripts
4. Test with your project

---

## Claude Desktop Configuration

### How Claude Finds Skills

**Order of precedence**:
1. **Project directory** (if `.claude/skills/` or `atlas-skills/` in project root)
2. **Global skills directory** (`~/.claude/skills/`)
3. **Built-in skills** (Anthropic-provided)

### StackMap Configuration

**Current setup**: Skills in project directory
```
/Users/adamstack/StackMap/StackMap/atlas-skills/
```

**Claude Code may need**:
- Skills path configured in `.claude/` directory
- Or explicit skill invocation: `"Use atlas-standard skill from ./atlas-skills/"`

**To verify Claude can find skills**:
```
"List available Atlas skills"
```

If Claude doesn't see them, add to `.claude/` config or reference explicitly.

---

## Future Improvements

### 1. Parameterized Skills (If Claude Supports)

```yaml
---
name: atlas-standard
parameters:
  conventions_file: ${PROJECT_ROOT}/.atlas/conventions.md
  deployment_script: ${PROJECT_ROOT}/scripts/deploy.sh
---
```

### 2. Skill Composition

```yaml
---
name: atlas-standard-stackmap
extends: atlas-standard
config:
  conventions: ./stackmap-conventions.md
---
```

### 3. Skill Marketplace

- Publish generic Atlas Skills
- Community can contribute project configs
- Rating/review system
- Dependency management

---

## Summary & Recommendations

### Current State: StackMap-Specific ✅

**Location**: `/Users/adamstack/StackMap/StackMap/atlas-skills/`
**Portability**: Low (StackMap conventions embedded)
**Installation**: Project directory (version controlled)
**Best for**: StackMap team members

### Recommended Next Steps:

#### For StackMap (Immediate):
1. ✅ Keep skills in project directory
2. ✅ Update CLAUDE.md with skill references (done)
3. ✅ Team testing and feedback
4. ⏳ Iterate based on usage

#### For Portability (Future - 5 hours):
1. ⏳ Create generic core (extract StackMap rules)
2. ⏳ Create project config template
3. ⏳ Document customization guide
4. ⏳ Publish to GitHub as separate repo
5. ⏳ Add example project configs

#### For Other Projects (Now):
- **Wait** for generic version (recommended)
- **Or fork** and customize (advanced users)

---

## Questions & Answers

### Q: Should we move skills to `~/.claude/skills/`?
**A**: No, keep in project directory for StackMap. Generic version can go global later.

### Q: Can other projects use these skills now?
**A**: Not easily - they're StackMap-specific. Need generic version first.

### Q: How much work to make them portable?
**A**: ~5 hours to extract generic core + documentation.

### Q: Will Claude Desktop find them in project directory?
**A**: Possibly - may need `.claude/` config or explicit path reference.

### Q: Should we create two versions (generic + StackMap)?
**A**: Yes, eventually:
- `atlas-skills/` (generic, GitHub, portable)
- `atlas-skills-stackmap/` (StackMap config for generic skills)

---

**Prepared by**: Claude (Sonnet 4.5)
**Date**: January 17, 2025
**Status**: Current state documented, portability roadmap defined
