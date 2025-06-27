/**
 * Left Menu Handler for StackMap
 * Manages the left sliding menu for activity management
 * Integrates with UnifiedHeader for consistent navigation
 */

(function() {
    'use strict';
    
    const LeftMenuHandler = {
        isInitialized: false,
        menu: null,
        overlay: null,
        isOpen: false,
        
        /**
         * Initialize the left menu handler
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Get menu elements
            self.menu = document.getElementById('left-menu');
            self.overlay = document.getElementById('left-menu-overlay');
            
            if (!self.menu || !self.overlay) {
                console.warn('LeftMenuHandler: Menu elements not found');
                return;
            }
            
            // Setup event listeners
            self.setupEventListeners();
            
            // Listen for unified header events
            document.addEventListener('unifiedHeaderLeftMenu', function(e) {
                self.toggle();
            });
            
            self.isInitialized = true;
            console.log('LeftMenuHandler: Initialized');
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Close button
            const closeBtn = document.getElementById('left-menu-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    self.close();
                });
            }
            
            // Overlay click to close
            self.overlay.addEventListener('click', function(e) {
                if (e.target === self.overlay) {
                    self.close();
                }
            });
            
            // Menu item clicks
            const menuItems = self.menu.querySelectorAll('.menu-item');
            menuItems.forEach(function(item) {
                item.addEventListener('click', function() {
                    const action = this.getAttribute('data-action');
                    if (action) {
                        self.handleMenuAction(action);
                    }
                });
            });
            
            // Keyboard navigation
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && self.isOpen) {
                    self.close();
                }
            });
            
            // Listen for close all menus event
            document.addEventListener('closeAllMenus', function() {
                if (self.isOpen) {
                    self.close();
                }
            });
        },
        
        /**
         * Toggle menu open/close
         */
        toggle: function() {
            const self = this;
            
            if (self.isOpen) {
                self.close();
            } else {
                self.open();
            }
        },
        
        /**
         * Open the menu
         */
        open: function() {
            const self = this;
            
            if (self.isOpen) return;
            
            // Check if user is in edit mode
            if (!window.EditMode || !window.EditMode.isActive()) {
                // Activate edit mode first
                if (window.EditMode) {
                    window.EditMode.toggle();
                }
            }
            
            // Show overlay
            self.overlay.style.display = 'block';
            self.overlay.setAttribute('aria-hidden', 'false');
            
            // Force reflow for animation
            self.overlay.offsetHeight;
            
            // Add active class for animation
            self.overlay.classList.add('active');
            self.menu.classList.add('active');
            
            // Set focus to first menu item
            setTimeout(function() {
                const firstItem = self.menu.querySelector('.menu-item');
                if (firstItem) {
                    firstItem.focus();
                }
            }, 300);
            
            self.isOpen = true;
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        },
        
        /**
         * Close the menu
         */
        close: function() {
            const self = this;
            
            if (!self.isOpen) return;
            
            // Remove active classes
            self.overlay.classList.remove('active');
            self.menu.classList.remove('active');
            
            // Hide overlay after animation
            setTimeout(function() {
                self.overlay.style.display = 'none';
                self.overlay.setAttribute('aria-hidden', 'true');
            }, 300);
            
            self.isOpen = false;
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Return focus to left menu button if available
            const leftMenuBtn = document.querySelector('.menu-left');
            if (leftMenuBtn) {
                leftMenuBtn.focus();
            }
        },
        
        /**
         * Handle menu item actions
         */
        handleMenuAction: function(action) {
            const self = this;
            
            console.log('LeftMenuHandler: Action', action);
            
            switch (action) {
                case 'add-activity':
                    if (window.TaskDisplay) {
                        window.TaskDisplay.addTask();
                    }
                    self.close();
                    break;
                    
                case 'quick-templates':
                    if (window.ActivityTemplates) {
                        window.ActivityTemplates.show();
                    }
                    self.close();
                    break;
                    
                case 'activity-library':
                    if (window.ActivityLibrary) {
                        window.ActivityLibrary.show();
                    }
                    self.close();
                    break;
                    
                case 'reorder':
                    // TODO: Implement reorder mode
                    alert('Reorder mode coming soon!');
                    break;
                    
                case 'pin-mode':
                    // TODO: Implement pin mode
                    alert('Pin mode coming soon!');
                    break;
                    
                case 'bulk-delete':
                    // TODO: Implement bulk delete
                    alert('Bulk delete coming soon!');
                    break;
                    
                case 'complete-day':
                    // TODO: Implement complete day
                    alert('Complete day feature coming soon!');
                    break;
                    
                case 'copy-tomorrow':
                    // TODO: Implement copy to tomorrow
                    alert('Copy to tomorrow coming soon!');
                    break;
                    
                default:
                    console.warn('LeftMenuHandler: Unknown action', action);
            }
        }
    };
    
    // Export to global scope
    window.LeftMenuHandler = LeftMenuHandler;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            LeftMenuHandler.init();
        });
    } else {
        // DOM already loaded
        setTimeout(() => LeftMenuHandler.init(), 100);
    }
    
})();