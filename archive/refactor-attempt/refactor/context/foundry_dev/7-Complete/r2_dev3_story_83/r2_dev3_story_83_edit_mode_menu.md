# Story #83: Edit Mode Quick Actions Menu

## Story Overview
**Round**: 2  
**Developer**: 3  
**Priority**: High - Improves edit mode usability

## Background
Currently, edit mode features are scattered across the interface. Parents need a centralized menu to quickly access common editing actions like adding activities, reordering, and managing their child's routine. This menu should only appear in edit mode.

## User Story
As a parent in edit mode, I want a menu button that gives me quick access to all editing actions so I can efficiently manage my child's activities.

## Acceptance Criteria
- [ ] Menu button appears in header during edit mode
- [ ] Menu button hidden when not in edit mode
- [ ] Opens dropdown with edit actions
- [ ] Includes: Add Activity, Quick Add, Reorder, etc.
- [ ] Actions are clearly labeled with icons
- [ ] Closes when action selected
- [ ] Closes when clicking outside
- [ ] Mobile-optimized layout

## Research Requirements
Before creating your plan, research:

1. **Edit Mode System**:
   - Study `js/edit-mode.js`
   - How is edit mode triggered?
   - What UI changes in edit mode?
   - Event system for mode changes?

2. **Current Edit Actions**:
   - Where is "Add Activity" currently?
   - What edit features exist?
   - Which are most commonly used?

3. **Header Space**:
   - Current header layout
   - Where can menu button fit?
   - Mobile header constraints

4. **Existing Patterns**:
   - Dropdown menus in codebase?
   - Menu styling patterns?
   - Icon system used?

## Implementation Plan Template
Create your plan in: `/refactor/context/foundry/4-PlanReview/r2_dev3_story_83_plan.md`

```markdown
# Implementation Plan: Edit Mode Menu

## Phase 1: Research Findings

### Edit Mode API
- Enable edit mode: [method]
- Check if in edit mode: [method]
- Mode change event: [event name]
- Current edit UI elements: [list them]

### Available Edit Actions
1. Add Activity - [current location]
2. Quick Add - [if exists]
3. Reorder - [current trigger]
4. Bulk Delete - [if exists]
5. Complete Day - [current location]

### Header Analysis
- Available space: [describe]
- Current elements: [list them]
- Mobile considerations: [notes]

### UI Patterns Found
- Dropdown examples: [where]
- Icon usage: [what system]
- Menu patterns: [describe]

## Phase 2: Implementation Order

### Step 1: Create Edit Menu Component
**File**: js/edit-menu.js (NEW)
```javascript
class EditMenu {
  constructor() {
    this.menuButton = null;
    this.dropdown = null;
    this.isOpen = false;
  }
  
  init() {
    this.createElements();
    this.setupEventListeners();
    this.watchEditMode();
  }
  
  createElements() {
    // Create menu button
    this.menuButton = document.createElement('button');
    this.menuButton.className = 'edit-menu-button';
    this.menuButton.innerHTML = `
      <span class="material-icons">menu</span>
      <span class="edit-menu-label">Edit</span>
    `;
    this.menuButton.setAttribute('aria-label', 'Edit actions menu');
    this.menuButton.setAttribute('aria-expanded', 'false');
    
    // Create dropdown
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'edit-menu-dropdown';
    this.dropdown.setAttribute('role', 'menu');
    this.dropdown.innerHTML = `
      <button class="edit-menu-item" data-action="add-activity" role="menuitem">
        <span class="material-icons">add_circle</span>
        <span>Add Activity</span>
      </button>
      <button class="edit-menu-item" data-action="quick-add" role="menuitem">
        <span class="material-icons">flash_on</span>
        <span>Quick Add</span>
      </button>
      <hr class="edit-menu-divider">
      <button class="edit-menu-item" data-action="reorder" role="menuitem">
        <span class="material-icons">drag_handle</span>
        <span>Reorder Activities</span>
      </button>
      <button class="edit-menu-item" data-action="bulk-select" role="menuitem">
        <span class="material-icons">check_box</span>
        <span>Select Multiple</span>
      </button>
      <hr class="edit-menu-divider">
      <button class="edit-menu-item" data-action="complete-day" role="menuitem">
        <span class="material-icons">done_all</span>
        <span>Complete Day</span>
      </button>
    `;
    
    // Add to DOM (hidden initially)
    document.body.appendChild(this.dropdown);
  }
  
  watchEditMode() {
    // Listen for edit mode changes
    document.addEventListener('edit-mode-changed', (e) => {
      if (e.detail.isEditMode) {
        this.show();
      } else {
        this.hide();
      }
    });
    
    // Check initial state
    if (EditMode.isActive()) {
      this.show();
    }
  }
  
  show() {
    // Add button to header
    const header = document.querySelector('.header-content');
    if (header && !this.menuButton.parentElement) {
      // Insert after title, before pill
      const subtitle = document.getElementById('subtitle');
      header.insertBefore(this.menuButton, subtitle);
    }
  }
  
  hide() {
    // Remove button from header
    if (this.menuButton.parentElement) {
      this.menuButton.remove();
    }
    // Close dropdown if open
    if (this.isOpen) {
      this.closeDropdown();
    }
  }
  
  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }
  
  openDropdown() {
    // Position dropdown below button
    const rect = this.menuButton.getBoundingClientRect();
    this.dropdown.style.top = `${rect.bottom + 4}px`;
    this.dropdown.style.left = `${rect.left}px`;
    
    // Show dropdown
    this.dropdown.classList.add('open');
    this.menuButton.setAttribute('aria-expanded', 'true');
    this.isOpen = true;
    
    // Focus first item
    this.dropdown.querySelector('.edit-menu-item').focus();
  }
  
  closeDropdown() {
    this.dropdown.classList.remove('open');
    this.menuButton.setAttribute('aria-expanded', 'false');
    this.isOpen = false;
    
    // Return focus to button
    this.menuButton.focus();
  }
  
  setupEventListeners() {
    // Toggle dropdown
    this.menuButton.addEventListener('click', () => {
      this.toggleDropdown();
    });
    
    // Handle menu item clicks
    this.dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.edit-menu-item');
      if (item) {
        const action = item.dataset.action;
        this.handleAction(action);
        this.closeDropdown();
      }
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !this.menuButton.contains(e.target) && 
          !this.dropdown.contains(e.target)) {
        this.closeDropdown();
      }
    });
    
    // Keyboard navigation
    this.dropdown.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDropdown();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateMenu(e.key === 'ArrowDown' ? 1 : -1);
      }
    });
  }
  
  navigateMenu(direction) {
    const items = Array.from(this.dropdown.querySelectorAll('.edit-menu-item'));
    const currentIndex = items.findIndex(item => item === document.activeElement);
    let nextIndex = currentIndex + direction;
    
    // Wrap around
    if (nextIndex < 0) nextIndex = items.length - 1;
    if (nextIndex >= items.length) nextIndex = 0;
    
    items[nextIndex].focus();
  }
  
  handleAction(action) {
    switch (action) {
      case 'add-activity':
        // Trigger add activity flow
        console.log('Add activity');
        // TODO: Connect to actual add flow
        break;
        
      case 'quick-add':
        // Open quick add modal
        console.log('Quick add');
        // TODO: Connect to quick add (Story #79)
        break;
        
      case 'reorder':
        // Enable reorder mode
        console.log('Reorder mode');
        // TODO: Connect to reorder functionality
        break;
        
      case 'bulk-select':
        // Enable multi-select
        console.log('Bulk select');
        break;
        
      case 'complete-day':
        // Complete day flow
        console.log('Complete day');
        break;
    }
  }
}

// Export
window.EditMenu = EditMenu;
```

### Step 2: Add Menu Styles
**File**: css/edit-menu.css (NEW)
```css
.edit-menu-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-menu-button:hover {
  background: var(--primary-dark);
}

.edit-menu-button .material-icons {
  font-size: 20px;
}

.edit-menu-dropdown {
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s;
  z-index: 1001;
}

.edit-menu-dropdown.open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.edit-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-menu-item:hover,
.edit-menu-item:focus {
  background: #f5f5f5;
  outline: none;
}

.edit-menu-item .material-icons {
  font-size: 20px;
  color: #666;
}

.edit-menu-divider {
  margin: 4px 0;
  border: none;
  border-top: 1px solid #eee;
}

/* Mobile adjustments */
@media (max-width: 400px) {
  .edit-menu-label {
    display: none; /* Icon only on small screens */
  }
  
  .edit-menu-dropdown {
    left: 16px !important;
    right: 16px;
    width: auto;
  }
}

/* Safe mode */
.safe-mode .edit-menu-button {
  min-height: 44px;
}

.safe-mode .edit-menu-item {
  min-height: 60px;
  padding: 16px;
}
```

### Step 3: Initialize in App
**File**: js/app.js
```diff
+ import EditMenu from './edit-menu.js';

  initializeComponents() {
    // ... existing code
    
+   // Initialize edit menu
+   this.editMenu = new EditMenu();
+   this.editMenu.init();
  }
```

### Step 4: Add Stylesheet
**File**: index.html  
```diff
  <!-- In <head> section -->
+ <link rel="stylesheet" href="css/edit-menu.css">
```

### Step 5: Connect Actions
- Connect each action to existing functionality
- May need to expose methods from other modules
- Coordinate with other stories for integration

## Phase 3: Testing Plan
- [ ] Menu button appears in edit mode
- [ ] Menu button hidden in normal mode  
- [ ] Dropdown opens on click
- [ ] All actions present
- [ ] Icons display correctly
- [ ] Actions trigger (log for now)
- [ ] Closes after action
- [ ] Closes on outside click
- [ ] Keyboard navigation works
- [ ] Mobile layout works
- [ ] Safe mode sizing correct
```

## Visual Design
```
┌─────────────┐
│ ☰ Edit   ▼ │ (Button in header)
└─────────────┘
       │
       ▼
┌─────────────────────┐
│ ➕ Add Activity     │
│ ⚡ Quick Add        │
│ ─────────────────── │
│ ↕️ Reorder          │
│ ☑️ Select Multiple  │
│ ─────────────────── │
│ ✅ Complete Day     │
└─────────────────────┘
```

## Integration Notes
- Actions will be stubs initially
- Connect to real functionality as available
- Quick Add connects to Story #79
- Add Activity uses existing flow
- Reorder uses existing reorder mode

## Definition of Done
- [ ] Research documented
- [ ] Detailed plan in 4-PlanReview
- [ ] PM approval received
- [ ] Menu appears in edit mode only
- [ ] Dropdown opens/closes properly
- [ ] All menu items present
- [ ] Keyboard accessible
- [ ] Mobile responsive
- [ ] Actions connected (or logged)
- [ ] No regressions

## Time Estimate
- Research: 1.5 hours
- Plan Creation: 1.5 hours
- Implementation: 4 hours
- Testing: 1.5 hours

## Questions for PM Before Starting
1. Which edit actions are highest priority?
2. Should menu replace existing edit buttons?
3. Icon preferences for actions?
4. Should some actions require confirmation?
5. Position in header (left, center, right)?

---
Note: This menu significantly improves edit mode usability by centralizing all actions in one place.