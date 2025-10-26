# Generic Atlas Developer Agent - Creation Summary

## What Was Created

A **fully generic, portable version** of the StackMap-specific developer agent skill, ready to be adapted to any codebase.

## File Structure

```
atlas-skills-generic/atlas-agent-developer/
├── README.md                          # Quick start and usage guide
├── SKILL.md                          # Complete agent specification (generic)
├── GENERIC_VERSION_SUMMARY.md        # This file
├── resources/
│   └── grep-test-guide.md           # Verifiable completion methodology
└── templates/
    ├── conventions.md               # Template for project conventions
    ├── verification.md              # Template for grep tests
    └── platforms.md                 # Template for platform-specific rules
```

## What Changed from StackMap Version

### Removed StackMap-Specific Content

**From SKILL.md:**
- ❌ Store architecture (useUserStore, useSettingsStore, etc.)
- ❌ Field naming standards (activity.text, activity.icon)
- ❌ Typography component requirements
- ❌ Platform gotchas (iOS AsyncStorage, Android fontWeight, Web 3-column layout)

**From grep-test-guide.md:**
- ❌ StackMap-specific grep patterns (useAppStore.setState, activity.emoji)
- ❌ StackMap field migration examples
- ❌ StackMap sync service examples

### Kept Universal Content

**Core Principles (unchanged):**
1. ✅ Verify, Then Act
2. ✅ Measure Everything (The "Grep Test")
3. ✅ Eliminate, Don't Add
4. ✅ Production Code is Silent & Safe
5. ✅ Own Your Quality

**Standard Workflow (unchanged):**
1. ✅ Understand
2. ✅ Implement
3. ✅ Self-Validate
4. ✅ Document
5. ✅ Submit for Review

**Grep Test Methodology (unchanged):**
- ✅ Measurable outcomes
- ✅ Verifiable claims
- ✅ Command-line verification
- ✅ Before/after metrics

### Added Generic Content

**Generic examples:**
- ✅ Generic bug fix (null pointer, not activity-specific)
- ✅ Generic feature (search functionality, not StackMap stores)
- ✅ Generic refactoring (extract utility, not sync service)

**Customization system:**
- ✅ `.atlas/conventions.md` for project-specific rules
- ✅ `.atlas/verification.md` for custom grep tests
- ✅ `.atlas/platforms.md` for platform-specific rules

**Templates provided:**
- ✅ `templates/conventions.md` - Complete conventions template
- ✅ `templates/verification.md` - Grep tests template
- ✅ `templates/platforms.md` - Platform rules template

## How to Use This Generic Version

### 1. Copy to Your Project

```bash
cp -r atlas-skills-generic/atlas-agent-developer /your-project/.atlas/skills/
```

### 2. Create Customization Files

**Option A: Start from templates**
```bash
cp .atlas/skills/atlas-agent-developer/templates/conventions.md .atlas/conventions.md
cp .atlas/skills/atlas-agent-developer/templates/verification.md .atlas/verification.md
cp .atlas/skills/atlas-agent-developer/templates/platforms.md .atlas/platforms.md
```

**Option B: Create minimal versions**
```bash
# Just add what you need - agent works without these files
echo "# Project Conventions\n\n[Your rules here]" > .atlas/conventions.md
```

### 3. Customize for Your Project

Edit `.atlas/conventions.md`:
- Document your state management approach
- Define naming standards
- Specify code organization rules
- Define testing requirements

Edit `.atlas/verification.md`:
- Add grep tests for your conventions
- Define success criteria
- Document verification commands

Edit `.atlas/platforms.md` (if multi-platform):
- Document platform-specific rules
- Define cross-platform abstractions
- List platform gotchas

### 4. Use the Developer Agent

```bash
"Implement [feature]. Use developer agent."
"Fix bug: [description]. Use developer agent."
```

The agent will:
1. Apply generic best practices (always)
2. Read your `.atlas/conventions.md` (if exists)
3. Use your `.atlas/verification.md` grep tests (if exists)
4. Follow your `.atlas/platforms.md` rules (if exists)

## Key Features of Generic Version

### 1. Framework Agnostic

Works with any framework:
- React, Vue, Angular, Svelte (frontend)
- Express, Fastify, Nest.js (backend)
- React Native, Flutter, Electron (cross-platform)
- Any TypeScript/JavaScript codebase

### 2. Convention Agnostic

Adapts to your conventions:
- Redux, MobX, Context, Zustand (state management)
- CSS Modules, Styled Components, Tailwind (styling)
- Jest, Vitest, Mocha (testing)
- ESLint, Prettier, Biome (tooling)

### 3. Process Agnostic

Works with any workflow:
- Agile, Scrum, Kanban
- Trunk-based, Git Flow
- TDD, BDD
- Any review process

### 4. Fully Portable

No dependencies on:
- Specific frameworks
- Specific tools
- Specific project structure
- Specific conventions

## What Makes This Version Generic

### Before (StackMap-specific):
```javascript
// ❌ WRONG: Direct setState (StackMap-specific rule)
useAppStore.setState({ users: newUsers })

// ✅ CORRECT: Store-specific method (StackMap pattern)
useUserStore.getState().setUsers(newUsers)
```

### After (Generic):
```javascript
// Follow your project's state management pattern
// Examples: Redux, MobX, Context API, Zustand, etc.

// Check .atlas/conventions.md for your project's approach

// Generic example:
// Redux: dispatch(updateUsers(newUsers))
// MobX: userStore.setUsers(newUsers)
// Context: setUsers(newUsers)
```

### Before (StackMap-specific):
```bash
# Verify store usage (StackMap-specific)
grep -r "useAppStore.setState" src/
# Should return NOTHING
```

### After (Generic):
```bash
# Verify your project's conventions
# Check .atlas/verification.md for custom grep tests

# Generic example:
# Verify no direct state mutations
grep -r "state\.\w\+\s*=" src/
# Should return NOTHING
```

## Comparison: StackMap vs Generic

| Aspect | StackMap Version | Generic Version |
|--------|------------------|-----------------|
| **Principles** | Same (5 core principles) | Same (5 core principles) |
| **Workflow** | Same (5 steps) | Same (5 steps) |
| **Grep Test** | Same methodology | Same methodology |
| **State Mgmt** | useUserStore, useSettingsStore | Your choice (Redux, MobX, etc.) |
| **Field Names** | activity.text, activity.icon | Your conventions |
| **Typography** | Typography component required | Your UI library |
| **Platforms** | iOS/Android/Web gotchas | Your platforms |
| **Conventions** | Hardcoded in SKILL.md | Defined in .atlas/conventions.md |
| **Verification** | Hardcoded grep tests | Defined in .atlas/verification.md |
| **Examples** | StackMap-specific | Generic patterns |

## Benefits of Generic Version

### 1. Portable
- ✅ Works with any codebase
- ✅ No framework dependencies
- ✅ No project structure assumptions

### 2. Customizable
- ✅ Add your conventions
- ✅ Define your grep tests
- ✅ Document your platforms

### 3. Maintainable
- ✅ Conventions documented separately
- ✅ Easy to update as project evolves
- ✅ Team can contribute to conventions

### 4. Educational
- ✅ Templates show what to document
- ✅ Examples show how to customize
- ✅ Clear separation of universal vs project-specific

## Usage Examples

### Example 1: React + Redux Project

**`.atlas/conventions.md`:**
```markdown
## State Management
- Use Redux for global state
- Use useSelector for reading state
- Use typed actions for updates
```

**`.atlas/verification.md`:**
```bash
# Verify Redux actions are typed
grep -r "dispatch(" src/ | grep -v ": Action"
# Should return NOTHING
```

**Agent applies:** Generic best practices + your Redux rules

### Example 2: Vue + Pinia Project

**`.atlas/conventions.md`:**
```markdown
## State Management
- Use Pinia for global state
- Use composition API (not options API)
- Define stores in src/stores/
```

**`.atlas/verification.md`:**
```bash
# Verify composition API used
grep -r "export default {" src/components/
# Should return NOTHING (use <script setup>)
```

**Agent applies:** Generic best practices + your Vue/Pinia rules

### Example 3: Backend Node.js + Express

**`.atlas/conventions.md`:**
```markdown
## API Design
- Use RESTful conventions
- Use async/await (no callbacks)
- Validate input with Zod
```

**`.atlas/verification.md`:**
```bash
# Verify async/await used
grep -r "\.then\|\.catch" src/routes/
# Should return NOTHING (use async/await)
```

**Agent applies:** Generic best practices + your Express rules

## Migration from StackMap Version

If you already use the StackMap version and want to migrate:

### Step 1: Backup Current Version
```bash
cp -r .atlas/skills/atlas-agent-developer .atlas/skills/atlas-agent-developer.backup
```

### Step 2: Copy Generic Version
```bash
cp -r atlas-skills-generic/atlas-agent-developer .atlas/skills/
```

### Step 3: Extract Your Conventions
Create `.atlas/conventions.md` with your StackMap-specific rules:
- Store architecture rules
- Field naming conventions
- Typography requirements
- Platform gotchas

### Step 4: Extract Your Grep Tests
Create `.atlas/verification.md` with your StackMap-specific checks:
- Store usage verification
- Field naming verification
- Typography verification

### Step 5: Test
```bash
"Fix [simple bug]. Use developer agent."
# Verify agent still works with your conventions
```

## Next Steps

1. **Try it out:** Copy to a project and test basic usage
2. **Customize:** Create `.atlas/conventions.md` for your project
3. **Verify:** Add grep tests in `.atlas/verification.md`
4. **Iterate:** Update conventions as project evolves
5. **Share:** Contribute improvements back to generic version

## Support

- **Generic version issues:** See README.md and SKILL.md
- **Customization help:** See templates/ directory
- **Grep test examples:** See resources/grep-test-guide.md
- **Atlas framework:** See /atlas/docs/

## License

MIT License - Free to use and modify for any project.

## Changelog

### v1.0.0 (2025-01-XX)

**Created:**
- Generic developer agent skill (from StackMap version)
- Grep test guide (generic examples)
- Convention customization system
- Templates for conventions, verification, platforms

**Removed:**
- StackMap-specific store architecture
- StackMap-specific field naming
- StackMap-specific platform gotchas
- StackMap-specific grep test examples

**Added:**
- Generic implementation patterns
- Customization documentation
- Template files for project adaptation
- Migration guide from StackMap version
