# Prompt Pack Template - StackMap

## Metadata
- **Priority**: [01-critical|02-high|03-medium|04-low]
- **Story ID**: [XXX]
- **Created**: [YYYY-MM-DD HH:MM]
- **Status**: Pending
- **Assigned To**: Unassigned

## Objective
[Clear, single sentence describing what needs to be accomplished]

## Context
[Why this work matters, what problem it solves, how it impacts users]

## Requirements

### Functional Requirements
- [ ] [Specific feature or behavior required]
- [ ] [Another requirement]
- [ ] [Keep requirements atomic and testable]

### Non-Functional Requirements
- [ ] Performance: [Specific metric, e.g., "Loads in <2 seconds"]
- [ ] Accessibility: [Specific requirement, e.g., "Screen reader compatible"]
- [ ] Cross-platform: Works identically on Web, iOS, Android

## Technical Approach

### Suggested Implementation
[High-level technical approach - but DEV can propose alternatives]

### Files to Modify
- `src/components/[Component]/index.js` - [What changes]
- `src/screens/[Screen].js` - [What changes]
- `src/stores/[store].js` - [What changes]

### Key Considerations
- [Platform-specific gotcha from CLAUDE.md]
- [Existing pattern to follow]
- [Potential blocker or dependency]

## Acceptance Criteria
- [ ] Feature works exactly as specified in requirements
- [ ] No TypeScript files created (JavaScript only)
- [ ] No platform-specific files (.native.js, .web.js)
- [ ] Passes `npm run lint` with zero errors
- [ ] Passes `npm run typecheck` with zero errors
- [ ] Works identically on Web browser
- [ ] Works identically on iOS simulator
- [ ] Works identically on Android emulator
- [ ] Documentation updated in `/docs/`
- [ ] PENDING_CHANGES.md updated with changes

## Testing Requirements

### Manual Testing Checklist
- [ ] Test on Web (Chrome, Safari, Firefox)
- [ ] Test on iOS simulator (latest iOS)
- [ ] Test on Android emulator (API 29+)
- [ ] Test with all theme colors
- [ ] Test offline behavior
- [ ] Test with slow network (3G)

### Edge Cases to Verify
- [ ] Empty state (no data)
- [ ] Maximum data (stress test)
- [ ] Rapid user actions (spam clicking)
- [ ] Network failure mid-operation
- [ ] App backgrounding/foregrounding
- [ ] Device rotation (mobile)

### Regression Testing
- [ ] Existing features still work
- [ ] No performance degradation
- [ ] No new console errors
- [ ] No memory leaks

## Documentation Requirements
- [ ] Update relevant `/docs/` files
- [ ] Add code comments for complex logic
- [ ] Update CLAUDE.md if introducing new patterns
- [ ] Create user-facing documentation if needed

## Definition of Done
- [ ] All functional requirements implemented
- [ ] All non-functional requirements met
- [ ] All acceptance criteria passed
- [ ] All testing completed successfully
- [ ] Documentation fully updated
- [ ] Code reviewed by PR (if priority = critical)
- [ ] PM has accepted the work
- [ ] Ready for deployment

## Dependencies
- [List any packs that must be completed first]
- [External dependencies or blockers]
- [Required approvals or decisions]

## Notes
[Additional context, links to discussions, related issues, etc.]

## References
- [Link to user request or bug report]
- [Link to design mockups if applicable]
- [Link to related documentation]

---
*Prompt Pack System v1.0 - StackMap*