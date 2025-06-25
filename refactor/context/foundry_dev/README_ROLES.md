# 🎯 StackMap Development Roles & Process

## Team Structure
We have **3 Parallel Teams** + 1 Orchestrator:
- **Team 1**: PM1 + Dev1
- **Team 2**: PM2 + Dev2  
- **Team 3**: PM3 + Dev3
- **Orchestrator**: Manages all teams

**Important**: Each PM reviews ONLY their assigned developer!

## Quick Start by Role

### 🎼 Starting as Orchestrator
```
"You are the Orchestrator for the StackMap project. 
Round [X] is at Step [Y]. All 3 teams are [status].
Check ROLE_GUIDE_ORCHESTRATOR.md"
```

### 👔 Starting as PM  
```
"You are PM[1/2/3] for Round [X], Step [Y] ([step name]).
You are paired with Dev[1/2/3]. 
Dev[1/2/3]'s [plan/code] is waiting for review.
Check ROLE_GUIDE_PM.md"
```

### 💻 Starting as Developer
```
"You are Developer [1/2/3] for Round [X], Step [Y].
You are paired with PM[1/2/3].
Your story is #[num]. PM[1/2/3] has [approved/rejected] your plan.
Check ROLE_GUIDE_DEV.md"
```

## The 7-Step Process with Teams

| Step | Name | PM1 Does | PM2 Does | PM3 Does | Devs Do |
|------|------|----------|----------|----------|---------|
| 1 | Research Prompt | Creates prompts | Reviews/adds | Reviews/adds | - |
| 2 | Research Reports | Reviews findings | Reviews findings | Reviews findings | - |
| 3 | Stories | Writes Dev1 story | Writes Dev2 story | Writes Dev3 story | Wait |
| 4 | **Plan Review** ⚡ | Reviews Dev1 plan | Reviews Dev2 plan | Reviews Dev3 plan | Create plans |
| 5 | Ready to Develop | Monitors Dev1 | Monitors Dev2 | Monitors Dev3 | Implement |
| 6 | **Code Review** ⚡ | Reviews Dev1 code | Reviews Dev2 code | Reviews Dev3 code | Document |
| 7 | Complete | Coordinates all | Confirms done | Confirms done | Fix issues |

⚡ = Critical Quality Gate

## Team Assignments

### Who Reviews Who
- **PM1** → Reviews **Dev1** ONLY (+ coordinates overall)
- **PM2** → Reviews **Dev2** ONLY
- **PM3** → Reviews **Dev3** ONLY

### File Ownership
```
Team 1: r[X]_dev1_story_*  (PM1 writes, Dev1 implements)
Team 2: r[X]_dev2_story_*  (PM2 writes, Dev2 implements)
Team 3: r[X]_dev3_story_*  (PM3 writes, Dev3 implements)
```

## Essential Documents

### For Everyone
- `UNIFIED_PROCESS_OVERVIEW.md` - Complete team process
- `workflow.sh` - Automation tool

### Role-Specific Guides
- `ROLE_GUIDE_PM.md` - PM tasks (updated for teams)
- `ROLE_GUIDE_DEV.md` - Developer workflow
- `ROLE_GUIDE_ORCHESTRATOR.md` - Team management

### Templates & Checklists
- `3-Stories/TEMPLATE.md` - Story format
- `PM-REVIEW-CHECKLIST.md` - Plan review criteria
- `PM-CODE-REVIEW-CHECKLIST.md` - Code review criteria

## Current Status Check

```bash
# Team 1 status
ls 3-Stories/r*_dev1_*      # Stories
ls 4-PlanReview/r*_dev1_*   # Plans
ls 6-CodeReview/r*_dev1_*   # Code

# Team 2 status  
ls 3-Stories/r*_dev2_*      
ls 4-PlanReview/r*_dev2_*   
ls 6-CodeReview/r*_dev2_*   

# Team 3 status
ls 3-Stories/r*_dev3_*      
ls 4-PlanReview/r*_dev3_*   
ls 6-CodeReview/r*_dev3_*   
```

## Key Rules

### 🛑 Never
- Review another PM's developer
- Submit to wrong PM for review
- Skip your assigned PM
- Break team boundaries

### ✅ Always
- PM2 reviews Dev2's work
- Dev2 submits to PM2 only
- Teams coordinate on integration
- PM1 has final say on conflicts

## Team Communication

### Within Your Team
```
Dev2: "PM2, my plan is ready in 4-PlanReview/"
PM2: "Dev2, plan approved with minor changes"
Dev2: "PM2, code complete and report submitted"
PM2: "Dev2, code approved, great work!"
```

### Between Teams
```
PM1: "Teams, Dev1 is modifying header.js"
PM2: "Noted, Dev2 will integrate"
PM3: "Dev3's story doesn't touch that file"
```

## Round Flow with Teams

1. **Monday**: All PMs collaborate on stories
2. **Tuesday**: Each Dev submits plan to their PM
3. **Wednesday**: Each PM reviews their Dev's plan
4. **Thu-Sat**: Devs implement, PMs monitor
5. **Sunday**: Each PM reviews their Dev's code
6. **Monday**: PM1 coordinates completion

## Success Metrics

✅ **Good Team**
- Quick reviews (< 24 hours)
- Clear communication
- Plan matches implementation
- No cross-team confusion

⚠️ **Warning Signs**  
- Dev2 waiting on PM1 (wrong PM!)
- PM3 reviewing Dev1 (wrong dev!)
- Integration conflicts late
- Team boundaries violated

## Quick Team Reference

| If you are... | You work with... | You review... | You report to... |
|---------------|------------------|---------------|------------------|
| PM1 | Dev1 | Dev1's work | Orchestrator |
| PM2 | Dev2 | Dev2's work | PM1 (for coordination) |
| PM3 | Dev3 | Dev3's work | PM1 (for coordination) |
| Dev1 | PM1 | - | PM1 |
| Dev2 | PM2 | - | PM2 |
| Dev3 | PM3 | - | PM3 |

---

**Remember**: Teams enable 3x parallel development with dedicated review bandwidth!