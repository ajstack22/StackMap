/**
 * Unified Header Navigation for StackMap
 * Mobile-first header with clear buttons and user/day context
 * ADHD-optimized with consistent placement and immediate feedback
 */

(function() {
    'use strict';
    
    const UnifiedHeader = {
        isInitialized: false,
        header: null,
        leftMenuBtn: null,
        rightMenuBtn: null,
        userDayPill: null,
        currentUser: null,
        currentDay: 'today',
        
        // Touch target sizes
        touchTargetSize: window.StackMapSafeMode ? 60 : 44,
        
        /**
         * Initialize the unified header
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Wait for dependencies
            if (!window.UserManager || !window.DaySelector) {
                console.warn('UnifiedHeader: Waiting for dependencies');
                setTimeout(() => self.init(), 100);
                return;
            }
            
            // Create header structure
            self.createHeader();
            
            // Setup event listeners
            self.setupEventListeners();
            
            // Listen for user/day changes
            self.listenForChanges();
            
            // Update initial state
            self.updateUserDayPill();
            
            self.isInitialized = true;
            console.log('UnifiedHeader: Initialized');
        },
        
        /**
         * Create the header HTML structure
         */
        createHeader: function() {
            const self = this;
            
            // Find existing headers
            const mainHeader = document.querySelector('#main-view .header');
            const settingsHeader = document.querySelector('#settings-view .header');
            
            if (!mainHeader) {
                console.error('UnifiedHeader: Main header not found');
                return;
            }
            
            // Transform main header
            mainHeader.innerHTML = '';
            mainHeader.className = 'unified-header';
            
            // Create left menu button
            self.leftMenuBtn = document.createElement('button');
            self.leftMenuBtn.className = 'menu-left';
            self.leftMenuBtn.setAttribute('aria-label', 'Activities menu');
            self.leftMenuBtn.innerHTML = '<span class="menu-icon">☰</span>';
            self.leftMenuBtn.style.minWidth = self.touchTargetSize + 'px';
            self.leftMenuBtn.style.minHeight = self.touchTargetSize + 'px';
            
            // Create user-day pill
            self.userDayPill = document.createElement('button');
            self.userDayPill.className = 'user-day-pill';
            self.userDayPill.setAttribute('aria-label', 'Switch user or day');
            self.userDayPill.innerHTML = `
                <span class="user-emoji">👤</span>
                <span class="user-name">Loading...</span>
                <span class="day-indicator">Today</span>
            `;
            
            // Create right menu button
            self.rightMenuBtn = document.createElement('button');
            self.rightMenuBtn.className = 'menu-right';
            self.rightMenuBtn.setAttribute('aria-label', 'Settings menu');
            self.rightMenuBtn.innerHTML = '<span class="menu-icon">⚙️</span>';
            self.rightMenuBtn.style.minWidth = self.touchTargetSize + 'px';
            self.rightMenuBtn.style.minHeight = self.touchTargetSize + 'px';
            
            // Append to header
            mainHeader.appendChild(self.leftMenuBtn);
            mainHeader.appendChild(self.userDayPill);
            mainHeader.appendChild(self.rightMenuBtn);
            
            // Store reference
            self.header = mainHeader;
            
            // Update settings header to match
            if (settingsHeader) {
                settingsHeader.className = 'unified-header settings-variant';
                // Keep existing back button but style consistently
                const backBtn = settingsHeader.querySelector('#settings-back');
                if (backBtn) {
                    backBtn.style.minWidth = self.touchTargetSize + 'px';
                    backBtn.style.minHeight = self.touchTargetSize + 'px';
                }
            }
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Left menu button
            if (self.leftMenuBtn) {
                self.leftMenuBtn.addEventListener('click', function() {
                    self.handleLeftMenuClick();
                });
            }
            
            // Right menu button
            if (self.rightMenuBtn) {
                self.rightMenuBtn.addEventListener('click', function() {
                    self.handleRightMenuClick();
                });
            }
            
            // User-day pill
            if (self.userDayPill) {
                self.userDayPill.addEventListener('click', function() {
                    self.handleUserDayClick();
                });
            }
            
            // Keyboard navigation
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    self.closeAllMenus();
                }
            });
        },
        
        /**
         * Listen for user and day changes
         */
        listenForChanges: function() {
            const self = this;
            
            // Listen for user changes
            document.addEventListener('userChanged', function(e) {
                self.currentUser = e.detail.user;
                self.updateUserDayPill();
            });
            
            // Listen for day changes
            document.addEventListener('dayViewChanged', function(e) {
                self.currentDay = e.detail.day;
                self.updateUserDayPill();
            });
        },
        
        /**
         * Update user-day pill display
         */
        updateUserDayPill: function() {
            const self = this;
            
            if (!self.userDayPill) return;
            
            // Get current user
            if (!self.currentUser && window.UserManager) {
                self.currentUser = window.UserManager.getCurrentUser();
            }
            
            // Get current day
            if (window.DaySelector && window.DaySelector.isReady()) {
                self.currentDay = window.DaySelector.getCurrentDay();
            }
            
            // Update display
            const emojiEl = self.userDayPill.querySelector('.user-emoji');
            const nameEl = self.userDayPill.querySelector('.user-name');
            const dayEl = self.userDayPill.querySelector('.day-indicator');
            
            if (emojiEl && self.currentUser) {
                emojiEl.textContent = self.currentUser.emoji || '👤';
            }
            
            if (nameEl && self.currentUser) {
                nameEl.textContent = self.currentUser.name || 'Me';
            }
            
            if (dayEl) {
                dayEl.textContent = self.currentDay === 'tomorrow' ? 'Tomorrow' : 'Today';
                // Add visual indicator for tomorrow
                if (self.currentDay === 'tomorrow') {
                    dayEl.classList.add('tomorrow');
                } else {
                    dayEl.classList.remove('tomorrow');
                }
            }
            
            // Update aria-label
            const label = `Current user: ${self.currentUser?.name || 'Me'}, viewing ${self.currentDay === 'tomorrow' ? 'tomorrow' : 'today'}. Tap to switch.`;
            self.userDayPill.setAttribute('aria-label', label);
        },
        
        /**
         * Handle left menu button click
         */
        handleLeftMenuClick: function() {
            const self = this;
            
            // Add pressed state
            self.leftMenuBtn.classList.add('pressed');
            
            // Use the LeftMenu API if available
            if (window.LeftMenu && window.LeftMenu.open) {
                window.LeftMenu.open();
            } else {
                // Fallback: trigger click on the existing left menu button
                const existingLeftMenuBtn = document.getElementById('left-menu-button');
                if (existingLeftMenuBtn) {
                    existingLeftMenuBtn.click();
                }
            }
            
            // Remove pressed state after animation
            setTimeout(() => {
                self.leftMenuBtn.classList.remove('pressed');
            }, 200);
        },
        
        /**
         * Handle right menu button click
         */
        handleRightMenuClick: function() {
            const self = this;
            
            // Add pressed state
            self.rightMenuBtn.classList.add('pressed');
            
            // For now, navigate to settings view
            if (window.StackMapApp && window.StackMapApp.ViewController) {
                window.StackMapApp.ViewController.show('settings-view');
            }
            
            // Remove pressed state after animation
            setTimeout(() => {
                self.rightMenuBtn.classList.remove('pressed');
            }, 200);
        },
        
        /**
         * Handle user-day pill click
         */
        handleUserDayClick: function() {
            const self = this;
            
            // Add pressed state
            self.userDayPill.classList.add('pressed');
            
            // Show combined user/day switcher modal
            self.showUserDaySwitcher();
            
            // Remove pressed state after animation
            setTimeout(() => {
                self.userDayPill.classList.remove('pressed');
            }, 200);
        },
        
        /**
         * Show combined user/day switcher modal
         */
        showUserDaySwitcher: function() {
            const self = this;
            
            if (!window.Modal) {
                console.error('UnifiedHeader: Modal system not available');
                return;
            }
            
            // Build modal content
            const content = self.buildUserDaySwitcherContent();
            
            // Show modal
            window.Modal.show({
                title: 'Switch View',
                content: content,
                className: 'user-day-switcher-modal',
                closeOnBackdrop: true,
                showCloseButton: true
            });
            
            // Setup modal event handlers
            setTimeout(() => {
                self.setupSwitcherHandlers();
            }, 100);
        },
        
        /**
         * Build user/day switcher content
         */
        buildUserDaySwitcherContent: function() {
            const self = this;
            
            let html = '<div class="user-day-switcher">';
            
            // Day selection section
            html += '<div class="switcher-section">';
            html += '<h3 class="switcher-title">Select Day</h3>';
            html += '<div class="day-options">';
            
            // Today option
            html += `<button class="day-option ${self.currentDay === 'today' ? 'active' : ''}" data-day="today">`;
            html += '<span class="day-icon">☀️</span>';
            html += '<span class="day-label">Today</span>';
            html += '</button>';
            
            // Tomorrow option
            html += `<button class="day-option ${self.currentDay === 'tomorrow' ? 'active' : ''}" data-day="tomorrow">`;
            html += '<span class="day-icon">🌙</span>';
            html += '<span class="day-label">Tomorrow</span>';
            html += '</button>';
            
            html += '</div>';
            html += '</div>';
            
            // User selection section
            if (window.UserManager) {
                const users = window.UserManager.getAllUsers();
                if (users && users.length > 0) {
                    html += '<div class="switcher-section">';
                    html += '<h3 class="switcher-title">Select User</h3>';
                    html += '<div class="user-options">';
                    
                    users.forEach(function(user) {
                        const isActive = user.id === self.currentUser?.id;
                        html += `<button class="user-option ${isActive ? 'active' : ''}" data-user-id="${user.id}">`;
                        html += `<span class="user-emoji">${user.emoji || '👤'}</span>`;
                        html += `<span class="user-name">${self.escapeHtml(user.name)}</span>`;
                        html += '</button>';
                    });
                    
                    // Add new user button
                    html += '<button class="user-option add-user" data-action="add-user">';
                    html += '<span class="user-emoji">➕</span>';
                    html += '<span class="user-name">Add User</span>';
                    html += '</button>';
                    
                    html += '</div>';
                    html += '</div>';
                }
            }
            
            html += '</div>';
            
            return html;
        },
        
        /**
         * Setup switcher modal handlers
         */
        setupSwitcherHandlers: function() {
            const self = this;
            
            // Day options
            const dayOptions = document.querySelectorAll('.day-option');
            dayOptions.forEach(function(option) {
                option.addEventListener('click', function() {
                    const day = this.getAttribute('data-day');
                    if (day && window.DaySelector) {
                        window.DaySelector.switchDay(day);
                        // Update UI immediately
                        dayOptions.forEach(opt => opt.classList.remove('active'));
                        this.classList.add('active');
                    }
                });
            });
            
            // User options
            const userOptions = document.querySelectorAll('.user-option');
            userOptions.forEach(function(option) {
                option.addEventListener('click', function() {
                    const userId = this.getAttribute('data-user-id');
                    const action = this.getAttribute('data-action');
                    
                    if (action === 'add-user') {
                        // Close modal and show user creation
                        window.Modal.close();
                        if (window.UserManager) {
                            window.UserManager.showAddUserDialog();
                        }
                    } else if (userId && window.UserManager) {
                        window.UserManager.switchUser(userId);
                        // Update UI immediately
                        userOptions.forEach(opt => opt.classList.remove('active'));
                        this.classList.add('active');
                    }
                });
            });
        },
        
        /**
         * Close all menus
         */
        closeAllMenus: function() {
            // Dispatch event for menu system
            document.dispatchEvent(new CustomEvent('closeAllMenus'));
        },
        
        /**
         * Update header for different views
         */
        updateForView: function(viewName) {
            const self = this;
            
            if (!self.header) return;
            
            // Add view-specific class
            self.header.className = 'unified-header ' + viewName + '-view';
            
            // Show/hide elements based on view
            if (viewName === 'settings') {
                // Settings view might have different layout
                self.leftMenuBtn.style.display = 'none';
                self.rightMenuBtn.style.display = 'none';
            } else {
                // Main view shows all elements
                self.leftMenuBtn.style.display = '';
                self.rightMenuBtn.style.display = '';
            }
        },
        
        /**
         * Escape HTML for safe display
         */
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }
    };
    
    // Export to global scope
    window.UnifiedHeader = UnifiedHeader;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            UnifiedHeader.init();
        });
    } else {
        // DOM already loaded
        setTimeout(() => UnifiedHeader.init(), 100);
    }
    
})();