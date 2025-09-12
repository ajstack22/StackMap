# Prompt Pack: Edit Mode Implement Reordering

## Metadata
- **Priority**: 02-high
- **Story ID**: 002
- **Created**: 2025-09-10 23:21
- **Status**: Pending
- **Assigned To**: Unassigned

## Objective
Implement up/down arrow buttons for reordering activities in the EditModeList without drag-and-drop.

## Context
Drag-and-drop is complex across platforms and has accessibility issues. Button-based reordering is simpler, more reliable, and works identically everywhere. Users need to reorder their daily activities to match their schedule.

## Requirements
### Functional Requirements
- [ ] Add up/down arrow buttons to each list item
- [ ] Up button moves item one position up in the list
- [ ] Down button moves item one position down in the list
- [ ] Disable up button for first item
- [ ] Disable down button for last item
- [ ] Maintain smooth animation during reorder (200ms fade)
- [ ] Update activity order in store after each move

### Non-Functional Requirements
- [ ] Performance: [specific metrics if applicable]
- [ ] Accessibility: [specific requirements]
- [ ] Cross-platform: Works on Web, iOS, Android

## Technical Approach
[Suggested technical approach, files to modify, patterns to follow]

### Files to Modify
- `src/components/EditModeList/EditModeListItem.js` - Add up/down buttons
- `src/components/EditModeList/index.js` - Implement reorder logic
- `src/stores/activityStore.js` - Add reorderActivity method if needed

### Key Considerations
- NO drag-and-drop (doesn't work well cross-platform)
- Use simple 200ms fade animation for smooth UX
- Follow existing reorder patterns from the app
- Ensure order persists through save/reload

## Acceptance Criteria
- [ ] Feature works as specified
- [ ] No TypeScript files (must be .js/.jsx only)
- [ ] No platform-specific files (.native.js, .web.js)
- [ ] Passes `npm run lint`
- [ ] Passes `npm run typecheck`
- [ ] Works on all platforms (Web, iOS, Android)
- [ ] Documentation updated

## Testing Requirements
### Manual Testing
- [ ] Test on Web browser
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test with different theme colors
- [ ] Test offline behavior if applicable

### Edge Cases
- [ ] Empty state
- [ ] Maximum data
- [ ] Network failure
- [ ] Rapid user actions

## Documentation Requirements
- [ ] Update relevant files in `/docs/`
- [ ] Update PENDING_CHANGES.md with changes
- [ ] Add inline code comments for complex logic
- [ ] Update CLAUDE.md if new patterns introduced

## Definition of Done
- [ ] All requirements met
- [ ] All acceptance criteria passed
- [ ] Testing completed
- [ ] Documentation updated
- [ ] Code reviewed (if critical)
- [ ] Ready for deployment

## Notes
[Any additional context, links to discussions, related issues]

---
*Prompt Pack System v1.0 - StackMap*
