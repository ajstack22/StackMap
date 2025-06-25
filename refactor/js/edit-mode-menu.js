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
        
        // State management
        activityCounts: {
            today: 0,
            tomorrow: 0,
            total: 0,
            library: 0
        },
        countCache: {
            data: null,
            timestamp: 0,
            ttl: 30000 // 30 seconds
        },
        updateTimer: null,
        eventHandlers: {},
        keyboardHandler: null,
        
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
            
            // Subscribe to activity events
            self.subscribeToEvents();
            
            // Initial state update
            self.updateMenuState();
            
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
            
            // Build menu items with keyboard shortcuts
            const menuItems = [
                { icon: '➕', label: 'Add Activity', action: 'add-activity', shortcut: 'A', showCount: false },
                { icon: '⚡', label: 'Quick Add', action: 'quick-add', shortcut: 'Q', showCount: false },
                { icon: '📚', label: 'Activity Library', action: 'activity-library', shortcut: 'L', showCount: true, countType: 'library' },
                { type: 'divider' },
                { icon: '🔄', label: 'Reorder Mode', action: 'reorder', shortcut: 'R', showCount: true, countType: 'current' },
                { icon: '📌', label: 'Pin Activities', action: 'pin-mode', shortcut: 'P', showCount: true, countType: 'pinned' },
                { icon: '🗑️', label: 'Bulk Delete', action: 'bulk-delete', shortcut: 'D', showCount: true, countType: 'current' },
                { type: 'divider' },
                { icon: '✅', label: 'Complete Day', action: 'complete-day', shortcut: 'C', showCount: true, countType: 'today' },
                { icon: '📋', label: 'Copy to Tomorrow', action: 'copy-tomorrow', shortcut: 'T', showCount: true, countType: 'today' }
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
                    menuItem.setAttribute('data-shortcut', item.shortcut || '');
                    menuItem.setAttribute('data-count-type', item.countType || '');
                    
                    // Build label with shortcut
                    let labelHtml = item.label;
                    if (item.shortcut) {
                        // Bold the shortcut letter in the label
                        const shortcutIndex = item.label.toUpperCase().indexOf(item.shortcut);
                        if (shortcutIndex >= 0) {
                            labelHtml = item.label.substring(0, shortcutIndex) + 
                                       '<strong>' + item.label[shortcutIndex] + '</strong>' + 
                                       item.label.substring(shortcutIndex + 1);
                        }
                        labelHtml += ' <span class="menu-item-shortcut">(' + item.shortcut + ')</span>';
                    }
                    
                    menuItem.innerHTML = 
                        '<span class="menu-item-icon">' + item.icon + '</span>' +
                        '<span class="menu-item-label">' + labelHtml + '</span>' +
                        (item.showCount ? '<span class="menu-item-count" data-count-type="' + item.countType + '"></span>' : '');
                    
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
            
            // Keyboard navigation and shortcuts
            self.keyboardHandler = function(e) {
                // Handle escape
                if (e.key === 'Escape') {
                    self.closeDropdown();
                    return;
                }
                
                // Handle arrow navigation
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    self.navigateMenu(e.key === 'ArrowDown' ? 1 : -1);
                    return;
                }
                
                // Handle single letter shortcuts (only when menu is open)
                if (self.isOpen && e.key.length === 1) {
                    const upperKey = e.key.toUpperCase();
                    const menuItem = self.dropdown.querySelector('[data-shortcut="' + upperKey + '"]');
                    
                    if (menuItem) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Check if item is disabled
                        if (menuItem.disabled) {
                            self.showNotification('This action is currently unavailable');
                            return;
                        }
                        
                        // Trigger the action
                        const action = menuItem.getAttribute('data-action');
                        self.handleAction(action);
                        self.closeDropdown();
                    }
                }
            };
            
            self.dropdown.addEventListener('keydown', self.keyboardHandler);
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
            
            // Update state before showing
            self.updateMenuState();
            
            // Position dropdown
            const rect = self.menuButton.getBoundingClientRect();
            self.dropdown.style.position = 'fixed';
            self.dropdown.style.top = (rect.bottom + 4) + 'px';
            self.dropdown.style.right = (window.innerWidth - rect.right) + 'px';
            self.dropdown.style.display = 'block';
            
            // Add open class for animation (skip in safe mode)
            if (!window.StackMapSafeMode) {
                requestAnimationFrame(function() {
                    self.dropdown.classList.add('open');
                });
            } else {
                self.dropdown.classList.add('open');
            }
            
            self.menuButton.setAttribute('aria-expanded', 'true');
            self.isOpen = true;
            
            // Focus first enabled item
            const firstItem = self.dropdown.querySelector('.edit-mode-menu-item:not([disabled])');
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
                    if (window.ActivityPin && window.ActivityPin.enterBulkMode) {
                        window.ActivityPin.enterBulkMode();
                    } else {
                        this.showNotification('Pin feature not available');
                    }
                    break;
                    
                case 'bulk-delete':
                    if (window.BulkOperations && window.BulkOperations.start) {
                        window.BulkOperations.start('delete');
                    } else {
                        this.showNotification('Bulk delete not available');
                    }
                    break;
                    
                case 'complete-day':
                    if (window.CompleteDayWorkflow && window.CompleteDayWorkflow.completeDay) {
                        window.CompleteDayWorkflow.completeDay();
                    } else if (window.TodayTomorrowView && window.TodayTomorrowView.completeDay) {
                        window.TodayTomorrowView.completeDay();
                    } else {
                        this.showNotification('Complete day workflow not available');
                    }
                    break;
                    
                case 'copy-tomorrow':
                    if (window.BulkOperations && window.BulkOperations.start) {
                        window.BulkOperations.start('copy');
                    } else if (window.TodayTomorrowView && window.TodayTomorrowView.copyToTomorrow) {
                        window.TodayTomorrowView.copyToTomorrow();
                    } else {
                        this.showNotification('Copy to tomorrow not available');
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
        },
        
        /**
         * Subscribe to events for real-time updates
         */
        subscribeToEvents: function() {
            const self = this;
            
            // Activities changed event
            self.eventHandlers.activitiesChanged = function() {
                self.scheduleUpdate();
            };
            document.addEventListener('activitiesChanged', self.eventHandlers.activitiesChanged);
            
            // Day view changed event
            self.eventHandlers.dayViewChanged = function() {
                self.scheduleUpdate();
            };
            document.addEventListener('dayViewChanged', self.eventHandlers.dayViewChanged);
            
            // Also listen for old task events for compatibility
            self.eventHandlers.tasksChanged = function() {
                self.scheduleUpdate();
            };
            document.addEventListener('tasksChanged', self.eventHandlers.tasksChanged);
        },
        
        /**
         * Schedule a debounced update
         */
        scheduleUpdate: function() {
            const self = this;
            
            // Clear existing timer
            if (self.updateTimer) {
                clearTimeout(self.updateTimer);
            }
            
            // Schedule new update with 100ms debounce
            self.updateTimer = setTimeout(function() {
                self.updateMenuState();
            }, 100);
        },
        
        /**
         * Update menu state (counts, disabled states)
         */
        updateMenuState: function() {
            const self = this;
            
            // Update activity counts
            self.updateActivityCounts();
            
            // Update disabled states
            self.updateDisabledStates();
            
            // Update count badges
            self.updateCountBadges();
        },
        
        /**
         * Update activity counts from data source
         */
        updateActivityCounts: function() {
            const self = this;
            
            try {
                // Check cache first
                const now = Date.now();
                if (self.countCache.data && (now - self.countCache.timestamp) < self.countCache.ttl) {
                    self.activityCounts = self.countCache.data;
                    return;
                }
                
                // Get current day
                const currentDay = window.DaySelector && window.DaySelector.getCurrentDay ? 
                    window.DaySelector.getCurrentDay() : 'today';
                
                // Get activities for today
                let todayActivities = [];
                let tomorrowActivities = [];
                
                if (window.ActivityDisplay && window.ActivityDisplay.getActivities) {
                    const allActivities = window.ActivityDisplay.getActivities();
                    todayActivities = allActivities.filter(a => a.timeframe === 'today');
                    tomorrowActivities = allActivities.filter(a => a.timeframe === 'tomorrow');
                } else if (window.TaskDisplay && window.TaskDisplay.getTasks) {
                    const allTasks = window.TaskDisplay.getTasks();
                    todayActivities = allTasks.filter(t => t.timeframe === 'today');
                    tomorrowActivities = allTasks.filter(t => t.timeframe === 'tomorrow');
                }
                
                // Count pinned activities
                const allActivities = [...todayActivities, ...tomorrowActivities];
                const pinnedCount = allActivities.filter(a => a.pinned === true).length;
                
                // Update counts
                self.activityCounts = {
                    today: todayActivities.length,
                    tomorrow: tomorrowActivities.length,
                    total: todayActivities.length + tomorrowActivities.length,
                    current: currentDay === 'today' ? todayActivities.length : tomorrowActivities.length,
                    library: 50, // Placeholder - would get from ActivityLibrary
                    pinned: pinnedCount
                };
                
                // Update cache
                self.countCache = {
                    data: self.activityCounts,
                    timestamp: now,
                    ttl: self.countCache.ttl
                };
                
            } catch (error) {
                console.error('Failed to update activity counts:', error);
                // Use cached data if available, otherwise show question marks
            }
        },
        
        /**
         * Update disabled states based on context
         */
        updateDisabledStates: function() {
            const self = this;
            const counts = self.activityCounts;
            
            // Get all menu items
            const menuItems = self.dropdown.querySelectorAll('.edit-mode-menu-item');
            
            menuItems.forEach(function(item) {
                const action = item.getAttribute('data-action');
                let shouldDisable = false;
                let disableReason = '';
                
                switch (action) {
                    case 'reorder':
                        shouldDisable = counts.current < 2;
                        disableReason = 'Need at least 2 activities to reorder';
                        break;
                        
                    case 'bulk-delete':
                        shouldDisable = counts.current === 0;
                        disableReason = 'No activities to delete';
                        break;
                        
                    case 'complete-day':
                        shouldDisable = counts.today === 0;
                        disableReason = 'No activities for today';
                        break;
                        
                    case 'copy-tomorrow':
                        shouldDisable = counts.today === 0;
                        disableReason = 'No activities to copy';
                        break;
                        
                    case 'pin-mode':
                        shouldDisable = counts.current === 0;
                        disableReason = 'No activities to pin';
                        break;
                }
                
                // Update disabled state
                if (shouldDisable) {
                    item.disabled = true;
                    item.setAttribute('aria-disabled', 'true');
                    item.setAttribute('title', disableReason);
                } else {
                    item.disabled = false;
                    item.removeAttribute('aria-disabled');
                    item.removeAttribute('title');
                }
            });
        },
        
        /**
         * Update count badges
         */
        updateCountBadges: function() {
            const self = this;
            const counts = self.activityCounts;
            
            // Update all count badges
            const badges = self.dropdown.querySelectorAll('.menu-item-count');
            badges.forEach(function(badge) {
                const countType = badge.getAttribute('data-count-type');
                let count = 0;
                
                switch (countType) {
                    case 'today':
                        count = counts.today;
                        break;
                    case 'tomorrow':
                        count = counts.tomorrow;
                        break;
                    case 'current':
                        count = counts.current;
                        break;
                    case 'library':
                        count = counts.library;
                        break;
                    case 'pinned':
                        count = counts.pinned;
                        break;
                }
                
                // Update badge text
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count.toString();
                    badge.style.display = '';
                } else {
                    badge.style.display = 'none';
                }
            });
        },
        
        /**
         * Clean up event listeners and timers
         */
        destroy: function() {
            const self = this;
            
            // Remove event listeners
            if (self.eventHandlers.activitiesChanged) {
                document.removeEventListener('activitiesChanged', self.eventHandlers.activitiesChanged);
            }
            if (self.eventHandlers.dayViewChanged) {
                document.removeEventListener('dayViewChanged', self.eventHandlers.dayViewChanged);
            }
            if (self.eventHandlers.tasksChanged) {
                document.removeEventListener('tasksChanged', self.eventHandlers.tasksChanged);
            }
            if (self.keyboardHandler) {
                self.dropdown.removeEventListener('keydown', self.keyboardHandler);
            }
            
            // Clear timers
            if (self.updateTimer) {
                clearTimeout(self.updateTimer);
            }
            
            // Reset state
            self.isInitialized = false;
        }
    };
    
    // Export to global scope
    window.EditModeMenu = EditModeMenu;
    
})();