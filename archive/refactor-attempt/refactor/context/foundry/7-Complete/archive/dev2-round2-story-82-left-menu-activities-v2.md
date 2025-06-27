# Story: Edit Mode Menu Button (Revised)

## Story ID
#82

## Developer Assignment
Round 2, Developer 2

## User Story
As a parent in edit mode, I want a clear menu button in the header so I can access activity management options without cluttering the main view.

## Context
- The refactor app uses edit-mode.js for edit mode
- No existing left menu implementation
- Should only show when in edit mode
- Replace floating action buttons with organized menu

## Acceptance Criteria
- [ ] Menu button appears in header when edit mode active
- [ ] Menu button hidden when not in edit mode
- [ ] Opens dropdown/panel with activity options
- [ ] Includes: Add Activity, Quick Templates, Reorder
- [ ] Works on mobile (no hover states)
- [ ] Smooth open/close animation

## Technical Requirements

### Research Tasks
1. Study edit-mode.js to understand edit mode state
2. Check if there's existing menu infrastructure
3. Identify current edit mode UI elements to replace

### Implementation Approach
```javascript
// Simple dropdown menu (not sliding)
class EditModeMenu {
  constructor() {
    this.menuButton = null;
    this.dropdown = null;
    this.isOpen = false;
  }
  
  init() {
    // Listen for edit mode changes
    EditMode.addEventListener('change', (inEditMode) => {
      this.toggleMenuButton(inEditMode);
    });
  }
  
  toggleMenuButton(show) {
    // Add/remove menu button from header
    const header = document.querySelector('.header-content');
    if (show && !this.menuButton) {
      this.createMenuButton();
      header.prepend(this.menuButton);
    } else if (!show && this.menuButton) {
      this.menuButton.remove();
      this.menuButton = null;
    }
  }
}
```

### Menu Structure
```
Edit Menu
├── Add Activity
├── Quick Templates  
├── Browse Library
├── ──────────────
├── Reorder Mode
├── Bulk Actions
└── Complete Day
```

### Integration Requirements
1. Must work with existing edit-mode.js
2. Should not interfere with grownup-mode.js
3. Coordinate with task-cards.js for actions

## Definition of Done
- [ ] Menu button shows/hides with edit mode
- [ ] Dropdown opens below button
- [ ] All menu items have click handlers
- [ ] Keyboard accessible (arrow keys)
- [ ] Clicks outside close menu
- [ ] Mobile-friendly touch targets

## Out of Scope
- Sliding panel animation (use simple dropdown)
- Complex gesture support
- Reorganizing existing edit features
- Creating new edit features

## Mobile First Design
- Dropdown, not slide-out
- Full width on small screens
- Large touch targets (44px min)
- No hover effects

## Notes for Developer
- Keep it simple - just a dropdown menu
- Use existing patterns from settings-ui.js if applicable
- Don't create new state management
- Test with keyboard navigation
- Ensure menu closes on action