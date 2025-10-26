# CLAUDE.md - Essential StackMap Development Guide

## 🎯 CURRENT WORK - READ THIS FIRST!
**See `/CURRENT_WORK.md` for what we're actively building**
- Current Feature: Edit Mode List Refactor (converting cards to list view)
- NOT working on: Sync fixes, documentation cleanup, or old issues

## 🤖 ATLAS SKILLS SYSTEM (RECOMMENDED)
StackMap now uses **Atlas Skills** for structured development - a more efficient, executable alternative to the documentation-based Atlas workflow.

### Quick Start with Skills

**Automatic tier selection** (recommended):
```
"[Task description]"
```
Claude will automatically analyze and route to the appropriate workflow tier.

**Explicit tier selection**:
```
"[Task description]. Use Atlas [Quick|Iterative|Standard|Full] workflow."
```

### Available Skills

**Core Workflow Tiers:**
- **atlas-meta**: Orchestrator (routes to appropriate tier)
- **atlas-quick**: Trivial changes (5-15 min)
- **atlas-iterative**: Changes needing validation (15-30 min)
- **atlas-standard**: Most tasks - DEFAULT (30-60 min) ⭐
- **atlas-full**: Complex features (2-4 hours)

**Agent Skills:**
- **atlas-agent-developer**: Implementation (Sonnet)
- **atlas-agent-peer-reviewer**: Deep reviews (Opus)
- **atlas-agent-product-manager**: Stories (Sonnet)
- **atlas-agent-devops**: Deployment (Sonnet)
- **atlas-agent-security**: Security audits (Sonnet)

### Benefits

- **12x more efficient**: 400 tokens vs 5,000 tokens
- **Progressive disclosure**: Load only what's needed
- **Automated validation**: Scripts enforce quality gates
- **StackMap integration**: All conventions built-in

**📖 Full Documentation**: See [atlas-skills/README.md](./atlas-skills/README.md)

---

## 🤖 ATLAS WORKFLOW SYSTEM (Legacy - use Atlas Skills instead)
StackMap uses the **Atlas Framework** for structured development workflows. Choose the right tier:

### Quick Workflow (5-15 min) - Trivial Changes
```
"Quick change: [DESCRIPTION]. Use Atlas Quick workflow."
```
**Use for:** Color changes, text updates, typo fixes, single-line changes
**Phases:** Make change → Deploy

### Iterative Workflow (15-30 min) - Changes Needing Validation
```
"[CHANGE DESCRIPTION]. Use Atlas Iterative workflow."
```
**Use for:** Style improvements, simple UI tweaks, straightforward refactors needing peer review
**Phases:** Make change → Peer review (repeat until passes) → Deploy

### Standard Workflow (30-60 min) - Most Tasks ⭐ **DEFAULT**
```
"[TASK DESCRIPTION]. Use Atlas Standard workflow."
```
**Use for:** Bug fixes, small features (1-5 files), refactoring, test additions
**Phases:** Research → Plan → Implement → Review → Deploy

### Full Workflow (2-4 hours) - Complex Features
```
"[TASK DESCRIPTION]. Use Atlas Full workflow."
```
**Use for:** New modules, cross-platform features, security changes, major refactors
**Phases:** Research → Story → Plan → Adversarial Review → Implement → Test → Validate → Cleanup → Deploy

**📖 Quick Reference:** See [docs/ATLAS_QUICK_REFERENCE.md](./docs/ATLAS_QUICK_REFERENCE.md) ⭐ **START HERE**
**📖 Detailed Tiers:** See [atlas/docs/WORKFLOW_TIERS.md](./atlas/docs/WORKFLOW_TIERS.md)
**📖 Integration Guide:** See [docs/ATLAS_INTEGRATION.md](./docs/ATLAS_INTEGRATION.md)
**🔧 Agent Specs:** See [.claude/agents/](../.claude/agents/)

---

## 🚀 DEPLOYMENT - ALWAYS USE THIS
```bash
# First, update PENDING_CHANGES.md with your changes:
# ## Title: Your descriptive title here
# ### Changes Made:
# - List of changes...

# Four-Tier Deployment Strategy (USE MASTER SCRIPT):
./scripts/deploy.sh qual [--all]         # QUAL: Development testing (qual-api DB, web + mobile, multiple/day)
./scripts/deploy.sh stage [--all]        # STAGE: Internal team validation (stage-api DB shares Qual DB, mobile-only, before beta)
./scripts/deploy.sh beta [--all]         # BETA: Closed beta testing (beta-api/prod-api DB, beta web + mobile, 1-2/week)
./scripts/deploy.sh prod [--all]         # PROD: Public release (prod-api DB, web + mobile, weekly/bi-weekly)

# Platform-specific deployment (all tiers):
./scripts/deploy.sh qual --web           # Deploy web only
./scripts/deploy.sh qual --ios           # Deploy iOS only
./scripts/deploy.sh qual --android       # Deploy Android only
./scripts/deploy.sh beta --all           # Deploy all platforms (default)

# ⚠️ IMPORTANT: Always use ./scripts/deploy.sh (master script)
# - Handles validation, locking, and verification
# - Delegates to tier-specific scripts (qual_deploy.sh, deploy_stage.sh, deploy_beta.sh, prod_deploy.sh)
# - Direct execution of tier scripts is blocked
```
**Four-Tier Strategy:** QUAL (multiple/day) → STAGE (internal validation) → BETA (1-2/week) → PROD (weekly/bi-weekly)
**API Endpoints:** stackmap.app/qual/api (QUAL), stackmap.app/stage/api (STAGE, shares Qual DB), stackmap.app/beta/api (BETA, Prod DB), stackmap.app/api (PROD)
**Commit Messages:** Update `PENDING_CHANGES.md` before deploying for descriptive commit messages
**iOS Production:** Now fully automated! No manual Xcode steps required - builds, uploads, and prepares for review
**iOS Bundle IDs:** Single bundle ID (`app.stackmap`) for stage/beta/prod, differentiated via TestFlight groups. QUAL uses `app.stackmap.qual` for local testing only.
**Android Package:** Single package name (`com.stackmapnative`) for all environments, differentiated via build variants
**Master Script:** Always use `./scripts/deploy.sh [tier] [options]` - validates before delegating to tier scripts
**For all deployment details:** See `docs/deployment/README.md`
**Beta deployment guide:** See `docs/deployment/BETA_DEPLOYMENT_GUIDE.md`
**Stage deployment guide:** See `docs/deployment/STAGE_DEPLOYMENT_SETUP.md`
**Testing approach:** See `docs/testing/simple-testing-guide.md`
**⚠️ Timeout:** Android builds take 2-3 minutes - use 600000ms (10 min) timeout when automating

---

## 📁 CRITICAL PROJECT STRUCTURE

### Key Directories
- `/docs/` - **PRIMARY DOCUMENTATION LOCATION**
  - `deployment/` - Deployment procedures and guides
  - `sync/` - Sync system documentation and troubleshooting
  - `platform/` - Platform-specific guides (iOS, Android, Web)
  - `features/` - Feature implementation guides and specifications
  - `testing/` - Testing guides, checklists, and protocols
  - `onboarding/` - New developer guides and user onboarding docs
- `/scripts/` - All automation scripts
- `/src/components/EditModeList/` - New unified edit mode (Jan 2025)
- `/src/utils/dataNormalizer.js` - Field normalization logic

### Branch Strategy (Jan 13, 2025)
- `main` - Source code only (no build files)
- `deploy-qual` - Qual build artifacts
- `deploy-prod` - Production build artifacts

---

## ⚠️ PLATFORM-SPECIFIC GOTCHAS (DO NOT CHANGE)

### Android
- **FlexWrap Cards**: MUST use percentage widths (48%) + alignContent: 'flex-start'
- **No calculateCardWidth()** for multi-column layouts
- **Font Weights**: MUST use font variants (ComicRelief-Bold) without fontWeight property
  - Typography component handles this automatically - just use `fontWeight: 'bold'`

### iOS  
- **AsyncStorage**: Causes 20+ second freeze - debounced in useAppStore.js
- **NetInfo.fetch()**: DISABLED - causes freezes, assumes online
- **Modal constraints**: Must use specific flex rules (see styles.js)

### Web
- **3-Column Layout**: Main screen cards MUST use percentage widths in App.js lines 4831-4832
  - 3 columns: width: '31%', 2 columns: width: '48%', 1 column: width: '100%'
  - DO NOT use flexBasis: 'auto' or width: undefined for multi-column layouts
  - Breakpoints: <768px: 1 col, 768-1199px: 2 cols, ≥1200px: 3 cols
- **VectorIcons.web.js**: MUST use `<span>` not `<Text>` component
- **Alert.alert**: Not supported - use ConfirmModal component
- **Build files**: Go in ROOT for qual, not web/build/

### Mobile (iOS & Android)
- **Swipe in modals**: Use `react-native-pager-view` NOT PanResponder
- **ScrollView**: Captures touches at native level before JS

---

## 🎨 DESIGN RULES
1. **NO GRAY TEXT** - All text must be black (#000) for accessibility
2. **High contrast** required - test with all theme colors
3. **Typography**: Comic Relief font forced everywhere via custom component
   - iOS/Web: Uses fontWeight with "Comic Relief" font
   - Android: Uses font variants (ComicRelief-Bold/Regular) without fontWeight

## ⚠️ FIELD NAMING STANDARDS (CRITICAL)
- **Activities**: Use `text` (not name/title), `icon` (not emoji)
- **Users**: Use `icon` (not emoji), `name` as string only
- **Always include fallbacks**: `activity.text || activity.name || activity.title`
- **Normalizer**: `/src/utils/dataNormalizer.js` handles variations
- **See**: `/docs/features/field-conventions.md` for full details

---

## 🔄 SYNC SYSTEM (Reverted to Complex - v2025.08.18)
- **Strategy**: Last-write-wins with conflict resolution
- **Architecture**: Full service with queue, throttling, network monitoring  
- **Components**: syncService.js + 9 supporting modules (queue, network, etc.)
- **URL Format**: `stackmap.app/?sync=<32-char-hex>`
- **Recovery phrase**: 32 character hexadecimal (no spaces)
- **Periodic Sync**: 30-second interval when enabled
- **Sync Triggers**: App visibility, data changes (5s debounce), manual, periodic
- **Offline Support**: Queue system for offline changes
- **Note**: Reverted from simplified TypeScript version due to AsyncStorage issues
- **Debug**: Check `[Sync]` and sync status messages in console

### Data Flow Summary
**Push**: Stores → Normalize (text/icon) → Encrypt (NaCl with 100k iterations) → Server (zero-knowledge)  
**Pull**: Server → Decrypt → Validate → Resolve conflicts → Update stores  
**Key Fields**: Activities use `text` (not name/title) and `icon` (not emoji)  
**Sync ID**: First 16 bytes of NaCl hash (100k iterations) of recovery phrase + fixed salt
**See**: `/docs/sync/README.md` for complete technical details

---

## 🛠️ ACTIVE DEVELOPMENT

### Store Refactoring (COMPLETED Aug 15, 2025)
- ✅ Split monolithic store into 4 focused stores
- ⚠️ **CRITICAL:** Always use store-specific methods for updates (not `useAppStore.setState`)
  - User updates: `useUserStore.getState().setUsers()`
  - Settings: `useSettingsStore.getState().updateSettings()`
  - Library: `useLibraryStore.getState().setLibrary()`
- See `/docs/STORE_ARCHITECTURE.md` for new structure and completion details

### TypeScript Migration (Jan 2025 - In Progress)
- Gradual migration strategy with @ts-check
- Type checking integrated into deployment
- See `/docs/TYPESCRIPT_ANALYSIS.md` for current status
- Run `npm run typecheck` before committing

### Edit Mode Refactor (Jan 2025)
- Unified list-based interface across all platforms
- Button-based reordering (no drag & drop)
- Max width constraints for readability
- Simplified animations (200ms fades) for better iOS performance
- See `/docs/features/edit-mode-refactor.md` for full specs

### Data Structure (COMPLETED Jan 2025)
- See `/docs/DATA_STRUCTURE.md` for complete documentation
- Migration completed: commit `[current]`
- Pre-migration checkpoint: commit `0691741`

---

## 🐛 QUICK FIXES

### "My Templates category not found"
Initialize EMPTY_CATEGORIES with default category in ActivityLibrary.js

### Bundle not found on web
Files must be copied to root directory, not served from web/build/

### "User missing icon or emoji" during sync
- Icons must be preserved during conflict resolution
- Always use store-specific update methods (not `useAppStore.setState`)
- See fix in syncService.ts `getCurrentState()` and `restoreData()`

### iOS build fails
```bash
cd ios && pod install
```

### Android build fails
```bash
cd android && ./gradlew clean
```

---

## 📝 BEFORE ANY CHANGES
1. **Choose Atlas Workflow Tier** (Quick/Standard/Full) - see [Workflow Tiers](./atlas/docs/WORKFLOW_TIERS.md)
2. Check `/docs/` directory for existing documentation
3. Check git history: `git log -p --grep="<feature>"`
4. Test on ALL platforms if changing shared code
5. Document WHY, not just what

---

## 🤖 ATLAS AGENT SYSTEM
StackMap has specialized agents in `.claude/agents/`:
- **developer** - Implementation and troubleshooting
- **product-manager** - Story creation, validation, roadmaps
- **peer-reviewer** - Quality gates, edge case analysis (uses Opus for deeper review)
- **devops** - Deployment, CI/CD, infrastructure
- **security** - Security audits and vulnerability analysis

**When to use agents:** For complex tasks (Standard/Full workflow), agents work in sequence or parallel:
```
"Implement dark mode. Use Atlas Standard workflow with developer and peer-reviewer agents."
```

---

## 🔗 QUICK LINKS

### Core Documentation
- [New Developer Guide](./docs/onboarding/new-developer-guide.md)
- [Full Deployment Guide](./docs/deployment/README.md)
- [Testing Guides](./docs/testing/README.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Feature Documentation
- [Feature Documentation](./docs/features/README.md)
- [Field Conventions](./docs/features/field-conventions.md)
- [Edit Mode Specs](./docs/features/edit-mode-refactor.md)

### Atlas Workflow System ⭐
- **[Atlas Quick Reference](./docs/ATLAS_QUICK_REFERENCE.md)** - Cheat sheet (START HERE!)
- [Atlas Integration Guide](./docs/ATLAS_INTEGRATION.md) - StackMap-specific workflows
- [Workflow Tiers](./atlas/docs/WORKFLOW_TIERS.md) - Quick/Standard/Full detailed guide
- [Agent Workflow Guide](./atlas/docs/AGENT_WORKFLOW.md) - Complete 9-phase workflow
- [Atlas README](./atlas/README.md) - Framework overview
- [Agent Definitions](./.claude/agents/) - Specialized agent specs