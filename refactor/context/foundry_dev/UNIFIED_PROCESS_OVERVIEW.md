# Unified Process Overview - StackMap Development Workflow

## 🎯 The Big Picture

We run **Rounds** of development with **3 Parallel Teams**:
- **Team 1**: PM1 + Dev1 
- **Team 2**: PM2 + Dev2
- **Team 3**: PM3 + Dev3
- **1 Orchestrator** managing the overall process
- **7 Steps** from idea to implementation

## 👥 Team Structure

### Development Teams
Each team is a dedicated PM/Dev pair:
- **PM reviews ONLY their assigned developer**
- **Dev reports ONLY to their assigned PM**
- **Clear accountability and faster reviews**

### Special Roles
- **PM1**: Primary PM - coordinates overall + manages Dev1
- **Orchestrator**: Process manager across all teams

## 📊 The 7-Step Workflow

```
Step | What Happens              | Team Responsibilities
-----|---------------------------|----------------------
1    | Research Prompt          | PM1 leads, PM2/3 contribute
2    | Research Reports         | All PMs review for their needs
3    | Stories                  | Each PM writes for their Dev
4    | Plan Review ⚡           | Each PM reviews their Dev's plan
5    | Ready to Develop         | Devs code, PMs monitor their Dev
6    | Code Review ⚡           | Each PM reviews their Dev's code
7    | Complete                 | PM1 coordinates completion
```
⚡ = Critical Quality Gate

## 🎭 The Roles Explained

### 👔 PM1 (Primary PM)
- Creates research prompts
- Reviews Dev1's work
- Coordinates story creation
- Resolves conflicts
- Manages round completion

### 👔 PM2 & PM3
- Review research for their dev needs
- Write story for their developer
- Review their dev's plan
- Review their dev's code
- Maintain quality standards

### 💻 Developer (Dev 1, 2, or 3)
- Works with assigned PM only
- Creates implementation plans
- Waits for their PM's approval
- Implements approved plans
- Reports to their PM

### 🎼 Orchestrator
- Assigns teams
- Ensures process compliance
- Manages round transitions
- Handles cross-team issues

## 🚦 Critical Gates

### Gate 1: Plan Approval (Step 4)
- **Dev1 plan** → PM1 must approve
- **Dev2 plan** → PM2 must approve  
- **Dev3 plan** → PM3 must approve
- **No coding without YOUR PM's approval**

### Gate 2: Code Review (Step 6)
- **Dev1 code** → PM1 must review
- **Dev2 code** → PM2 must review
- **Dev3 code** → PM3 must review
- **Implementation must match approved plan**

## 📁 File Naming Convention

```
r[round]_dev[number]_story_[id]_[description].[ext]

Examples:
r6_dev2_story_85_unified_header.md         (PM2 writes)
r6_dev2_story_85_unified_header_plan.md    (Dev2 writes, PM2 reviews)
r6_dev2_story_85_close_report.md          (Dev2 writes, PM2 reviews)
```

## 🔄 Typical Round Flow

### Day 1: Story Creation
- PM1, PM2, PM3 collaborate on stories
- Each PM writes story for their dev
- Ensure no file conflicts

### Day 2: Planning
- Dev1 plans → submits to PM1
- Dev2 plans → submits to PM2
- Dev3 plans → submits to PM3

### Day 3: Plan Review
- PM1 reviews Dev1's plan
- PM2 reviews Dev2's plan
- PM3 reviews Dev3's plan

### Day 4-6: Development
- All devs implement in parallel
- Each PM monitors their dev
- PMs coordinate on integration

### Day 7: Code Review & Completion
- PM1 reviews Dev1's code
- PM2 reviews Dev2's code
- PM3 reviews Dev3's code
- PM1 coordinates completion

## 📋 Quick Commands

```bash
# Check team status
ls 4-PlanReview/r*_dev1_*  # Team 1 plans
ls 4-PlanReview/r*_dev2_*  # Team 2 plans
ls 4-PlanReview/r*_dev3_*  # Team 3 plans

# Complete round (PM1 only)
./workflow.sh round 6 complete
```

## ⚡ Starting a Session

### For PM Role
```
"You are PM[2] for Round [X], Step [Y].
You are paired with Dev[2] working on Story #[85].
Dev2's [plan/code] is waiting for your review.
Use ROLE_GUIDE_PM.md for your tasks."
```

### For Developer Role
```
"You are Developer [2] for Round [X], Step [Y].
You are paired with PM[2].
Your story is #[85]: [title].
PM2 has [approved your plan/requested changes].
Use ROLE_GUIDE_DEV.md for process."
```

## 🎯 Success Criteria

### Good Team
- PM reviews within 24 hours
- Dev follows approved plan
- Clear communication
- No scope creep

### Good Integration
- Teams coordinate early
- No file conflicts
- Features work together
- All PMs sign off

## 🚨 Team Boundaries

### ✅ Correct
- Dev2 submits plan → PM2 reviews
- PM2 writes story → Dev2 implements
- Dev2 has questions → asks PM2

### ❌ Incorrect
- Dev2 submits plan → PM1 reviews (wrong PM!)
- PM3 writes story → Dev2 implements (wrong pairing!)
- Dev1 has questions → asks PM2 (wrong PM!)

## 📚 Key Documents

- `ROLE_GUIDE_PM.md` - PM complete guide
- `ROLE_GUIDE_DEV.md` - Developer complete guide
- `ROLE_GUIDE_ORCHESTRATOR.md` - Orchestrator guide
- `README_ROLES.md` - Quick reference
- This document - Team process overview

## 🎉 Why Teams Work Better

1. **Dedicated Reviews** - Each PM focuses on one developer
2. **Faster Turnaround** - No review bottlenecks
3. **Clear Accountability** - Known PM/Dev pairs
4. **Better Mentoring** - Consistent PM guidance
5. **Parallel Efficiency** - True 3x productivity

---

Remember: **Stay in your team!** PM2 reviews Dev2, PM3 reviews Dev3, etc.