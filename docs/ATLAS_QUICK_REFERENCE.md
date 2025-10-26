# Atlas Workflow Quick Reference

## 🎯 Choose Your Workflow

| If your task is... | Use this tier | Example command |
|-------------------|---------------|-----------------|
| **Typo, color change, 1 file** | 🟢 **Quick** | `"Fix typo in welcome text. Atlas Quick."` |
| **Style tweak, simple UI change** | 🔵 **Iterative** | `"Improve button spacing. Atlas Iterative."` |
| **Bug fix, small feature, 2-5 files** | 🟡 **Standard** | `"Fix sync race condition. Atlas Standard."` |
| **New module, epic, 6+ files** | 🔴 **Full** | `"Implement photo attachments. Atlas Full."` |

## 🟢 Quick Workflow (5-15 min)

```
"[Simple change]. Use Atlas Quick workflow."
```

**Phases:**
1. Make change
2. Deploy via `./scripts/qual_deploy.sh`

**Perfect for:** Typos, colors, config updates, single-line fixes

---

## 🔵 Iterative Workflow (15-30 min)

```
"[Change needing validation]. Use Atlas Iterative workflow."
```

**Phases:**
1. Make change
2. Peer review (repeat until passes)
3. Deploy via `./scripts/qual_deploy.sh`

**Perfect for:** Styling improvements, simple UI tweaks, straightforward refactors that need quality validation but not upfront research/planning

---

## 🟡 Standard Workflow (30-60 min) ⭐ DEFAULT

```
"[Task description]. Use Atlas Standard workflow."
```

**Phases:**
1. Research - Find all affected files
2. Plan - Design approach
3. Implement - Make changes + tests
4. Review - Edge cases + security
5. Deploy - Full tests via `./scripts/qual_deploy.sh`

**Perfect for:** Most bugs, small features, refactoring, test additions

---

## 🔴 Full Workflow (2-4 hours)

```
"[Complex task]. Use Atlas Full workflow."
```

**Phases:**
1. Research - Deep exploration
2. Story - Formal requirements
3. Plan - Technical design
4. Adversarial Review - Security + edge cases
5. Implement - Parallel coding
6. Test - Comprehensive validation
7. Validate - Acceptance criteria
8. Clean-up - Documentation + artifacts
9. Deploy - Quality gates via `./scripts/qual_deploy.sh`

**Perfect for:** New modules, cross-platform features, security changes, major refactors

---

## 🤖 Agent Cheat Sheet

| Agent | When to use | Model |
|-------|-------------|-------|
| **developer** | Implementation, planning | Sonnet |
| **product-manager** | Stories, validation | Sonnet |
| **peer-reviewer** | Deep reviews, edge cases | **Opus** |
| **devops** | Deployment, infrastructure | Sonnet |
| **security** | Security audits | Sonnet |

**Tip:** peer-reviewer uses Opus for more thorough analysis!

---

## 📋 StackMap-Specific Checklist

Before deploying ANY change:

### Field Naming ✅
- [ ] Activities use `text` and `icon` (not name/title/emoji)
- [ ] Users use `icon` and `name` (not emoji)
- [ ] Fallbacks included: `activity.text || activity.name || activity.title`

### Store Updates ✅
- [ ] Using `useUserStore.getState().setUsers()` (not `useAppStore.setState`)
- [ ] Using `useSettingsStore.getState().updateSettings()`
- [ ] Using `useLibraryStore.getState().setLibrary()`

### Platform Testing ✅
- [ ] Tested on iOS (if shared code changed)
- [ ] Tested on Android (if shared code changed)
- [ ] Tested on Web (if shared code changed)
- [ ] Platform-specific gotchas addressed (see CLAUDE.md)

### Deployment ✅
- [ ] Updated `PENDING_CHANGES.md`
- [ ] Ran `npm run typecheck` (passes)
- [ ] Used `./scripts/qual_deploy.sh` (not manual commit)
- [ ] All tests passed

---

## ⚡ Common Commands

### Research Phase
```bash
# Find all files related to feature
grep -r "featureName" src/

# Find component usage
grep -r "import.*ComponentName" src/
```

### Testing Phase
```bash
# Type checking
npm run typecheck

# Run tests
npm test

# Deploy with quality gates
./scripts/qual_deploy.sh
```

### Deployment
```bash
# 1. Update PENDING_CHANGES.md first!

# 2. Deploy to qual/staging
./scripts/qual_deploy.sh

# 3. Deploy to production (after qual testing)
./scripts/prod_deploy.sh web     # Web only
./scripts/prod_deploy.sh all     # Web + Android + iOS
```

---

## 🚨 Never Do This

❌ Skip tests without approval
❌ Use `useAppStore.setState()` directly
❌ Use `activity.name` or `activity.emoji`
❌ Skip `PENDING_CHANGES.md` update
❌ Manual git commits (use deployment scripts)
❌ Gray text colors (use #000 only)
❌ Platform-specific code in shared files

---

## ✅ Always Do This

✅ Choose appropriate workflow tier
✅ Test all platforms for shared code
✅ Use store-specific update methods
✅ Update `PENDING_CHANGES.md` before deploy
✅ Deploy via `./scripts/qual_deploy.sh`
✅ Include field name fallbacks
✅ Use Typography component for fonts

---

## 🎓 Decision Tree

```
Is it 1 file, trivial, zero risk?
├─ YES → Quick Workflow
└─ NO → Continue...

Does it need validation but not research/planning?
├─ YES → Iterative Workflow
└─ NO → Continue...

Is it 2-5 files, clear requirements?
├─ YES → Standard Workflow ⭐
└─ NO → Continue...

Is it 6+ files, security-critical, or needs formal requirements?
├─ YES → Full Workflow
└─ NOT SURE → Use Standard Workflow
```

**When in doubt, use Standard Workflow** - it's the right balance for 80% of tasks.

---

## 📚 Full Documentation

- **CLAUDE.md** - Main development guide
- **atlas/docs/WORKFLOW_TIERS.md** - Detailed tier explanations
- **atlas/docs/AGENT_WORKFLOW.md** - Complete 9-phase workflow
- **docs/ATLAS_INTEGRATION.md** - StackMap-specific integration guide
- **.claude/agents/** - Agent specifications

---

## 💡 Pro Tips

1. **Start small** - Can always escalate to higher tier
2. **Use agents strategically** - peer-reviewer (Opus) for deep analysis
3. **Parallelize wisely** - Max 2-3 agents at once
4. **Document as you go** - Update PENDING_CHANGES.md incrementally
5. **Test early** - Don't wait until deployment to test platforms

---

## 🏃 Quick Start Example

**Task:** "Fix the bug where sync fails with empty activity list"

**Command:**
```
"Fix sync failure with empty activity list. Use Atlas Standard workflow."
```

**What happens:**
1. **Research** - Finds sync code, identifies edge case handling
2. **Plan** - Designs null check and empty array handling
3. **Implement** - Updates syncService.ts, adds tests
4. **Review** - Checks: field naming? store updates? platform compatibility?
5. **Deploy** - Updates PENDING_CHANGES.md, runs qual_deploy.sh

**Result:** Bug fixed, tested, deployed in ~45 minutes with full quality checks.

---

**This is your daily driver. Print it, pin it, memorize it.** 🚀
