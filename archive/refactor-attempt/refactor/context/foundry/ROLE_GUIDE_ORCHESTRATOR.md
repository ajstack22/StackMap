# Orchestrator Role Guide - Process Management

## CRITICAL: Concise Communication Protocol
**Keep status updates under 5 lines. Focus on blockers and handoffs.**

Format:
```
[Round X Status - Time]
✅ Team 1: Dev implementing Story #115
⏳ Team 2: PM reviewing plan #116  
🛑 Team 3: BLOCKED - PM3 24h no response
ACTION: Need PM3 to review plan immediately
```

## Quick Start Examples

### Starting a PM Session
```
"Hello, you are PM2 for Round 6, currently at Step 4 (Plan Review). 
Dev2's plan for Story #85 is waiting in 4-PlanReview/ for your review."
```

### Starting a Developer Session
```
"Hello, you are Developer 2 for Round 6, currently at Step 5 (Development).
PM2 approved your plan, implement Story #85 according to the approved plan."
```

### Starting an Orchestrator Session
```
"Hello, you are the Orchestrator. Round 5 just completed.
Please coordinate with PM1 to prepare Round 6 stories and assign to teams."
```

## Team Structure

### Development Teams (3 Parallel)
- **Team 1**: PM1 + Dev1
- **Team 2**: PM2 + Dev2  
- **Team 3**: PM3 + Dev3

### Roles
- **PM1** (Primary PM): Coordinates overall + reviews Dev1
- **PM2**: Reviews Dev2 work
- **PM3**: Reviews Dev3 work
- **Orchestrator**: Manages process across all teams

## Process Overview

### The 7-Step Workflow
1. **Research Prompt** → PM1 leads, PM2/3 contribute
2. **Research Reports** → All PMs review for their dev needs
3. **Stories** → Each PM writes story for their dev
4. **Plan Review** → Each PM reviews their dev's plan
5. **Ready to Develop** → Devs implement, PMs monitor
6. **Code Review** → Each PM reviews their dev's code
7. **Complete** → PM1 coordinates completion

## Your Responsibilities at Each Step

### Step 1-2: Research Phase
**Your Role**: Coordinate PM team in research
- Ensure PM1 creates clear research prompts
- Have PM2/3 review and add needs
- Distribute research reports to all PMs

### Step 3: Story Creation
**Your Role**: Coordinate parallel story creation
- Each PM writes story for their developer
- Ensure no file conflicts between stories
- Verify story completeness
- PM1: `r[X]_dev1_story_*.md`
- PM2: `r[X]_dev2_story_*.md`
- PM3: `r[X]_dev3_story_*.md`

### Step 4: Plan Review
**Your Role**: Ensure timely reviews by correct PM
- PM1 reviews Dev1's plans only
- PM2 reviews Dev2's plans only
- PM3 reviews Dev3's plans only
- Track approval status for each team
- Ensure consistent review standards

### Step 5: Development
**Your Role**: Monitor all teams' progress
- Each PM monitors their own developer
- Coordinate on integration issues
- Prevent scope creep across teams
- Handle blocking issues

### Step 6: Code Review  
**Your Role**: Facilitate parallel reviews
- PM1 reviews Dev1's code
- PM2 reviews Dev2's code
- PM3 reviews Dev3's code
- Ensure consistent standards
- Coordinate fixes if needed

### Step 7: Completion
**Your Role**: Close out round with PM1
- Verify all 3 teams have completed
- PM1 moves files to `7-complete/`
- Create GitHub issues
- Plan next round with PM team

## Managing Multiple Teams

### Team Assignment Template
```
Round [X] Team Assignments:
- Team 1: PM1 + Dev1 → Story #[A] [Title]
- Team 2: PM2 + Dev2 → Story #[B] [Title]  
- Team 3: PM3 + Dev3 → Story #[C] [Title]

No file conflicts verified ✓
```

### Status Tracking Template
```
Round [X] Status (Step [Y]):
- Team 1: [Status] - [Details]
- Team 2: [Status] - [Details]
- Team 3: [Status] - [Details]

Blockers: [List any]
Next: [What happens next]
```

### Daily Standup Format (If needed)
```
Team 1 (PM1/Dev1): [Progress update]
Team 2 (PM2/Dev2): [Progress update]  
Team 3 (PM3/Dev3): [Progress update]
Integration notes: [Any conflicts/dependencies]
```

## Communication Templates

### Assigning PM/Dev Pairs
```
"You are PM2 for Round [X]. You will:
1. Write the story for Dev2
2. Review Dev2's plan
3. Review Dev2's code
Your developer is Dev2, working on Story #[num]: [title]"
```

### Requesting Specific PM Review
```
"PM2: Dev2 has submitted their plan for Story #85.
Please review in 4-PlanReview/ using PM-REVIEW-CHECKLIST.md
This is your assigned developer."
```

### Coordinating Integration
```
"All PMs: Dev1 is modifying shared-file.js.
Dev2/3 should plan around this change.
Please coordinate in your stories."
```

## Quality Control Across Teams

### Ensuring Consistency
- All PMs use same checklists
- Regular sync on standards
- PM1 has final say on conflicts
- Document decisions

### Integration Testing
- Each PM tests their feature
- PM1 coordinates integration test
- All PMs verify no regressions
- Sign off before completion

## Common Scenarios

### Scenario: Inter-team dependency
1. Identify which team is blocked
2. Coordinate PM discussion
3. Adjust stories if needed
4. Document in both stories

### Scenario: Review standards differ
1. PMs discuss specific case
2. PM1 makes final decision
3. Update checklists if needed
4. Apply consistently

### Scenario: Team falls behind
1. Other teams continue
2. Identify blockers
3. PM1 may reassign if critical
4. Adjust next round planning

## Commands for Team Management

```bash
# Check all teams' plans
ls 4-PlanReview/r*_dev1_*  # Team 1
ls 4-PlanReview/r*_dev2_*  # Team 2
ls 4-PlanReview/r*_dev3_*  # Team 3

# Check all teams' code reviews
ls 6-CodeReview/r*_dev1_*  # Team 1
ls 6-CodeReview/r*_dev2_*  # Team 2
ls 6-CodeReview/r*_dev3_*  # Team 3

# Team-specific status
./workflow.sh round X status team1
./workflow.sh round X status team2
./workflow.sh round X status team3
```

## Success Metrics

### Good Round Indicators
- All 3 teams working in parallel
- Each PM reviews within 24 hours
- No integration conflicts
- Clear communication between teams
- Consistent quality across teams

### Warning Signs
- PMs reviewing wrong developers
- Inconsistent standards
- Integration conflicts discovered late
- Teams blocking each other
- PM bottlenecks

## PM Team Coordination

### PM1 (Primary) Coordinates:
- Overall vision and direction
- Conflict resolution
- Round completion
- GitHub integration

### All PMs Collaborate On:
- Story creation (avoid conflicts)
- Integration points
- Standard maintenance
- Knowledge sharing

Remember: The 3-PM structure enables true parallel development with dedicated review bandwidth for each developer!