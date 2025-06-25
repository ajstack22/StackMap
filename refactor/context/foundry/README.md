# StackMap Development Foundry - 3-Team Structure

## 🎯 Team-Based Development Workflow

We use a **3-team parallel development** structure for maximum efficiency:
- **Team 1**: PM1 + Dev1
- **Team 2**: PM2 + Dev2  
- **Team 3**: PM3 + Dev3
- **Orchestrator**: Manages all teams

## 📚 Essential Documentation

### Quick Start Guides
- **[README_ROLES.md](README_ROLES.md)** - Team structure & quick reference
- **[UNIFIED_PROCESS_OVERVIEW.md](UNIFIED_PROCESS_OVERVIEW.md)** - Complete workflow explanation

### Role-Specific Guides
- **[ROLE_GUIDE_PM.md](ROLE_GUIDE_PM.md)** - PM tasks and responsibilities
- **[ROLE_GUIDE_DEV.md](ROLE_GUIDE_DEV.md)** - Developer workflow and standards
- **[ROLE_GUIDE_ORCHESTRATOR.md](ROLE_GUIDE_ORCHESTRATOR.md)** - Team management guide

### Process Documents
- **[PM-REVIEW-CHECKLIST.md](4-PlanReview/PM-REVIEW-CHECKLIST.md)** - Plan review criteria
- **[PM-CODE-REVIEW-CHECKLIST.md](6-CodeReview/PM-CODE-REVIEW-CHECKLIST.md)** - Code review criteria
- **[DEVELOPER-STANDARD-PROCESS.md](3-Stories/DEVELOPER-STANDARD-PROCESS.md)** - Step-by-step dev guide

## 🚀 Quick Start by Role

### Starting as PM
```
"You are PM[1/2/3] for Round [X], Step [Y].
You are paired with Dev[1/2/3].
Check ROLE_GUIDE_PM.md for your tasks."
```

### Starting as Developer
```
"You are Developer [1/2/3] for Round [X], Step [Y].
You are paired with PM[1/2/3].
Your story is #[num]: [title].
Check ROLE_GUIDE_DEV.md for process."
```

### Starting as Orchestrator
```
"You are the Orchestrator for Round [X].
All 3 teams are at Step [Y].
Check ROLE_GUIDE_ORCHESTRATOR.md."
```

## 📁 Workflow Stages

### The 7-Step Process

1. **Research Prompt** - PMs identify needed information
2. **Research Reports** - Research conducted and documented
3. **Stories** - Each PM writes story for their developer
4. **Plan Review** ⚡ - Each PM reviews their dev's plan
5. **Ready to Develop** - Devs implement approved plans
6. **Code Review** ⚡ - Each PM reviews their dev's code
7. **Complete** - Round closed, work integrated

⚡ = Critical Quality Gates

## 🗂️ File Naming Convention

### Round-Based Stories
```
r[round]_dev[number]_story_[id]_[description].md

Examples:
r3_dev1_story_84_complete_activity_references.md
r3_dev2_story_85_unified_header_system.md
r3_dev3_story_86_enhanced_edit_menu.md
```

### Plans and Reports
```
# Plans (in 4-PlanReview)
r[round]_dev[number]_story_[id]_plan.md

# Close Reports (in 6-CodeReview)
r[round]_dev[number]_story_[id]_close_report.md
```

## 🔄 Current Round Status

### Round 3 - Active
- **Team 1**: Story #84 - Complete Activity References
- **Team 2**: Story #85 - Unified Header System
- **Team 3**: Story #86 - Enhanced Edit Menu
- **Status**: Stories ready, awaiting developer plans

## 📋 Commands

```bash
# Check round status
./workflow.sh round [number]

# Check team status
ls 4-PlanReview/r*_dev1_*  # Team 1
ls 4-PlanReview/r*_dev2_*  # Team 2
ls 4-PlanReview/r*_dev3_*  # Team 3

# Complete a round (PM1 only)
./workflow.sh round [number] complete
```

## ⚠️ Critical Rules

### Team Boundaries
- PM1 reviews ONLY Dev1's work
- PM2 reviews ONLY Dev2's work
- PM3 reviews ONLY Dev3's work
- Developers report ONLY to their assigned PM

### Process Gates
- NO coding without approved plan
- NO skipping documentation
- NO changing scope mid-implementation
- NO direct commits without review

## 🎯 Success Metrics

### Good Team
- Quick reviews (< 24 hours)
- Plans match implementation
- Clear communication
- No file conflicts

### Warning Signs
- Wrong PM/Dev pairings
- Skipped process steps
- Integration conflicts
- Review bottlenecks

## 📞 Communication Patterns

### Within Teams
```
Dev2: "PM2, my plan is ready in 4-PlanReview"
PM2: "Dev2, plan approved with suggestions"
```

### Between PMs
```
PM1: "Teams, Dev1 is modifying core files"
PM2: "Noted, Dev2 will integrate after"
```

## 🏁 Getting Started

1. **Identify your role** (PM1/2/3, Dev1/2/3, or Orchestrator)
2. **Read your role guide** (see Essential Documentation above)
3. **Check current round/step** status
4. **Follow your workflow** exactly
5. **Communicate with your team** partner

---

Remember: The 3-team structure enables 3x parallel development with dedicated review bandwidth!