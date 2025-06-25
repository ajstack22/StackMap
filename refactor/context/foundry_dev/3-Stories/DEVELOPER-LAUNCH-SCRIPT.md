# Developer Launch Script

## Quick Start Instructions

### 1. Find Your Assignment
Check which story you're assigned to:
- **Round 1**: Active NOW
  - Dev 1: Story #70 - Convert Tasks to Activities
  - Dev 2: Story #71 - Today/Tomorrow Selector
  - Dev 3: Story #79 - Activity Templates & Quick Add

- **Round 2**: Starts after Round 1 complete
  - Dev 1: Story #81 - Header User/Day Pill
  - Dev 2: Story #82 - Modal User/Day Selector
  - Dev 3: Story #83 - Edit Mode Menu

### 2. Read Your Story
Your story file is named: `r{round}_dev{developer}_story_{number}_{description}.md`

Example: `r1_dev1_story_70_convert_tasks_to_activities.md`

### 3. Start Research Phase (REQUIRED)
Before writing any code, you MUST:

1. **Read the PROJECT-CONTEXT.md** to understand the overall project
2. **Study your story file** completely - it has critical guidance
3. **Research the existing code** as specified in your story
4. **Document your findings**

### 4. Create Your Implementation Plan

Create a new file in the `4-PlanReview` folder:
```
/refactor/context/foundry/4-PlanReview/r{round}_dev{developer}_story_{number}_plan.md
```

Your plan MUST include:
- Research findings
- File-by-file modifications with exact changes
- Code snippets showing before/after
- Testing approach
- Rollback strategy (if applicable)

Use the template provided in your story file!

### 5. Submit Plan for Review

Once your plan is complete:
1. Ensure it's in the 4-PlanReview folder
2. Notify PM that plan is ready for review
3. **DO NOT START CODING** until plan is approved

### 6. After Approval

When PM approves your plan:
1. Your plan will be moved to `5-ReadyToDevelop` folder
2. You can begin implementation
3. Follow your plan EXACTLY as approved
4. Test thoroughly before marking complete

## Critical Reminders

⚠️ **NO CODING WITHOUT AN APPROVED PLAN**

⚠️ **Stories in the same round have NO file conflicts - you can work in parallel**

⚠️ **Research is NOT optional - it prevents bugs and rework**

⚠️ **Use the exact file naming convention**

⚠️ **Test on mobile devices - this is a mobile-first app**

## Example Plan Structure

```markdown
# Implementation Plan: [Story Title]

## Phase 1: Research Findings
[Document what you learned about existing code]

## Phase 2: Implementation Order
### Step 1: [First file to modify]
**File**: path/to/file.js
```diff
- old code
+ new code
```

### Step 2: [Next file]
[Continue with detailed changes]

## Phase 3: Testing Plan
[Specific test cases]

## Risks and Mitigation
[What could go wrong and how to handle it]
```

## Questions?

If you're unsure about:
- Which story you're assigned to
- How to research effectively  
- What level of detail needed in plan
- Integration with other stories

**ASK BEFORE PROCEEDING** - It's better to clarify than to redo work.

## Quick Commands

```bash
# See your story
cat r{round}_dev{developer}_story_*.md

# Create your plan
touch 4-PlanReview/r{round}_dev{developer}_story_{number}_plan.md

# Check active stories
ls r*_dev*_story_*.md
```

## Ready?

1. ✓ Know your assignment
2. ✓ Read PROJECT-CONTEXT.md
3. ✓ Read your story completely
4. ✓ Understand the process
5. ✓ Ready to research

**Now BEGIN YOUR RESEARCH PHASE!**

Remember: Good research and planning saves hours of debugging later.