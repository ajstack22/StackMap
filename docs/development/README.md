# StackMap Development Framework

Based on the proven Manylla Framework, adapted for StackMap's specific needs and technical debt management.

## 🚀 Quick Start

### Working on a Story
```bash
# 1. Pick a story from the backlog
cat docs/development/BACKLOG.md

# 2. Move to in-progress
# Update BACKLOG.md status

# 3. Implement following the story requirements

# 4. Follow ADVERSARIAL_REVIEW_PROCESS
# Get peer review approval

# 5. Deploy to qual
./scripts/qual_deploy.sh
```

### Creating New Work
```bash
# Create a story
./scripts/create-story.sh "Fix navigation bug" P1 Bug

# Create a bug report
./scripts/create-bug.sh "App crashes on startup" P0 Critical

# Convert tech debt to story
./scripts/tech-debt-to-story.sh docs/development/tech-debt/drafts/issue.md
```

## 📁 Framework Structure

```
docs/development/
├── README.md                    # This file
├── BACKLOG.md                  # Prioritized work queue
├── processes/                  # Development workflows
│   ├── ADVERSARIAL_REVIEW_PROCESS.md
│   ├── EPIC_REVIEW_PROCESS.md
│   └── TECH_DEBT_MANAGEMENT.md
├── backlog/                    # Active story definitions
│   └── S-DEBT-*.md            # Tech debt stories
├── stories/                    # Story lifecycle
│   ├── active/                # Currently being worked
│   └── completed/             # Finished stories
├── bugs/                      # Bug tracking
│   ├── active/                # Open bugs
│   └── resolved/              # Fixed bugs
├── epics/                     # Multi-story features
│   ├── active/                # In-progress epics
│   └── completed/             # Finished epics
├── reviews/                   # Review reports
├── tech-debt/                 # Technical debt tracking
│   ├── drafts/                # Identified debt
│   └── archived/              # Converted to stories
└── templates/                 # Reusable templates
    ├── story-template.md
    └── epic-template.md
```

## 🎯 Core Principles

### 1. Adversarial Review
- **Developer** implements story exactly as specified
- **Peer Reviewer** tries to break it
- No approval without evidence
- Maximum 3 iterations before escalation

### 2. Evidence-Based Acceptance
- Every claim needs proof (command output)
- All platforms must be tested
- Performance metrics required
- No regressions allowed

### 3. Structured Tech Debt Management
- Document debt when discovered
- Convert to actionable stories
- Prioritize by impact
- Track resolution metrics

## 📋 Process Overview

### For Single Stories
1. Create story with clear requirements
2. Developer implements
3. Peer Reviewer validates adversarially
4. Iterate until approved
5. Deploy via qual_deploy.sh

### For Epics (Multi-Story)
1. Break down into 3-7 stories
2. Each story follows adversarial review
3. Integration testing after all complete
4. Epic-level validation
5. Production deployment

### For Tech Debt
1. Document in tech-debt/drafts/
2. Prioritize by impact (P0-P3)
3. Convert to story when ready
4. Follow standard story process
5. Track metrics improvement

## 👥 Role Responsibilities

### Developer
- Implements stories exactly as specified
- Tests on all required platforms
- Provides evidence of completion
- Fixes issues found in review

### Peer Reviewer
- Assumes implementation is broken
- Tests every requirement
- Tries to find edge cases
- Demands proof for all claims

### PM/Lead
- Defines epics and priorities
- Makes go/no-go decisions
- Resolves blocked items
- Approves architecture changes

## 🔍 Current Priorities

### P0 - Critical (Immediate)
1. **Sync System Test Coverage** - Zero tests for most critical system

### P1 - High (Next Sprint)
1. **God Object Refactoring** - 2000+ line files killing velocity
2. **React Performance** - Massive unnecessary re-renders
3. **iOS Freeze Fix** - 20+ second freezes on storage

### P2 - Medium (This Quarter)
1. **Console.log Cleanup** - 570+ in production
2. **Bundle Optimization** - Large initial load
3. **Platform Abstractions** - Too many workarounds

See [BACKLOG.md](BACKLOG.md) for complete list.

## 📊 Success Metrics

### Story Metrics
- First-time approval rate > 30%
- Average review cycles ≤ 2
- No production incidents from approved stories
- All platforms tested

### Tech Debt Metrics
- P0 debt = 0 always
- Resolution rate > discovery rate
- No debt older than 6 months
- Measurable improvement required

### Quality Metrics
- Test coverage > 80% target
- Bundle size < 50MB
- Load time < 3 seconds
- Zero console.logs in production

## 🛠️ Tools and Commands

### Story Management
```bash
# Create new story
./scripts/create-story.sh "Title" P1

# Create bug report
./scripts/create-bug.sh "Title" P0 Critical

# Convert tech debt
./scripts/tech-debt-to-story.sh drafts/debt.md
```

### Validation
```bash
# Standard checks
npm run lint          # Must pass
npm run typecheck     # Must pass
npm run build:web     # Must succeed

# Platform testing
npx react-native run-ios
npx react-native run-android
```

### Deployment
```bash
# ONLY approved deployment method
./scripts/qual_deploy.sh         # Full qual deploy
./scripts/qual_deploy.sh --web   # Web only
```

## ⚠️ Common Pitfalls

### Story Pitfalls
- ❌ Vague requirements → Rejection
- ❌ No success metrics → Can't verify
- ❌ Missing platform testing → Bugs in production
- ❌ No evidence provided → Not approved

### Review Pitfalls
- ❌ Accepting without proof → Bugs slip through
- ❌ Not testing edge cases → User issues
- ❌ Skipping platforms → Platform-specific bugs
- ❌ Approving incomplete work → Tech debt

### Process Pitfalls
- ❌ Skipping adversarial review → Quality issues
- ❌ Multiple stories in progress → Context switching
- ❌ Not documenting debt → Accumulation
- ❌ Ignoring metrics → No improvement

## 📝 Best Practices

### For Developers
1. Read requirements carefully
2. Test as you develop
3. Capture evidence early
4. Update PENDING_CHANGES.md
5. Follow StackMap conventions (CLAUDE.md)

### For Reviewers
1. Be genuinely adversarial
2. Test on real devices
3. Check for regressions
4. Verify all claims
5. Document issues clearly

### For Everyone
1. Evidence over assertions
2. Quality over speed
3. All platforms matter
4. Document everything
5. Learn from failures

## 🔄 Continuous Improvement

This framework evolves:
- Document learnings in role files
- Update templates based on patterns
- Add processes as needed
- Track what works/doesn't

## 🚨 Emergency Procedures

### Production Issue
1. Create P0 story immediately
2. Fix with emergency process
3. Deploy with qual_deploy.sh
4. Document in post-mortem

### Data Corruption Risk
1. Stop all deployments
2. Backup current state
3. Investigate root cause
4. Fix with P0 priority

## 📚 Additional Resources

- [CLAUDE.md](../../CLAUDE.md) - StackMap conventions
- [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) - Common issues
- [deployment/README.md](../deployment/README.md) - Deployment guide
- [testing/simple-testing-guide.md](../testing/simple-testing-guide.md) - Testing approach

---

*Framework Version: 1.0 - StackMap Specific*
*Based on Manylla Development Framework*
*Last Updated: 2025-01-13*

**Remember**: The goal is quality through rigorous validation, not speed through shortcuts.