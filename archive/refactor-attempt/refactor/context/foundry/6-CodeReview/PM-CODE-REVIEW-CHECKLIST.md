# PM Code Review Checklist

## For Reviewing Implemented Code

When a developer completes their implementation, use this checklist to ensure quality before marking the story complete.

### 1. Plan Adherence
- [ ] Code follows the approved implementation plan
- [ ] All planned files were modified as specified
- [ ] No unexpected files were changed
- [ ] Changes match the documented approach
- [ ] Any deviations are explained and justified

### 2. Acceptance Criteria
- [ ] All acceptance criteria from story are met
- [ ] Features work as specified
- [ ] Edge cases handled properly
- [ ] User experience matches requirements
- [ ] No regressions in existing functionality

### 3. Code Quality
- [ ] Follows project ES6+ standards
- [ ] Consistent with existing code patterns
- [ ] Proper error handling implemented
- [ ] No console.log statements left in
- [ ] Comments only where necessary (per project standards)

### 4. Mobile First
- [ ] Works on mobile devices (320px width minimum)
- [ ] Touch targets are adequate (44px minimum)
- [ ] No desktop-only interactions
- [ ] Performance acceptable on mobile
- [ ] Tested on actual device (not just browser)

### 5. Testing Evidence
- [ ] Manual testing completed
- [ ] Test cases from plan executed
- [ ] Edge cases verified
- [ ] Cross-browser testing done
- [ ] No breaking changes to existing features

### 6. Specific Technical Checks

#### For Database/Storage Changes:
- [ ] Migration executed successfully
- [ ] Data integrity maintained
- [ ] Rollback tested
- [ ] No data loss
- [ ] Performance impact acceptable

#### For UI Components:
- [ ] Responsive design works
- [ ] Animations smooth (60fps)
- [ ] Keyboard navigation functional
- [ ] Screen reader compatible
- [ ] Safe mode respected

#### For Integration Work:
- [ ] Events fire correctly
- [ ] State stays synchronized
- [ ] No memory leaks
- [ ] Clean disconnection/cleanup
- [ ] Error boundaries in place

### 7. Performance & Safety
- [ ] Page load time acceptable
- [ ] No blocking operations
- [ ] Memory usage reasonable
- [ ] Network requests optimized
- [ ] Security best practices followed

### 8. Common Issues to Check
- ❌ Hardcoded values that should be configurable
- ❌ Missing loading states
- ❌ Unhandled promise rejections
- ❌ Event listeners not cleaned up
- ❌ Direct DOM manipulation in wrong places
- ❌ localStorage without try/catch
- ❌ Missing null checks
- ❌ CSS breaking existing styles

### 9. Documentation & Cleanup
- [ ] Code is self-documenting (clear names)
- [ ] Complex logic explained (if needed)
- [ ] Deprecated code removed
- [ ] TODOs addressed or ticketed
- [ ] Test files cleaned up

### 10. Final Verification
- [ ] App builds without errors
- [ ] No console errors during use
- [ ] Feature demo successful
- [ ] Ready for other developers to build upon
- [ ] Matches user expectations

## Code Review Decision Tree

**APPROVE** if:
- All checklist items pass
- Code matches plan
- Quality meets standards
- No bugs found
- Ready for production

**REQUEST CHANGES** if:
- Minor issues found
- Small fixes needed
- Style inconsistencies
- Missing edge cases

**REJECT** if:
- Doesn't follow plan
- Major bugs present
- Breaks existing features
- Security issues
- Performance problems

## Review Response Template

```markdown
## Code Review: Story #[NUMBER] - [APPROVED/CHANGES REQUESTED/REJECTED]

### Summary
[Brief overview of implementation quality]

### What Works Well
- [Positive aspects]
- [Good implementations]

### Required Changes (if any)
1. **[Issue Type]**: [Description]
   - File: `path/to/file.js`
   - Line: [line numbers]
   - Fix: [what needs to change]

2. **[Next Issue]**: [Description]
   - File: `path/to/file.js`
   - Line: [line numbers]
   - Fix: [what needs to change]

### Suggestions (optional)
- [Non-blocking improvements]
- [Future enhancements]

### Testing Notes
- Tested on: [devices/browsers]
- Test scenarios: [what was tested]
- Results: [pass/fail]

### Next Steps
[What developer should do next]
```

## Quick Review Process

1. **Pull the branch** - Get latest code
2. **Run the app** - Test functionality
3. **Check the diff** - Review code changes
4. **Test key scenarios** - Verify acceptance criteria
5. **Check mobile** - Test on actual device
6. **Make decision** - Approve or request changes

## Testing Commands

```bash
# Get the branch
git checkout [feature-branch]

# Install dependencies (if changed)
npm install

# Run any linting
npm run lint

# Start the app
npm start

# Check for build issues
npm run build
```

## Common Quick Checks

### Mobile Testing
1. Open Chrome DevTools
2. Toggle device toolbar
3. Test at 320px, 375px, 768px
4. Check touch interactions
5. Verify text readability

### Performance Check
1. Open Network tab
2. Disable cache
3. Reload page
4. Check load time < 3 seconds
5. Verify no failed requests

### Console Check
1. Open Console
2. Clear existing logs
3. Interact with new feature
4. Verify no errors
5. Check for warnings

## Remember

- Code review ensures quality
- Consistent standards matter
- Test on real devices
- User experience is key
- Help developers improve

## Review Outcomes

**When Approving:**
1. Mark story as complete
2. Merge feature branch
3. Deploy if applicable
4. Notify team of completion

**When Requesting Changes:**
1. Be specific about fixes
2. Provide examples if helpful
3. Set timeline for fixes
4. Re-review when ready

**When Rejecting:**
1. Explain major issues
2. Suggest new approach
3. Offer pairing session
4. Reset expectations

Good code reviews make better products!