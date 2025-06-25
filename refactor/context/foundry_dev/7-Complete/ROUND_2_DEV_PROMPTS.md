# Round 2 Developer Prompts

## Developer 1 Prompt
```
Please implement Story #81 (r2_dev1_story_81_header_user_day_pill.md) - Unified Header with User/Day Pill.

This story creates a unified header component that displays the app title and a user/day pill that opens the left menu when clicked. The implementation should:

1. Create a mobile-first header with the StackMap title
2. Add a pill showing current user emoji and day (Today/Tomorrow)
3. Make the pill clickable to open the left menu
4. Ensure 60px touch targets in safe mode
5. Include proper ARIA labels and keyboard support

Key files to create/modify:
- /refactor/js/unified-header.js (new)
- /refactor/css/unified-header.css (new)
- /refactor/index.html (add header HTML and script/style references)
- /refactor/js/app.js (initialize UnifiedHeader)

The story file is in /refactor/context/foundry/3-Stories/r2_dev1_story_81_header_user_day_pill.md

Please follow the implementation guidance in the story file and ensure all acceptance criteria are met. When complete, create a close report in 6-CodeReview folder.
```

## Developer 2 Prompt
```
Please implement Story #82 (r2_dev2_story_82_modal_user_day_selector.md) - Modal User/Day Selector.

This story creates a modal-based selector that appears when clicking the day selector or user button, allowing users to switch between days and users. The implementation should:

1. Create a slide-up modal interface (mobile-first)
2. Show user list (if multiple users) and day options
3. Highlight current selections
4. Support swipe-down gesture to dismiss
5. Include proper transitions and safe mode support

Key files to create/modify:
- /refactor/js/user-day-modal.js (new)
- /refactor/css/user-day-modal.css (new)
- Update left-menu.js to trigger modal instead of inline selection
- Ensure integration with existing user and day management

The story file is in /refactor/context/foundry/3-Stories/r2_dev2_story_82_modal_user_day_selector.md

Please follow the implementation guidance in the story file and ensure all acceptance criteria are met. When complete, create a close report in 6-CodeReview folder.
```

## Developer 3 Prompt
```
Please implement Story #83 (r2_dev3_story_83_edit_mode_menu.md) - Edit Mode Menu Button.

This story adds a dedicated edit mode toggle button to the header that replaces the floating button. The implementation should:

1. Add an edit mode button to the header (pencil icon)
2. Show visual indicator when edit mode is active
3. Remove the floating edit button
4. Ensure proper state synchronization
5. Include tooltips and accessibility features

Key files to modify:
- /refactor/js/unified-header.js (add edit button - coordinate with Dev1)
- /refactor/css/unified-header.css (add edit button styles)
- /refactor/js/edit-mode.js (update to work with header button)
- /refactor/css/edit-mode.css (remove floating button styles)

The story file is in /refactor/context/foundry/3-Stories/r2_dev3_story_83_edit_mode_menu.md

Note: This story has a dependency on Dev1's header work. Coordinate to ensure the edit button is properly integrated into the unified header component.

Please follow the implementation guidance in the story file and ensure all acceptance criteria are met. When complete, create a close report in 6-CodeReview folder.
```

## Coordination Notes

### File Dependencies:
- **unified-header.js**: Dev1 creates, Dev3 modifies to add edit button
- **unified-header.css**: Dev1 creates, Dev3 adds edit button styles
- **left-menu.js**: Dev2 modifies to trigger modal instead of inline selection

### Integration Points:
1. All three stories work together to create a cohesive header system
2. The user/day pill (Dev1) triggers the modal (Dev2)
3. The edit button (Dev3) is part of the unified header (Dev1)
4. All components should respect safe mode and accessibility standards

### Testing Together:
Once all three are complete, test the full flow:
1. Header displays with title, user/day pill, and edit button
2. Clicking pill opens modal for user/day selection
3. Edit button toggles edit mode with visual feedback
4. All interactions work on mobile with proper touch targets