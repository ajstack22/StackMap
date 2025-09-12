# Story: [Title]
## ID: S-[CATEGORY]-[NUMBER]
## Priority: P[0-3]
## Category: [Feature/Bug/Debt/Performance/Security]
## Estimated Effort: [S(1d)/M(3d)/L(1w)/XL(2w+)]

## Problem Statement
[Clear description of what needs to be solved and why]

## Requirements
### Functional Requirements
- [ ] Requirement 1: [Specific, measurable requirement]
- [ ] Requirement 2: [Include edge cases]
- [ ] Requirement 3: [Platform-specific needs]

### Non-Functional Requirements
- [ ] Performance: [Specific metrics]
- [ ] Security: [Specific considerations]
- [ ] Accessibility: [WCAG compliance]
- [ ] Platform compatibility: [Web/iOS/Android]

## Success Criteria
### Verification Commands
```bash
# These commands must pass
npm run lint
npm run typecheck
npm run build:web

# Platform-specific tests
npx react-native run-ios
npx react-native run-android

# Custom verification
[Specific commands to prove success]
```

### Acceptance Criteria
- [ ] All requirements implemented
- [ ] No console.log statements
- [ ] No TypeScript errors
- [ ] Bundle size impact < 1%
- [ ] Load time impact < 100ms
- [ ] All platforms tested
- [ ] PENDING_CHANGES.md updated

## Implementation Notes
### Approach
[High-level approach to implementation]

### Key Files to Modify
- `src/[component].js` - [What changes]
- `src/[service].js` - [What changes]

### Platform Considerations
- **Web**: [Specific considerations]
- **iOS**: [Specific considerations]
- **Android**: [Specific considerations]

### Dependencies
- Must complete after: [Story ID or None]
- Must complete before: [Story ID or None]
- Related stories: [Story IDs]

## Testing Plan
### Unit Tests
- [ ] Test case 1: [Description]
- [ ] Test case 2: [Description]

### Integration Tests
- [ ] Sync functionality maintained
- [ ] Data persistence verified
- [ ] Platform features work

### Manual Testing
- [ ] Web (Chrome): [Test steps]
- [ ] Web (Safari): [Test steps]
- [ ] iOS Simulator: [Test steps]
- [ ] Android Emulator: [Test steps]

## Rollback Plan
### Risk Level: [Low/Medium/High]
### Rollback Steps:
1. [Step 1]
2. [Step 2]
3. [Verification]

## Documentation Updates
- [ ] Update CLAUDE.md if conventions change
- [ ] Update README.md if setup changes
- [ ] Update relevant docs/ files
- [ ] Add to RELEASE_NOTES.md if user-facing

## Review Checklist
### For Developer
- [ ] All requirements implemented
- [ ] All tests passing
- [ ] Platforms tested with evidence
- [ ] Performance metrics captured
- [ ] Documentation updated
- [ ] PENDING_CHANGES.md updated

### For Peer Reviewer
- [ ] Requirements verified independently
- [ ] Edge cases tested
- [ ] Performance regression checked
- [ ] Security implications reviewed
- [ ] Code follows StackMap conventions
- [ ] No console.logs or debug code

## Notes
[Any additional context, warnings, or considerations]

---
*Story Template v1.0 - StackMap*
*Based on Manylla Framework*