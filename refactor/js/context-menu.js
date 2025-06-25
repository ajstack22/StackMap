/**
 * Context Menu System
 * Provides right-click and long-press context menus for activity cards
 * Story #96 - Round 5 Dev2
 */

(function() {
    'use strict';
    
    const ContextMenu = {
        activeMenu: null,
        targetElement: null,
        targetActivity: null,
        longPressTimer: null,
        longPressThreshold: 500, // ms
        
        /**
         * Initialize context menu system
         */
        init: function() {
            const self = this;
            
            // Set up event listeners
            self.setupEventListeners();
            
            console.log('ContextMenu: Initialized');
        },
        
        /**
         * Setup event listeners for context menu triggers
         */
        setupEventListeners: function() {
            const self = this;
            
            // Right-click (desktop)
            document.addEventListener('contextmenu', function(e) {
                const card = e.target.closest('.activity-card, .task-card');
                if (card && !card.classList.contains('add-activity-card') && !card.classList.contains('add-task-card')) {
                    e.preventDefault();
                    self.showContextMenu(card, { x: e.clientX, y: e.clientY });
                }
            });
            
            // Long-press (mobile)
            document.addEventListener('touchstart', function(e) {
                const card = e.target.closest('.activity-card, .task-card');
                if (card && !card.classList.contains('add-activity-card') && !card.classList.contains('add-task-card')) {
                    // Don't show context menu on drag handles or buttons
                    if (e.target.closest('.card-drag-handle, .card-edit-controls, button, input')) {
                        return;
                    }
                    
                    self.startLongPressTimer(card, e.touches[0]);
                }
            });
            
            document.addEventListener('touchmove', function(e) {
                if (self.longPressTimer) {
                    // Movement cancels long press
                    clearTimeout(self.longPressTimer);
                    self.longPressTimer = null;
                }
            });
            
            document.addEventListener('touchend', function(e) {
                if (self.longPressTimer) {
                    clearTimeout(self.longPressTimer);
                    self.longPressTimer = null;
                }
            });
            
            // Close menu on clicks outside
            document.addEventListener('click', function(e) {
                if (self.activeMenu && !self.activeMenu.contains(e.target)) {
                    self.closeMenu();
                }
            });
            
            // Close menu on escape
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && self.activeMenu) {
                    self.closeMenu();
                }
            });
        },
        
        /**
         * Start long press timer for mobile
         */
        startLongPressTimer: function(card, touch) {
            const self = this;
            
            self.longPressTimer = setTimeout(function() {
                // Haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                self.showContextMenu(card, { x: touch.clientX, y: touch.clientY });
                self.longPressTimer = null;
            }, self.longPressThreshold);
        },
        
        /**
         * Show context menu for a card
         */
        showContextMenu: function(card, position) {
            const self = this;
            
            // Close existing menu
            if (self.activeMenu) {
                self.closeMenu();
            }
            
            // Get activity data
            const activityId = card.getAttribute('data-activity-id') || card.getAttribute('data-task-id');
            const activity = self.getActivity(activityId);
            
            if (!activity) {
                console.error('Activity not found for context menu');
                return;
            }
            
            self.targetElement = card;
            self.targetActivity = activity;
            
            // Create menu
            self.activeMenu = self.createMenu(activity);
            
            // Position menu
            self.positionMenu(position);
            
            // Add to DOM
            document.body.appendChild(self.activeMenu);
            
            // Focus first item for keyboard navigation
            const firstItem = self.activeMenu.querySelector('.context-menu-item:not([disabled])');
            if (firstItem) {
                firstItem.focus();
            }
            
            // Announce to screen readers
            if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                window.StackMapKeyboardNav.announce('Context menu opened for ' + activity.title);
            }
            
            console.log('Context menu opened for:', activity.title);
        },
        
        /**
         * Create context menu element
         */
        createMenu: function(activity) {
            const self = this;
            const targetSize = window.StackMapSafeMode ? 60 : 44;
            
            const menu = document.createElement('div');
            menu.className = 'context-menu';
            menu.setAttribute('role', 'menu');
            menu.setAttribute('aria-label', 'Activity actions');
            
            // Create menu items based on activity state and context
            const menuItems = self.getMenuItems(activity);
            
            menuItems.forEach(function(item, index) {
                if (item.type === 'separator') {
                    const separator = document.createElement('hr');
                    separator.className = 'context-menu-separator';
                    menu.appendChild(separator);
                } else {
                    const menuItem = document.createElement('button');
                    menuItem.className = 'context-menu-item';
                    menuItem.setAttribute('role', 'menuitem');
                    menuItem.setAttribute('tabindex', '-1');
                    menuItem.style.minHeight = targetSize + 'px';
                    
                    if (item.disabled) {
                        menuItem.disabled = true;
                        menuItem.setAttribute('aria-disabled', 'true');
                    }
                    
                    // Icon and text
                    menuItem.innerHTML = `
                        <span class="context-menu-icon" aria-hidden="true">${item.icon}</span>
                        <span class="context-menu-text">${item.text}</span>
                        ${item.shortcut ? `<span class="context-menu-shortcut">${item.shortcut}</span>` : ''}
                    `;
                    
                    // Click handler
                    menuItem.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self.handleMenuAction(item.action, activity);
                        self.closeMenu();
                    });
                    
                    // Enhanced keyboard navigation
                    menuItem.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            menuItem.click();
                        } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            self.focusNextItem(menuItem);
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            self.focusPreviousItem(menuItem);
                        }
                    });
                    
                    menu.appendChild(menuItem);
                }
            });
            
            return menu;
        },
        
        /**
         * Get context-aware menu items based on activity state
         */
        getMenuItems: function(activity) {
            const self = this;
            const items = [];
            const isCompleted = activity.completed || activity.status === 'completed';
            const isPinned = activity.pinned === true;
            const currentDay = activity.timeframe || activity.day || 'today';
            const hasTimer = window.ActivityTimer || window.TaskTimer;
            const hasTypes = window.ActivityTypes && activity.type;
            
            // Section 1: Status Actions
            items.push({
                icon: isCompleted ? '↩️' : '✅',
                text: isCompleted ? 'Mark Incomplete' : 'Mark Complete',
                action: 'toggle-complete',
                shortcut: 'Space'
            });
            
            if (!isCompleted && hasTimer) {
                const existingTimer = hasTimer && hasTimer.getTimer ? hasTimer.getTimer(activity.id) : null;
                items.push({
                    icon: existingTimer ? '⏸️' : '▶️',
                    text: existingTimer ? (existingTimer.isPaused ? 'Resume Timer' : 'Pause Timer') : 'Start Timer',
                    action: existingTimer ? 'toggle-timer' : 'start-timer',
                    shortcut: 'T'
                });
            }
            
            items.push({ type: 'separator' });
            
            // Section 2: Edit Actions  
            items.push({
                icon: '✏️',
                text: 'Quick Edit',
                action: 'edit',
                shortcut: 'E'
            });
            
            items.push({
                icon: '📋',
                text: 'Duplicate',
                action: 'duplicate',
                shortcut: 'D'
            });
            
            items.push({ type: 'separator' });
            
            // Section 3: Organization Actions
            items.push({
                icon: isPinned ? '📌' : '📍',
                text: isPinned ? 'Unpin Activity' : 'Pin Activity',
                action: 'toggle-pin',
                shortcut: 'P'
            });
            
            items.push({
                icon: currentDay === 'today' ? '🌙' : '☀️',
                text: currentDay === 'today' ? 'Move to Tomorrow' : 'Move to Today',
                action: 'move-day',
                shortcut: 'M'
            });
            
            // Priority adjustment
            const currentPriority = activity.priority || 'medium';
            const priorities = ['low', 'medium', 'high'];
            const nextPriority = priorities[(priorities.indexOf(currentPriority) + 1) % priorities.length];
            
            items.push({
                icon: self.getPriorityIcon(nextPriority),
                text: `Set Priority: ${nextPriority.charAt(0).toUpperCase() + nextPriority.slice(1)}`,
                action: 'cycle-priority',
                shortcut: 'R'
            });
            
            items.push({ type: 'separator' });
            
            // Section 4: Time & Type Actions
            if (activity.time_estimate || activity.estimatedMinutes) {
                items.push({
                    icon: '⏱️',
                    text: 'Adjust Time',
                    action: 'adjust-time',
                    shortcut: '+/-'
                });
            }
            
            if (hasTypes) {
                items.push({
                    icon: self.getTypeIcon(activity.type.category),
                    text: `Type: ${activity.type.category}`,
                    action: 'change-type',
                    shortcut: 'Y'
                });
            }
            
            items.push({ type: 'separator' });
            
            // Section 5: Destructive Actions
            items.push({
                icon: '🗑️',
                text: 'Delete',
                action: 'delete',
                shortcut: 'Del',
                destructive: true
            });
            
            return items;
        },
        
        /**
         * Get icon for priority level
         */
        getPriorityIcon: function(priority) {
            switch (priority) {
                case 'high': return '🔴';
                case 'medium': return '🟡';
                case 'low': return '🟢';
                default: return '⚪';
            }
        },
        
        /**
         * Get icon for activity type
         */
        getTypeIcon: function(type) {
            switch (type) {
                case 'recurring': return '🔄';
                case 'frequent': return '♾️';
                case 'single-use': return '📝';
                default: return '📋';
            }
        },
        
        /**
         * Position menu relative to click/touch point
         */
        positionMenu: function(position) {
            const self = this;
            const menu = self.activeMenu;
            
            // Set initial position
            menu.style.position = 'fixed';
            menu.style.left = position.x + 'px';
            menu.style.top = position.y + 'px';
            menu.style.zIndex = '10000';
            
            // Get menu dimensions after adding to DOM temporarily
            menu.style.visibility = 'hidden';
            menu.style.display = 'block';
            
            const menuRect = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Adjust horizontal position if menu goes off screen
            let left = position.x;
            if (left + menuRect.width > viewportWidth) {
                left = viewportWidth - menuRect.width - 10;
            }
            if (left < 10) {
                left = 10;
            }
            
            // Adjust vertical position if menu goes off screen
            let top = position.y;
            if (top + menuRect.height > viewportHeight) {
                top = position.y - menuRect.height;
            }
            if (top < 10) {
                top = 10;
            }
            
            // Apply final position
            menu.style.left = left + 'px';
            menu.style.top = top + 'px';
            menu.style.visibility = 'visible';
        },
        
        /**
         * Handle menu action
         */
        handleMenuAction: function(action, activity) {
            const self = this;
            
            switch (action) {
                case 'toggle-complete':
                    self.toggleComplete(activity);
                    break;
                    
                case 'start-timer':
                    self.startTimer(activity);
                    break;
                    
                case 'toggle-timer':
                    self.toggleTimer(activity);
                    break;
                    
                case 'edit':
                    self.editActivity(activity);
                    break;
                    
                case 'duplicate':
                    self.duplicateActivity(activity);
                    break;
                    
                case 'move-day':
                    self.moveDay(activity);
                    break;
                    
                case 'toggle-pin':
                    self.togglePin(activity);
                    break;
                    
                case 'cycle-priority':
                    self.cyclePriority(activity);
                    break;
                    
                case 'adjust-time':
                    self.adjustTime(activity);
                    break;
                    
                case 'change-type':
                    self.changeType(activity);
                    break;
                    
                case 'set-priority-high':
                    self.setPriority(activity, 'high');
                    break;
                    
                case 'set-priority-low':
                    self.setPriority(activity, 'low');
                    break;
                    
                case 'delete':
                    self.deleteActivity(activity);
                    break;
                    
                default:
                    console.warn('Unknown context menu action:', action);
            }
        },
        
        /**
         * Toggle activity completion
         */
        toggleComplete: function(activity) {
            activity.completed = !activity.completed;
            activity.status = activity.completed ? 'completed' : 'pending';
            activity.updated_at = new Date().toISOString();
            
            if (activity.completed) {
                activity.completed_at = new Date().toISOString();
            } else {
                delete activity.completed_at;
            }
            
            this.updateActivity(activity);
            console.log('Toggled completion:', activity.title, activity.completed);
        },
        
        /**
         * Start timer for activity
         */
        startTimer: function(activity) {
            if (window.ActivityTimer && window.ActivityTimer.showTimerMenu) {
                window.ActivityTimer.showTimerMenu(activity.id);
            } else if (window.TaskTimer && window.TaskTimer.showTimerMenu) {
                window.TaskTimer.showTimerMenu(activity.id);
            }
        },
        
        /**
         * Edit activity
         */
        editActivity: function(activity) {
            if (window.InlineCardEdit) {
                window.InlineCardEdit.startEdit(activity);
            } else {
                const display = window.ActivityDisplay || window.TaskDisplay;
                if (display.startEditing) {
                    display.startEditing(activity);
                }
            }
        },
        
        /**
         * Duplicate activity
         */
        duplicateActivity: function(activity) {
            if (window.ActivityCards && window.ActivityCards.handleCardDuplicate) {
                window.ActivityCards.handleCardDuplicate(activity);
            }
        },
        
        /**
         * Move activity to other day
         */
        moveDay: function(activity) {
            if (window.ActivityCards && window.ActivityCards.handleCardMove) {
                window.ActivityCards.handleCardMove(activity);
            }
        },
        
        /**
         * Toggle pin state
         */
        togglePin: function(activity) {
            if (window.ActivityPin && window.ActivityPin.togglePin) {
                window.ActivityPin.togglePin(activity.id);
            }
        },
        
        /**
         * Set activity priority
         */
        setPriority: function(activity, priority) {
            activity.priority = priority;
            activity.updated_at = new Date().toISOString();
            this.updateActivity(activity);
            console.log('Set priority:', activity.title, priority);
        },
        
        /**
         * Toggle timer state
         */
        toggleTimer: function(activity) {
            const timer = window.ActivityTimer || window.TaskTimer;
            if (timer && timer.getTimer) {
                const existingTimer = timer.getTimer(activity.id);
                if (existingTimer) {
                    if (existingTimer.isPaused) {
                        timer.resumeTimer(activity.id);
                    } else {
                        timer.pauseTimer(activity.id);
                    }
                }
            }
        },
        
        /**
         * Cycle through priority levels
         */
        cyclePriority: function(activity) {
            const priorities = ['low', 'medium', 'high'];
            const currentPriority = activity.priority || 'medium';
            const currentIndex = priorities.indexOf(currentPriority);
            const nextPriority = priorities[(currentIndex + 1) % priorities.length];
            
            activity.priority = nextPriority;
            activity.updated_at = new Date().toISOString();
            this.updateActivity(activity);
            
            // Show feedback
            this.showActionFeedback(`Priority set to ${nextPriority}`);
            console.log('Cycled priority:', activity.title, nextPriority);
        },
        
        /**
         * Adjust time estimate
         */
        adjustTime: function(activity) {
            // Open inline editing for time adjustment
            if (window.InlineCardEdit) {
                window.InlineCardEdit.startEdit(activity);
                
                // Focus on time controls after a delay
                setTimeout(function() {
                    const timeControls = document.querySelector('.time-quick-adjustment');
                    if (timeControls) {
                        const firstBtn = timeControls.querySelector('.time-btn');
                        if (firstBtn) {
                            firstBtn.focus();
                        }
                    }
                }, 100);
            }
        },
        
        /**
         * Change activity type
         */
        changeType: function(activity) {
            if (window.ActivityTypes && window.ActivityTypes.cycleType) {
                window.ActivityTypes.cycleType(activity);
                this.updateActivity(activity);
                this.showActionFeedback('Activity type updated');
            }
        },
        
        /**
         * Show action feedback
         */
        showActionFeedback: function(message) {
            // Use existing notification system if available
            if (window.EditModeMenu && window.EditModeMenu.showNotification) {
                window.EditModeMenu.showNotification(message);
            } else {
                // Simple toast
                const toast = document.createElement('div');
                toast.textContent = message;
                toast.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 14px;
                    z-index: 11000;
                `;
                document.body.appendChild(toast);
                
                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 2000);
            }
        },
        
        /**
         * Delete activity
         */
        deleteActivity: function(activity) {
            if (window.ActivityCards && window.ActivityCards.handleCardDelete) {
                window.ActivityCards.handleCardDelete(activity);
            }
        },
        
        /**
         * Update activity in storage
         */
        updateActivity: function(activity) {
            const display = window.ActivityDisplay || window.TaskDisplay;
            if (display.updateActivity) {
                display.updateActivity(activity);
            } else if (display.updateTask) {
                display.updateTask(activity);
            }
            
            // Re-render to show changes
            if (display.render) {
                display.render();
            }
        },
        
        /**
         * Focus next menu item
         */
        focusNextItem: function(currentItem) {
            const items = Array.from(this.activeMenu.querySelectorAll('.context-menu-item:not([disabled])'));
            const currentIndex = items.indexOf(currentItem);
            const nextIndex = (currentIndex + 1) % items.length;
            items[nextIndex].focus();
        },
        
        /**
         * Focus previous menu item
         */
        focusPreviousItem: function(currentItem) {
            const items = Array.from(this.activeMenu.querySelectorAll('.context-menu-item:not([disabled])'));
            const currentIndex = items.indexOf(currentItem);
            const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
            items[prevIndex].focus();
        },
        
        /**
         * Close context menu
         */
        closeMenu: function() {
            const self = this;
            
            if (self.activeMenu) {
                self.activeMenu.remove();
                self.activeMenu = null;
            }
            
            self.targetElement = null;
            self.targetActivity = null;
            
            // Announce to screen readers
            if (window.StackMapKeyboardNav && window.StackMapKeyboardNav.announce) {
                window.StackMapKeyboardNav.announce('Context menu closed');
            }
        },
        
        /**
         * Get activity by ID
         */
        getActivity: function(activityId) {
            const display = window.ActivityDisplay || window.TaskDisplay;
            
            if (display.getActivityById) {
                return display.getActivityById(activityId);
            } else if (display.getTaskById) {
                return display.getTaskById(activityId);
            } else if (display.activities) {
                return display.activities.find(function(a) { return a.id === activityId; });
            } else if (display.tasks) {
                return display.tasks.find(function(t) { return t.id === activityId; });
            }
            
            return null;
        }
    };
    
    // Export to global scope
    window.ContextMenu = ContextMenu;
    
})();