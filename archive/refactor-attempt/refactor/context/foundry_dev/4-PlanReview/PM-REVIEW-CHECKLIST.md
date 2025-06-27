# PM Review Checklist

## For Reviewing Developer Plans

When a developer submits a plan to `4-PlanReview`, use this checklist to ensure quality.

### 1. Research Completeness
- [ ] Developer researched all specified areas
- [ ] Findings are documented clearly
- [ ] Integration points identified
- [ ] Edge cases considered
- [ ] No assumptions - APIs verified to exist

### 2. Implementation Plan Quality
- [ ] File-by-file modifications listed
- [ ] Exact changes shown (not vague descriptions)
- [ ] Code snippets included
- [ ] Order of operations makes sense
- [ ] Dependencies handled correctly

### 3. Code Quality
- [ ] Follows project patterns (ES6+, no frameworks)
- [ ] Error handling included
- [ ] Mobile-first approach
- [ ] Accessibility considered
- [ ] Performance implications addressed

### 4. Testing Coverage
- [ ] All acceptance criteria have test cases
- [ ] Edge cases included
- [ ] Mobile testing specified
- [ ] Integration testing planned
- [ ] Manual test steps clear

### 5. Risk Management
- [ ] Rollback plan included (if applicable)
- [ ] Migration strategy safe (if needed)
- [ ] No breaking changes without mitigation
- [ ] Data integrity preserved
- [ ] User experience maintained

### 6. Specific Checks by Story Type

#### For Database/Storage Changes:
- [ ] Migration script included
- [ ] Backward compatibility addressed
- [ ] Data backup plan
- [ ] Testing with real data

#### For UI Components:
- [ ] Mobile layout considered
- [ ] Touch targets adequate (44px min)
- [ ] Keyboard navigation planned
- [ ] Screen reader compatibility
- [ ] Visual states defined (hover, active, disabled)

#### For Integration Work:
- [ ] All connection points identified
- [ ] Event handlers properly managed
- [ ] State synchronization handled
- [ ] No memory leaks

### 7. Common Issues to Watch For
- ❌ "I'll figure it out during implementation"
- ❌ Vague descriptions like "update the component"
- ❌ Missing error handling
- ❌ No mobile considerations
- ❌ Assuming APIs without verification
- ❌ Over-engineering simple features
- ❌ Under-planning complex features

### 8. Approval Decision Tree

**APPROVE** if:
- All checklist items pass
- Plan is detailed and clear
- Risks are manageable
- Implementation matches story requirements

**REQUEST REVISION** if:
- Missing critical details
- Approach has flaws
- Better solution available
- Needs clarification

**REJECT** if:
- Fundamentally wrong approach
- Would break existing functionality
- Doesn't meet story requirements
- Too risky without justification

## Review Response Template

```markdown
## Plan Review: [Story Number] - [APPROVED/REVISION NEEDED/REJECTED]

### Summary
[Brief overview of plan quality]

### Strengths
- [What they did well]

### Required Changes (if revision needed)
1. [Specific issue]
   - Current: [what they have]
   - Needed: [what it should be]

2. [Next issue]
   - Current: [...]
   - Needed: [...]

### Suggestions (optional improvements)
- [Non-blocking suggestions]

### Next Steps
[What developer should do next]
```

## Quick Review Process

1. **Skim first** - Get overall sense of plan
2. **Check research** - Did they understand the problem?
3. **Verify approach** - Will this work?
4. **Review details** - Are changes specific enough?
5. **Consider risks** - What could go wrong?
6. **Make decision** - Approve, revise, or reject

## Remember

- Plans prevent bugs - be thorough
- Developers can't start coding until approved
- Clear feedback helps developers improve
- Good plans make good code
- Time spent here saves debugging later

## Approval Actions

When approving:
1. Move plan from `4-PlanReview` to `5-ReadyToDevelop`
2. Notify developer they can begin
3. Note any warnings or watch points
4. Set expectations for check-ins

When requesting revision:
1. Be specific about what needs fixing
2. Give examples where helpful
3. Set timeline for resubmission
4. Offer to clarify if needed

Good plans lead to good implementations!