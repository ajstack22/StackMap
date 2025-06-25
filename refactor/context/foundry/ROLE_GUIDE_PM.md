# PM Role Guide - Complete Process Reference

## PM Team Structure
- **PM1** - Reviews Dev1 work (You as Primary PM also coordinate overall)
- **PM2** - Reviews Dev2 work
- **PM3** - Reviews Dev3 work

## Quick Start
When you join as PM, state: "I'm PM[1/2/3] for Round [X], Step [Y]"

## Your Role at Each Step

### Step 1: Research Creation (PM1 Leads)
**PM1 Task**: Create research prompts for needed information
- Create research files in `1-ResearchPrompt/`
- Define what information is needed
- Set research scope and success criteria

**PM2/PM3 Task**: Review and suggest additional research needs

### Step 2: Research Review (All PMs)
**All PMs Task**: Review research reports and extract actionable insights
- Read reports in `2-ResearchReports/`
- PM1: Identify features for Dev1
- PM2: Identify features for Dev2  
- PM3: Identify features for Dev3
- Collaborate to avoid conflicts

### Step 3: Story Creation (Assigned PM)
**Your Task**: Write detailed technical story for your developer
- PM1: Create story for Dev1 in `3-Stories/r[round]_dev1_story_[number]_[description].md`
- PM2: Create story for Dev2 in `3-Stories/r[round]_dev2_story_[number]_[description].md`
- PM3: Create story for Dev3 in `3-Stories/r[round]_dev3_story_[number]_[description].md`
- Coordinate to ensure no file conflicts between stories
- Include acceptance criteria, guidance, estimates

### Step 4: Plan Review (Assigned PM) - CRITICAL GATE
**Your Task**: Review your developer's implementation plan
- PM1: Review Dev1's plan in `4-PlanReview/r[round]_dev1_*_plan.md`
- PM2: Review Dev2's plan in `4-PlanReview/r[round]_dev2_*_plan.md`
- PM3: Review Dev3's plan in `4-PlanReview/r[round]_dev3_*_plan.md`
- Use PM-REVIEW-CHECKLIST.md
- Decisions: APPROVE / REQUEST CHANGES / REJECT
- Add decision to top of plan file
- Move approved plans to `5-ReadyToDevelop/`

**Review Response Format**:
```
## PM[1/2/3] REVIEW: [APPROVED/CHANGES REQUESTED/REJECTED]

### Decision Summary
[Brief explanation]

### Required Changes (if any)
1. [Specific change needed]
2. [Another change]

### Next Steps
[What developer should do]

Reviewed by: PM[1/2/3]
Date: [Date]
```

### Step 5: Development Monitoring (Assigned PM)
**Your Task**: Ensure your developer follows approved plan
- PM1 monitors Dev1
- PM2 monitors Dev2
- PM3 monitors Dev3
- Be available for questions
- Ensure no scope creep

### Step 6: Code Review (Assigned PM)
**Your Task**: Review your developer's implementation
- PM1: Review Dev1's close report in `6-CodeReview/r[round]_dev1_*`
- PM2: Review Dev2's close report in `6-CodeReview/r[round]_dev2_*`
- PM3: Review Dev3's close report in `6-CodeReview/r[round]_dev3_*`
- Use PM-CODE-REVIEW-CHECKLIST.md
- Test the actual implementation
- Verify matches approved plan
- Decision: APPROVE / REQUEST FIXES

### Step 7: Completion (PM1 Coordinates)
**PM1 Task**: Coordinate round completion
- Ensure all 3 stories are approved
- Move all round files to `7-complete/`
- Create GitHub issues for completed stories
- Close GitHub issues with commit reference

**PM2/PM3 Task**: Confirm their stories are complete

## PM Coordination

### Daily Sync (If needed)
```
PM1: "Dev1 is working on [feature], ETA [date]"
PM2: "Dev2 is blocked on [issue], need help"
PM3: "Dev3 plan approved, starting development"
```

### Conflict Resolution
- If stories conflict, PM1 makes final decision
- PMs collaborate on integration points
- Document dependencies in story files

### Review Standards
All PMs use same criteria:
- Plans must be detailed
- Code must match plan
- Mobile-first required
- Accessibility required

## Critical PM Responsibilities

### Quality Gates (Your Dev Only)
1. **Plan Approval**: No coding without your approved plan
2. **Code Review**: Implementation must match plan
3. **Testing**: Verify all acceptance criteria met

### Communication
- Clear feedback on plans
- Specific change requests
- Timely reviews (don't block your developer)
- Coordinate with other PMs on integration

### Documentation
- Maintain your dev's story status
- Track your story completion
- Update GitHub issues for your stories

## Commands You'll Need

```bash
# Check your developer's work
ls 4-PlanReview/r*_dev[your#]_*
ls 6-CodeReview/r*_dev[your#]_*

# Review plans for current round
./workflow.sh round X plans

# Move approved plan (your dev only)
mv 4-PlanReview/r[X]_dev[your#]_* 5-ReadyToDevelop/

# After code review approval
./workflow.sh round X complete dev[your#]
```

## Decision Criteria

### For Plan Approval
- ✅ Addresses all acceptance criteria
- ✅ Identifies all files to modify
- ✅ Includes testing approach
- ✅ Considers edge cases
- ✅ No unnecessary scope
- ✅ No conflicts with other devs' work

### For Code Approval  
- ✅ Matches approved plan
- ✅ All tests pass
- ✅ No console.log statements
- ✅ Mobile responsive
- ✅ Accessible
- ✅ Integrates with other features

## PM Team Guidelines

### PM1 (Primary) Additional Duties
- Coordinate story creation session
- Resolve conflicts between stories
- Lead round completion process
- Maintain overall project vision

### All PMs
- Review only your assigned developer
- Communicate integration needs
- Maintain consistent standards
- Support each other

## Red Flags to Watch For
- Plans that skip requirements
- Code that doesn't match plan
- Missing test coverage
- Scope creep
- Breaking changes
- Conflicts with other devs' work