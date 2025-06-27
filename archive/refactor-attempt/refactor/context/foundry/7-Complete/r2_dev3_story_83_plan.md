# Implementation Plan: Edit Mode Quick Actions Menu

## Phase 1: Research Findings

### Edit Mode API
- Enable edit mode: `window.EditMode.toggle()` or `window.EditMode.enable()`
- Check if in edit mode: `window.EditMode.isActive()`
- Mode change event: `'change'` event via `EditMode.on('change', callback)`
- Current edit UI elements:
  - Edit mode toggle button (✏️) in header
  - Edit mode banner with timer and exit button
  - Add Activity card appears as first card in grid
  - Edit buttons on each activity card (arrows, delete, menu)

### Available Edit Actions
1. **Add Activity** - Currently shown as first card in grid when in edit mode
2. **Quick Add** - Available via QuickAddUI FAB button (⚡)
3. **Reorder** - Via up/down arrows on each card
4. **Bulk Delete** - Not currently implemented
5. **Complete Day** - Not currently implemented
6. **Activity Library** - Available via left menu

### Header Analysis
- Current structure: [Left Menu] [User-Day Pill] [Right Menu]
- Edit mode toggle (✏️) is inserted before the right menu button
- Available space: Can add menu button after edit toggle, before right menu
- Mobile considerations: Limited horizontal space, may need icon-only on small screens

### UI Patterns Found
- Dropdown examples: Settings dropdown (settings-dropdown.js)
- Icon usage: Mix of emoji and text icons
- Menu patterns: Left menu uses slide-out panel, settings uses dropdown

## Phase 2: Implementation Order

### Step 1: Create Edit Mode Menu Component
**File**: js/edit-mode-menu.js (NEW)

```javascript
/**
 * Edit Mode Quick Actions Menu
 * Provides centralized access to edit mode actions
 */

(function() {
    'use strict';
    
    const EditModeMenu = {
        isInitialized: false,
        menuButton: null,
        dropdown: null,
        isOpen: false,
        
        /**
         * Initialize the edit mode menu
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Create menu elements
            self.createElements();
            
            // Setup event listeners
            self.setupEventListeners();
            
            // Watch for edit mode changes
            self.watchEditMode();
            
            self.isInitialized = true;
            console.log('EditModeMenu: Initialized');
        },
        
        /**
         * Create menu elements
         */
        createElements: function() {
            const self = this;
            
            // Create menu button
            self.menuButton = document.createElement('button');
            self.menuButton.id = 'edit-mode-menu-button';
            self.menuButton.className = 'edit-mode-menu-button';
            self.menuButton.setAttribute('aria-label', 'Edit actions menu');
            self.menuButton.setAttribute('aria-expanded', 'false');
            self.menuButton.innerHTML = '<span class="menu-icon">☰</span><span class="menu-label">Actions</span>';
            
            // Create dropdown
            self.dropdown = document.createElement('div');
            self.dropdown.className = 'edit-mode-dropdown';
            self.dropdown.setAttribute('role', 'menu');
            self.dropdown.style.display = 'none';
            
            // Build menu items
            const menuItems = [
                { icon: '➕', label: 'Add Activity', action: 'add-activity' },
                { icon: '⚡', label: 'Quick Add', action: 'quick-add' },
                { icon: '📚', label: 'Activity Library', action: 'activity-library' },
                { type: 'divider' },
                { icon: '🔄', label: 'Reorder Mode', action: 'reorder' },
                { icon: '📌', label: 'Pin Activities', action: 'pin-mode' },
                { icon: '🗑️', label: 'Bulk Delete', action: 'bulk-delete' },
                { type: 'divider' },
                { icon: '✅', label: 'Complete Day', action: 'complete-day' },
                { icon: '📋', label: 'Copy to Tomorrow', action: 'copy-tomorrow' }
            ];
            
            menuItems.forEach(function(item) {
                if (item.type === 'divider') {
                    const divider = document.createElement('hr');
                    divider.className = 'edit-mode-menu-divider';
                    self.dropdown.appendChild(divider);
                } else {
                    const menuItem = document.createElement('button');
                    menuItem.className = 'edit-mode-menu-item';
                    menuItem.setAttribute('role', 'menuitem');
                    menuItem.setAttribute('data-action', item.action);
                    menuItem.innerHTML = 
                        '<span class="menu-item-icon">' + item.icon + '</span>' +
                        '<span class="menu-item-label">' + item.label + '</span>';
                    self.dropdown.appendChild(menuItem);
                }
            });
            
            // Add to body
            document.body.appendChild(self.dropdown);
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Menu button click
            self.menuButton.addEventListener('click', function(e) {
                e.stopPropagation();
                self.toggleDropdown();
            });
            
            // Menu item clicks
            self.dropdown.addEventListener('click', function(e) {
                const item = e.target.closest('.edit-mode-menu-item');
                if (item) {
                    e.stopPropagation();
                    const action = item.getAttribute('data-action');
                    self.handleAction(action);
                    self.closeDropdown();
                }
            });
            
            // Close on outside click
            document.addEventListener('click', function(e) {
                if (self.isOpen && !self.dropdown.contains(e.target)) {
                    self.closeDropdown();
                }
            });
            
            // Keyboard navigation
            self.dropdown.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    self.closeDropdown();
                } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    self.navigateMenu(e.key === 'ArrowDown' ? 1 : -1);
                }
            });
        },
        
        /**
         * Watch for edit mode changes
         */
        watchEditMode: function() {
            const self = this;
            
            // Listen for edit mode changes
            if (window.EditMode) {
                window.EditMode.on('change', function(isActive) {
                    if (isActive) {
                        self.show();
                    } else {
                        self.hide();
                    }
                });
                
                // Check initial state
                if (window.EditMode.isActive()) {
                    self.show();
                }
            }
        },
        
        /**
         * Show menu button in header
         */
        show: function() {
            const self = this;
            
            // Find insertion point (after edit toggle, before right menu)
            const header = document.querySelector('.unified-header') || document.querySelector('#main-view .header');
            if (!header) return;
            
            const rightMenuBtn = header.querySelector('.menu-right') || document.getElementById('menu-button');
            if (!rightMenuBtn) return;
            
            // Insert menu button if not already present
            if (!self.menuButton.parentElement) {
                header.insertBefore(self.menuButton, rightMenuBtn);
            }
        },
        
        /**
         * Hide menu button
         */
        hide: function() {
            const self = this;
            
            // Remove button from DOM
            if (self.menuButton.parentElement) {
                self.menuButton.parentElement.removeChild(self.menuButton);
            }
            
            // Close dropdown if open
            if (self.isOpen) {
                self.closeDropdown();
            }
        },
        
        /**
         * Toggle dropdown
         */
        toggleDropdown: function() {
            const self = this;
            
            if (self.isOpen) {
                self.closeDropdown();
            } else {
                self.openDropdown();
            }
        },
        
        /**
         * Open dropdown
         */
        openDropdown: function() {
            const self = this;
            
            // Position dropdown
            const rect = self.menuButton.getBoundingClientRect();
            self.dropdown.style.position = 'fixed';
            self.dropdown.style.top = (rect.bottom + 4) + 'px';
            self.dropdown.style.right = (window.innerWidth - rect.right) + 'px';
            self.dropdown.style.display = 'block';
            
            // Add open class for animation
            requestAnimationFrame(function() {
                self.dropdown.classList.add('open');
            });
            
            self.menuButton.setAttribute('aria-expanded', 'true');
            self.isOpen = true;
            
            // Focus first item
            const firstItem = self.dropdown.querySelector('.edit-mode-menu-item');
            if (firstItem) {
                firstItem.focus();
            }
        },
        
        /**
         * Close dropdown
         */
        closeDropdown: function() {
            const self = this;
            
            self.dropdown.classList.remove('open');
            self.menuButton.setAttribute('aria-expanded', 'false');
            
            // Hide after animation
            setTimeout(function() {
                if (!self.isOpen) {
                    self.dropdown.style.display = 'none';
                }
            }, 200);
            
            self.isOpen = false;
            
            // Return focus to button
            self.menuButton.focus();
        },
        
        /**
         * Navigate menu with keyboard
         */
        navigateMenu: function(direction) {
            const items = Array.from(this.dropdown.querySelectorAll('.edit-mode-menu-item'));
            const currentIndex = items.findIndex(item => item === document.activeElement);
            let nextIndex = currentIndex + direction;
            
            // Wrap around
            if (nextIndex < 0) nextIndex = items.length - 1;
            if (nextIndex >= items.length) nextIndex = 0;
            
            items[nextIndex].focus();
        },
        
        /**
         * Handle menu actions
         */
        handleAction: function(action) {
            console.log('EditModeMenu: Action triggered:', action);
            
            switch (action) {
                case 'add-activity':
                    if (window.ActivityDisplay && window.ActivityDisplay.addActivity) {
                        window.ActivityDisplay.addActivity();
                    } else if (window.TaskDisplay && window.TaskDisplay.addTask) {
                        window.TaskDisplay.addTask();
                    }
                    break;
                    
                case 'quick-add':
                    if (window.QuickAddUI) {
                        window.QuickAddUI.openPanel();
                    } else if (window.ActivityTemplates) {
                        window.ActivityTemplates.show();
                    }
                    break;
                    
                case 'activity-library':
                    if (window.ActivityLibrary) {
                        window.ActivityLibrary.show();
                    }
                    break;
                    
                case 'reorder':
                    if (window.DragDropReorder) {
                        window.DragDropReorder.init();
                        this.showNotification('Drag to reorder activities');
                    }
                    break;
                    
                case 'pin-mode':
                    this.showNotification('Pin mode coming soon!');
                    break;
                    
                case 'bulk-delete':
                    this.showNotification('Bulk delete coming soon!');
                    break;
                    
                case 'complete-day':
                    if (window.TodayTomorrow && window.TodayTomorrow.completeDay) {
                        window.TodayTomorrow.completeDay();
                    } else {
                        this.showNotification('Complete day coming soon!');
                    }
                    break;
                    
                case 'copy-tomorrow':
                    if (window.TodayTomorrow && window.TodayTomorrow.copyToTomorrow) {
                        window.TodayTomorrow.copyToTomorrow();
                    } else {
                        this.showNotification('Copy to tomorrow coming soon!');
                    }
                    break;
            }
        },
        
        /**
         * Show notification
         */
        showNotification: function(message) {
            // Dispatch custom event for notification system
            const event = new CustomEvent('notification:show', {
                detail: { message: message }
            });
            document.dispatchEvent(event);
        }
    };
    
    // Export to global scope
    window.EditModeMenu = EditModeMenu;
    
})();
```

### Step 2: Add Menu Styles
**File**: css/edit-mode-menu.css (NEW)

```css
/* Edit Mode Menu Button */
.edit-mode-menu-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    background: var(--edit-mode-bg, rgba(255, 193, 7, 0.1));
    color: var(--text-primary);
    border: 2px solid var(--edit-mode-border, #ffc107);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-right: 8px;
}

.edit-mode-menu-button:hover {
    background: var(--edit-mode-border, #ffc107);
    color: #000;
}

.edit-mode-menu-button .menu-icon {
    font-size: 18px;
}

.edit-mode-menu-button .menu-label {
    display: inline;
}

/* Hide label on small screens */
@media (max-width: 400px) {
    .edit-mode-menu-button .menu-label {
        display: none;
    }
    
    .edit-mode-menu-button {
        padding: 8px;
    }
}

/* Dropdown Menu */
.edit-mode-dropdown {
    background: var(--bg-secondary, #2a2a2a);
    border: 1px solid var(--border-color, #444);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    min-width: 220px;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.2s ease;
    z-index: 1000;
}

.edit-mode-dropdown.open {
    opacity: 1;
    transform: translateY(0);
}

/* Menu Items */
.edit-mode-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 400;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s ease;
    outline: none;
}

.edit-mode-menu-item:first-child {
    border-radius: 8px 8px 0 0;
}

.edit-mode-menu-item:last-child {
    border-radius: 0 0 8px 8px;
}

.edit-mode-menu-item:hover,
.edit-mode-menu-item:focus {
    background: var(--hover-bg, rgba(255, 255, 255, 0.1));
}

.edit-mode-menu-item:focus {
    box-shadow: inset 0 0 0 2px var(--primary-color, #667eea);
}

.menu-item-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
}

.menu-item-label {
    flex: 1;
}

/* Divider */
.edit-mode-menu-divider {
    margin: 4px 16px;
    border: none;
    border-top: 1px solid var(--border-color, #444);
}

/* Safe mode adjustments */
.safe-mode .edit-mode-menu-button {
    min-height: 44px;
    transition: none;
}

.safe-mode .edit-mode-menu-item {
    min-height: 60px;
    padding: 16px;
    transition: none;
}

.safe-mode .edit-mode-dropdown {
    transition: none;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
    .edit-mode-menu-button,
    .edit-mode-dropdown,
    .edit-mode-menu-item {
        transition: none;
    }
}

/* High contrast mode */
@media (prefers-contrast: high) {
    .edit-mode-menu-button {
        border-width: 3px;
    }
    
    .edit-mode-dropdown {
        border-width: 2px;
    }
    
    .edit-mode-menu-item:focus {
        outline: 3px solid currentColor;
        outline-offset: -3px;
        box-shadow: none;
    }
}

/* Light theme support */
@media (prefers-color-scheme: light) {
    .edit-mode-dropdown {
        background: #ffffff;
        border-color: #e0e0e0;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    .edit-mode-menu-item {
        color: #333;
    }
    
    .edit-mode-menu-item:hover,
    .edit-mode-menu-item:focus {
        background: rgba(0, 0, 0, 0.05);
    }
    
    .edit-mode-menu-divider {
        border-color: #e0e0e0;
    }
}
```

### Step 3: Update App.js
**File**: js/app.js (MODIFY)

Add initialization after EditMode:

```javascript
// After EditMode initialization
if (window.EditModeMenu) {
    console.log('[App] Initializing EditModeMenu');
    window.EditModeMenu.init();
}
```

### Step 4: Update index.html
**File**: index.html (MODIFY)

Add stylesheet and script references:

```html
<!-- Add to <head> after edit-mode.css -->
<link rel="stylesheet" href="css/edit-mode-menu.css">

<!-- Add to scripts after edit-mode.js -->
<script src="js/edit-mode-menu.js" defer></script>
```

## Phase 3: Testing Plan

- [x] Menu button appears only in edit mode
- [x] Menu button positioned correctly in header
- [x] Dropdown opens on click
- [x] All menu items present with icons
- [x] Actions trigger appropriate functions
- [x] Dropdown closes after action
- [x] Dropdown closes on outside click
- [x] Keyboard navigation works (arrow keys, escape)
- [x] Mobile layout (icon-only on small screens)
- [x] Safe mode sizing correct
- [x] Accessibility features (ARIA, focus management)

## Definition of Done

- [x] Research documented
- [x] Edit mode menu button appears in header when edit mode active
- [x] Dropdown menu with all edit actions
- [x] Actions connected to existing functionality
- [x] Keyboard navigation support
- [x] Mobile responsive design
- [x] Accessibility features implemented
- [x] No visual regressions
- [x] Integrates smoothly with unified header

## Integration Notes

- The menu button is inserted between the edit mode toggle and the right menu button
- Actions that aren't implemented yet show a notification
- The component watches for edit mode changes automatically
- Menu position adjusts based on screen size

## Questions Resolved

1. **Position in header**: After edit toggle, before right menu
2. **Which actions to include**: All major edit actions as specified
3. **Icon style**: Emoji icons to match existing UI
4. **Mobile behavior**: Icon-only on small screens
5. **Confirmation dialogs**: Not needed for this phase (can be added per-action later)