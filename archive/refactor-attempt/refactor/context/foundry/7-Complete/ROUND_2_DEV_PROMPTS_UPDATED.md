# Round 2 Developer Prompts (Updated with Full Process)

## Developer 1 Prompt (REVISED - Fix Required)
```
Please implement Story #81 (r2_dev1_story_81_header_user_day_pill.md) - Unified Header with User/Day Pill.

IMPORTANT: The initial implementation has a critical bug that needs to be fixed. The user-day pill currently opens a modal but it should open the LEFT MENU.

Required Fix:
In /refactor/js/unified-header.js, the handleUserDayClick() method (around line 261) needs to be updated to open the left menu, not a modal. The correct implementation should be:

// Open left menu as per story requirements
if (window.LeftMenu && window.LeftMenu.open) {
    window.LeftMenu.open();
} else {
    // Fallback: try to click the left menu button directly
    const leftMenuBtn = document.getElementById('left-menu-button');
    if (leftMenuBtn) {
        leftMenuBtn.click();
    }
}

Also:
1. Remove the unnecessary modal/switcher code (showUserDaySwitcher method and related)
2. Remove console.warn statements
3. Test that clicking the pill opens the left menu

PROCESS TO FOLLOW:

1. Read the full story at /refactor/context/foundry/3-Stories/r2_dev1_story_81_header_user_day_pill.md
2. Review the adversarial code review at /refactor/context/foundry/6-CodeReview/r2_dev1_story_81_ADVERSARIAL_REVIEW.md
3. Make the required fixes listed above
4. Test all acceptance criteria
5. Update your close report to reflect the actual implementation

For the complete development process, see: /refactor/context/foundry/3-Stories/DEVELOPER-STANDARD-PROCESS.md
```

## Developer 2 Prompt
```
Please implement Story #82 (r2_dev2_story_82_modal_user_day_selector.md) - Modal User/Day Selector.

This story creates a modal-based selector that appears when clicking the day selector or user button, allowing users to switch between days and users.

PROCESS TO FOLLOW:

1. Initial Setup:
   - cd /Users/adamstack/StackMap/StackMap
   - git checkout mobile-first-refactor
   - git pull origin mobile-first-refactor

2. Read your story file at: /refactor/context/foundry/3-Stories/r2_dev2_story_82_modal_user_day_selector.md

3. Create implementation plan at: /refactor/context/foundry/4-PlanReview/r2_dev2_story_82_plan.md

4. Implementation should include:
   - Create /refactor/js/user-day-modal.js (new)
   - Create /refactor/css/user-day-modal.css (new)
   - Update left-menu.js to trigger modal instead of inline selection
   - Add script/style references to index.html

5. Key features to implement:
   - Slide-up modal interface (mobile-first)
   - Show user list (if multiple users) and day options
   - Highlight current selections
   - Support swipe-down gesture to dismiss
   - Include proper transitions and safe mode support

6. Test your implementation:
   - Mobile responsive (320px, 375px, 768px)
   - Touch targets adequate (44px min, 60px safe mode)
   - Swipe gesture works
   - Safe mode disables animations
   - Integration with existing user/day management

7. Create close report at: /refactor/context/foundry/6-CodeReview/r2_dev2_story_82_close_report.md

For the complete development process, see: /refactor/context/foundry/3-Stories/DEVELOPER-STANDARD-PROCESS.md
```

## Developer 3 Prompt
```
Please implement Story #83 (r2_dev3_story_83_edit_mode_menu.md) - Edit Mode Menu Button.

This story adds a dedicated edit mode toggle button to the header that replaces the floating button.

PROCESS TO FOLLOW:

1. Initial Setup:
   - cd /Users/adamstack/StackMap/StackMap
   - git checkout mobile-first-refactor
   - git pull origin mobile-first-refactor

2. Read your story file at: /refactor/context/foundry/3-Stories/r2_dev3_story_83_edit_mode_menu.md

3. Create implementation plan at: /refactor/context/foundry/4-PlanReview/r2_dev3_story_83_plan.md

4. IMPORTANT DEPENDENCY: This story depends on Dev1's unified header. You'll need to:
   - Wait for Dev1 to fix the unified-header.js file
   - Coordinate on adding the edit button to the header
   - The header structure should already exist

5. Implementation should include:
   - Modify /refactor/js/unified-header.js (add edit button)
   - Modify /refactor/css/unified-header.css (add edit button styles)
   - Update /refactor/js/edit-mode.js (work with header button)
   - Update /refactor/css/edit-mode.css (remove floating button styles)

6. Key features to implement:
   - Add edit mode button to header (pencil icon ✏️)
   - Show visual indicator when edit mode is active
   - Remove the floating edit button
   - Ensure proper state synchronization
   - Include tooltips and accessibility features

7. Test your implementation:
   - Edit button visible in header
   - Toggle works correctly
   - Visual feedback when active
   - Old floating button removed
   - Works with existing edit mode features

8. Create close report at: /refactor/context/foundry/6-CodeReview/r2_dev3_story_83_close_report.md

For the complete development process, see: /refactor/context/foundry/3-Stories/DEVELOPER-STANDARD-PROCESS.md
```

## Coordination Notes

### File Dependencies:
- **unified-header.js**: Dev1 must fix it first, then Dev3 can modify
- **unified-header.css**: Dev1 creates, Dev3 adds edit button styles
- **left-menu.js**: Dev2 modifies to trigger modal instead of inline selection

### Integration Points:
1. All three stories work together to create a cohesive header system
2. The user/day pill (Dev1) should open left menu (not modal)
3. The modal (Dev2) is triggered from within the left menu
4. The edit button (Dev3) is part of the unified header (Dev1)

### Testing Together:
Once all three are complete, test the full flow:
1. Header displays with title, user/day pill, and edit button
2. Clicking pill opens left menu (not modal)
3. From left menu, user can trigger the modal for user/day selection
4. Edit button toggles edit mode with visual feedback
5. All interactions work on mobile with proper touch targets

## Common Pitfalls to Avoid:
- ❌ Not reading the full story first
- ❌ Implementing different behavior than specified
- ❌ Leaving console.log or console.warn statements
- ❌ Not testing on mobile viewports
- ❌ Close report not matching actual implementation
- ❌ Forgetting to add new files to index.html
- ❌ Not coordinating on shared files

Remember: Your close report should accurately describe what you actually implemented!