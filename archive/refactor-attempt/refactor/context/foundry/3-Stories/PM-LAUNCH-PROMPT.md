# PM Launch Prompt for Plan Review

## Quick Review Command

When you need to review a developer's plan, use this prompt:

```
Please review the implementation plan for Story #[NUMBER] using the PM-REVIEW-CHECKLIST.md as your guide. Provide structured feedback following the review response template.
```

## Full Review Process

### Step 1: Locate the Plan
Plans are submitted to: `/refactor/context/foundry/4-PlanReview/`

File naming: `r{round}_dev{developer}_story_{number}_plan.md`

### Step 2: Open the Checklist
Reference: `PM-REVIEW-CHECKLIST.md`

### Step 3: Use This Review Prompt

```
I need to review a developer's implementation plan.

Story: #[NUMBER] - [TITLE]
Developer: [DEV NUMBER]
Round: [ROUND NUMBER]
Plan File: [FILENAME]

Please:
1. Read the plan thoroughly
2. Apply the PM-REVIEW-CHECKLIST criteria
3. Check for:
   - Research completeness
   - Implementation detail level
   - Code quality approach
   - Testing coverage
   - Risk management
   
4. Provide feedback using this format:

## Plan Review: Story #[NUMBER] - [APPROVED/REVISION NEEDED/REJECTED]

### Summary
[Overall assessment]

### Strengths
- [What they did well]

### Required Changes (if revision needed)
1. [Specific issue]
   - Current: [what they have]
   - Needed: [what it should be]

### Suggestions (optional)
- [Non-blocking improvements]

### Next Steps
[Clear action items]
```

## Quick Decision Guide

**APPROVE if:**
- ✅ All research areas covered
- ✅ File changes are specific
- ✅ Code examples included
- ✅ Testing plan present
- ✅ Risks identified

**REQUEST REVISION if:**
- ⚠️ Missing key details
- ⚠️ Vague implementation steps
- ⚠️ No code examples
- ⚠️ Insufficient testing

**REJECT if:**
- ❌ Wrong approach entirely
- ❌ Would break existing code
- ❌ Doesn't meet requirements
- ❌ Too risky

## Sample Review Commands

### For Approval:
```
The plan for Story #70 is APPROVED. Move the plan from 4-PlanReview to 5-ReadyToDevelop. Developer 1 can begin implementation following their plan exactly.
```

### For Revision:
```
Story #71 plan needs REVISION. Key issues:
1. Missing research on existing today-tomorrow.js functionality
2. No code examples for event handling
3. Testing plan too vague

Please address these points and resubmit.
```

### For Rejection:
```
Story #82 plan is REJECTED. The approach would conflict with existing modal system. Please research the current modal.js implementation and propose a solution that integrates rather than replaces.
```

## Batch Review Process

If reviewing multiple plans:

```
Please review the following plans in sequence:
1. Story #70 (Dev 1, Round 1)
2. Story #71 (Dev 2, Round 1) 
3. Story #79 (Dev 3, Round 1)

Use PM-REVIEW-CHECKLIST.md for each and provide individual feedback.
```

## Post-Review Actions

After review decision:

**If APPROVED:**
1. Move plan file: `4-PlanReview/` → `5-ReadyToDevelop/`
2. Notify developer they can start
3. Note any watch points

**If REVISION NEEDED:**
1. Leave in `4-PlanReview/`
2. Developer updates same file
3. Re-review when ready

**If REJECTED:**
1. Move to `archive/rejected-plans/`
2. Developer starts fresh plan
3. Provide guidance on new approach

## Remember

- Good plans prevent bugs
- Specific feedback helps developers
- Time here saves debugging later
- Consistency across reviews matters
- Support developer growth

Ready to review? Use the prompt above with the story number!