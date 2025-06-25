# Developer Role Guide - Complete Process Reference

## Quick Start
When you join as Developer, state: "I'm Dev [1/2/3] for Round [X], Step [Y]"

## Your Role at Each Step

### Step 1-2: Research Phase
**Your Task**: None - PM handles research
- Wait for story assignment

### Step 3: Story Assignment
**Your Task**: Read and understand your story
- Find your story in `3-Stories/r[X]_dev[your#]_story_*.md`
- Read entire story carefully
- Note all requirements
- Check dependencies on other devs

### Step 4: Plan Creation (MANDATORY)
**Your Task**: Create detailed implementation plan
- Create plan in `4-PlanReview/r[X]_dev[your#]_story_[#]_plan.md`
- Use this template:

```markdown
# Implementation Plan: Story #[NUMBER] - [TITLE]

## Overview
[What you'll implement]

## Files to Modify
1. **[file.js]** - [what changes]
2. **[file.css]** - [what changes]

## Implementation Steps
1. [First step with details]
2. [Second step with details]

## Dependencies
- [What must exist first]
- [APIs you'll use]

## Testing Plan
- [ ] [Test case 1]
- [ ] [Test case 2]
- [ ] Mobile testing
- [ ] Safe mode testing

## Risk Mitigation
- [Potential issues]
- [How to handle them]
```

**THEN STOP AND WAIT FOR APPROVAL**

### Step 5: Development (ONLY after approval)
**Your Task**: Implement according to approved plan
- Code EXACTLY what your plan says
- Test as you go
- No console.log statements
- Follow project patterns

### Step 6: Documentation
**Your Task**: Create close report
- Create report in `6-CodeReview/r[X]_dev[your#]_story_[#]_close_report.md`
- Use this template:

```markdown
# Story Close Report: Story #[NUMBER] - [TITLE]

## Story Details
- **Story ID**: #[NUMBER]
- **Developer**: Dev [your#]
- **Round**: [X]
- **Status**: ✅ COMPLETE

## Summary
[What was implemented]

## Files Modified
1. **[file]** - [what changed]

## Features Implemented
- [x] [Feature 1]
- [x] [Feature 2]

## Testing Performed
- ✅ [Test 1] - [Result]
- ✅ Mobile tested at 320px, 375px, 768px
- ✅ Safe mode verified

## Integration Notes
[How it works with other features]

## Known Issues
[Any minor issues or future improvements]
```

### Step 7: Completion
**Your Task**: Address any review feedback
- Fix issues if requested
- Update close report
- Wait for final approval

## Critical Developer Rules

### 🛑 STOP Points
1. **After reading story** - Create plan first
2. **After creating plan** - Wait for approval
3. **After implementation** - Create close report
4. **After close report** - Wait for review

### ✅ Always Do
- Read entire story first
- Plan before coding
- Test on mobile (320px minimum)
- Test safe mode (?safe=true)
- Remove console.log statements
- Follow existing patterns

### ❌ Never Do
- Code without approved plan
- Change scope from plan
- Skip mobile testing
- Leave debug code
- Break existing features

## Testing Requirements

### For Every Story
```bash
# Basic testing
open refactor/index.html

# Mobile testing (use DevTools)
# Test at: 320px, 375px, 768px

# Safe mode testing
open refactor/index.html?safe=true

# Check console for errors
# Open DevTools > Console
```

### Specific Tests by Feature Type
- **UI Components**: Visual states, interactions
- **Data Changes**: Migration, storage, integrity
- **Integration**: Events, state sync, cleanup

## Common Patterns to Follow

### Event Handling
```javascript
// Listen for events
document.addEventListener('eventName', function(e) {
    // Handle event
});

// Dispatch events
document.dispatchEvent(new CustomEvent('eventName', {
    detail: { data: value }
}));
```

### Safe Mode Support
```javascript
// Check safe mode
const safeMode = window.StackMapSafeMode || false;
const touchTarget = safeMode ? 60 : 44;
```

### Mobile First CSS
```css
/* Mobile first */
.component { /* mobile styles */ }

/* Tablet and up */
@media (min-width: 768px) {
    .component { /* larger screen styles */ }
}
```

## File Locations

- **Your Story**: `3-Stories/r[X]_dev[your#]_story_*.md`
- **Your Plan**: `4-PlanReview/r[X]_dev[your#]_story_*_plan.md`
- **Your Report**: `6-CodeReview/r[X]_dev[your#]_story_*_close_report.md`

## Getting Help

1. Re-read story requirements
2. Check similar implementations
3. Review project documentation
4. Ask PM for clarification (not implementation)