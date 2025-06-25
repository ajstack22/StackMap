/**
 * Settings Dropdown Menu
 * Simple dropdown that integrates with existing settings infrastructure
 * No duplication, just quick access to common settings
 */

(function() {
    'use strict';
    
    const SettingsDropdown = {
        isOpen: false,
        isInitialized: false,
        dropdownElement: null,
        buttonElement: null,
        
        /**
         * Initialize the dropdown
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Find the menu button
            self.buttonElement = document.getElementById('menu-button');
            if (!self.buttonElement) {
                console.warn('SettingsDropdown: Menu button not found');
                return;
            }
            
            // Create dropdown element
            self.createDropdown();
            
            // Set up event listeners
            self.setupEventListeners();
            
            self.isInitialized = true;
            console.log('SettingsDropdown: Initialized');
        },
        
        /**
         * Create the dropdown element
         */
        createDropdown: function() {
            const self = this;
            
            self.dropdownElement = document.createElement('div');
            self.dropdownElement.className = 'settings-dropdown';
            self.dropdownElement.setAttribute('role', 'menu');
            self.dropdownElement.setAttribute('aria-label', 'Settings menu');
            self.dropdownElement.style.display = 'none';
            
            // Build menu items
            const menuItems = [
                { type: 'link', label: 'Settings', icon: '⚙️', action: 'settings' },
                { type: 'divider' },
                { type: 'toggle', label: 'Number Mode', icon: '123', setting: 'display-mode' },
                { type: 'toggle', label: 'Celebrations', icon: '🎉', setting: 'celebrations' },
                { type: 'divider' },
                { type: 'link', label: 'User Profiles', icon: '👤', action: 'profiles', protected: true },
                { type: 'link', label: 'Export Data', icon: '💾', action: 'export', protected: true },
                { type: 'divider' },
                { type: 'link', label: 'Help', icon: '❓', action: 'help' }
            ];
            
            menuItems.forEach(function(item) {
                if (item.type === 'divider') {
                    const divider = document.createElement('div');
                    divider.className = 'dropdown-divider';
                    divider.setAttribute('role', 'separator');
                    self.dropdownElement.appendChild(divider);
                } else {
                    const menuItem = self.createMenuItem(item);
                    self.dropdownElement.appendChild(menuItem);
                }
            });
            
            // Position near button
            const header = self.buttonElement.closest('.header');
            if (header) {
                header.style.position = 'relative';
                header.appendChild(self.dropdownElement);
            } else {
                document.body.appendChild(self.dropdownElement);
            }
        },
        
        /**
         * Create a menu item
         */
        createMenuItem: function(item) {
            const self = this;
            const element = document.createElement('button');
            element.className = 'dropdown-item';
            element.setAttribute('role', 'menuitem');
            
            // Build content
            let content = `<span class="dropdown-icon">${item.icon}</span>`;
            content += `<span class="dropdown-label">${item.label}</span>`;
            
            // Add toggle state for toggle items
            if (item.type === 'toggle') {
                const isOn = self.getToggleState(item.setting);
                content += `<span class="dropdown-toggle ${isOn ? 'on' : 'off'}"></span>`;
            }
            
            element.innerHTML = content;
            
            // Add data attribute for toggle items
            if (item.type === 'toggle') {
                element.setAttribute('data-setting', item.setting);
            }
            
            // Add click handler
            element.addEventListener('click', function() {
                self.handleItemClick(item);
            });
            
            return element;
        },
        
        /**
         * Get toggle state
         */
        getToggleState: function(setting) {
            switch(setting) {
                case 'display-mode':
                    return window.TaskDisplay && window.TaskDisplay.getDisplayMode() === 'numbers';
                case 'celebrations':
                    const celebPref = localStorage.getItem('stackmap_celebrations_enabled');
                    return celebPref !== 'false';
                default:
                    return false;
            }
        },
        
        /**
         * Handle menu item click
         */
        handleItemClick: function(item) {
            const self = this;
            
            // Check if protected action
            if (item.protected && window.GrownupMode && window.GrownupMode.isEnabled()) {
                window.GrownupMode.showChallenge(function() {
                    self.executeAction(item);
                });
                return;
            }
            
            self.executeAction(item);
        },
        
        /**
         * Execute the action
         */
        executeAction: function(item) {
            const self = this;
            
            if (item.type === 'toggle') {
                // Handle toggle items
                switch(item.setting) {
                    case 'display-mode':
                        if (window.DisplayModeToggle) {
                            window.DisplayModeToggle.toggleMode();
                        }
                        break;
                    case 'celebrations':
                        const current = localStorage.getItem('stackmap_celebrations_enabled') !== 'false';
                        localStorage.setItem('stackmap_celebrations_enabled', !current);
                        if (window.CelebrationSystem) {
                            window.CelebrationSystem.setEnabled(!current);
                        }
                        break;
                }
                // Update toggle visual state
                self.updateToggleState(item.setting);
            } else {
                // Handle link items
                switch(item.action) {
                    case 'settings':
                        self.close();
                        if (window.StackMapApp && window.StackMapApp.ViewController) {
                            window.StackMapApp.ViewController.show('settings-view');
                        }
                        break;
                    case 'profiles':
                        self.close();
                        if (window.StackMapApp && window.StackMapApp.ViewController) {
                            window.StackMapApp.ViewController.show('profiles-view');
                        }
                        break;
                    case 'export':
                        self.close();
                        if (window.DataExport) {
                            window.DataExport.exportData();
                        }
                        break;
                    case 'help':
                        self.close();
                        window.open('https://stackmap.app/help', '_blank', 'noopener,noreferrer');
                        break;
                }
            }
        },
        
        /**
         * Update toggle visual state
         */
        updateToggleState: function(setting) {
            const self = this;
            const item = self.dropdownElement.querySelector(`[data-setting="${setting}"]`);
            if (!item) return;
            
            const toggle = item.querySelector('.dropdown-toggle');
            if (toggle) {
                const isOn = self.getToggleState(setting);
                toggle.classList.toggle('on', isOn);
                toggle.classList.toggle('off', !isOn);
            }
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Button click
            self.buttonElement.addEventListener('click', function(e) {
                e.stopPropagation();
                self.toggle();
            });
            
            // Click outside to close
            document.addEventListener('click', function(e) {
                if (self.isOpen && !self.dropdownElement.contains(e.target)) {
                    self.close();
                }
            });
            
            // Escape key to close
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && self.isOpen) {
                    self.close();
                    self.buttonElement.focus();
                }
            });
        },
        
        /**
         * Toggle dropdown
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
         * Open dropdown
         */
        open: function() {
            const self = this;
            
            if (self.isOpen) return;
            
            // Position dropdown
            self.positionDropdown();
            
            // Show dropdown
            self.dropdownElement.style.display = 'block';
            self.isOpen = true;
            
            // Update button state
            self.buttonElement.setAttribute('aria-expanded', 'true');
            
            // Focus first item
            const firstItem = self.dropdownElement.querySelector('.dropdown-item');
            if (firstItem) {
                firstItem.focus();
            }
        },
        
        /**
         * Close dropdown
         */
        close: function() {
            const self = this;
            
            if (!self.isOpen) return;
            
            self.dropdownElement.style.display = 'none';
            self.isOpen = false;
            
            // Update button state
            self.buttonElement.setAttribute('aria-expanded', 'false');
        },
        
        /**
         * Position dropdown relative to button
         */
        positionDropdown: function() {
            const self = this;
            const rect = self.buttonElement.getBoundingClientRect();
            
            // Position below button, aligned to right edge
            self.dropdownElement.style.position = 'absolute';
            self.dropdownElement.style.top = (rect.bottom + 4) + 'px';
            self.dropdownElement.style.right = (window.innerWidth - rect.right) + 'px';
        },
        
        /**
         * Destroy dropdown
         */
        destroy: function() {
            const self = this;
            
            if (self.dropdownElement && self.dropdownElement.parentNode) {
                self.dropdownElement.parentNode.removeChild(self.dropdownElement);
            }
            
            self.isInitialized = false;
            self.isOpen = false;
            self.dropdownElement = null;
        }
    };
    
    // Expose to global scope
    window.SettingsDropdown = SettingsDropdown;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            SettingsDropdown.init();
        });
    } else {
        // DOM already loaded
        setTimeout(function() {
            SettingsDropdown.init();
        }, 100);
    }
})();