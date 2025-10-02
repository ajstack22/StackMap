# Atlas Framework Integration for StackMap

## Overview

StackMap uses the **Atlas Lite Framework** for structured, agent-driven development workflows. This document explains how Atlas integrates with StackMap's specific development practices.

## Quick Start

### For Simple Changes
```
"Fix the typo in the welcome message. Use Atlas Quick workflow."
```
**Result:** Change made → Deployed via `./scripts/qual_deploy.sh` in ~10 minutes

### For Most Tasks (Recommended Default)
```
"Fix the login bug where users can't save activities. Use Atlas Standard workflow."
```
**Result:** Research → Plan → Implement → Review → Deploy in ~45 minutes

### For Complex Features
```
"Implement offline queue for sync system. Use Atlas Full workflow."
```
**Result:** Complete 9-phase workflow with stories, formal reviews, comprehensive testing in 2-4 hours

---

## Workflow Tiers Explained

### 🟢 Quick Workflow (5-15 minutes)

**When to use:**
- Text changes, typos
- Color/style tweaks
- Single-line bug fixes
- Configuration updates

**What happens:**
1. **Make Change** - Locate code, make change, verify locally
2. **Deploy** - Run `./scripts/qual_deploy.sh`, tests pass, done

**Example command:**
```
"Change primary button color to #007AFF. Atlas Quick workflow."
```

---

### 🟡 Standard Workflow (30-60 minutes) ⭐ **DEFAULT**

**When to use:**
- Bug fixes (2-5 files affected)
- Small features
- Code refactoring
- Test additions
- Logic changes with moderate complexity

**What happens:**
1. **Research** - Find all related files, understand current implementation
2. **Plan** - Design approach, list file changes
3. **Implement** - Make changes, update tests
4. **Review** - Peer review for edge cases, security check
5. **Deploy** - Run full test suite via `./scripts/qual_deploy.sh`

**Example command:**
```
"Fix null pointer when user syncs with empty activity list. Atlas Standard workflow."
```

**StackMap-specific considerations:**
- Always check field naming standards (text/icon, not name/emoji)
- Test on ALL platforms if touching shared code
- Update `PENDING_CHANGES.md` before deployment
- Consider platform-specific gotchas (see CLAUDE.md)

---

### 🔴 Full Workflow (2-4 hours)

**When to use:**
- New modules (6+ files)
- Cross-platform features
- Security-critical changes
- Major refactoring
- Database schema changes
- Features requiring formal requirements

**What happens:**
1. **Research** - Deep codebase exploration with parallel searches
2. **Story Creation** - Formal user story with acceptance criteria
3. **Planning** - Technical design, file-by-file implementation plan
4. **Adversarial Review** - Security audit, edge cases, performance
5. **Implementation** - Parallel coding when possible
6. **Testing** - Functional, UI/UX, code quality
7. **Validation** - Acceptance criteria verification
8. **Clean-up** - Remove temp files, organize documentation
9. **Deployment** - Full quality gates via `./scripts/qual_deploy.sh`

**Example command:**
```
"Add end-to-end encryption for sync with key derivation. Atlas Full workflow."
```

**StackMap-specific outputs:**
- Story saved to `docs/features/` (not `atlas/stories/`)
- Evidence documented in commit messages via `PENDING_CHANGES.md`
- Platform-specific testing on iOS, Android, Web

---

## Agent System Integration

### Available Agents

StackMap has 5 specialized agents in `.claude/agents/`:

| Agent | Model | Best For | Typical Phases |
|-------|-------|----------|----------------|
| **developer** | Sonnet | Implementation, troubleshooting | Research, Plan, Implement |
| **product-manager** | Sonnet | Story creation, validation | Story, Validate |
| **peer-reviewer** | Opus | Quality review, edge cases | Review, Test |
| **devops** | Sonnet | Deployment, CI/CD | Deploy |
| **security** | Sonnet | Security audits | Adversarial Review |

### When to Use Agents

**Standard Workflow (Sequential):**
```
"Fix sync race condition. Use Atlas Standard workflow:
1. Research (me)
2. Plan (me)
3. Implement (me)
4. Review (peer-reviewer agent)
5. Deploy (devops agent)"
```

**Full Workflow (Strategic Parallel):**
```
"Implement collaborative sync. Use Atlas Full workflow with:
- Research: parallel searches for sync + networking code
- Story: product-manager agent
- Plan: developer agent
- Review: security + peer-reviewer agents in parallel
- Implement: me (with peer-reviewer agent available for questions)
- Deploy: devops agent"
```

**Best practices:**
- Use agents for specialized expertise (security audits, deep reviews)
- Keep parallelization practical (2-3 agents max)
- Let main Claude handle most Standard workflow tasks
- Use peer-reviewer (Opus) for complex edge case analysis

---

## StackMap-Specific Workflow Rules

### Always Follow These Rules

1. **Field Naming Standards**
   - Activities: `text`, `icon` (not name/title/emoji)
   - Users: `icon`, `name` (not emoji)
   - Include fallbacks: `activity.text || activity.name || activity.title`
   - See [Field Conventions](./features/field-conventions.md)

2. **Platform Testing**
   - Shared code changes → Test iOS, Android, Web
   - Use platform-specific patterns (see CLAUDE.md gotchas)
   - Font handling: Typography component auto-handles Android variants

3. **Deployment Process**
   - ALWAYS update `PENDING_CHANGES.md` first
   - Use `./scripts/qual_deploy.sh` for all deployments
   - NEVER skip tests without explicit approval
   - Tests failing? Fix them, don't skip them

4. **Store Updates**
   - Use store-specific methods (not `useAppStore.setState`)
   - `useUserStore.getState().setUsers()`
   - `useSettingsStore.getState().updateSettings()`
   - See [Store Architecture](./STORE_ARCHITECTURE.md)

### Quality Gates (Enforced by qual_deploy.sh)

StackMap's deployment script enforces:
- ✅ All tests pass (no skipping without approval)
- ✅ TypeScript type checking (`npm run typecheck`)
- ✅ Build succeeds for web
- ✅ Clean commit with proper message from `PENDING_CHANGES.md`
- ✅ Version auto-incremented

---

## Practical Examples

### Example 1: Quick Workflow
```
User: "Change the toast background color to #007AFF"

Response: "I'll use the Atlas Quick workflow for this trivial change."

[Locates Toast.js, changes color, tests locally]

"Color updated. Deploying via qual_deploy.sh..."

[Runs ./scripts/qual_deploy.sh, tests pass]

"✅ Deployed. Toast now uses #007AFF background."
```

---

### Example 2: Standard Workflow
```
User: "Fix the bug where activities lose their icon during sync"

Response: "I'll use the Atlas Standard workflow for this bug fix."

## Phase 1: Research
[Searches sync code, finds icon handling issues in syncService.ts]

## Phase 2: Plan
[Designs fix: preserve icon field in conflict resolution]

## Phase 3: Implement
[Updates syncService.ts, adds icon fallback logic]

## Phase 4: Review
"Launching peer-reviewer agent to check for edge cases..."
[Agent finds: what about custom emoji? Adds handling]

## Phase 5: Deploy
[Updates PENDING_CHANGES.md]
[Runs ./scripts/qual_deploy.sh]

"✅ Deployed. Icons now preserved during sync conflicts."
```

---

### Example 3: Full Workflow
```
User: "Implement photo attachments for activities"

Response: "This is a complex feature requiring the Atlas Full workflow."

## Phase 1: Research
[Parallel searches: storage, sync, UI components, platform capabilities]

## Phase 2: Story Creation
[Launches product-manager agent]
Story saved to: docs/features/FEAT-photo-attachments.md
- Acceptance criteria defined
- Success metrics established

## Phase 3: Planning
[Launches developer agent]
Plan created:
- Photo storage layer (AsyncStorage for metadata, filesystem for images)
- Sync integration (base64 encoding for transmission)
- UI components (PhotoPicker, PhotoGallery, PhotoAttachment)
- Platform specifics (ImagePicker.native vs web <input>)

## Phase 4: Adversarial Review
[Launches security + peer-reviewer agents in parallel]
Issues found:
- Security: Need to validate image types, limit file sizes
- Peer Review: What about offline photo capture? Need queue

## Phase 5: Implementation
[Implements changes across 8 files, tests incrementally]

## Phase 6: Testing
[Tests on iOS, Android, Web]
[Verifies offline queue, sync, storage limits]

## Phase 7: Validation
[Product-manager agent verifies all acceptance criteria met]

## Phase 8: Clean-up
[Removes debug logs, updates documentation]

## Phase 9: Deployment
[Updates PENDING_CHANGES.md with comprehensive change list]
[Runs ./scripts/qual_deploy.sh - all tests pass]

"✅ Photo attachments deployed. Feature complete."
```

---

## Decision Matrix: Which Tier?

| Question | Quick | Standard | Full |
|----------|-------|----------|------|
| How many files affected? | 1 | 2-5 | 6+ |
| Any logic changes? | No | Yes | Complex |
| Security implications? | No | Maybe | Yes |
| Cross-platform? | No | Maybe | Yes |
| Need formal requirements? | No | No | Yes |
| Risk of breaking changes? | Zero | Low-Med | High |

**When in doubt, use Standard workflow** - it's the right balance for 80% of tasks.

---

## Escalation Rules

### Escalate Quick → Standard if:
- During implementation, multiple files need changes
- Tests fail and require new test cases
- Edge cases emerge that need peer review

### Escalate Standard → Full if:
- Scope expands to 6+ files
- Security concerns emerge
- Formal requirements become necessary
- Cross-platform coordination needed

**How to escalate:**
```
"Escalating to Standard workflow. Found 4 files need updates, not just 1."
```
Then restart from Phase 1 of new tier.

---

## Integration with Existing StackMap Processes

### PENDING_CHANGES.md
Atlas deployment phase expects you to update this file:
```markdown
## Feature: Photo Attachments for Activities
### Changes Made:
- Added PhotoStorage service for image management
- Integrated ImagePicker for iOS/Android/Web
- Updated sync to handle base64 encoded photos
- Added file size validation (max 5MB)
- Created PhotoGallery component for viewing
```

### Documentation Structure
- **Stories**: `docs/features/FEAT-*.md` (not `atlas/stories/`)
- **Evidence**: Commit messages via `PENDING_CHANGES.md`
- **Plans**: Can save to `docs/features/` for reference

### Testing Integration
- Standard/Full workflows run full test suite via `qual_deploy.sh`
- Platform-specific testing follows StackMap conventions
- Tests must pass - no skipping without approval

---

## Common Pitfalls

### ❌ DON'T Do This:
```
"Use Full workflow for fixing a typo"
(Overkill - use Quick)

"Use Quick workflow for adding authentication"
(Too complex - use Full)

"Skip deployment phase to save time"
(Never skip - tests are mandatory)

"Skip peer review because it's a small change"
(Standard workflow requires review phase)
```

### ✅ DO This Instead:
```
"Fix typo in welcome message. Atlas Quick workflow."

"Implement authentication with OAuth. Atlas Full workflow."

"Always complete deployment phase with qual_deploy.sh."

"Use peer-reviewer agent for Standard workflow review phase."
```

---

## Success Metrics

### Quick Workflow Success:
- ✅ Change deployed in < 15 minutes
- ✅ Tests pass
- ✅ No rollbacks

### Standard Workflow Success:
- ✅ Feature complete in < 2 hours
- ✅ All edge cases covered
- ✅ Tests pass
- ✅ Peer review approved

### Full Workflow Success:
- ✅ Epic complete with full documentation
- ✅ 100% acceptance criteria met
- ✅ Zero defects in production
- ✅ Full evidence trail

---

## Getting Help

### Atlas Framework Questions
- [Atlas README](../atlas/README.md)
- [Workflow Tiers](../atlas/docs/WORKFLOW_TIERS.md)
- [Agent Workflow Guide](../atlas/docs/AGENT_WORKFLOW.md)

### StackMap-Specific Questions
- [CLAUDE.md](../CLAUDE.md) - Main development guide
- [Deployment Guide](./deployment/README.md)
- [Testing Guide](./testing/simple-testing-guide.md)

---

## TL;DR

**For 80% of tasks:**
```
"[Your task]. Use Atlas Standard workflow."
```

**The system will:**
1. Research the code
2. Plan the approach
3. Implement the changes
4. Review for edge cases
5. Deploy via qual_deploy.sh

**You just specify the workflow tier and let Atlas guide the process.**

Simple. Structured. Effective.
