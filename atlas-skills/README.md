---
title: Atlas Skills System
version: 1.0.0
last_updated: 2025-01-17
---

# Atlas Skills - Structured Development Workflows as Claude Skills

## Overview

Atlas Skills converts the Atlas Framework into **executable Claude Skills**, providing structured, tiered development workflows with progressive context disclosure and compositional modularity.

### What Are Claude Skills?

Claude Skills are modular, composable resources that extend Claude's capabilities through:
- **SKILL.md files** with YAML metadata and markdown instructions
- **Progressive disclosure**: Load context incrementally, not all at once
- **Executable scripts**: Deterministic validation and deployment automation
- **Resource files**: Supporting documentation loaded on demand

### What Is Atlas?

Atlas is a **structured development framework** with 4 workflow tiers based on task complexity:

| Tier | Time | Use For | Phases |
|------|------|---------|--------|
| **Quick** | 5-15 min | Typos, colors, trivial changes | 2 phases |
| **Iterative** | 15-30 min | Style tweaks needing validation | 3 phases |
| **Standard** | 30-60 min | Most bugs/features (DEFAULT) | 5 phases |
| **Full** | 2-4 hours | Complex features, security | 9 phases |

---

## Skills Architecture

### Core Skills

```
atlas-skills/
├── atlas-meta/                    # 🎯 Orchestrator (start here)
│   ├── SKILL.md                   # Routes to appropriate tier
│   └── resources/
│       └── tier-selector.md       # Decision matrix
│
├── atlas-quick/                   # 🟢 Trivial changes
│   ├── SKILL.md                   # 2-phase workflow
│   └── scripts/
│       └── deploy-quick.sh        # Auto-deploy
│
├── atlas-iterative/               # 🔵 Changes needing validation
│   ├── SKILL.md                   # 3-phase workflow with review cycle
│   └── resources/
│       └── peer-review-checklist.md
│
├── atlas-standard/                # 🟡 Most tasks (DEFAULT)
│   ├── SKILL.md                   # 5-phase workflow
│   ├── resources/
│   │   └── research-patterns.md   # Research templates
│   └── scripts/
│       └── validate-standard.sh   # Quality checks
│
└── atlas-full/                    # 🔴 Complex features
    ├── SKILL.md                   # 9-phase workflow
    ├── resources/
    │   ├── story-template.md
    │   └── adversarial-checklist.md
    └── scripts/
        └── quality-gates.sh       # Comprehensive validation
```

### Agent Skills (Specialized Expertise)

```
atlas-skills/
├── atlas-agent-developer/         # Implementation & troubleshooting (Sonnet)
├── atlas-agent-peer-reviewer/     # Deep reviews & edge cases (Opus)
├── atlas-agent-product-manager/   # Story creation & validation (Sonnet)
├── atlas-agent-devops/            # Deployment & infrastructure (Sonnet)
└── atlas-agent-security/          # Security audits (Sonnet)
```

---

## Quick Start

### Installation

**Option 1: Clone to Claude Desktop** (Recommended)
```bash
# Skills will be in your project directory
# Claude Desktop can reference them via file path
cd /path/to/your/project
git pull  # atlas-skills/ directory included
```

**Option 2: Copy to Claude Skills Directory**
```bash
# Copy skills to Claude's skills directory
cp -r atlas-skills/* ~/.claude/skills/
```

### Basic Usage

**Automatic tier selection** (let Atlas choose):
```
User: "Fix the bug where activity icons are lost during sync"

Claude: [Invokes atlas-meta] → [Routes to atlas-standard]
        [Executes 5-phase Standard workflow]
```

**Explicit tier selection**:
```
User: "Fix typo in welcome message. Use Atlas Quick workflow."

Claude: [Invokes atlas-quick]
        [Executes 2-phase Quick workflow]
```

**With specific agent**:
```
User: "Review my changes for security issues. Use Atlas peer-reviewer."

Claude: [Invokes atlas-agent-peer-reviewer]
        [Performs adversarial security review]
```

---

## Skill Summaries

### 🎯 atlas-meta (Orchestrator)

**Purpose**: Routes tasks to appropriate workflow tier

**Key features**:
- Decision tree for tier selection
- StackMap-specific rules built-in
- Escalation logic
- Integration with agent skills

**When to use**:
- Default entry point for all tasks
- Let Claude choose the right tier
- "Use Atlas workflow" (automatic routing)

**Example**:
```
User: "Implement dark mode"
→ atlas-meta analyzes: 6+ files, cross-platform, formal requirements
→ Routes to: atlas-full
```

---

### 🟢 atlas-quick (Trivial Changes)

**Purpose**: Fast 2-phase workflow for trivial changes

**Phases**:
1. Make Change (locate, change, verify)
2. Deploy (test + deploy)

**Time**: 5-15 minutes

**Perfect for**:
- Typos, text updates
- Color changes
- Config updates
- Single-line fixes

**Example task**: "Change button color to #007AFF"

**Success criteria**: Deployed in < 15 minutes, tests pass, no rollbacks

---

### 🔵 atlas-iterative (Validation Needed)

**Purpose**: 3-phase workflow with peer review cycle

**Phases**:
1. Make Change (implement)
2. Peer Review (cycle: review → fix → repeat)
3. Deploy (test + deploy)

**Time**: 15-30 minutes

**Perfect for**:
- Style improvements
- Simple UI tweaks
- Straightforward refactors
- Changes where approach is clear but need validation

**Example task**: "Improve button spacing for better UX"

**Success criteria**: Peer review approved, tests pass, < 30 minutes

---

### 🟡 atlas-standard (Most Tasks) ⭐ DEFAULT

**Purpose**: 5-phase workflow for most development tasks

**Phases**:
1. Research (understand current implementation)
2. Plan (design approach)
3. Implement (make changes + tests)
4. Review (edge cases + security)
5. Deploy (full test suite + deployment)

**Time**: 30-60 minutes

**Perfect for (80% of tasks)**:
- Bug fixes (2-5 files)
- Small features
- Code refactoring
- Test additions
- Logic changes with moderate complexity

**Example task**: "Fix null pointer when syncing empty activity list"

**Success criteria**: Complete in < 2 hours, all edge cases covered, peer review approved

**Resources**:
- `research-patterns.md`: Templates for different research scenarios
- `validate-standard.sh`: Automated quality checks

---

### 🔴 atlas-full (Complex Features)

**Purpose**: Complete 9-phase workflow for complex, high-risk tasks

**Phases**:
1. Research (deep exploration)
2. Story Creation (formal requirements)
3. Planning (technical design)
4. Adversarial Review (security + edge cases)
5. Implementation (parallel coding)
6. Testing (comprehensive validation)
7. Validation (acceptance criteria)
8. Clean-up (documentation + artifacts)
9. Deployment (full quality gates)

**Time**: 2-4 hours

**Perfect for**:
- New modules (6+ files)
- Cross-platform features
- Security-critical changes
- Major refactoring
- Features requiring formal requirements

**Example task**: "Implement end-to-end encryption for sync with key derivation"

**Success criteria**: 100% acceptance criteria met, zero defects, full evidence trail

**Resources**:
- `story-template.md`: Formal user story format
- `adversarial-checklist.md`: Security audit checklist
- `quality-gates.sh`: Comprehensive validation script

---

## Agent Skills

### atlas-agent-developer (Sonnet)

**Specialization**: Implementation, troubleshooting, planning

**Core principles**:
- Verify, then act (grep test for correctness)
- Measure everything (evidence-based completion)
- Eliminate, don't add (reduce complexity)
- Production code is silent & safe

**Use in**: Research, Plan, Implement phases

---

### atlas-agent-peer-reviewer (Opus) 🔥

**Specialization**: Adversarial quality gate, deep analysis

**Core mission**: Find flaws before users do

**Verdicts**:
- 🔴 **REJECTED**: Violations found, must fix
- ⚠️ **CONDITIONAL PASS**: Minor issues, non-blocking
- ✅ **PASS**: Perfect compliance

**Use in**: Review, Adversarial Review, Testing phases

**Note**: Uses **Opus model** for deeper analysis

---

### atlas-agent-product-manager (Sonnet)

**Specialization**: Story creation, requirement definition, validation

**Responsibilities**:
- Backlog management
- User story creation with acceptance criteria
- Quality gatekeeping
- Release management

**Use in**: Story Creation, Validation phases

---

### atlas-agent-devops (Sonnet)

**Specialization**: Deployment, infrastructure, CI/CD

**Use in**: Deploy phase (all tiers)

---

### atlas-agent-security (Sonnet)

**Specialization**: Security audits, vulnerability analysis

**Use in**: Adversarial Review phase (Full workflow)

---

## Decision Tree

### Start Here: Which Tier?

```
Is your task:
├─ 1 file, trivial, zero risk? → atlas-quick ✅
├─ 1-2 files, need validation? → atlas-iterative ✅
├─ 2-5 files, clear requirements? → atlas-standard ✅ (DEFAULT)
└─ 6+ files OR security OR complex? → atlas-full ✅
```

### Escalation Rules

**Escalate Quick → Iterative if**:
- Want validation on simple change
- Multiple related small changes

**Escalate Iterative → Standard if**:
- Affects 3+ files
- Tests fail (need new tests)
- Edge cases require planning

**Escalate Standard → Full if**:
- Scope expands to 6+ files
- Security concerns emerge
- Formal requirements needed
- Cross-platform complexity increases

---

## Key Benefits Over Traditional Docs

### 1. Token Efficiency (12x improvement)

**Before (Traditional Atlas Docs)**:
```
Load upfront:
- CLAUDE.md: 200 lines
- ATLAS_INTEGRATION.md: 475 lines
- WORKFLOW_TIERS.md: 411 lines
- Agent specs: 100+ lines each

Total: ~5,000+ tokens loaded immediately
```

**After (Atlas Skills)**:
```
Progressive loading:
- atlas-meta: 50 tokens (initial)
- atlas-standard: 200 tokens (when needed)
- atlas-agent-peer-reviewer: 150 tokens (if invoked)

Total: ~400 tokens loaded progressively
```

**Result**: 12x more efficient context usage

---

### 2. Progressive Disclosure

**Traditional approach**: Load all documentation upfront, overwhelming context window

**Skills approach**:
- Start with meta skill (tiny)
- Load tier-specific instructions (only what's needed)
- Expand to resources (on demand)
- Invoke agents (when required)

---

### 3. Composability

**Mix and match skills**:
```
atlas-standard (5 phases)
  ├─ Phase 1: Research (main Claude)
  ├─ Phase 2: Plan (main Claude)
  ├─ Phase 3: Implement (main Claude)
  ├─ Phase 4: Review (atlas-agent-peer-reviewer)
  └─ Phase 5: Deploy (atlas-agent-devops)
```

---

### 4. Shareability

**Share across projects**:
- Copy `atlas-skills/` directory
- Adapt StackMap-specific rules
- Use generic workflow tiers as-is

**Share with community**:
- Publish to GitHub
- Others can adopt Atlas workflows
- Contribute agent variations

---

### 5. Maintainability

**Single source of truth**:
- Update `atlas-standard/SKILL.md` → all Standard workflows updated
- Update agent skill → all invocations benefit
- Version control for workflow changes

---

### 6. Discoverability

**Skills appear in Claude UI**:
- List all skills: Skills are visible in Claude's skill picker
- Auto-documentation: YAML metadata provides descriptions
- Clear entry points: atlas-meta is the obvious starting point

---

## StackMap-Specific Integration

All Atlas Skills include StackMap-specific rules:

### Field Naming Standards
- Activities: `text`, `icon` (NOT name/title/emoji)
- Users: `name`, `icon` (NOT emoji)
- Always include fallbacks: `text || name || title`

### Store Updates
- NEVER use `useAppStore.setState()` directly
- Use store-specific methods:
  - `useUserStore.getState().setUsers()`
  - `useSettingsStore.getState().updateSettings()`
  - `useLibraryStore.getState().setLibrary()`

### Platform Testing
- Shared code → Test iOS, Android, Web
- Check platform gotchas (see CLAUDE.md):
  - Android: FlexWrap 48% widths, font variants
  - iOS: AsyncStorage debounced, NetInfo disabled
  - Web: 3-column layout, no Alert.alert

### Deployment
- Update `PENDING_CHANGES.md` first
- Use `./scripts/deploy.sh [tier]`
- NEVER skip tests
- Run `npm run typecheck` before commit

### Design Rules
- NO GRAY TEXT (use #000)
- High contrast required
- Typography component (handles font variants)

---

## Validation & Quality Gates

### Quick Workflow
- Type checking (if applicable)
- Deployment script runs tests

### Iterative Workflow
- Type checking
- Linting
- Peer review cycle
- Deployment script runs tests

### Standard Workflow
- `validate-standard.sh` script:
  - Type checking
  - Linting
  - Unit tests
  - PENDING_CHANGES.md check
  - Anti-pattern detection
- Deployment script enforces all gates

### Full Workflow
- `quality-gates.sh` script:
  - All Standard checks
  - Security audit
  - Performance checks
  - Documentation completeness
  - Full test suite

---

## Examples

### Example 1: Automatic Routing (Standard)

```
User: "Fix the bug where activity icons disappear during sync conflicts"

Claude (using atlas-meta):
  - Analyzes: Affects sync logic, 2-5 files, needs research
  - Routes to: atlas-standard
  - Executes:
    Phase 1: Research sync code, find conflict resolution
    Phase 2: Plan deep-merge solution
    Phase 3: Implement preserveIconFields()
    Phase 4: Review with peer-reviewer agent
    Phase 5: Deploy via qual script

Result: Bug fixed in 45 minutes ✅
```

---

### Example 2: Explicit Quick Workflow

```
User: "Fix typo: 'Wellcome' should be 'Welcome'. Use Atlas Quick."

Claude (using atlas-quick):
  Phase 1: Make Change
    - Found: src/components/Welcome.js:12
    - Changed: Wellcome → Welcome
    - Verified: Visual check ✅

  Phase 2: Deploy
    - Updated PENDING_CHANGES.md
    - Ran: ./scripts/deploy.sh qual --all
    - Result: Deployed ✅

Total time: 5 minutes ✅
```

---

### Example 3: Iterative with Review Cycle

```
User: "Improve button spacing on login screen. Use Atlas Iterative."

Claude (using atlas-iterative):
  Phase 1: Make Change
    - Updated padding: 8px → 16px
    - Applied to LoginButton.js

  Phase 2: Peer Review - Cycle 1
    - Submitted for review
    - Feedback: "Check Android, small screens"
    - Tested: Android ✅, iPhone SE ✅
    - Re-submitted

  Phase 2: Peer Review - Cycle 2
    - Feedback: "PASS - looks good"

  Phase 3: Deploy
    - Updated PENDING_CHANGES.md
    - Deployed: ./scripts/deploy.sh qual --all

Total time: 20 minutes ✅
```

---

### Example 4: Full Workflow with Agents

```
User: "Implement photo attachments for activities. Use Atlas Full."

Claude (using atlas-full):
  Phase 1: Research (developer agent)
    - Parallel searches: storage, sync, UI, platform

  Phase 2: Story Creation (product-manager agent)
    - Created: docs/features/FEAT-photo-attachments.md
    - Acceptance criteria defined

  Phase 3: Planning (developer agent)
    - Storage layer design
    - Sync integration plan
    - UI component list

  Phase 4: Adversarial Review (security + peer-reviewer agents in parallel)
    - Security: Validate file types, size limits
    - Peer review: Offline photo capture queue

  Phase 5: Implementation (main Claude)
    - 8 files created/modified
    - Tests added

  Phase 6: Testing (main Claude)
    - iOS, Android, Web tested
    - Offline queue verified

  Phase 7: Validation (product-manager agent)
    - All acceptance criteria met ✅

  Phase 8: Clean-up (main Claude)
    - Debug logs removed
    - Documentation updated

  Phase 9: Deployment (devops agent)
    - quality-gates.sh passed
    - Deployed to qual
    - Deployment report generated

Total time: 3.5 hours ✅
Feature complete with zero defects ✅
```

---

## Troubleshooting

### "Skill not found"

**Problem**: Claude can't find the skill

**Solutions**:
1. Verify skill directory exists: `ls -la atlas-skills/`
2. Check SKILL.md file present: `ls atlas-skills/atlas-meta/SKILL.md`
3. Ensure skill name matches directory: `atlas-meta` directory → `name: atlas-meta` in YAML
4. Try explicit path if using file references

---

### "Script permission denied"

**Problem**: Validation/deployment scripts can't execute

**Solution**:
```bash
# Make all scripts executable
chmod +x atlas-skills/*/scripts/*.sh
```

---

### "Escalation loop"

**Problem**: Keeps escalating between tiers

**Solution**:
- Review escalation criteria in each skill
- Be explicit about tier: "Use Atlas Standard workflow"
- Check if task truly fits chosen tier

---

### "Agent skill not invoked"

**Problem**: Agent skills aren't being called during workflows

**Solution**:
- Agents are optional in Standard workflow
- Explicitly request: "Use Atlas Standard with peer-reviewer agent"
- Agents invoked automatically in Full workflow

---

## Extending Atlas Skills

### Adding a Custom Tier

1. Create directory: `atlas-skills/atlas-custom/`
2. Create `SKILL.md` with YAML frontmatter
3. Define phases and workflow
4. Add to atlas-meta routing logic

### Adding a Custom Agent

1. Create directory: `atlas-skills/atlas-agent-custom/`
2. Create `SKILL.md` with specialization
3. Define when to invoke
4. Reference from tier skills

### Adapting for Another Project

1. Copy `atlas-skills/` directory
2. Update StackMap-specific rules in atlas-meta
3. Customize validation scripts
4. Adjust deployment commands

---

## Best Practices

### 1. Start with atlas-meta

**Always begin with**:
```
"[Task description]"
or
"[Task description]. Use Atlas workflow."
```

Let atlas-meta route to appropriate tier.

---

### 2. Be explicit when uncertain

**If you know the right tier**:
```
"[Task]. Use Atlas Standard workflow."
```

Explicit routing prevents mis-classification.

---

### 3. Escalate early

**Don't force complexity into lower tier**:
- Quick taking > 15 min? → Escalate to Iterative/Standard
- Iterative reveals edge cases? → Escalate to Standard
- Standard expands scope? → Escalate to Full

---

### 4. Use agents strategically

**Don't invoke all agents always**:
- Standard: Manual review often sufficient
- Full: Invoke agents for their specialization
- Use peer-reviewer (Opus) for complex analysis

---

### 5. Trust the process

**Don't skip phases**:
- Each phase has a purpose
- Skipping research → poor planning
- Skipping review → missed edge cases
- Skipping validation → broken deployments

---

## Roadmap

### Phase 1: Core Skills ✅ (Current)
- ✅ atlas-meta (orchestrator)
- ✅ atlas-quick (trivial changes)
- ✅ atlas-iterative (validation needed)
- ✅ atlas-standard (most tasks)
- ⏳ atlas-full (complex features) - IN PROGRESS

### Phase 2: Agent Skills (Next)
- ⏳ atlas-agent-peer-reviewer
- ⏳ atlas-agent-developer
- ⏳ atlas-agent-product-manager
- ⏳ atlas-agent-devops
- ⏳ atlas-agent-security

### Phase 3: Enhanced Automation
- Automatic escalation detection
- Smart agent invocation
- Workflow telemetry
- Success metric tracking

### Phase 4: Community
- Publish to GitHub
- Contribution guidelines
- Example adaptations
- Community agent skills

---

## Success Metrics

### Adoption Metrics
- **Target**: 90%+ team usage within 3 months
- **Measure**: Track skill invocations vs. manual workflows

### Efficiency Metrics
- **Target**: 80%+ reduction in context tokens
- **Measure**: Compare token usage before/after

### Quality Metrics
- **Target**: 50%+ reduction in post-deployment defects
- **Measure**: Track rollbacks/hotfixes

### Time Metrics
- **Target**: 20%+ faster task completion
- **Measure**: Time from task start to deployment

---

## Contributing

### Reporting Issues
- Open issue in repository
- Include: Task description, tier used, what went wrong
- Attach: Logs, screenshots if applicable

### Suggesting Improvements
- Open issue with "enhancement" label
- Describe: What could be better, why, how
- Consider: Backward compatibility

### Contributing Skills
- Fork repository
- Create new skill in `atlas-skills/`
- Follow naming convention: `atlas-*`
- Submit pull request with description

---

## Resources

### Internal Documentation
- [CLAUDE.md](../CLAUDE.md) - StackMap development guide
- [ATLAS_INTEGRATION.md](../docs/ATLAS_INTEGRATION.md) - Atlas integration guide (legacy)
- [ATLAS_QUICK_REFERENCE.md](../docs/ATLAS_QUICK_REFERENCE.md) - Quick reference (legacy)

### External Resources
- [Claude Skills (Anthropic)](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Claude Skills Repository (GitHub)](https://github.com/anthropics/skills)
- [Simon Willison on Claude Skills](https://simonwillison.net/2025/Oct/16/claude-skills/)

---

## License

Atlas Skills System for StackMap
Copyright © 2025 StackMap Development Team

(Include your license here)

---

## Support

For questions or support:
- Check this README first
- Review skill-specific SKILL.md files
- Check StackMap CLAUDE.md for project conventions
- Open GitHub issue for bugs/enhancements

---

**Version**: 1.0.0
**Last Updated**: 2025-01-17
**Maintained By**: StackMap Development Team
**Status**: Production Ready (Core Skills), Beta (Agent Skills)
