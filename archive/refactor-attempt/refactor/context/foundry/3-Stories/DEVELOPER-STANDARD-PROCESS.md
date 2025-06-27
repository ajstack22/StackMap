# Developer Standard Process for Story Implementation

## Complete Process Overview

When you receive a story assignment, follow these steps:

### 1. Initial Setup
```bash
# Navigate to the project
cd /Users/adamstack/StackMap/StackMap

# Make sure you're on the correct branch
git checkout mobile-first-refactor
git pull origin mobile-first-refactor

# Check your story file location
ls refactor/context/foundry/3-Stories/r*_dev*_story_*.md
```

### 2. Read and Understand Your Story
1. Find your story file in `/refactor/context/foundry/3-Stories/`
2. Read the entire story carefully
3. Note all acceptance criteria
4. Check for dependencies on other developers' work
5. Review the implementation guidance section

### 3. Create Your Implementation Plan
Create a plan file in the PlanReview folder:

```bash
# Create your plan file
touch refactor/context/foundry/4-PlanReview/[round]_[dev]_story_[number]_plan.md
```

Plan template:
```markdown
# Implementation Plan: Story #[NUMBER] - [TITLE]

## Overview
[Brief summary of what you'll implement]

## Files to Create/Modify
1. **new-file.js** - [What it does]
2. **existing-file.js** - [What changes]
3. **styles.css** - [What styles]

## Implementation Steps
1. [First step with details]
2. [Second step with details]
3. [Testing approach]

## Dependencies
- [Any files/features that must exist first]
- [APIs you'll use]

## Risk Mitigation
- [Potential issues and solutions]
```

### 4. Implement Your Story

Follow your plan and implement the features. Remember:
- Use ES6+ JavaScript (no Android 5 requirement)
- Mobile-first design (test at 320px width)
- 44px minimum touch targets (60px in safe mode)
- Follow existing code patterns
- Add proper error handling
- Include ARIA labels for accessibility

### 5. Test Your Implementation

#### Manual Testing Checklist:
- [ ] Feature works as specified
- [ ] Mobile responsive (320px, 375px, 768px)
- [ ] Touch targets adequate
- [ ] No console errors
- [ ] Safe mode works (`?safe=true`)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

#### Integration Testing:
- [ ] Works with other features
- [ ] Events fire correctly
- [ ] State stays synchronized
- [ ] No regressions

### 6. Create Your Close Report

When complete, create a close report in the CodeReview folder:

```bash
# Create your close report
touch refactor/context/foundry/6-CodeReview/[round]_[dev]_story_[number]_close_report.md
```

Close report template:
```markdown
# Story Close Report: Story #[NUMBER] - [TITLE]

## Story Details
- **Story ID**: #[NUMBER]
- **Developer**: Dev [1/2/3]
- **Round**: [NUMBER]
- **Title**: [STORY TITLE]
- **Status**: ✅ COMPLETE

## Summary
[Brief overview of what was implemented]

## Implementation Overview

### Files Created
1. **/refactor/js/[file].js** - [Description]
2. **/refactor/css/[file].css** - [Description]

### Files Modified
1. **/refactor/[file]** - [What was changed]
2. **/refactor/index.html** - [Added references]

## Features Implemented

### Core Functionality ✅
- [x] [Feature 1 from acceptance criteria]
- [x] [Feature 2 from acceptance criteria]
- [x] [All other acceptance criteria]

### Additional Enhancements ✅
- [x] [Any extra features added]
- [x] [Performance optimizations]
- [x] [Accessibility improvements]

## Technical Implementation

### Key Components
1. **[Component Name]** - [What it does]
   - [Key methods/features]
   - [Integration points]

2. **Event Handling**:
   - Listens for: [events]
   - Dispatches: [events]

3. **Error Handling**:
   - [How errors are handled]
   - [Fallback mechanisms]

## Testing Performed
- ✅ [Test scenario 1] - [Result]
- ✅ [Test scenario 2] - [Result]
- ✅ Mobile devices tested
- ✅ Safe mode verified
- ✅ Keyboard navigation tested
- ✅ No console errors

## Code Quality
- ES6+ JavaScript used
- Mobile-first CSS
- Follows project patterns
- Error handling included
- No console.log statements
- ARIA labels present

## Integration Notes
- Works with: [other features]
- Dependencies: [what it needs]
- No conflicts with: [other stories]

## Known Issues
- None [or list any minor issues]

## Future Enhancements (out of scope)
- [Any ideas for future improvements]

## Acceptance Criteria Status
- [x] [Criterion 1] ✅
- [x] [Criterion 2] ✅
- [x] [All criteria from story] ✅

## Story Completion
The story is complete with all acceptance criteria met and tested.

---
**Submitted for Code Review**
Date: [TODAY'S DATE]
Developer: Dev [NUMBER], Round [NUMBER]
```

### 7. Common Pitfalls to Avoid

#### Code Issues:
- ❌ Leaving console.log statements
- ❌ Not handling errors properly
- ❌ Hardcoding values that should be dynamic
- ❌ Not cleaning up event listeners
- ❌ Missing null checks
- ❌ Not testing on actual mobile devices

#### Process Issues:
- ❌ Not reading the full story first
- ❌ Implementing different behavior than specified
- ❌ Not testing all acceptance criteria
- ❌ Close report not matching actual implementation
- ❌ Forgetting to add new files to index.html

### 8. Coordination with Other Developers

If your story has dependencies:
1. Check if dependent files exist
2. Coordinate on shared files (who creates, who modifies)
3. Agree on API contracts
4. Test integration between features

### 9. Getting Help

If you're stuck:
1. Review similar implementations in the codebase
2. Check the story file for guidance
3. Look at completed stories for examples
4. Ask for clarification on requirements

### 10. Final Checklist Before Submission

- [ ] All acceptance criteria met
- [ ] Story file re-read to ensure compliance
- [ ] Code tested on mobile
- [ ] No console errors
- [ ] Close report accurately describes implementation
- [ ] New files added to git
- [ ] Ready for code review

## Example Commands

```bash
# See your changes
git status

# Test your changes
# Open in browser
open refactor/index.html

# Add safe mode
open refactor/index.html?safe=true

# Check for console errors
# Open DevTools > Console

# Stage your changes (when complete)
git add refactor/js/your-new-file.js
git add refactor/css/your-new-file.css
git add -u  # for modified files
```

## Remember

1. **Read First**: Always read the entire story before starting
2. **Plan Before Coding**: Create your implementation plan
3. **Test Everything**: Manual testing is crucial
4. **Document Accurately**: Your close report should match your code
5. **Follow Standards**: Use project patterns and conventions

Good luck with your implementation!