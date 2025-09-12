# Prompt Pack: Edit Mode Add Action Buttons

## Metadata
- **Priority**: 02-high
- **Story ID**: 001
- **Created**: 2025-09-10 23:20
- **Status**: Pending
- **Assigned To**: Unassigned

## Objective
Add action buttons to each list item in the new EditModeList component for edit, delete, add to library, and complete actions.

## Context
We're converting the edit mode from cards to a list interface for better visibility and space efficiency. Users need quick access to actions for each activity without opening separate modals. This is part of the Edit Mode List Refactor started in January 2025.

## Requirements
### Functional Requirements
- [ ] Add four action buttons to each list item: Edit, Delete, Add to Library, Complete
- [ ] Buttons should be visible on the right side of each list item
- [ ] Buttons should use appropriate icons from MaterialCommunityIcons
- [ ] Edit button opens the edit modal for that activity
- [ ] Delete button removes the activity (with confirmation)
- [ ] Add to Library button adds activity to user's library
- [ ] Complete button marks activity as done and moves to completed section

### Non-Functional Requirements
- [ ] Performance: No lag when scrolling list with 50+ items
- [ ] Accessibility: All buttons must be 44x44 minimum touch target
- [ ] Cross-platform: Identical behavior on Web, iOS, Android

## Technical Approach
Modify the EditModeListItem component to include action buttons. Follow the existing pattern from ActivityCard.js for button handling.

### Files to Modify
- `src/components/EditModeList/EditModeListItem.js` - Add button row with actions
- `src/components/EditModeList/styles.js` - Add styles for button container
- `src/screens/EditScheduleScreen.js` - Ensure handlers are passed to list items

### Key Considerations
- Follow existing button patterns from ActivityCard component
- Use TouchableOpacity for consistent touch feedback
- Ensure buttons don't cause row height to increase excessively
- Consider using IconButton component if it exists

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
