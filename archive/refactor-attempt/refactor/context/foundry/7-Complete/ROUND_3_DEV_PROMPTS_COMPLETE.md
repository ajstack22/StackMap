# Round 3 Developer Prompts - Complete Process Guide

## IMPORTANT: Process Overview

Every developer MUST follow this process for their story implementation:

### 📋 Phase 1: Planning (REQUIRED BEFORE CODING)
1. **Read** your story file completely
2. **Create** a detailed implementation plan
3. **Submit** plan to 4-PlanReview folder
4. **Wait** for PM approval before coding

### 💻 Phase 2: Implementation (AFTER PLAN APPROVAL)
1. **Code** according to approved plan
2. **Test** all acceptance criteria
3. **Verify** no regressions

### 📝 Phase 3: Documentation (AFTER IMPLEMENTATION)
1. **Create** comprehensive close report
2. **Submit** to 6-CodeReview folder
3. **Address** any review feedback

## Process Documentation References

**MUST READ BEFORE STARTING:**
- `/refactor/context/foundry/3-Stories/DEVELOPER-STANDARD-PROCESS.md` - Complete workflow guide
- `/refactor/context/foundry/4-PlanReview/PM-REVIEW-CHECKLIST.md` - What PM looks for in plans
- `/refactor/context/foundry/6-CodeReview/PM-CODE-REVIEW-CHECKLIST.md` - Code review criteria

---

## Developer 1 Prompt - Story #84
```
You are assigned Story #84: Complete Activity References Migration

REQUIRED PROCESS:

Step 1 - Planning Phase (DO THIS FIRST):
1. Read the complete story at: /refactor/context/foundry/3-Stories/r3_dev1_story_84_complete_activity_references.md
2. Review the DEVELOPER-STANDARD-PROCESS.md for workflow requirements
3. Create a detailed implementation plan at: /refactor/context/foundry/4-PlanReview/r3_dev1_story_84_plan.md

Your plan MUST include:
- List of ALL files that still have "task" references
- Specific changes needed for each file
- Order of implementation
- Testing approach for each change
- Risk mitigation strategy

Plan Template:
---
# Implementation Plan: Story #84 - Complete Activity References

## Scope Analysis
[List all files with remaining task references]

## Implementation Strategy
1. [First file/component to update]
   - Current state: [what needs changing]
   - Changes needed: [specific modifications]
   - Testing: [how to verify]

2. [Continue for all files...]

## Risk Assessment
- [Potential breaking changes]
- [Backward compatibility concerns]
- [Mitigation strategies]

## Testing Plan
- [ ] Manual testing checklist
- [ ] Integration testing approach
- [ ] Regression testing needed
---

Step 2 - Wait for Approval:
DO NOT start coding until your plan is approved. The PM will review and either:
- Approve the plan (move to implementation)
- Request changes (update plan and resubmit)

Step 3 - Implementation (ONLY AFTER APPROVAL):
1. Follow your approved plan exactly
2. Make changes systematically
3. Test each change before moving to next
4. Key areas to check:
   - Internal variable names (task → activity)
   - Method names that reference tasks
   - Event names with "task" in them
   - CSS classes that might still use task-
   - Comments and documentation

Step 4 - Testing:
- Verify all functionality still works
- Check that task→activity migration runs correctly
- Ensure backward compatibility maintained
- Test on mobile viewports

Step 5 - Documentation:
Create close report at: /refactor/context/foundry/6-CodeReview/r3_dev1_story_84_close_report.md
Include:
- List of all files changed
- Specific changes made
- Testing performed
- Any issues encountered
- Verification that no "task" references remain

REMEMBER: Do NOT skip the planning phase. Your plan must be in 4-PlanReview before you write any code.
```

## Developer 2 Prompt - Story #85
```
You are assigned Story #85: Unified Header System

CRITICAL: You MUST create and submit a plan before coding!

Step 1 - Planning Phase (MANDATORY):
1. Read the complete story at: /refactor/context/foundry/3-Stories/r3_dev2_story_85_unified_header_system.md
2. Study the existing header implementations:
   - unified-header.js (from Round 2)
   - left-menu.js integration
   - user-day-modal.js interaction
3. Review DEVELOPER-STANDARD-PROCESS.md for complete workflow

Create your plan at: /refactor/context/foundry/4-PlanReview/r3_dev2_story_85_plan.md

Plan Requirements:
---
# Implementation Plan: Story #85 - Unified Header System

## Current State Analysis
- [How headers currently work]
- [Integration points with other components]
- [Issues to address]

## Proposed Changes
1. Header Component Updates
   - [Specific modifications to unified-header.js]
   - [New methods/properties needed]
   - [Event handling changes]

2. Settings View Integration
   - [How to unify settings header]
   - [Back button handling]
   - [Consistency improvements]

3. State Management
   - [How header state will be managed]
   - [View-specific adaptations]
   - [Memory cleanup strategy]

## Mobile Considerations
- [Touch target verification]
- [Responsive behavior]
- [Safe mode support]

## Testing Approach
- [ ] Navigation between views
- [ ] State persistence
- [ ] Mobile responsiveness
- [ ] Accessibility compliance

## Risk Mitigation
- [Breaking changes to avoid]
- [Fallback strategies]
---

Step 2 - Approval Gate:
Submit your plan and WAIT. Do not code until approved.
Check for plan feedback in your plan file.

Step 3 - Implementation (POST-APPROVAL ONLY):
1. Update unified-header.js for better state management
2. Integrate settings view header
3. Ensure consistent behavior across all views
4. Add proper cleanup on view switches
5. Test header persistence and updates

Key Requirements:
- Header must work identically on all views
- Settings back button returns to previous view
- User/day pill always reflects current state
- Edit mode button visibility controlled properly

Step 4 - Testing Checklist:
- [ ] Navigate main → settings → main
- [ ] User switching updates pill immediately
- [ ] Day changes reflect in header
- [ ] Edit mode button shows/hides correctly
- [ ] Mobile touch targets meet requirements
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes

Step 5 - Close Report:
Document at: /refactor/context/foundry/6-CodeReview/r3_dev2_story_85_close_report.md

NO CODE WITHOUT APPROVED PLAN!
```

## Developer 3 Prompt - Story #86
```
You are assigned Story #86: Enhanced Edit Menu

⚠️ STOP: You MUST plan before coding! ⚠️

Step 1 - Mandatory Planning:
1. Read story: /refactor/context/foundry/3-Stories/r3_dev3_story_86_enhanced_edit_menu.md
2. Review edit-mode-menu.js from Round 2
3. Understand current limitations
4. Read DEVELOPER-STANDARD-PROCESS.md

Create plan: /refactor/context/foundry/4-PlanReview/r3_dev3_story_86_plan.md

Required Plan Sections:
---
# Implementation Plan: Story #86 - Enhanced Edit Menu

## Current Implementation Review
- [What edit menu currently does]
- [Placeholder features that need implementation]
- [Integration points]

## Feature Implementation Plan

### 1. Keyboard Shortcuts
- [Key combinations to implement]
- [Conflict detection approach]
- [Visual indicator design]

### 2. Dynamic Disabling
- [Context detection logic]
- [Which items to disable when]
- [Visual feedback for disabled items]

### 3. Status Indicators
- [Count bubbles design]
- [How to get counts efficiently]
- [Update frequency strategy]

### 4. Responsive Improvements
- [Current responsive behavior]
- [Improvements needed]
- [Testing approach]

## Technical Architecture
- [Event system for updates]
- [Performance considerations]
- [Memory management]

## Accessibility Plan
- [Keyboard shortcut announcements]
- [Screen reader updates]
- [Focus management improvements]

## Testing Strategy
- [ ] All keyboard shortcuts work
- [ ] Context-aware disabling
- [ ] Count updates are accurate
- [ ] Mobile responsiveness
- [ ] No performance degradation
---

Step 2 - Wait for Plan Approval:
Your plan will be reviewed for:
- Completeness
- Technical approach
- Risk assessment
- Testing coverage

Step 3 - Code Implementation (AFTER APPROVAL):
Follow your approved plan to implement:

1. Keyboard Shortcuts:
   - Cmd/Ctrl + A: Add Activity
   - Cmd/Ctrl + Q: Quick Add
   - Cmd/Ctrl + L: Activity Library
   - Cmd/Ctrl + R: Toggle Reorder
   - Show tooltips with shortcuts

2. Context-Aware Disabling:
   - Disable reorder if < 2 activities
   - Disable complete day if no activities
   - Visual feedback for why disabled

3. Status Indicators:
   - Activity count badge
   - Pending changes indicator
   - Dynamic updates

4. Responsive Enhancements:
   - Better mobile layout
   - Touch-friendly interactions
   - Improved animations

Step 4 - Comprehensive Testing:
Test every feature combination:
- Keyboard shortcuts on different OS
- Menu updates when activities change
- Disabled states are correct
- Mobile layout at all breakpoints
- Accessibility with screen readers

Step 5 - Documentation:
Create: /refactor/context/foundry/6-CodeReview/r3_dev3_story_86_close_report.md

Document all:
- Features implemented
- Technical decisions
- Testing performed
- Known limitations
- Future enhancement opportunities

REMEMBER: Plan approval is MANDATORY before coding!
```

## Critical Reminders for All Developers

### 🚫 DO NOT:
- Start coding without an approved plan
- Skip the planning documentation
- Implement differently than your plan states
- Forget to test on mobile devices
- Leave console.log statements in code

### ✅ DO:
- Read the entire story first
- Create comprehensive plans
- Wait for plan approval
- Follow the plan exactly
- Test thoroughly
- Document accurately

### 📚 Required Reading:
1. `/refactor/context/foundry/3-Stories/DEVELOPER-STANDARD-PROCESS.md`
2. `/refactor/context/foundry/4-PlanReview/PM-REVIEW-CHECKLIST.md`
3. Your specific story file
4. Related code from previous rounds

### 🔄 Process Flow:
```
Read Story → Create Plan → Submit to 4-PlanReview → Wait for Approval
    ↓ (only after approval)
Implement Code → Test Everything → Create Close Report → Submit to 6-CodeReview
```

## Plan Submission Instructions

When submitting your plan:
1. Save it in `/refactor/context/foundry/4-PlanReview/`
2. Use naming: `r3_dev[1|2|3]_story_[84|85|86]_plan.md`
3. Include all required sections
4. Be specific about changes
5. Consider edge cases
6. Plan your testing approach

## Questions?

If you need clarification:
1. Re-read the story file
2. Check the process documentation
3. Look at examples from previous rounds
4. Ask for clarification before implementing

Good luck with Round 3! Remember: **PLAN FIRST, CODE SECOND!**