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
                    if (window.TodayTomorrowView && window.TodayTomorrowView.completeDay) {
                        window.TodayTomorrowView.completeDay();
                    } else {
                        this.showNotification('Complete day coming soon!');
                    }
                    break;
                    
                case 'copy-tomorrow':
                    if (window.TodayTomorrowView && window.TodayTomorrowView.copyToTomorrow) {
                        window.TodayTomorrowView.copyToTomorrow();
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
            // Log to console for now
            console.log('[EditModeMenu] Notification:', message);
            
            // Dispatch custom event for notification system (when implemented)
            const event = new CustomEvent('notification:show', {
                detail: { message: message }
            });
            document.dispatchEvent(event);
            
            // Basic toast notification fallback
            const toast = document.createElement('div');
            toast.className = 'edit-mode-notification';
            toast.textContent = message;
            toast.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 12px 24px; border-radius: 4px; z-index: 9999;';
            document.body.appendChild(toast);
            
            // Remove after 3 seconds
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 3000);
        }
    };
    
    // Export to global scope
    window.EditModeMenu = EditModeMenu;
    
})();